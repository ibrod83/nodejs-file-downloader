import rpur from './utils/rpur';
import { capitalize } from './utils/string';
import Download from './Download';
import { IncomingMessage } from 'http';

interface ConfigType {
  [index:string]:{
    type:any,
    mandatory:boolean
  }
  url: {
    type: 'string';
    mandatory: boolean;
  };
  directory: {
    type: 'string';
    mandatory: boolean;
  };
  fileName: {
    type: 'string';
    mandatory: boolean;
  };
  cloneFiles: {
    type: 'boolean';
    mandatory: boolean;
  };
  proxy: {
    type: 'string';
    mandatory: boolean;
  };
}

const configTypes: ConfigType = {
  
  url: {
    type: 'string',
    mandatory: true,
  },
  directory: {
    type: 'string',
    mandatory: false,
  },
  fileName: {
    type: 'string',
    mandatory: false,
  },
  cloneFiles: {
    type: 'boolean',
    mandatory: false,
  },
  proxy: {
    type: 'string',
    mandatory: false,
  },
};

const validateConfig = (config:DownloaderConfig) => {
  const generateTypeError = (prop:string) => { throw new Error(`config.${prop} must be of type ${configTypes[prop].type}`) }
  for (let prop in configTypes) {
    if (configTypes[prop].mandatory) {
      if (!config[prop])
        throw new Error(`Must supply a config.${prop}`);

        //@ts-ignore
        if (-1 === [].concat(configTypes[prop].type).indexOf(typeof config[prop]))
            generateTypeError(prop)
    }

    //@ts-ignore
      if (config.hasOwnProperty(prop) &&  -1 === [].concat(configTypes[prop].type).indexOf(typeof config[prop]))
          generateTypeError(prop)
  }
}


interface DownloaderConfig {
  [index:string]:any
  url: string;
  directory?: string;
  fileName?: string;
  cloneFiles?: boolean;
  skipExistingFileName?: boolean;
  timeout?: number;
  maxAttempts?: number;
  headers?: any;
  httpsAgent?: any;
  proxy?: string;
  onError?: (error: Error) => void | Promise<void>;
  onResponse?: (response: IncomingMessage) => boolean | Promise<boolean> | void;
  onBeforeSave?: (path: string) => string | Promise<string> | void;
  onProgress?: (percentage: number, chunk: Buffer, remainingSize: number) => Promise<void> | void;
  shouldStop?: (error: Error) => boolean | Promise<boolean> | void;
  shouldBufferResponse?: boolean;
  useSynchronousMode?: boolean;
}

 class Downloader {
  private config: DownloaderConfig;
  private _currentDownload: Download | null;

  constructor(config: DownloaderConfig) {
    if (!config || typeof config !== 'object') {
      throw new Error('Must provide a valid config object');
    }
    validateConfig(config);

    const defaultConfig: DownloaderConfig = {
      url: config.url,
      directory: './',
      fileName: undefined,
      timeout: 6000,
      maxAttempts: 1,
      useSynchronousMode: false,
      httpsAgent: undefined,
      proxy: undefined,
      headers: undefined,
      cloneFiles: true,
      skipExistingFileName: false,
      shouldBufferResponse: false,
      onResponse: undefined,
      onBeforeSave: undefined,
      onError: undefined,
      onProgress: undefined,
    };

    this.config = {
      ...defaultConfig,
      ...config,
    };

    if (this.config.fileName) {
      this.config.fileName = this.config.fileName;
    }

    this._currentDownload = null;
  }

  on(event:  keyof DownloaderConfig,
    callback: (arg?: any) => void | Promise<void>,
  ): void {
    //@ts-ignore
    this.config[`on${capitalize(event)}`] = callback;
  }
  
  /**
   * @return {Promise<{filePath:string|null,downloadStatus:"ABORTED"|"COMPLETE"}>}
   */
  async download(): Promise<{
    filePath: string | null;
    downloadStatus: 'ABORTED' | 'COMPLETE';
  }> {
    const that = this;
    const {
      url,
      directory,
      fileName,
      cloneFiles,
      skipExistingFileName,
      timeout,
      headers,
      httpsAgent,
      proxy,
      onResponse,
      onBeforeSave,
      onProgress,
      shouldBufferResponse,
      useSynchronousMode,
    } = that.config;
  
    // Repeat downloading process until success
    const { filePath, downloadStatus } = await that._makeUntilSuccessful(
      async () => {
        const download = new Download({
          url,
          directory,
          fileName,
          cloneFiles,
          skipExistingFileName,
          timeout,
          headers,
          httpsAgent,
          proxy,
          onResponse,
          onBeforeSave,
          onProgress,
          shouldBufferResponse,
          useSynchronousMode,
        });
        this._currentDownload = download;
  
        return await download.start();
      },
    );
  
    return { filePath, downloadStatus };
  }
  
  private async _makeUntilSuccessful(asyncFunc: () => Promise<any>): Promise<any> {
    let data;
    const func = asyncFunc.bind(this);
    await rpur(async () => {
      data = await func();
    }, {
      onError: async (e: Error) => {
        if (this.config.onError) {
          await this.config.onError(e);
        }
      },
      shouldStop: async (e: any) => {
        if (e.code === 'ERR_REQUEST_CANCELLED') {
          // Means the request was cancelled, therefore no repetition is required.
          return true;
        }
  
        if (this.config.shouldStop) {
          return await this.config.shouldStop(e) === true;
        }
        
        return false;
      },
      maxAttempts: this.config.maxAttempts,
    });
    return data;
  }
  
  
  cancel(): void {
    this._currentDownload?.cancel();
  }
  }


  export = Downloader