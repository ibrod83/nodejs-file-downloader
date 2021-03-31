const fs = require('fs');
// const axios = require('axios');
const { request } = require('./request');
const stream = require('stream');
var HttpsProxyAgent = require('https-proxy-agent');

// const {WritableStream}= fs;
const { Transform } = require('stream')
const util = require('util');
const FileProcessor = require('./utils/FileProcessor');
const pipelinePromisified = util.promisify(stream.pipeline);
const mkdir = util.promisify(fs.mkdir);
const writeFile = util.promisify(fs.writeFile);
const { deduceFileName } = require('./utils/fileName');
const rpur = require('./utils/rpur');
// const { resolve } = require('path');
// const {IncomingMessage} = require('http')
const unlink = util.promisify(fs.unlink)
const rename = util.promisify(fs.rename)


const configTypes = {
  url: {
    type: 'string',
    mandatory: true
  },
  directory: {
    type: 'string',
    mandatory: false
  },
  fileName: {
    type: 'string',
    mandatory: false
  },
  cloneFiles: {
    type: 'boolean',
    mandatory: false
  },
  proxy: {
    type: 'string',
    mandatory: false
  }
};

const validateConfig = (config) => {
  const generateTypeError = (prop) => { throw new Error(`config.${prop} must be of type ${configTypes[prop].type}`) }
  for (let prop in configTypes) {
    if (configTypes[prop].mandatory) {
      if (!config[prop])
        throw new Error(`Must supply a config.${prop}`);

      if (typeof config[prop] !== configTypes[prop].type)
        generateTypeError(prop)
    }
    if (config.hasOwnProperty(prop) && typeof config[prop] !== configTypes[prop].type)
      generateTypeError(prop)
  }
}


module.exports = class Downloader {


  /**
   * 
   * @param {object} config 
   * @param {string} config.url 
   * @param {string} [config.directory]    
   * @param {string} [config.fileName = undefined] 
   * @param {boolean} [config.cloneFiles=true] 
   * @param {number} [config.timeout=6000] 
   * @param {number} [config.maxAttempts=1] 
   * @param {object} [config.headers = undefined] 
   * @param {object} [config.httpsAgent = undefined] 
   * @param {string} [config.proxy = undefined] 
   * @param {function} [config.onError = undefined] 
   * @param {function} [config.onResponse = undefined] 
   * @param {function} [config.onBeforeSave = undefined] 
   * @param {function} [config.onProgress = undefined] 
   * @param {function} [config.shouldStop = undefined] 
   * @param {boolean} [config.shouldBufferResponse = false] 
   * @param {boolean} [config.useSynchronousMode = false] 
   */
  constructor(config) {

    // super();
    if (!config || typeof config !== 'object') {
      throw new Error('Must provide a valid config object')
    }
    validateConfig(config);

    const defaultConfig = {
      directory: './',
      fileName: undefined,
      timeout: 6000,
      maxAttempts: 1,
      useSynchronousMode: false,
      httpsAgent: undefined,
      proxy: undefined,
      headers: undefined,
      cloneFiles: true,
      shouldBufferResponse: false,
      onResponse: undefined,
      onBeforeSave: undefined,
      onError: undefined,
      onProgress: undefined
    }

    this.config = {
      ...defaultConfig,
      ...config
    }



    if (this.config.filename) {
      this.config.fileName = this.config.filename
    }

    // this.readStream = null;
    // this.buffer = null;
    // this.responseHeaders = null;
    // this.response = null;
    this.percentage = 0;
    this.fileSize = null;
    this.currentDataSize = 0;


  }

  //For EventEmitter backwards compatibility
  on(event, callback) {
    this.config[`on${capitalize(event)}`] = callback
  }


  /**
  * @return {Promise<void>}
  */
  async download() {
    await this._verifyDirectoryExists(this.config.directory)
    await this._makeUntilSuccessful(async () => {
      this._resetData()
      const response = await this._request();
      // const readStream = response.readStream
      if (this.config.onResponse) {
        // debugger
        const shouldContinue = await this.config.onResponse(response);
        if (shouldContinue === false) {
          return;
        }
      }
      // const finalName = await this._getFinalFileName(response.headers);
      // const finalPath = `${this.config.directory}/${finalName}`;
      await this._save(response)
    })
    // debugger

  }


  async _verifyDirectoryExists(directory) {
    await mkdir(directory, { recursive: true });
  }

  _resetData() {
    this.percentage = 0;
    this.fileSize = null;
    this.currentDataSize = 0;
  }


  /**
   * @return {Promise<IncomingMessage} response 
   */
  async _request() {
    // this.resetData()
    const response = await this._makeRequest();
    // debugger;

    const contentLength = response.headers['content-length'] || response.headers['Content-Length'];
    this.fileSize = parseInt(contentLength);
    return response;

  }

  /**
   * @param {IncomingMessage} response
   * @return {Promise<void>}
   */
  async _save(response) {
    
    try {
      // debugger
      let finalName = await this._getFinalFileName(response.headers);

      if(this.config.onBeforeSave){
        // debugger
        const clientOverideName = await this.config.onBeforeSave(finalName)
        if(clientOverideName && typeof clientOverideName === 'string'){
          finalName  = clientOverideName;
        }
      }

      const finalPath = `${this.config.directory}/${finalName}`;

      var tempPath = this._getTempFilePath(finalPath);

      if (this.config.shouldBufferResponse) {
        const buffer = await this._createBufferFromResponseStream(response);
        await this._saveFromBuffer(buffer, tempPath);
        // await this._saveFromBuffer(buffer, finalPath);
      } else {
        await this._saveFromReadableStream(response, tempPath);
        // await this._saveFromReadableStream(response, finalPath);
      }
      // debugger;
      await this._renameTempFileToFinalName(tempPath, finalPath)

    } catch (error) {
      // debugger
      await this._removeFailedFile(tempPath)
      throw error;
    }


  }




  /**
   * @param {Function} asyncFunc
   * @return {Promise<any>} 
   */
  async _makeUntilSuccessful(asyncFunc) {

    let data;
    // debugger;
    const func = asyncFunc.bind(this)
    await rpur(async () => {

      data = await func();
    }, {
      onError: async (e) => {
        // debugger;
        if (this.config.onError) {
          await this.config.onError(e);
        }
      },
      shouldStop: async (e) => {
        // debugger
        if (this.config.shouldStop) {
          if (await this.config.shouldStop(e) === true) {
            return true;
          }
        }

      },
      maxAttempts: this.config.maxAttempts
    })
    return data;


  }
  /**
   * 
   * @return {Promise<IncomingMessage>}
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

    var response = await request(url, options);

    return response;
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
    // try {
    await pipelinePromisified(...arrayOfStreams);
    // } catch (error) {
    // debugger;
    // }

  }



  async _saveFromReadableStream(read, path) {
    // debugger;
    const streams = [read];
    const write = this._createWriteStream(path)
    if (this.config.onProgress) {
      const progressStream = this._getProgressStream()
      streams.push(progressStream);

    }
    streams.push(write)
    // debugger
    await this._pipeStreams(streams)
    // debugger


  }



  async _saveFromBuffer(buffer, path) {
    // debugger;
    // const tempPath = this._getTempFilePath(path);
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


}


const capitalize = (s) => {
  if (typeof s !== 'string') return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}