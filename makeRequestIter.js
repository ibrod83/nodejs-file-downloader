const { http, https } = require('follow-redirects');
const { Readable } = require('stream')

async function* makeRequestIter(url, config = {}) {
    debugger
    const protocol = url.trim().startsWith('https') ? https : http;
    let request;
    // let response;
    debugger
    const responsePromise = new Promise((resolve) => {
        request = protocol.request(url, config, (res) => {
            debugger
            console.log('response')
            resolve(res)
        });
        debugger

    });
    debugger
    const timeoutPromise = new Promise((resolve, reject) => {
        if (config.timeout) {
            request.setTimeout(config.timeout, () => {
                debugger
                console.log('from timeout callback')
                reject('timeout')
            });
        }
    });

    try {
        var response =  Promise.race([
            responsePromise,
            timeoutPromise
        ])
        debugger
    } catch (error) {
        debugger
        throw error;
    }

    const responseIter = response[Symbol.asyncIterator]();
    debugger
    while (true) {
        debugger
        const item = await Promise.race([
            responseIter.next(),
            timeoutPromise
        ]);
        if (item.done) {
            break;
        }
        yield item.value;
    }

    //for await (const chunk of response) {
    //    yield chunk;
    //}
}

const iter = makeRequestIter('https://ibrod83.com/timeout/', { timeout: 5000 });

Readable.from(iter).on('data', (c) => {
    console.log(c)
}).on('error', (e) => {
    console.log(e)
})







// const items = [];
// for await (const chunk of makeRequestIter('...', {})) {
//     items.push(chunk);
// }

// const fs = require('fs')

// const https = require('https');

// const request = https.get('https://ibrod83.com/timeout/',{},(res)=>{
//     console.log('response recevied')
//     const write =fs.createWriteStream('./yoyo')
//     res.pipe(write);
//     res.on('aborted',()=>{
//         console.log('res aborted')
//     })

// })

// request.setTimeout(5000,()=>{
//     console.log('request timedout')
//     request.abort();

// })


