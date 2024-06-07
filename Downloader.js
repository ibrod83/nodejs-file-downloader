const rpur = require('./utils/rpur')
const { capitalize } = require('./utils/string')
const Download = require('./Download');


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

        if (-1 === [].concat(configTypes[prop].type).indexOf(typeof config[prop]))
            generateTypeError(prop)
    }

      if (config.hasOwnProperty(prop) &&  -1 === [].concat(configTypes[prop].type).indexOf(typeof config[prop]))
          generateTypeError(prop)
  }
}


 class Downloader {


  /**
   * 
   * @param {object} config 
   * @param {string} config.url 
   * @param {string} [config.method= 'GET']
   * @param {string} [config.directory]    
   * @param {string} [config.fileName = undefined] 
   * @param {boolean} [config.cloneFiles=true] true will create a duplicate. false will overwrite the existing file. 
   * @param {boolean} [config.skipExistingFileName = false] true will cause the downloader to skip the download process in case a file with the same name already exists.
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
      skipExistingFileName:false,
      shouldBufferResponse: false,
      onResponse: undefined,
      onBeforeSave: undefined,
      onError: undefined,
      onProgress: undefined,
      method: 'GET',
    }

    this.config = {
      ...defaultConfig,
      ...config
    }



    if (this.config.filename) {
      this.config.fileName = this.config.filename
    }

    this._currentDownload = null;

  }

  //For EventEmitter backwards compatibility
  on(event, callback) {
    this.config[`on${capitalize(event)}`] = callback
  }




  /**
   * @return {Promise<{filePath:string|null,downloadStatus:"ABORTED"|"COMPLETE"}>}
   */
  async download() {
    const that = this;
    const { url, method, directory, fileName, cloneFiles, skipExistingFileName, timeout, headers, httpsAgent, proxy, onResponse, onBeforeSave, onProgress, shouldBufferResponse, useSynchronousMode } = that.config;

    //Repeat downloading process until success    
    const {filePath,downloadStatus} = await that._makeUntilSuccessful(async () => {
      const download = new Download({ url, method, directory, fileName, cloneFiles, skipExistingFileName, timeout, headers, httpsAgent, proxy, onResponse, onBeforeSave, onProgress, shouldBufferResponse, useSynchronousMode });
      this._currentDownload = download

      return await download.start();

    })

    return {filePath,downloadStatus}


  }

  /**
   * @param {Function} asyncFunc
   * @return {Promise<any>} 
   */
  async _makeUntilSuccessful(asyncFunc) {

    let data;
    const func = asyncFunc.bind(this)
    await rpur(async () => {

      data = await func();
    }, {
      onError: async (e) => {
        if (this.config.onError) {
          await this.config.onError(e);
        }
      },
      shouldStop: async (e) => {

        if (e.code === 'ERR_REQUEST_CANCELLED')//Means the request was cancelled, therefore no repetition is required.
          return true;

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

  cancel() {

    this._currentDownload.cancel();
  }




}

//Export Downloader as both default and a named export
module.exports = Downloader
module.exports.Downloader = Downloader


