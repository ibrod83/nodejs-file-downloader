// const { read } = require('fs');
// const http = require('http');
const { http, https } = require('follow-redirects');
// const IncomingMessage = http.IncomingMessage
// const ClientRequest = http.ClientRequest
const abort = require('./utils/abort')
// const https = require('https');
// debugger;




/**

 * @param {string} url 
 * @param {object} [config] 
 * @param {object} [config.headers] 
 * @param {number} [config.timeout] 
 * @param {httpsAgent} [config.agent] 
 */
class RequestWrapper {
    constructor(url, config = {}) {
        this.url = url;
        this.config = config;

        this.redirectableRequest = null;
        // this.request = null;
        // this.response = null;
        this.responsePromise = null;
    }

    setTimeout(mil, cb) {
        // debugger
        this.redirectableRequest.setTimeout(mil, ()=>{
            // debugger
            cb()
        })
    }

    async getResponse() {
        return await this.responsePromise;
    }

    getRequest() {
        return this.redirectableRequest._currentRequest;
    }

    abort() {
        // debugger
        abort(this.getRequest())
    }

    onError(cb) {
        this.redirectableRequest.on('error', (e) => {
            cb(e)
        })
    }


    makeRequest() {
        // debugger
        const prom = new Promise((resolve, reject) => {
            // debugger
            const url = this.url
            const { httpsAgent, headers, timeout, } = this.config;

            const options = {
                headers,
                timeout,
                agent: httpsAgent,
            }

            const protocol = url.trim().startsWith('https') ? https : http;
            const redirectableRequest = protocol.request(url, options, (res) => {

                if (res.statusCode > 226) {
                    res.resume();
                    const error = new Error(`Request failed with status code ${res.statusCode}`)
                    error.statusCode = res.statusCode
                    return reject(error)
                }
                resolve(res)

            })
            this.redirectableRequest = redirectableRequest;
            this.redirectableRequest.end()
            // this.redirectableRequest = redirectableRequest;
            // this.currentRequest = this.redirectableRequest._currentRequest;
        })
        // debugger

        this.responsePromise = prom;

        // return this.redirectableRequest


    }


}
// function request(url, config = {}) {
//     return {
//         request: null,
//         promise: new Promise((resolve, reject) => {

//             // debugger;
//             const { httpsAgent, headers, timeout, } = config;

//             // debugger;
//             // console.log('headersss',headers)
//             const options = {
//                 headers,
//                 timeout,
//                 agent: httpsAgent,
//                 // onTimeout//Function
//             }
//             // debugger;

//             const protocol = url.trim().startsWith('https') ? https : http;
//             let readStream;
//             // debugger;
//             request = protocol.request(url, options, (res) => {
//                 debugger;
//                 // nativeRequest = request._currentRequest;
//                 readStream = res;
//                 // debugger;
//                 if (res.statusCode > 226) {
//                     res.resume();
//                     const error = new Error(`Request failed with status code ${res.statusCode}`)
//                     error.statusCode = res.statusCode
//                     return reject(error)
//                 }
//                 resolve({
//                     request: request._currentRequest, response: readStream
//                 })

//             })
//             this.request = request;
//             debugger
//             request.on('error', (e) => {
//                 // debugger;
//                 // console.log(prom)
//                 reject(new Error(e.message))
//             })


//             if (options.timeout) {
//                 // const nativeRequest = request._currentRequest;

//                 // debugger;
//                 request.setTimeout(options.timeout, () => {
//                     // console.log(request.abort)
//                     // debugger;
//                     const nativeReuqest = request._currentRequest
//                     const error = new Error(`Request timed out`)
//                     reject(error)

//                     abort(nativeReuqest);

//                     if (readStream) {
//                         readStream.emit('error', error);
//                     }


//                 })
//             }

//             request.end()

//         })
//     }

// }




// module.exports = { request };
module.exports = RequestWrapper