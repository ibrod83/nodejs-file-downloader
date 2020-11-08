// const { read } = require('fs');
const http = require('http');
const IncomingMessage = http.IncomingMessage
const https = require('https');
// debugger
// const { Readable } = require('stream');
// const { once } = require('events');
// const {get} = require('./httpAdapter')
// const defaultHeaders = {
//     // "Accept-Encoding": "gzip,deflate",
//     // 'User-Agent': "node-fetch/1.0",
//     // "Accept": "*/*",
// }


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

    return new Promise((resolve, reject) => {
        // debugger;
        const { httpsAgent, headers, timeout, } = config;

        // debugger;
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
            // debugger;
            if (res.statusCode > 226) {
                res.resume();
                return reject(new Error(`Request failed with status code ${res.statusCode}`))
            }
            resolve(readStream)

        }).end()

            .on('error', (e) => { reject(new Error(e.message)) });
        // debugger;
        if (options.timeout) {
            request.setTimeout(options.timeout, () => {
                const error = new Error(`Request timed out`)
                request.destroy(error)
                reject(error)
                // console.log('after reject')
                if (readStream) {
                    // debugger;
                    if (parseInt(process.versions.node.split('.')[0]) < 12) {
                        readStream.emit('error', error);
                    }

                }

            })
        }



    })
}




module.exports = { request };