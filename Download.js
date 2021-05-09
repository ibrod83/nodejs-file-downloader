const fs = require('fs');
const http = require('http')//For jsdoc
const IncomingMessage = http.IncomingMessage
const makeRequest = require('./makeRequest');
const stream = require('stream');
var HttpsProxyAgent = require('https-proxy-agent');
const { Transform } = require('stream')
const util = require('util');
const FileProcessor = require('./utils/FileProcessor');
const pipelinePromisified = util.promisify(stream.pipeline);
const mkdir = util.promisify(fs.mkdir);
const writeFile = util.promisify(fs.writeFile);
const { deduceFileName } = require('./utils/fileName');
const unlink = util.promisify(fs.unlink)
const rename = util.promisify(fs.rename)


module.exports = class Download {

    /**
   * 
   * @param {object} config 
   * @param {string} config.url 
   * @param {string} [config.directory]    
   * @param {string} [config.fileName = undefined] 
   * @param {boolean} [config.cloneFiles=true] 
   * @param {number} [config.timeout=6000]   
   * @param {object} [config.headers = undefined] 
   * @param {object} [config.httpsAgent = undefined] 
   * @param {string} [config.proxy = undefined]   
   * @param {function} [config.onResponse = undefined] 
   * @param {function} [config.onBeforeSave = undefined] 
   * @param {function} [config.onProgress = undefined]   
   * @param {boolean} [config.shouldBufferResponse = false] 
   * @param {boolean} [config.useSynchronousMode = false] 
   */
    constructor(config) {

        const defaultConfig = {
            directory: './',
            fileName: undefined,
            timeout: 6000,
            useSynchronousMode: false,
            httpsAgent: undefined,
            proxy: undefined,
            headers: undefined,
            cloneFiles: true,
            shouldBufferResponse: false,
            onResponse: undefined,
            onBeforeSave: undefined,
            onProgress: undefined
        }

        this.config = {
            ...defaultConfig,
            ...config
        }


        this.isCancelled = false;
        this.cancelCb = null;//Function from makeRequest, to cancel the download.
        this.percentage = 0;
        this.fileSize = null;
        this.currentDataSize = 0;
        this.originalResponse = null;//The IncomingMessage read stream.


    }



    /**
    * The entire download process.
    * @return {Promise<void>}
    */
    async start() {

        await this._verifyDirectoryExists(this.config.directory)

        try {
            const { dataStream, originalResponse } = await this._request();
            this.originalResponse = originalResponse;

            if (this.config.onResponse) {

                const shouldContinue = await this.config.onResponse(originalResponse);
                if (shouldContinue === false) {
                    return;
                }
            }
            await this._save({ dataStream, originalResponse })
        } catch (error) {

            if (this.isCancelled) {
                const customError = new Error('Request cancelled')
                customError.code = 'ERR_REQUEST_CANCELLED'
                throw customError
            }
            throw error;
        }

    }




    /**
     * 
     * @param {string} directory 
     */
    async _verifyDirectoryExists(directory) {
        await mkdir(directory, { recursive: true });
    }



    /**
     * @return {Promise<{dataStream:stream.Readable,originalResponse:IncomingMessage}}  
     */
    async _request() {
        const { dataStream, originalResponse } = await this._makeRequest();
        const headers = originalResponse.headers;
        const contentLength = headers['content-length'] || headers['Content-Length'];
        this.fileSize = parseInt(contentLength);
        return { dataStream, originalResponse }

    }

    /**
     * @param {Promise<{dataStream:stream.Readable,originalResponse:IncomingMessage}}  
     * @return {Promise<void>}
     */
    async _save({ dataStream, originalResponse }) {

        try {
            let finalName = await this._getFinalFileName(originalResponse.headers);

            if (this.config.onBeforeSave) {
                const clientOverideName = await this.config.onBeforeSave(finalName)
                if (clientOverideName && typeof clientOverideName === 'string') {
                    finalName = clientOverideName;
                }
            }

            const finalPath = `${this.config.directory}/${finalName}`;

            var tempPath = this._getTempFilePath(finalPath);

            if (this.config.shouldBufferResponse) {
                const buffer = await this._createBufferFromResponseStream(dataStream);
                await this._saveFromBuffer(buffer, tempPath);
                // await this._saveFromBuffer(buffer, finalPath);
            } else {
                await this._saveFromReadableStream(dataStream, tempPath);
                // await this._saveFromReadableStream(response, finalPath);
            }
            // debugger;
            await this._renameTempFileToFinalName(tempPath, finalPath)

        } catch (error) {
            // debugger
            if (!this.config.shouldBufferResponse)
                await this._removeFailedFile(tempPath)

            throw error;
        }


    }





    /**
     * 
     * @return {Promise<{dataStream:stream.Readable,originalResponse:IncomingMessage}}  
     */
    async _makeRequest() {
        const { timeout, headers, proxy, url, httpsAgent } = this.config;
        const options = {
            timeout,
            headers
        }
        if (httpsAgent) {
            options.httpsAgent = httpsAgent;
        }
        else if (proxy) {
            // debugger
            options.httpsAgent = new HttpsProxyAgent(proxy)
        }
        // debugger

        // const { response, request } = await makeRequest(url, options);
        const { makeRequestIter, cancel } = makeRequest(url, options)
        // debugger
        this.cancelCb = cancel
        const { dataStream, originalResponse, } = await makeRequestIter()
        // debugger


        return { dataStream, originalResponse }
    }



    /**
     * 
     * @param {string} fullPath 
     * @return {Promie<WritableStream>}
     */
    _createWriteStream(fullPath) {
        // debugger
        return fs.createWriteStream(fullPath)
    }

    /**
     * 
     * @param {stream.Readable} stream 
     * @returns 
     */
    async _createBufferFromResponseStream(stream) {
        const chunks = []
        for await (let chunk of stream) {
            chunks.push(chunk)
        }

        const buffer = Buffer.concat(chunks)
        return buffer;
    }


    _getProgressStream() {
        const that = this;
        const progress = new Transform({

            transform(chunk, encoding, callback) {

                that.currentDataSize += chunk.byteLength;
                if (that.fileSize) {
                    that.percentage = ((that.currentDataSize / that.fileSize) * 100).toFixed(2)
                } else {
                    that.percentage = NaN
                }

                const remainingFracture = (100 - that.percentage) / 100;
                const remainingSize = Math.round(remainingFracture * that.fileSize);


                if (that.config.onProgress) {
                    that.config.onProgress(that.percentage, chunk, remainingSize);
                }

                // Push the data onto the readable queue.
                callback(null, chunk);
            }
        });

        return progress;

    }







    async _pipeStreams(arrayOfStreams) {
        await pipelinePromisified(...arrayOfStreams);
    }



    async _saveFromReadableStream(read, path) {
        const streams = [read];
        const write = this._createWriteStream(path)
        if (this.config.onProgress) {
            const progressStream = this._getProgressStream()
            streams.push(progressStream);

        }
        streams.push(write)
        await this._pipeStreams(streams)


    }



    async _saveFromBuffer(buffer, path) {
        await writeFile(path, buffer)

    }

    async _removeFailedFile(path) {
        await unlink(path);
    }

    async _renameTempFileToFinalName(temp, final) {
        // debugger;
        await rename(temp, final)
    }

    /**
     * 
     * @param {string} finalpath 
     */
    _getTempFilePath(finalpath) {
        return `${finalpath}.download`;
    }



    /**
     * @param {object} responseHeaders 
     */
    async _getFinalFileName(responseHeaders) {
        let fileName;
        if (this.config.fileName) {
            fileName = this.config.fileName
        } else {
            fileName = deduceFileName(this.config.url, responseHeaders)
        }

        if (this.config.cloneFiles) {

            var fileProcessor = new FileProcessor({ useSynchronousMode: this.config.useSynchronousMode, fileName, path: this.config.directory })

            fileName = await fileProcessor.getAvailableFileName()
        }

        return fileName;
    }


    cancel() {
        if (this.cancelCb) {
            this.isCancelled = true;

            this.cancelCb()
        }


    }
}


