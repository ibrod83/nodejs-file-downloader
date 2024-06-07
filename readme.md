nodejs-file-downloader is a simple utility for downloading files. It hides the complexity of dealing with streams, redirects, paths and duplicate file names. Can automatically repeat failed downloads.

In case you encounter any bugs or have a question, please don't hesitate to open an issue.

[If you like the program and want to support me for my work, you can buy me &#x2615;](https://ko-fi.com/ibrod83)

 
## Installation

```sh
$ npm install nodejs-file-downloader
```
# Table of Contents

- [Examples](#examples)
  - [Basic](#basic)
  - [Get the progress of a download](#get-the-progress-of-a-download)
  - [Get the deduced file name and override it](#get-the-deduced-file-name-and-override-it)
  - [Custom file name](#custom-file-name)
  - [Overwrite existing files](#overwrite-existing-files)
  - [Send custom headers](#send-custom-headers)
  - [Hook into response](#hook-into-response)
  - [Repeat failed downloads automatically](#repeat-failed-downloads-automatically)
  - [Prevent unnecessary repetition](#prevent-unnecessary-repetition)
  - [Cancel a download](#cancel-a-download)
  - [Use a Proxy](#use-a-proxy)
- [Error handling](#error-handling)
  - [Getting the response body during an error](#getting-the-response-body-during-an-error)
  - [ECONNRESET](#ECONNRESET)

## Examples

#### Basic

Download a large file with default configuration

```javascript
const {Downloader} = require("nodejs-file-downloader");

(async () => {
  //Wrapping the code with an async function, just for the sake of example.

  const downloader = new Downloader({
    url: "http://212.183.159.230/200MB.zip", //If the file name already exists, a new file with the name 200MB1.zip is created.
    directory: "./downloads", //This folder will be created, if it doesn't exist.   
  });
  try {
    const {filePath,downloadStatus} = await downloader.download(); //Downloader.download() resolves with some useful properties.

    console.log("All done");
  } catch (error) {
    //IMPORTANT: Handle a possible error. An error is thrown in case of network errors, or status codes of 400 and above.
    //Note that if the maxAttempts is set to higher than 1, the error is thrown only if all attempts fail.
    console.log("Download failed", error);
  }
})();
```

&nbsp;

#### Get the progress of a download

If the response headers contain information about the file size, onProgress hook can be used. If the file size cannot be determined, "percentage" and "remainingSize" arguments will be called with NaN.

```javascript
const {Downloader} = require("nodejs-file-downloader");

(async () => {
  const downloader = new Downloader({
    url: "http://212.183.159.230/200MB.zip",
    directory: "./downloads/2020/May", //Sub directories will also be automatically created if they do not exist.
    onProgress: function (percentage, chunk, remainingSize) {
      //Gets called with each chunk.
      console.log("% ", percentage);
      console.log("Current chunk of data: ", chunk);
      console.log("Remaining bytes: ", remainingSize);
    },
  });

  try {
    await downloader.download();
  } catch (error) {
    console.log(error);
  }
})();
```

&nbsp;

#### Get the deduced file name and override it

If you haven't supplied a "fileName" config property, the program will try its best to choose the most appropriate name for the file(from the URL, headers, etc). In case you wish to know the name that was chosen, before the file is actually saved, use the onBeforeSave hook, which is called with the deduced name.
If you're "unhappy" with the name, it can be overridden by returning a new string. Returning anything else(including undefined/void), will
let the program know that it can keep the name.

```javascript
const downloader = new Downloader({
  url: "http://212.183.159.230/200MB.zip",
  directory: "./downloads/2020/May",
  onBeforeSave: (deducedName) => {
    console.log(`The file name is: ${deducedName}`);
    //If you return a string here, it will be used as the name(that includes the extension!).
  },
});
```

&nbsp;

#### Custom file name

Normally, nodejs-file-downloader "deduces" the file name, from the URL or the response headers. If you want to choose a custom file name, supply a config.fileName property.

```javascript
const downloader = new Downloader({
  url: "http://212.183.159.230/200MB.zip",
  directory: "./downloads/2020/May",
  fileName: "somename.zip", //This will be the file name.
});
```

&nbsp;

#### Overwrite existing files

By default, nodejs-file-downloader uses config.cloneFiles = true, which means that files with an existing name, will have a number appended to them.

```javascript
const downloader = new Downloader({
  url: "http://212.183.159.230/200MB.zip",
  directory: "./",
  cloneFiles: false, //This will cause the downloader to re-write an existing file.
});
```

If you want to completely skip downloading a file, when a file with the same name already exists, use config.skipExistingFileName = true

&nbsp;

#### Send custom headers

Just add a "headers" property to the config object:

```javascript
const downloader = new Downloader({
  url: "http://212.183.159.230/200MB.zip",
  directory: "./",
  headers: {
    "Some-Header": value,
  },
});
```

&nbsp;

#### Hook into response

If you need to get the underlying response, in order to decide whether the download should continue, or perform any other operations, use the onReponse hook.

```javascript
//The response object is a node response(http.IncomingMessage)
function onResponse(response) {
  //Now you can do something with the response, like check the headers
  if (response.headers["content-length"] > 1000000) {
    console.log("File is too big!");
    return false; //If you return false, the download process is stopped, and downloader.download() is resolved.
  }

  //Returning any other value, including undefined, will tell the downloader to proceed as usual.
}

const downloader = new Downloader({
  url: "http://212.183.159.230/200MB.zip",
  directory: "./",
  onResponse,
});
try {
  await downloader.download();
} catch (error) {
  console.log(error);
}
```

&nbsp;

#### Repeat failed downloads automatically

The program can repeat any failed downloads automatically. Only if the provided config.maxAttempts number is exceeded, an Error is thrown.

```javascript
const downloader = new Downloader({
  url: "http://212.183.159.230/200MB.zip",
  directory: "./",
  maxAttempts: 3, //Default is 1.
  onError: function (error) {
    //You can also hook into each failed attempt.
    console.log("Error from attempt ", error);
  },
});

try {
  await downloader.download();
} catch (error) {
  //If all attempts fail, the last error is thrown.
  console.log("Final fail", error);
}
```

&nbsp;

#### Prevent unnecessary repetition

If you use the auto-repeat option, by setting the maxAttempts to greater than 1, "shouldStop" hook can be used, To decide
whether the repetition should continue. This is useful in cases where you're generating many dynamic url's, some of which can result in a 404 http status code(for example), and there is no point in repeating that request.

```javascript
const downloader = new Downloader({
  url: "http://212.183.159.230/200MB.zip",
  directory: "./",
  maxAttempts: 3, //We set it to 3, but in the case of status code 404, it will run only once.
  shouldStop: function (error) {
    //A request that results in a status code of 400 and above, will throw an Error, that contains a custom property
    //"statusCode".

    //Note that an error that is thrown during the stream itself(after a valid http response was already received. It's quite rare, but happens), will not have a "statusCode" property.
    if (e.statusCode && e.statusCode === 404) {
      return true; //If you return true, the repetition will not happen. Returning anything else, including undefined, will let the downloader know that you want to continue repeating.
    }
  },
});

try {
  await downloader.download();
} catch (error) {
  //If all attempts fail, the last error is thrown.
  console.log("Final fail", error);
}
```

&nbsp;

#### Cancel a download

This feature is new. Kindly report any bugs you encounter.
Useful for Electron apps.

```javascript
const downloader = new Downloader({
  url: "http://212.183.159.230/200MB.zip",
  directory: "./",
});

try {
  //Mocking cancellation
  setTimeout(() => {
    downloader.cancel();
  }, 2000);

  await downloader.download();

  //If the download is cancelled, the promise will not be resolved, so this part is never reached
  console.log("done");
} catch (error) {
  //When the download is cancelled, 'ERR_REQUEST_CANCELLED' error is thrown. This is how you can handle cancellations in your code.
  if (error.code === "ERR_REQUEST_CANCELLED") {
    //do something after cancellation..
  } else {
    //handle general error..
  }
}
```

&nbsp;

#### Use a proxy

You can pass a proxy string. Under the hood, this will create a custom httpsAgent. This feature wasn't tested extensively.

```javascript
const downloader = new Downloader({
  proxy: "http://username:password@some-proxy.com:22225",
  url: "http://212.183.159.230/200MB.zip",
  directory: "./",
});
```

&nbsp;

## Error handling

downloader.download() will throw an error, just like Axios, in case of network problems
or an http status code of 400 or higher.

If the auto-repeat feature is enabled(by setting the maxAttempts to higher than 1), then only a failure of the final attempt will throw an error.

&nbsp;
#### Getting the response body during an error

If a status code of 400 or above is received, the program throws an error. In this case, a reference to the response body will be available in error.responseBody:

```javascript
const downloader = new Downloader({
  url: "http://www.somesite.com/400",
  directory: "./",
});

try {
  await downloader.download();
} catch (error) {
  if (error.responseBody) {
    console.log(error.responseBody)
  }
}

```

&nbsp;

#### ECONNRESET

If you're getting a consistent ECONNRESET error, it's possible the server requires a User-Agent header to be sent. Try adding it:

```javascript
const downloader = new Downloader({
  url: "http://www.user-agent-required.com/",
  directory: "./",
  headers:{
    'User-Agent':'Some user agent..'
  }
});


```

&nbsp;

