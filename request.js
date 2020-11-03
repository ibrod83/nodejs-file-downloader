const http = require('http');
const https = require('https');
// const {get} = require('./httpAdapter')
// const defaultHeaders = {
//     // "Accept-Encoding": "gzip,deflate",
//     // 'User-Agent': "node-fetch/1.0",
//     // "Accept": "*/*",
// }

function request(url, config = {}) {
    // const defaultConfig = {

    // }
    // const headers = {
    //     ...defaultHeaders,
    //     ...config.headers
    // }
    const {httpsAgent,headers,timeout} = config;
    const options = {
        headers,
        timeout,
        agent:httpsAgent
    }

    return new Promise((resolve, reject) => {

        const protocol = url.trim().startsWith('https') ? https : http;

        debugger;
        // const request = get(url, options, (res) => {
        const request = protocol.get(url, options, (res) => {
            debugger;
            if (res.statusCode !== 200) {
                // Consume response data to free up memory
                res.resume();
                return reject(new CustomError({ code: res.statusCode, message: `Request failed with status ${res.statusCode}` }))
            }
            resolve({
                readStream: res,
                headers: res.headers
            })
            // res.pipe(fs.createWriteStream(dest)).once('close', () => resolve());
        })
            .on('timeout', (e) => {
                debugger;
                reject(new CustomError({ message: `Request timed out` }))
            })
            .on('error', (e) => { reject(new CustomError({ message: e.message })) });
            debugger;
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
    }
}

module.exports = { request };