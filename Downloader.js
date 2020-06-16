const fs = require('fs');
const axios = require('axios');
const stream = require('stream');
const { Transform } = require('stream')
const util = require('util');
const { EventEmitter } = require('events')
const path = require('path');
const sanitize = require('sanitize-filename');
const FileProcessor = require('./FileProcessor');
var mime = require('mime-types')
const pipeline = util.promisify(stream.pipeline);
const mkdir = util.promisify(fs.mkdir);



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
   * @param {boolean} [config.cloneFiles] 
   */
  constructor(config) {
    super();
    if(!config || typeof config !== 'object'){
      throw new Error('Must provide a valid config object')
    }
    validateConfig(config);

    const defaultConfig = {
      directory: './',
      fileName: null,
      cloneFiles: true,
    }

    this.config = {
      ...defaultConfig,
      ...config
    }

    this.response = null;
    this.readStream = null;
    this.fileSize = null;
    this.currentDataSize = 0;

  }

  async createReadStream(url) {
    const response = await axios({
      method: 'get',
      url: this.config.url,
      responseType: 'stream'
    })
    // console.log(response.constructor)
    // debugger;
    if (this._events.response) {
      this.emit('response', response)
    }
    const contentLength = response.headers['content-length'] || response.headers['Content-Length'];
    this.fileSize = parseInt(contentLength);
    // console.log('content-length',response.headers['content-length'])
    // console.log('Content-Length',response.headers['Content-Length'])
    // debugger;
    this.response = response;
    return response.data;
  }


  createWriteStream(fullPath) {
    // console.log(fullPath)
    return fs.createWriteStream(fullPath)
  }


  download() {
    // debugger;
    const that = this;

    return new Promise(async (resolve, reject) => {
      try {
        const read = await this.createReadStream(this.config.url);
        let fileName;
        if (this.config.fileName) {
          fileName = this.config.fileName
        } else {
          fileName = this.deduceFileName()
        }
        // debugger;
        var fileProcessor = new FileProcessor({ fileName, path: this.config.directory })
        // debugger;
        if (! await fileProcessor.pathExists(this.config.directory)) {
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
        }
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
        // write.on('error',(error)=>{console.log('error from write',error)})
        // console.log(write)
        // setTimeout(()=>{
        //   read.unpipe();
        //    setTimeout(()=>{
           
        //    },5000)
        // },5000)
        await pipeline(read, progress,write )

        resolve();
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Returns the file name from content-disposition if exists. Empty string otherwise.
   * @return {string} filename
   */
  getFileNameFromContentDisposition(contentDisposition) {


    let filename = "";
    var filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
    var matches = filenameRegex.exec(contentDisposition);
    if (matches != null && matches[1]) {
      filename = matches[1].replace(/['"]/g, '');
    }

    return filename;
  }


  /**
   * Deduce the fileName, covering various scenarios.
   * @return {string} sanitizedBaseName
   */
  deduceFileName() {

    const headers = this.response.headers;
    const contentDisposition = headers['content-disposition'] || headers['Content-Disposition'];
    const contentType = this.response.headers['content-type'] || headers['Content-Type'];
    // console.log('content-type',contentType)
    if (contentDisposition && contentDisposition.includes('filename=')) {
      return this.getFileNameFromContentDisposition(contentDisposition);
    }
    // console.log('content-disposition',contentDisposition)
    const baseName = path.basename(this.config.url);
    const extension = path.extname(baseName);
    const sanitizedBaseName = sanitize(baseName)
    if (extension) {
      return sanitizedBaseName;
    }

    const extensionFromContentType = mime.extension(contentType)
    if (extensionFromContentType) {
      return `${sanitizedBaseName}.${extensionFromContentType}`
    }

    return sanitizedBaseName;

  }
}


