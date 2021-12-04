const expect = require('expect')
// const request = require('supertest');
const { app, server } = require('./testServer');

// var MockAdapter = require("axios-mock-adapter");
// var mock = new MockAdapter(axios);
const fs = require('fs');
const Path = require('path');
const rimraf = require('rimraf')
const Downloader = require('./Downloader');
const { Readable } = require('stream');
describe('concurrency tests', () => {

    beforeEach((done) => {
        rimraf.sync("./downloads");
        // console.log('done')
        // deleteFolderRecursive('./downloads')
        done();
    })

    after((done) => {
        // if (server) {
        //     server.close();
        // }

        done();
    })


    it('Should download 1000 files, with different names, same directory - at the same time, within a synchronous loop', async function () {
        this.timeout(0);
        let errorCounter = 0
        async function makeDownload(fileName) {
            const downloader = new Downloader({

                fileName,
                maxAttempts: 4,
                // timeout: 50000,
                cloneFiles: true,
                url: `http://localhost:3002/koala`,
                directory: "./downloads",
                // onResponse() {

                // },
                // onError() {
                //     errorCounter++
                // }

            })
            // console.log('downloading')
            try {
                await downloader.download()
            } catch (error) {
                errorCounter++
            }

            // console.log('finish')
        }
        // try {
        const names = []
        const promises = []
        for (let i = 0; i < 1000; i++) {
            const name = makeid(10) + '.jpg'
            names.push(name)
            promises.push(makeDownload(name))
        }
        await Promise.all(promises);

        for (let name of names) {
            // counter++
            const size = getFilesizeInBytes('./downloads/' + name);
            // console.log(size)
            if (errorCounter > 0 || size !== 29051) {
                throw new Error('At least one file failed')
            }

        }



    })

    it('Should download 1000 files, with identical names, same directory - at the same time, within a synchronous loop, and skip 999', async function () {
        this.timeout(0);
        let errorCounter = 0
        async function makeDownload(fileName) {
            const downloader = new Downloader({

                fileName,
                maxAttempts: 4,
                // timeout: 50000,
                // cloneFiles:true,
                skipExistingFileName: true,
                url: `http://localhost:3002/koala`,
                directory: "./downloads",
                // onResponse() {

                // },
                // onError() {
                //     errorCounter++
                // }

            })
            // console.log('downloading')
            try {
                await downloader.download()
            } catch (error) {
                errorCounter++
            }

            // console.log('finish')
        }
        // try {
        const names = []
        const promises = []
        for (let i = 0; i < 1000; i++) {
            const name = 'someName' + '.jpg'
            names.push(name)
            promises.push(makeDownload(name))
        }
        await Promise.all(promises);
        console.log(promises.length)
        // for(let name of names){
        //     // counter++
        //     const size = getFilesizeInBytes('./downloads/'+name);
        //     // console.log(size)
        //     if(errorCounter > 0 || size !== 29051){
        //         throw new Error('At least one file failed')
        //     }

        // }
        const files = fs.readdirSync('./downloads');
        //    console.log(files.length)
        expect(files.length).toBe(1)



    })

})

// function doesFileExist(path) {
//     return new Promise((resolve, reject) => {
//         fs.readFile(path, (err, data) => {
//             // console.log('err', err)
//             if (err)
//                 return resolve(false)

//             resolve(true)

//         });

//     })
// }

function makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() *
            charactersLength));
    }
    return result;
}

function getFilesizeInBytes(filename) {
    var stats = fs.statSync(filename)
    var fileSizeInBytes = stats["size"]
    return fileSizeInBytes
}


