const { read } = require('fs');
const http = require('http');
const https = require('https');
debugger
const { Readable } = require('stream');
const { once } = require('events');
// const {get} = require('./httpAdapter')
// const defaultHeaders = {
//     // "Accept-Encoding": "gzip,deflate",
//     // 'User-Agent': "node-fetch/1.0",
//     // "Accept": "*/*",
// }

async function request(url, config = {}) {
    // console.log(process.env)
    
    return new Promise((resolve, reject) => {
        // debugger;
        const { httpsAgent, headers, timeout, } = config;

        debugger;
        const options = {
            headers,
            timeout,
            agent: httpsAgent,
            // onTimeout//Function
        }

        const protocol = url.trim().startsWith('https') ? https : http;
        let readStream;

        const request = protocol.request(url, options, (res) => {
            readStream = res;
            debugger;
            if (res.statusCode !== 200) {
                res.resume();
                return reject(new Error(`Request failed with status code ${res.statusCode}` ))
            }
            resolve(readStream)

        }).end()

            .on('error', (e) => { reject(new Error(e.message)) });
        // debugger;
        if (options.timeout)
            request.setTimeout(options.timeout, () => {
                request.destroy(new Error(`Request timed out`))
                reject(new Error( `Request timed out` ))
                // console.log('after reject')
                if (readStream) {                 
                    debugger;
                    if (parseInt(process.versions.node.split('.')[0]) < 12) {
                        readStream.emit('error', new Error('Request timed out'));
                    }

                }                

            })


    })
}




// class CustomError extends Error {
//     // debugger;
//     constructor({ code, response, message, errno }) {
//         super(message)
//         // this.config = config;//The config object of the failing request
//         this.errno = errno//Error constant. Will be set Only in the case of network errors.
//         this.code = code;//http code.Null if network error
//         this.response = response//Reference to the customResponse. Will not be set in network errors.
//         Error.captureStackTrace(this, CustomError);
//     }
// }

module.exports = { request };