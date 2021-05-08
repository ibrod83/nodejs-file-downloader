const { http, https } = require('follow-redirects');
const { Readable, } = require('stream')
// const fs = require('fs');
// const { request } = require('express');

function makeRequest(url, config = {}) {
    // let cancelled = false;
    let cancelPromiseReject;
    let request;
    // let nativeRequest;
    const responsePromise = new Promise((resolve, reject) => {
        const protocol = url.trim().startsWith('https') ? https : http;

        request = protocol.request(url, config, (res) => {
            if (res.statusCode > 226) {
                res.resume();
                const error = new Error(`Request failed with status code ${res.statusCode}`)
                error.statusCode = res.statusCode
                return reject(error)
            }
            // debugger
            resolve(res)
        });
        request.end()
        // nativeRequest = request._currentRequest;
    });
    const timeoutPromise = new Promise((resolve, reject) => {
        if (config.timeout) {
            request.setTimeout(config.timeout, () => {
                // debugger
                const customError = new Error('Request timed out')
                customError.code = 'ERR_REQUEST_TIMEDOUT'
                // throw customError
                // console.log('from timeout callback')
                reject(customError)
            });
        }
    });

    const cancelPromise = new Promise((resolve, reject) => {
        cancelPromiseReject = reject;
    })
    async function makeRequestIter() {

        const response = await Promise.race([
            responsePromise,
            cancelPromise,
            timeoutPromise
        ]);
        // debugger

        const responseIter = response[Symbol.asyncIterator]();

        const data = (async function* () {
            try {
                while (true) {
                    // if (cancelled) {
                    //     debugger
                    //     const customError = new Error('Request cancelled')
                    //     customError.code = 'ERR_REQUEST_CANCELLED'
                    //     throw customError;
                    // }
                    const item = await Promise.race([
                        responseIter.next(),
                        cancelPromise,
                        timeoutPromise
                    ]);
                    if (item.done) {
                        break;
                    }
                    yield item.value;
                }

            } catch (error) {
                // console.log('error from mini iterator',error)
                debugger
                abort(request._currentRequest);
                throw error
            }
        })();

        return {
            dataStream: Readable.from(data),
            originalResponse: response, // The original
        };
    }

    return {
        makeRequestIter,
        cancel() {
            // cancelled = true;
            const customError = new Error('Request cancelled')
            customError.code = 'ERR_REQUEST_CANCELLED'
            // throw customError;
            cancelPromiseReject(customError)
            // abort(request._currentRequest)
        }
    }
}




// module.exports = makeRequestIter;
module.exports = makeRequest;
// (async () => {
//     const { dataStream, originalResponse } = await makeRequestIter('https://ibrod83.com/timeout/',{timeout:5000} );
//     // debugger
//     debugger
//     const writeable = fs.createWriteStream('./timeoutFile')
//     // Readable.from(iter).on('data', (c) => {
//     //     console.log(c)
//     // }).on('error', (e) => {
//     //     console.log(e)
//     // })
//     // readable.on('aborted', (e) => {
//     //     console.log('from on error', e)
//     // })

//     dataStream.pipe(writeable)
// })();



/**
 * 
 * @param {ClientRequest} request 
 */
function abort(request) {
    const majorNodeVersion = process.versions.node.split('.')[0];
    // debugger
    if (!majorNodeVersion || majorNodeVersion < 14) {
        request.abort()

    } else {
        request.destroy()
    }
}


// const items = [];
// for await (const chunk of makeRequestIter('...', {})) {
//     items.push(chunk);
// }

// const fs = require('fs')

// const https = require('https');

// const request = https.get('https://ibrod83.com/timeout/',{},(res)=>{
//     console.log('response recevied')
//     const write =fs.createWriteStream('./yoyo')
//     res.pipe(write);
//     res.on('aborted',()=>{
//         console.log('res aborted')
//     })

// })

// request.setTimeout(5000,()=>{
//     console.log('request timedout')
//     request.abort();

// })


