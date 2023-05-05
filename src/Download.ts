import * as fs from 'fs';
import * as http from 'http'; // For jsdoc
import { IncomingMessage } from 'http';
import makeRequest from './makeRequest';
import * as stream from 'stream';
import HttpsProxyAgent from 'https-proxy-agent';
import { Transform } from 'stream';
import * as util from 'util';
import {FileProcessor} from './utils/FileProcessor';
import { deduceFileName, exists, getTempFilePath } from './utils/fileName';
import { isJson } from './utils/string';
import { isDataUrl } from './utils/url';
import { bufferToReadableStream, createWriteStream, createBufferFromResponseStream, pipeStreams, getStringFromStream } from './utils/stream';
import path from 'path';
import { Socket } from 'net';

interface TempAndFinalPath {
    finalPath: string;
    tempPath: string;
  }

const mkdir = util.promisify(fs.mkdir);
const writeFile = util.promisify(fs.writeFile);
const unlink = util.promisify(fs.unlink);
const rename = util.promisify(fs.rename);

enum DownloadStatusEnum {
  COMPLETE = 'COMPLETE',
  ABORTED = 'ABORTED'
}

interface DownloadConfig {
  url: string;
  directory?: string;
  fileName?: string | undefined;
  cloneFiles?: boolean;
  skipExistingFileName?: boolean;
  timeout?: number;
  headers?: {[index:string]:string}; 
  httpsAgent?: any;
  proxy?: string | undefined;
  onResponse?: (response: IncomingMessage) => boolean | Promise<boolean> | void;
  onBeforeSave?: (fileName: string) => string | Promise<string> | void;
  onProgress?: (percentage: number, chunk: Buffer, remainingSize: number) => Promise<void> | void;
  shouldBufferResponse?: boolean;
  useSynchronousMode?: boolean;
}



export default class Download {
  private config: DownloadConfig;
  private isCancelled: boolean = false;
  private cancelCb: (() => void) | null = null;
  private percentage: number = 0;
  private fileSize: number | null = null;
  private currentDataSize: number = 0;

  constructor(config: DownloadConfig) {
    
    const defaultConfig: Partial<DownloadConfig> = {
      directory: './',
      fileName: undefined,
      timeout: 6000,
      useSynchronousMode: false,
      httpsAgent: undefined,
      proxy: undefined,
      headers: undefined,
      cloneFiles: true,
      skipExistingFileName: false,
      shouldBufferResponse: false,
      onResponse: undefined,
      onBeforeSave: undefined,
      onProgress: undefined
    };

    this.config = {
      ...defaultConfig,
      ...config
    };
  }


  /**
 * The entire download process.
 * @return {Promise<{filePath:string | null,downloadStatus:(keyof downloadStatusEnum)} | void>}
 */
async start(): Promise<{ filePath: string | null, downloadStatus: keyof typeof DownloadStatusEnum } | void> {

    await this._verifyDirectoryExists(this.config.directory as string);
  
    if (await this._shouldSkipRequest()) {
      return { downloadStatus: DownloadStatusEnum.ABORTED, filePath: null };
    }
  
    try {
  
      const { dataStream, originalResponse } = await this._request();  

      await this._handlePossibleStatusCodeError({ dataStream, originalResponse });
  
      if (this.config.onResponse) {
  
        const shouldContinue = await this.config.onResponse(originalResponse);
        if (shouldContinue === false) {
          return { downloadStatus: DownloadStatusEnum.ABORTED, filePath: null };
        }
      }
  
      let { finalFileName, originalFileName } = await this._getFileName(originalResponse.headers);
      
 
      const finalPath = await this._getFinalPath({ dataStream, finalFileName, originalFileName });
  
      return { filePath: finalPath, downloadStatus: finalPath ? DownloadStatusEnum.COMPLETE : DownloadStatusEnum.ABORTED };
  
    } catch (error:any) {
  
      if (this.isCancelled) {
        const customError:any = new Error('Request cancelled');
        customError.code = 'ERR_REQUEST_CANCELLED';
        throw customError;
      }
      throw error;
    }
  
  }
  async _shouldSkipRequest(): Promise<boolean> {        
    if (this.config.fileName && this.config.skipExistingFileName) {
      if (await exists(this.config.directory + '/' + this.config.fileName)) {
        return true
      }
    }
    return false
  }

