

// console.log('env from root',process.env.NODE_ENV)
const express = require('express');
// const http = require('http');
const fs = require('fs');
const { Readable } = require('stream');


const port = '3002';
const app = express();
// debugger
app.get('/cancelWhileStream', (req, res) => {
    // console.log('incoming request!')
    // res.send('Hello World!')
    const read = fs.createReadStream('./fixtures/Desert.jpg',{highWaterMark:2000});
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




app.get('/cancelBeforeStream', async (req, res) => {
    // console.log('incoming request!')
    // res.send('Hello World!')
    await timeout(3000)
    const read = fs.createReadStream('./fixtures/Desert.jpg');
    // read.pipe(res);

    const modifiedStream = Readable.from((async function* () {
        // await timeout(100)
        // yield 'yoyo'
        // await timeout(100)

        // counter++
        // if (counter === 4) {
        for await (const chunk of read) {
            // await timeout(1000)
            yield chunk;

        }
        // } else {
        //     throw new Error('LOL');
        // }


    })());
    modifiedStream.pipe(res);
})

app.get('/timeoutDuringStream', (req, res) => {
    // console.log('incoming request!')
    // res.send('Hello World!')
    const read = fs.createReadStream('./fixtures/Koala.jpg',{highWaterMark:2000});
    // read.pipe(res);

    const modifiedStream = Readable.from((async function* () {
        // await timeout(100)
        // yield 'yoyo'
        // await timeout(100)

        // counter++
        let counter = 0;
        // if (counter === 4) {
        for await (const chunk of read) {
            // counter++
            // console.log(counter);
            // yield chunk
            // console.log('streaming')
            if (counter === 0) {
                // console.log(chunk)
                // console.log('counter',counter)
                counter++
                yield chunk;
            } else {
                // console.log('before timeout')
                await timeout(2000)
                yield chunk;
            }



        }
        // } else {
        //     throw new Error('LOL');
        // }


    })());
    modifiedStream.pipe(res);
})

app.get('/timeoutBeforeResponse', async(req, res) => {
    // console.log('incoming request!')
    // res.send('Hello World!')
    const read = fs.createReadStream('./fixtures/Koala.jpg',{highWaterMark:2000});
    // read.pipe(res);
    await timeout(5000)
    const modifiedStream = Readable.from((async function* () {

        for await (const chunk of read) {
            yield chunk
        }


    })());
    modifiedStream.pipe(res);
})

app.get('/koala',async(req,res)=>{

    const read = fs.createReadStream('./fixtures/Koala.jpg',{highWaterMark:2000});

    const modifiedStream = Readable.from((async function* () {

        for await (const chunk of read) {
            yield chunk
        }


    })());
    modifiedStream.pipe(res);
})

const server = app.listen(port, () => {
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
    app,
    server
}



// async function* sourceData() {
//     yield 1;
//     yield 2;
//     yield 3;
// }

// async function* filter(source, predicate) {
//     for await (const item of source) {
//         if (await predicate(item)) {
//             yield item;
//         }
//     }
// }

// async function* map(source, mapper) {
//     for await (const item of source) {
//         yield await mapper(item);
//     }
// }

// let iter = sourceData();
// iter = filter(iter, async val => await checkNumIsValidViaExternalService(val));
// iter = map(iter, val => val.toFixed(2));
// iter = map(iter, async val => {
//     await new Promise(resolve => setTimeout(resolve, 100));
//     return val;
// });

// const finalIter = sourceData()
//     .filter(...)
//     .map(...)
//     .map(...)

// const finalIter = pipe(
//     sourceData(),
//     filter(...),
//     map(...),
//     map(...)
// );

// for await (const item of iter) {
//     console.log(item);
// }
