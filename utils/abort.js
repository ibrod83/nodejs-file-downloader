const http = require('http')
const ClientRequest = http.ClientRequest

/**
 * 
 * @param {ClientRequest} request 
 */
function abort(request){
    const majorNodeVersion = process.versions.node.split('.')[0];
        // debugger
        if (!majorNodeVersion || majorNodeVersion < 14) {
            request.abort()

        } else {
            request.destroy()
        }
}

module.exports = abort