  /**
   * 
   * @param {Object} obj 
   * @param {stream.Readable} obj.dataStream 
   * @param {http.IncomingMessage} obj.originalResponse
   */
  async _handlePossibleStatusCodeError({dataStream, originalResponse}: {dataStream:  NodeJS.ReadableStream, originalResponse: http.IncomingMessage}): Promise<void> {

    if (originalResponse.statusCode && originalResponse.statusCode > 226) {
      const error = await this._createErrorObject(dataStream, originalResponse);
      throw error;
    }
  }

  async _createErrorObject(dataStream:  NodeJS.ReadableStream, originalResponse: http.IncomingMessage): Promise<Error> {
    const responseString = await getStringFromStream(dataStream);
    const error :any= new Error(`Request failed with status code ${originalResponse.statusCode}`)
    error.statusCode = originalResponse.statusCode
    error.response = originalResponse
    error.responseBody = isJson(responseString) ? JSON.parse(responseString) : responseString
    // return error;
    return error;
  }

  /**
   * 
   * @param {string} directory 
   */
  async _verifyDirectoryExists(directory: string): Promise<void> {
    await mkdir(directory, { recursive: true });
  }


  async _request(): Promise<{dataStream: NodeJS.ReadableStream, originalResponse: http.IncomingMessage}> {
    if (isDataUrl(this.config.url)) {
      return this._mimic_RequestForDataUrl(this.config.url);
    } else {
      const { dataStream, originalResponse } = await this._makeRequest();
      const headers = originalResponse.headers;
      const contentLength = headers['content-length'] || headers['Content-Length'];
      this.fileSize = parseInt(contentLength as string);
      return { dataStream, originalResponse };
    }
  }

  
//write a method 
  
   
  /**
   * @param {string} dataUrl
   * @return {Promise<{dataStream:stream.Readable,originalResponse:http.IncomingMessage}}  
   */
  _mimic_RequestForDataUrl(dataUrl:string) {
  
    const mimeType = dataUrl.match(/data:([^;]+);/)?.[1];
    const base64Data = dataUrl.replace(/^data:[^;]+;base64,/, '');
    const data = Buffer.from(base64Data, 'base64');
    const dataStream = bufferToReadableStream(data);
    
    const originalResponse = new IncomingMessage(new Socket());
    originalResponse.headers = {
      'content-type': mimeType,  
      'content-length': data.byteLength.toString(),
    };
    originalResponse.statusCode = 200;
    this.fileSize = data.byteLength;
    return { dataStream, originalResponse };
  }
  
  async _getFinalPath({ dataStream, finalFileName, originalFileName }:{ dataStream:NodeJS.ReadableStream, finalFileName:string, originalFileName:string }) {
    let finalPath;
    const shouldSkipSaving = await this._shouldSkipSaving(originalFileName);
    if (!shouldSkipSaving) {
      finalPath = await this._save({ dataStream, finalFileName, originalFileName });
    } else {
      finalPath = null;
    }
    return finalPath;
  }
  
  /**
   * 
   * @param {string} originalFileName 
   * @returns 
   */
  async _shouldSkipSaving(originalFileName:string) {
    if (this.config.skipExistingFileName) {
      const filePath = path.join(this.config.directory as string, originalFileName);
      if (await fs.promises.access(filePath).then(() => true).catch(() => false)) {
        return true;
      }
    }
    return false;
  }

  /**
   * 
   * @param finalFileName 
   * @returns TempAndFinalPath
   */
  _getTempAndFinalPath(finalFileName: string): TempAndFinalPath {
    const finalPath = `${this.config.directory}/${finalFileName}`;
    const tempPath = getTempFilePath(finalPath);
    return { finalPath, tempPath };
  }
  async _saveAccordingToConfig({ dataStream, tempPath }: { dataStream: NodeJS.ReadableStream; tempPath: string }): Promise<void> {
    if (this.config.shouldBufferResponse) {
      const buffer = await createBufferFromResponseStream(dataStream);
      await this._saveFromBuffer(buffer, tempPath);
    } else {
      await this._saveFromReadableStream(dataStream, tempPath);
    }
  }

