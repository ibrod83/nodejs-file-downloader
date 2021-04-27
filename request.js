const { http, https } = require('follow-redirects');
module.exports = class Request {

    /**
     * 
     * @param {string} url 
     * @param {object} [config] 
     * @param {object} [config.headers] 
     * @param {number} [config.timeout] 
     * @param {httpsAgent} [config.agent]   
     */
    constructor(url, config) {


        this._config = {}
        this._config.url = url;
        this._config.httpsAgent = config.httpsAgent;
        this._config.timeout = config.timeout;
        this._config.headers = config.headers;


        this.nativeRequest = null;//ClientRequest
        this.responseStream = null;//IncomingMessage

    }
    async perform() {
        // debugger
        const { httpsAgent, headers, timeout, } = this._config;
        const { request, response } = await this._makeRequest(this._config.url, { httpsAgent, headers, timeout, })
        // debugger
        this.nativeRequest = request;
        this.responseStream = response;
    }

    cancel() {
        if (this.nativeRequest)
            this.nativeRequest.abort();
    }

    async _makeRequest(url, config = {}) {
        // console.log(process.env)
        // debugger
        let request;
        let prom = new Promise((resolve, reject) => {

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
                
                // debugger;
                readStream = res;
                readStream.on('aborted',(e)=>{
                    console.log(e)
                    debugger
                })
                // debugger;
                if (res.statusCode > 226) {
                    res.resume();
                    const error = new Error(`Request failed with status code ${res.statusCode}`)
                    error.statusCode = res.statusCode
                    return reject(error)
                }
                resolve({
                    request: request._currentRequest, response: readStream
                })

            })
                .on('error', (e) => {
                    // debugger;
                    // console.log(prom)
                    reject(new Error(e.message))
                })

            if (options.timeout) {

                request.setTimeout(options.timeout, () => {

                    const error = new Error(`Request timed out`)
                    reject(error)
                    debugger
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
}