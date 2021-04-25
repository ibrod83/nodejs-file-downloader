

const rpur = require('./utils/rpur')
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

  }

  //For EventEmitter backwards compatibility
  on(event, callback) {
    this.config[`on${capitalize(event)}`] = callback
  }

  

  /**
  * @return {Promise<void>}
  */
  download() {
    const that = this;
    const {url,directory,fileName,cloneFiles,timeout,headers,httpsAgent,proxy,onResponse,onBeforeSave,onProgress,shouldBufferResponse,useSynchronousMode} = that.config;
    return {
      async then(fulfilled, rejected) {
        try {
        
          await that._makeUntilSuccessful(async () => {
            const download = new Download({url,directory,fileName,cloneFiles,timeout,headers,httpsAgent,proxy,onResponse,onBeforeSave,onProgress,shouldBufferResponse,useSynchronousMode});
            // setTimeout(()=>{
            //   download.cancel();
            // },1000)
            await download.start();
            fulfilled()
          })
        } catch (error) {
          // console.log('ERROR',error)
          rejected(error)
        }

      }

    }

    // debugger

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




}


