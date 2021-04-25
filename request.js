module.exports = class Request {

    /**
     * 
     * @param {string} url 
     * @param {object} [config] 
     * @param {object} [config.headers] 
     * @param {number} [config.timeout] 
     * @param {httpsAgent} [config.agent]   
     */
    constructor(url,config) {
        this._nativeRequest = null;
        this._config.url = url;
        this._config.httpsAgent = config.httpsAgent;
        this._config.timeout = config.timeout;
        this._config.headers = config.headers;


        this.responseStream = null;        

    }
    async perform() {
        const { httpsAgent, headers, timeout, } = this._config; 
        const {request,response} = await this._makeRequest(this._url,{ httpsAgent, headers, timeout, } )
    }

    cancel() { }

    async _makeRequest(url, config = {}) {
        // console.log(process.env)
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
                // debugger;
                if (res.statusCode > 226) {
                    res.resume();
                    const error = new Error(`Request failed with status code ${res.statusCode}`)
                    error.statusCode = res.statusCode
                    return reject(error)
                }
                resolve({
                    request, response: readStream
                })

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
                    console.log(request.destroy)
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
}