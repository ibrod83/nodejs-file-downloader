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
  * [Get response and then download](#get-response-and-then-download)  
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

#### Get response and then download

There is an alternative way to using Downloader.download():

```javascript

  const downloader = new Downloader({     
      url: 'http://212.183.159.230/200MB.zip',     
      directory: "./",        
  }) 

  const response = await downloader.request()//This function just performs the request. The file isn't actually being downloaded yet. It returns an Axios response object. You can refer to their docs for more details.

  //Now you can do something with the response, like check the headers
  if(response.headers['content-length'] < 1000000){
    await downloader.save()
  }else{
    console.log('File is too big!')
  }  

  //Note that Downloader.download() simply combines these two function calls.


```

&nbsp;



#### Repeat failed downloads automatically

The program can repeat any failed http request or a stream automatically. Just set the maxAttempts property.
Note that this applies separately both to the http request and the stream(each will have 3 maxAttemps, in this example).

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
