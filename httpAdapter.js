const http = require('http');
const https = require('https');

function get(){
    debugger;
    const url = arguments[0]
    const protocol = url.trim().startsWith('https') ? https : http;
    return protocol.get(...arguments);

}

module.exports = {get}