nodejs-file-downloader is a simple utility for downloading files. It hides the complexity of dealing with streams, paths and duplicate file names. Can automatically repeat failed downloads.

If you encounter any bugs or have a question, please don't hesitate to open an issue.

## Installation

```sh
$ npm install nodejs-file-downloader
```
# Table of Contents
- [Examples](#examples)     
  * [Basic](#basic)  
  * [Get the progress of a download](#get-the-progress-of-a-download)  
  * [Custom file name](#custom-file-name)  
  * [Overwrite existing files](#overwrite-existing-files)  
  * [Hook into response](#hook-into-response)  
  * [Repeat failed downloads automatically](#repeat-failed-downloads-automatically)  

## Examples
#### Basic

Download a large file with default configuration

```javascript
const Downloader = require('nodejs-file-downloader');

(async () => {//Wrapping the code with an async function, just for the sake of example.

    const downloader = new Downloader({     
      url: 'http://212.183.159.230/200MB.zip',//If the file name already exists, a new file with the name 200MB1.zip is created.     
      directory: "./downloads",//This folder will be created, if it doesn't exist.               
    })
    
    await downloader.download();//Downloader.download() returns a promise.

    console.log('All done');

})();    

```

&nbsp;

#### Get the progress of a download

```javascript
const Downloader = require('nodejs-file-downloader');

(async () => {

   const downloader = new Downloader({     
      url: 'http://212.183.159.230/200MB.zip',     
      directory: "./downloads/2020/May",//Sub directories will also be automatically created if they do not exist.  
      onProgress:function(percentage){//Gets called with each chunk.
           console.log('% ',percentage)   
      }         
    })    
    
    await downloader.download();   

})();    

```

&nbsp;

#### Custom file name

Normally, nodejs-file-downloader "deduces" the file name, from the URL or the response headers. If you want to choose a custom file name, supply a config.fileName property.

```javascript

  const downloader = new Downloader({     
      url: 'http://212.183.159.230/200MB.zip',     
      directory: "./downloads/2020/May", 
      fileName:'somename.zip'//This will be the file name.        
  }) 

```

&nbsp;

#### Overwrite existing files

By default, nodejs-file-downloader uses config.cloneFiles = true, which means that files with an existing name, will have a number appended to them.

```javascript

  const downloader = new Downloader({     
      url: 'http://212.183.159.230/200MB.zip',     
      directory: "./",  
      cloneFiles:false//This will cause the downloader to re-write an existing file.   
  }) 

```

&nbsp;

#### Hook into response

If you need to get the underlying response, in order to decide whether the download should continue, or perform any other operations, use the onReponse hook.

```javascript

  //The response object is an Axios response object. Refer to their docs for more details.
  function onResponse(response){
    //Now you can do something with the response, like check the headers
    if(response.headers['content-length'] > 1000000){
      console.log('File is too big!')
      return false;//If you return false, the download process is stopped, and downloader.download() is resolved.
    } 
    
    //Returning any other value, including undefined, will tell the downloader to proceed as usual.
  }

  const downloader = new Downloader({     
      url: 'http://212.183.159.230/200MB.zip',     
      directory: "./",
      onResponse        
  }) 

  await downloader.download()

```

&nbsp;



#### Repeat failed downloads automatically

The program can repeat any failed downloads automatically. Only if the provided config.maxAttempts number is exceeded, an Error is thrown.


```javascript

  const downloader = new Downloader({     
      url: 'http://212.183.159.230/200MB.zip',     
      directory: "./",
      maxAttempts:3,//Default is 1.
      onError:function(error){//You can also hook into each failed attempt.
        console.log('Error from attempt ',error)
      }        
  })   

  await downloader.dowload();


```

&nbsp;
