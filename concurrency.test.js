const expect = require('expect');
const { app, server } = require('./testServer');


const fs = require('fs');
const Path = require('path');
const rimraf = require('rimraf')
const {Downloader} = require('./Downloader');
const { Readable } = require('stream');
const e = require('express');
describe('concurrency tests', () => {
    beforeEach((done) => {
        rimraf.sync("./downloads");
        done();
    })

    after((done) => {
        done();
    })

    it('Should download 500 files, with different names, same directory - at the same time, within a synchronous loop', async function () {
        this.timeout(0);
        let errorCounter = 0;
        async function makeDownload(fileName) {
            const downloader = new Downloader({
                fileName,
                maxAttempts: 4,
                cloneFiles: true,
                url: `http://localhost:3002/koala`,
                directory: "./downloads",
            })
            try {
                await downloader.download();
            } catch (error) {
                console.log('error:', error)
                errorCounter++;
            }
        }

        const names = [];
        const promises = [];
        for (let i = 0; i < 500; i++) {
            const name = makeid(10) + '.jpg';
            names.push(name);
            promises.push(makeDownload(name))
        }
        await Promise.all(promises);
        for (let name of names) {
            const size = getFilesizeInBytes('./downloads/' + name);
            if (errorCounter > 0 || size !== 29051) {
                throw new Error('At least one file failed');
            }
        }
    })

    it('Should download 1000 files, with identical names, same directory - at the same time, within a synchronous loop, and skip 999', async function () {
        this.timeout(0);
        let errorCounter = 0;
        async function makeDownload(fileName) {
            const downloader = new Downloader({
                fileName,
                maxAttempts: 4,
                skipExistingFileName: true,
                url: `http://localhost:3002/koala`,
                directory: "./downloads",
            })
            try {
                await downloader.download()
            } catch (error) {
                errorCounter++;
            }
        }
        const names = []
        const promises = []
        for (let i = 0; i < 1000; i++) {
            const name = 'someName' + '.jpg';
            names.push(name);
            promises.push(makeDownload(name));
        }
        await Promise.all(promises);
        console.log(promises.length)

        const files = fs.readdirSync('./downloads');
        expect(files.length).toBe(1)
    })

})


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


