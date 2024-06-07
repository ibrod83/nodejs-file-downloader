import * as http from 'http';


export interface DownloaderConfig{
    url:string
    directory?:string
    fileName?:string
    cloneFiles?:boolean
    skipExistingFileName?:boolean
    timeout?:number
    maxAttempts?:number
    headers?:object
    httpsAgent?:any
    proxy?:string
    onError?(e:Error):void
    onResponse?(r:http.IncomingMessage):boolean|void
    onBeforeSave?(finalName:string):string|void
    onProgress?(percentage:string,chunk:object,remainingSize:number):void
    shouldStop?(e:Error):boolean|void
    shouldBufferResponse?:boolean
    useSynchronousMode?:boolean

}

export interface DownloaderReport{
    downloadStatus:"COMPLETE"|"ABORTED"
    filePath:string|null
}


export declare class Downloader {

    constructor(config: DownloaderConfig);

    download():Promise<DownloaderReport>

    cancel():void

}

export default Downloader;
