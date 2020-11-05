const { read } = require('fs');
const http = require('http');
const https = require('https');
const { Readable } = require('stream');
const { once } = require('events');
// const {get} = require('./httpAdapter')
// const defaultHeaders = {
//     // "Accept-Encoding": "gzip,deflate",
//     // 'User-Agent': "node-fetch/1.0",
//     // "Accept": "*/*",
// }

async function request(url, config = {}) {
   
    // // debugger;
    // const protocol = url.trim().startsWith('https') ? https : http;
    // const { httpsAgent, headers, timeout,  } = config;
    // const options = {
    //     headers,
    //     timeout,
    //     agent: httpsAgent,
    //     // onTimeout//Function
    // }

    // let respReceived = false;

    // //ClientRequest
    // const request = protocol.get(url, options);
    // request.on('timeout', () => {
    //     debugger
    //     if(respReceived){
    //         response.emit(new Error('Stream timed out'));
    //         // request.destroy()

    //     }else{
    //         request.destroy(new Error('Request timed out'))
    //     }
    //     // request.destroy(
    //     //     respReceived
    //     //         ? new Error('Stream timed out')
    //     //         : new Error('Request timed out')
    //     // );
    // });

    // //IncomingMessage
    // const response = await new Promise((resolve, reject) => {        
    //     request
    //         .on('response', resolve)
    //         .on('error', reject);
    // });
    // debugger;

    // respReceived = true;
    // // debugger;
  

    // // const [response] = await once(request, 'response');

   

    // if (response.statusCode !== 200) {
    //     // Consume response data to free up memory
    //     response.resume();
    //     throw new CustomError({ code: res.statusCode, message: `Request failed with status ${res.statusCode}` });
    // }


    // debugger
    // return response

    return new Promise((resolve, reject) => {

        const { httpsAgent, headers, timeout, onTimeout } = config;


        const options = {
            headers,
            timeout,
            agent: httpsAgent,
            // onTimeout//Function
        }

        const protocol = url.trim().startsWith('https') ? https : http;
        let readStream;

        const request = protocol.get(url, options, (res) => {
            readStream = res;

            if (res.statusCode !== 200) {
                res.resume();
                return reject(new CustomError({ code: res.statusCode, message: `Request failed with status ${res.statusCode}` }))
            }
            resolve(readStream)

        }).on('timeout', (e) => {
            // debugger;
            // timedOut = true;
            reject(new CustomError({ message: `Request timed out` }))
            if (readStream){
                debugger;
                //  readStream.emit('error', new Error('Stream timed out'));
                // request.destroy()
                readStream.destroy(new Error('Stream timed out'));
                // readStream.emit('error', new Error('Stream timed out'));
            }
               
           
            debugger;

            
            // request.destroy(new Error('Request was destroyed due to time out!!'))
        })
            .on('error', (e) => { reject(new CustomError({ message: e.message })) });
        // debugger;
        if (options.timeout)
            request.setTimeout(options.timeout)


    })
}


class CustomError extends Error {
    // debugger;
    constructor({ code, response, message, errno }) {
        super(message)
        // this.config = config;//The config object of the failing request
        this.errno = errno//Error constant. Will be set Only in the case of network errors.
        this.code = code;//http code.Null if network error
        this.response = response//Reference to the customResponse. Will not be set in network errors.
        Error.captureStackTrace(this, CustomError);
    }
}

module.exports = { request };