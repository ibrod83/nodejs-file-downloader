const fs = require('fs');
const axios = require('axios');
const stream = require('stream');
const { Transform } = require('stream')
const util = require('util');
var HttpsProxyAgent = require('https-proxy-agent');
const { EventEmitter } = require('events')
const path = require('path');
const sanitize = require('sanitize-filename');
const FileProcessor = require('./FileProcessor');
var mime = require('mime-types')
const pipeline = util.promisify(stream.pipeline);
const mkdir = util.promisify(fs.mkdir);
const writeFile = util.promisify(fs.writeFile);



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

module.exports = class Downloader extends EventEmitter {


  /**
   * 
   * @param {object} config 
   * @param {string} config.url 
   * @param {string} [config.directory]    
   * @param {string} [config.fileName] 
   * @param {boolean} [config.cloneFiles=true] 
   * @param {number} [config.timeout=6000] 
   * @param {object} [config.headers] 
   * @param {string} [config.proxy] 
   * @param {string} [config.auth] 
   * @param {boolean} [config.useSynchronousMode = false] 
   */
  constructor(config) {
    super();
    if (!config || typeof config !== 'object') {
      throw new Error('Must provide a valid config object')
    }
    validateConfig(config);

    const defaultConfig = {
      directory: './',
      fileName: null,
      timeout: 6000,
      useSynchronousMode:false,
      // proxy: null,
      // auth:null,
      cloneFiles: true,
      shouldBufferResponse: false
    }

    this.config = {
      ...defaultConfig,
      ...config
    }

    this.response = null;
    this.readStream = null;
    this.fileSize = null;
    this.currentDataSize = 0;

    // this.config.httpsAgent = new HttpsProxyAgent(this.config.proxy)

  }

  /**
   * 
   * @param {boolean} shouldBuffer 
   * @return {Promise<axios.AxiosResponse>}
   */
  async makeRequest(shouldBuffer) {

    const httpsAgent = this.config.proxy ? new HttpsProxyAgent(this.config.proxy) : null; 
    // debugger;
    const response = await axios({
      method: 'get',
      url: this.config.url,
      timeout: this.config.timeout,
      headers: this.config.headers,
      httpsAgent,
      responseType: shouldBuffer ? 'arraybuffer' : 'stream'
    })

    return response;
  }

  async createReadStream() {

    const response = await this.makeRequest(false)

    if (this._events.response) {
      this.emit('response', response)
    }
    const contentLength = response.headers['content-length'] || response.headers['Content-Length'];
    this.fileSize = parseInt(contentLength);

    this.response = response;
    return response.data;
  }


  createWriteStream(fullPath) {
    // console.log(fullPath)
    return fs.createWriteStream(fullPath)
  }

  async downloadAndBuffer() {
    // debugger;
    const response = await this.makeRequest(true);
    this.response = response;
    const fileName = await this.getFinalFileName();
    // const write = this.createWriteStream(`${this.config.directory}/${fileName}`)
    await writeFile(`${this.config.directory}/${fileName}`, response.data)

  }

  download() {
    if (this.config.shouldBufferResponse) return this.downloadAndBuffer()
    // debugger;
    const that = this;

    return new Promise(async (resolve, reject) => {
      try {
        const read = await this.createReadStream(this.config.url);
        const fileName = await this.getFinalFileName();

        const progress = new Transform({
          // writableObjectMode: true,

          transform(chunk, encoding, callback) {

            that.currentDataSize += chunk.byteLength;

            that.percentage = ((that.currentDataSize / that.fileSize) * 100).toFixed(2)

            if (that._events.progress) {
              that.emit('progress', that.percentage, chunk);
            }

            // Push the data onto the readable queue.
            callback(null, chunk);
          }
        });
        const write = this.createWriteStream(`${this.config.directory}/${fileName}`)

        await pipeline(read, progress, write)

        resolve();
      } catch (error) {
        reject(error)
      }
    })
  }

  async getFinalFileName() {
    // debugger;
    let fileName;
    if (this.config.fileName) {
      fileName = this.config.fileName
    } else {
      fileName = this.deduceFileName(this.config.url, this.response.headers)
    }
    // debugger;
    var fileProcessor = new FileProcessor({useSynchronousMode:this.config.useSynchronousMode, fileName, path: this.config.directory })
    // debugger;
    // if (! await fileProcessor.pathExists(this.config.directory)) {
    if (!await fileProcessor.pathExists(this.config.directory)) {
      // debugger;
      try {
        await mkdir(this.config.directory, { recursive: true });
      } catch (error) {
        // debugger;
      }

    }
    if (this.config.cloneFiles) {


      // debugger;
      fileName = await fileProcessor.getAvailableFileName()
      // fileName = fileProcessor.getAvailableFileName()
    }

    return fileName;
  }


  getFileNameFromContentDisposition(contentDisposition) {
    // debugger;
    // const contentDisposition = this.response.headers['content-disposition'] || this.response.headers['Content-Disposition'];
    if (!contentDisposition || !contentDisposition.includes('filename=')) {
      return "";
    }
    let filename = "";
    var filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
    var matches = filenameRegex.exec(contentDisposition);
    if (matches != null && matches[1]) {
      filename = matches[1].replace(/['"]/g, '');
    }

    return filename ? sanitize(filename) : "";
  }

  getFileNameFromContentType(contentType) {

    // var contentType = this.response.headers['content-type'] || this.response.headers['Content-Type'];
    // console.log(contentType)
    let extension = mime.extension(contentType)

    const url = this.removeQueryString(this.config.url);
    const fileNameWithoutExtension = this.removeExtension(path.basename(url));
    return `${sanitize(fileNameWithoutExtension)}.${extension}`;
  }


  removeQueryString(url) {
    return url.split(/[?#]/)[0];
  }

  removeExtension(str) {
    // debugger;
    const arr = str.split('.');
    if (arr.length == 1) {
      return str;
    }
    return arr.slice(0, -1).join('.')



  }


  /**
   * 
   * @param {string} url 
   * @return {string} fileName
   */
  deduceFileNameFromUrl(url) {
    // debugger;
    const cleanUrl = this.removeQueryString(url);
    const baseName = sanitize(path.basename(cleanUrl));
    return baseName;

  }


  /**
   * Deduce the fileName, covering various scenarios.
   * @param {string} url
   * @param {Object} headers
   * @return {string} fileName
   */
  deduceFileName(url, headers) {


    //First option
    const fileNameFromContentDisposition = this.getFileNameFromContentDisposition(headers['content-disposition'] || headers['Content-Disposition']);
    // console.log('filenamecontentdisposition', fileNameFromContentDisposition)
    if (fileNameFromContentDisposition) return fileNameFromContentDisposition;

    // debugger;
    //Second option
    if (path.extname(url)) {//First check if the url even has an extension
      const fileNameFromUrl = this.deduceFileNameFromUrl(url);
      if (fileNameFromUrl) return fileNameFromUrl;
    }

    //Third option
    const fileNameFromContentType = this.getFileNameFromContentType(headers['content-type'] || headers['Content-Type'])
    if (fileNameFromContentType) return fileNameFromContentType


    //Fallback option
    return sanitize(url)


  }
}


