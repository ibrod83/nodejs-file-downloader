// const { read } = require('fs');
// const http = require('http');
const { http, https } = require('follow-redirects');
const IncomingMessage = http.IncomingMessage
const abort = require('./utils/abort')
// const https = require('https');
// debugger;




/**
 * Wraps the http request in a promise
 * @param {string} url 
 * @param {object} [config] 
 * @param {object} [config.headers] 
 * @param {number} [config.timeout] 
 * @param {httpsAgent} [config.agent] 
 * @returns {Promise<IncomingMessage>}
 */
async function request(url, config = {}) {
    // console.log(process.env)
    let request;
    // let nativeRequest;
    let prom=new Promise((resolve, reject) => {

        // debugger;
        const { httpsAgent, headers, timeout, } = config;

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
        let readStream;
        // debugger;
        request = protocol.request(url, options, (res) => {
            debugger;
            // nativeRequest = request._currentRequest;
            readStream = res;
            // debugger;
            if (res.statusCode > 226) {
                res.resume();
                const error = new Error(`Request failed with status code ${res.statusCode}`)
                error.statusCode  = res.statusCode
                return reject(error)
            }
            resolve({
                request:request._currentRequest,response:readStream
            })

        })
        // debugger
            request.on('error', (e) => { 
                // debugger;
                // console.log(prom)
                reject(new Error(e.message))
             })
           

        if (options.timeout) {
            // const nativeRequest = request._currentRequest;
            
            // debugger;
            request.setTimeout(options.timeout, () => {
                // console.log(request.abort)
                // debugger;
                const nativeReuqest = request._currentRequest
                const error = new Error(`Request timed out`)
                reject(error)

                abort(nativeReuqest);

                if (readStream) {
                    readStream.emit('error', error);
                }               


            })
        }

        request.end()



    })
    return prom;
}




module.exports = { request };