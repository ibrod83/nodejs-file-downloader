

// console.log('env from root',process.env.NODE_ENV)
const express = require('express');
// const http = require('http');
const fs = require('fs');
const { Readable } = require('stream');


const port = '3002';
const app = express();

app.get('/', (req, res) => {
    console.log('incoming request!')
    // res.send('Hello World!')
    const read = fs.createReadStream('./fixtures/Desert.jpg');
    // read.pipe(res);

    const modifiedStream = Readable.from((async function* () {
        // await timeout(100)
        // yield 'yoyo'
        // await timeout(100)
        
        // counter++
        // if (counter === 4) {
            for await (const chunk of read) {
                await timeout(1000)
                yield chunk;

            }
        // } else {
        //     throw new Error('LOL');
        // }


    })());
    modifiedStream.pipe(res);
})

app.listen(port, () => {
    console.log(port)
})


function timeout(mil) {
    return new Promise((res) => {
        setTimeout(() => {
            res();
        }, mil)
    })
}



module.exports = {
    app
}

