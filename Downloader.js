const fs = require('fs');
const axios = require('axios');
const stream = require('stream');
const { Transform } = require('stream')
const util = require('util');
// var HttpsProxyAgent = require('https-proxy-agent');
const { EventEmitter } = require('events')
const FileProcessor = require('./FileProcessor');
const pipeline = util.promisify(stream.pipeline);
const mkdir = util.promisify(fs.mkdir);
const writeFile = util.promisify(fs.writeFile);
const {deduceFileName} = require('./fileName')



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
   * @param {object} [config.httpsAgent] 
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
      fileName: null,
      timeout: 6000,
      useSynchronousMode:false,
      proxy: null,
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
  async request(){
    const response = await this._makeRequest();
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
  async save(){
    if(this.config.shouldBufferResponse){
      // debugger;
      return this._saveFromBuffer(this.response.data);
    }
    // debugger;
    await this._saveFromReadableStream(this.response.data);
  }


  /**
   * @return {Promise<void>}
   */
  async download() {

    await this.request();
    await this.save()
  }

  /**
   * 
   * @return {Promise<axios.AxiosResponse>}
   */
  async _makeRequest() {
   
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

  async _createReadStream() {

    const response = await this._makeRequest()

    if (this._events.response) {
      this.emit('response', response)
    }
    const contentLength = response.headers['content-length'] || response.headers['Content-Length'];
    this.fileSize = parseInt(contentLength);

    // this.response = response;
    return response.data;
  }


  _createWriteStream(fullPath) {
    // console.log(fullPath)
    return fs.createWriteStream(fullPath)
  }


  _getProgressStream(){
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

  _saveFromReadableStream(read){
  

    return new Promise(async (resolve, reject) => {
      try {       
        const fileName = await this._getFinalFileName();

        const progress = this._getProgressStream();
        const write = this._createWriteStream(`${this.config.directory}/${fileName}`)

        await pipeline(read, progress, write)

        resolve();
      } catch (error) {
        reject(error)
      }
    })
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


}


