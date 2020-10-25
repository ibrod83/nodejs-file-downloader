const fs = require('fs');
const axios = require('axios');
const stream = require('stream');
const { Transform } = require('stream')
const util = require('util');
// var HttpsProxyAgent = require('https-proxy-agent');
const { EventEmitter } = require('events')
const FileProcessor = require('./utils/FileProcessor');
const pipeline = util.promisify(stream.pipeline);
const mkdir = util.promisify(fs.mkdir);
const writeFile = util.promisify(fs.writeFile);
const { deduceFileName } = require('./utils/fileName');
const rpur = require('./utils/rpur');



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
   * @param {string} [config.fileName = undefined] 
   * @param {boolean} [config.cloneFiles=true] 
   * @param {number} [config.timeout=6000] 
   * @param {number} [config.maxAttempts=1] 
   * @param {object} [config.headers = undefined] 
   * @param {object} [config.httpsAgent = undefined] 
   * @param {boolean} [config.shouldBufferResponse = false] 
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
      fileName: undefined,
      timeout: 6000,
      maxAttempts:1,
      useSynchronousMode: false,
      httpsAgent:undefined,
      headers:undefined,
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
   * @return {Promise<axios.AxiosResponse>}
   */
  async request() {
    // const response = await this._makeRequest();
    // const response = await this._makeRequestUntilSuccessful();
    const response = await this._makeUntilSuccessful(this._makeRequest);
    this.response = response;
    if (this._events.response) {
      this.emit('response', response)
    }
    const contentLength = response.headers['content-length'] || response.headers['Content-Length'];
    this.fileSize = parseInt(contentLength);
    return response;

  }

  /**
   * @return {Promise<void>}
   */
  async save() {
    if (this.config.shouldBufferResponse) {
      // debugger;
      // return this._saveFromBuffer(this.response.data);
      return this._makeUntilSuccessful(async()=>{await this._saveFromBuffer(this.response.data)});
    }
    // debugger;
    // await this._saveFromReadableStream(this.response.data);
    await this._makeUntilSuccessful(async()=>{await this._saveFromReadableStream(this.response.data)});
  }


  /**
   * @return {Promise<void>}
   */
  async download() {

    await this.request();
    // debugger;
    await this.save()
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
      // debugger;

      data = await func();
      // debugger;
    }, {
      onError: (e) => {
        // debugger;
        if (this._events.error) {
          this.emit('error', e);
        }
      },
      maxAttempts:this.config.maxAttempts
      // maxAttempts:1
    })
    // debugger;
    return data;


  }
  /**
   * 
   * @return {Promise<axios.AxiosResponse>}
   */
  async _makeRequest() {
    // debugger;
    const shouldBuffer = this.config.shouldBufferResponse
    const httpsAgent = this.config.httpsAgent;
    const response = await axios({
      method: 'get',
      url: this.config.url,
      timeout: this.config.timeout,
      headers: this.config.headers,
      httpsAgent,
      responseType: shouldBuffer ? 'arraybuffer' : 'stream'
    })
    // debugger;
    // this.response = response;

    return response;
  }



  _createWriteStream(fullPath) {
    // console.log(fullPath)
    return fs.createWriteStream(fullPath)
  }


  _getProgressStream() {
    const that = this;
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

    return progress;

  }

  async _saveFromReadableStream(read) {
    // yoyo
    const fileName = await this._getFinalFileName();

    const progress = this._getProgressStream();
    const write = this._createWriteStream(`${this.config.directory}/${fileName}`)

    await pipeline(read, progress, write)

  }

  async _saveFromBuffer(buffer) {
    // debugger;
    // const response = await this._makeRequest(true);
    // this.response = response;
    const fileName = await this._getFinalFileName();
    // debugger;
    // const write = this.createWriteStream(`${this.config.directory}/${fileName}`)
    await writeFile(`${this.config.directory}/${fileName}`, buffer)

  }



  async _getFinalFileName() {
    // debugger;
    let fileName;
    if (this.config.fileName) {
      fileName = this.config.fileName
    } else {
      fileName = deduceFileName(this.config.url, this.response.headers)
    }
    // debugger;
    var fileProcessor = new FileProcessor({ useSynchronousMode: this.config.useSynchronousMode, fileName, path: this.config.directory })
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


}


