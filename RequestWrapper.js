// const { read } = require('fs');
// const http = require('http');
const { http, https } = require('follow-redirects');
const IncomingMessage = http.IncomingMessage
const ClientRequest = http.ClientRequest
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
        this.request = null;
        this.response = null;
        this.responsePromise = null;
    }

    setTimeout(mil, cb) {
        this.redirectableRequest.setTimeout(mil, cb)
    }

   
    makeRequest() {
        // debugger
        const prom = new Promise((resolve, reject) => {
            // debugger
            const url = this.url
            const { httpsAgent, headers, timeout, } = this.config;

            // debugger;
            // console.log('headersss',headers)
            const options = {
                headers,
                timeout,
                agent: httpsAgent,
                // onTimeout//Function
            }
            // debugger;

            const protocol = url.trim().startsWith('https') ? https : http;
            const redirectableRequest = protocol.request(url, options, (res) => {
                this.response = res;
                debugger;
                // nativeRequest = request._currentRequest;
                // readStream = res;
                // debugger;
                if (res.statusCode > 226) {
                    res.resume();
                    const error = new Error(`Request failed with status code ${res.statusCode}`)
                    error.statusCode = res.statusCode
                    return reject(error)
                }
                resolve(this.response)

            })
            this.redirectableRequest = redirectableRequest;
            this.request = redirectableRequest._currentRequest;
            this.redirectableRequest.end()
            // this.request = redirectableRequest._currentRequest;
            // this.redirectableRequest = request;
        })
        // debugger

        this.responsePromise = prom;
        return this.request

        // this.redirectableRequest = redirectableRequest;
        // this.request = redirectableRequest._currentRequest;
        // return this.request
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