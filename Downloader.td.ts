import http from 'http';
export = Downloader;


interface DownloaderConfig{
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
    onResponse?(r:http.IncomingMessage):void
    onBeforeSave?(finalName:string):void
    onProgress?(percentage:string,chunk:object,remaningSize:number):void
    shouldStop?(e:Error):void
    shouldBufferResponse?:boolean
    useSynchronousMode?:boolean

}

declare class Downloader {

    constructor(config: DownloaderConfig);

    download():Promise<void>

    cancel():void

}