  async _handleOnBeforeSave(finalFileName: string): Promise<string> {
    if (this.config.onBeforeSave) {
      const clientOverideName = await this.config.onBeforeSave(finalFileName);
      if (clientOverideName && typeof clientOverideName === 'string') {
        finalFileName = clientOverideName;
      }
    }
    return finalFileName;
  }

  /**
   * @param input
   * @return finalPath
   */
  async _save({ dataStream, finalFileName, originalFileName }:{dataStream:NodeJS.ReadableStream,finalFileName:string,originalFileName:string}): Promise<string | null> {
    
    if (await this._shouldSkipSaving(originalFileName)) {
        return null;
      }

      let updatedFinalFileName = await this._handleOnBeforeSave(finalFileName);

      var { finalPath, tempPath } = this._getTempAndFinalPath(updatedFinalFileName);
    
    try {   
 
      await this._saveAccordingToConfig({ dataStream, tempPath });

      await this._renameTempFileToFinalName(tempPath, finalPath);

      return finalPath;

    } catch (error) {
      if (!this.config.shouldBufferResponse) {
       
        await this._removeFailedFile(tempPath);
      }

      throw error;
    }
  }

  /**
   * @returns dataStream and originalResponse
   */
  async _makeRequest(): Promise<{ dataStream: NodeJS.ReadableStream, originalResponse: IncomingMessage }> {
    const { timeout, headers, proxy, url, httpsAgent } = this.config;
    const options: Partial<{ timeout: number, headers?: {[index:string]:string}, agent?: http.Agent }> = {      
           headers,
    };
    if(timeout){
        options.timeout = timeout
    }

    if (httpsAgent) {
      options.agent = httpsAgent;
    } else if (proxy) {
        //@ts-ignore
      options.agent = new HttpsProxyAgent(proxy);
    }

    const { makeRequestIter, cancel } = makeRequest(url, options);
    this.cancelCb = cancel;
    const { dataStream, originalResponse } = await makeRequestIter();

    return { dataStream, originalResponse };
  }

  /**
   * @returns progress stream
   */
  _getProgressStream(): Transform {
    const that = this;
    const progress = new Transform({
      transform(chunk, encoding, callback) {
        that.currentDataSize += chunk.byteLength;

        if (that.fileSize) {

            //@ts-ignore
          that.percentage = ((that.currentDataSize / that.fileSize) * 100).toFixed(2);
        } else {
          that.percentage = NaN;
        }

        const remainingFracture = (100 - that.percentage) / 100;
        //@ts-ignore
        const remainingSize = Math.round(remainingFracture * that.fileSize);

        if (that.config.onProgress) {
          that.config.onProgress(that.percentage, chunk, remainingSize);
        }

        // Push the data onto the readable queue.
        callback(null, chunk);
      },
    });

    return progress;
  }

  async _saveFromReadableStream(read: NodeJS.ReadableStream, path: string): Promise<void> {
    const streams :Array<stream.Stream> = [read];
    const write = createWriteStream(path);

    if (this.config.onProgress) {
      const progressStream = this._getProgressStream();
      streams.push(progressStream);
    }

    streams.push(write);
    await pipeStreams(streams);
  }

  async _saveFromBuffer(buffer: Buffer, path: string): Promise<void> {
    await writeFile(path, buffer);
  }

  async _removeFailedFile(path: string): Promise<void> {
    await unlink(path);
  }

  async _renameTempFileToFinalName(temp: string, final: string): Promise<void> {
    await rename(temp, final);
  }

  /**
   * @param responseHeaders
   * @returns finalFileName and originalFileName
   */
  async _getFileName(responseHeaders:http.IncomingHttpHeaders): Promise<{ finalFileName: string; originalFileName: string }> {
    let originalFileName: string;
    let finalFileName: string;

    if (this.config.fileName) {
      originalFileName = this.config.fileName;
    } else {
      originalFileName = deduceFileName(this.config.url, responseHeaders);
    }

    if (this.config.cloneFiles === true) {
      const fileProcessor = new FileProcessor({ useSynchronousMode: this.config.useSynchronousMode, fileName: originalFileName, path: this.config.directory as string });
      finalFileName = await fileProcessor.getAvailableFileName();
    } else {
      finalFileName = originalFileName;
    }

    return { finalFileName, originalFileName };
  }

  cancel(): void {
    if (this.cancelCb) {
      this.isCancelled = true;
      this.cancelCb();
    }
  }

  

  

  

}