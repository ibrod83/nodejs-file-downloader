// const { read } = require('fs');
// const http = require('http');
const { http, https } = require('follow-redirects');
const IncomingMessage = http.IncomingMessage
// const https = require('https');
// debugger;




/**
 * 
 * @param {string} url 
 * @param {object} [config] 
 * @param {object} [config.headers] 
 * @param {number} [config.timeout] 
 * @param {httpsAgent} [config.agent] 
 * @returns {Promise<IncomingMessage>}
 */
async function request(url, config = {}) {
    // console.log(process.env)
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
        const request = protocol.request(url, options, (res) => {
            // debugger;
            readStream = res;
            // debugger;
            if (res.statusCode > 226) {
                res.resume();
                const error = new Error(`Request failed with status code ${res.statusCode}`)
                error.statusCode  = res.statusCode
                return reject(error)
            }
            resolve(readStream)

        })
            .on('error', (e) => { 
                // debugger;
                // console.log(prom)
                reject(new Error(e.message))
             })
           


        // debugger;
        // if (options.timeout) {
        //     debugger;
        //     request.setTimeout(options.timeout, () => {
        //         debugger;
        //         const error = new Error(`Request timed out`)
        //         request.destroy(error)
        //         reject(error)
        //         // console.log('after reject')
        //         if (readStream) {
        //             // debugger;
        //             if (parseInt(process.versions.node.split('.')[0]) < 12) {
        //                 readStream.emit('error', error);
        //             }

        //         }

        //     })
        // }
        if (options.timeout) {
            // debugger;
            request.setTimeout(options.timeout, () => {
                
                // debugger;
                const error = new Error(`Request timed out`)
                reject(error)
                request.destroy(error)
               
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