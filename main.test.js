const expect = require('expect')
const fs = require('fs');
const Path = require('path');
const rimraf = require('rimraf')
const Downloader = require('./Downloader');
const { Readable } = require('stream');
const nock = require('nock')

describe('Main tests', () => {
    before((done) => {
        rimraf.sync("./downloads");
        done();
    })

    it('Should download a picture and use content-type', async () => {
        const host = randomHost()
        nock(`http://www.${host}.com`)
            .get('/contentType1')
            .reply(200, (uri, requestBody) => {
                return fs.createReadStream(Path.join(__dirname, 'fixtures/Desert.jpg'))
            }, {
                'Content-Type': 'image/jpeg',
                'Content-Length': '23642'
            })
        const downloader = new Downloader({
            url: `http://www.${host}.com/contentType1`,
            directory: "./downloads",
            cloneFiles: false,
            onProgress: (p, chunk) => {
                expect(!isNaN(parseFloat(p)) && isFinite(p)).toBe(true)
                expect(Object.getPrototypeOf(chunk).constructor.name).toBe('Buffer')
            },
            onResponse: (r) => {

                expect(r.constructor.name).toBe('IncomingMessage');
            }
        })
        await downloader.download();
        await verifyFile('./downloads/contentType1.jpeg', 23642);
    })

    it('Should get the deduced name', async () => {
        let deducedName;
        const host = randomHost()
        nock(`http://www.${host}.com`)
            .get('/contentType')
            .reply(200, (uri, requestBody) => {
                return fs.createReadStream(Path.join(__dirname, 'fixtures/Desert.jpg'))
            }, {
                'Content-Type': 'image/jpeg',
                'Content-Length': '23642'
            })
        const downloader = new Downloader({
            url: `http://www.${host}.com/contentType`,
            directory: "./downloads",
            cloneFiles: false,
            onBeforeSave: (name) => {
                deducedName = name;
            }
        })

        await downloader.download();
        expect(deducedName).toBe('contentType.jpeg')
        await verifyFile('./downloads/contentType.jpeg', 23642);
    })

    it('Should override the deduced name', async () => {
        let deducedName;
        const host = randomHost()
        nock(`http://www.${host}.com`)
            .get('/contentType')
            .reply(200, (uri, requestBody) => {
                return fs.createReadStream(Path.join(__dirname, 'fixtures/Desert.jpg'))
            }, {
                'Content-Type': 'image/jpeg',
                'Content-Length': '23642'
            })
        const downloader = new Downloader({
            url: `http://www.${host}.com/contentType`,
            directory: "./downloads",
            cloneFiles: false,
            onBeforeSave: (name) => {
                deducedName = name;
                return 'override.jpg'
            }
        })
        await downloader.download();
        expect(deducedName).toBe('contentType.jpeg')
        await verifyFile('./downloads/override.jpg', 23642);
    })

    it ('Should skip same name request', async () => {
        let deducedName;
        const host = randomHost()
        let downloadTimes = 0;
        nock(`http://www.${host}.com`)
            .get('/contentType')
            .reply(200, (uri, requestBody) => {
                downloadTimes++
                return fs.createReadStream(Path.join(__dirname, 'fixtures/Desert.jpg'))
            }, {
                'Content-Type': 'image/jpeg',
                'Content-Length': '23642'
            }).persist()
        const downloader = new Downloader({
            url: `http://www.${host}.com/contentType`,
            directory: "./downloads",
            fileName: "testfile.jpg",
            cloneFiles:true
        })

        const downloader2 = new Downloader({
            url: `http://www.${host}.com/contentType`,
            directory: "./downloads",
            fileName: "testfile.jpg",
            cloneFiles:true,
            skipExistingFileName:true
        })
      
        await downloader.download();
        await downloader2.download();  
        await verifyFile('./downloads/testfile.jpg', 23642);
        expect(downloadTimes).toBe(1);
    })

    it ('Should skip same name request, without config.fileName', async () => {

        const host = randomHost()      
        nock(`http://www.${host}.com`)
            .get('/contentType')
            .reply(200, (uri, requestBody) => {
                return fs.createReadStream(Path.join(__dirname, 'fixtures/Desert.jpg'))
            }, {
                'Content-Type': 'image/jpeg',
                'Content-Length': '23642',
                'Content-Disposition': 'attachment; filename="testfile2.jpg"'
            }).persist()
        const downloader = new Downloader({
            url: `http://www.${host}.com/contentType`,
            directory: "./downloads",
        })

        const downloader2 = new Downloader({
            url: `http://www.${host}.com/contentType`,
            directory: "./downloads",
            skipExistingFileName:true
        })

        await downloader.download();
        await downloader2.download();
        await verifyFile('./downloads/testfile2.jpg', 23642);
        let error=false;
        try {
            //Make sure no clone is present
            await verifyFile('./downloads/testfile2_2.jpg', 23642);
        } catch (e) {
            error = true
        }
        expect(error).toBe(true);
    })

    it('Should download a file, without a known fileName, and skip the second one', async () => {
        rimraf.sync('./downloads')
        const host = randomHost()
        nock(`http://www.${host}.com`)
            .get('/contentType')
            .reply(200, (uri, requestBody) => {
                return fs.createReadStream(Path.join(__dirname, 'fixtures/Desert.jpg'))
            }, {
                'Content-Type': 'image/jpeg',
                'Content-Length': '23642',
            }).persist()

        const downloader = new Downloader({
            url: `http://www.${host}.com/contentType`,
            directory: "./downloads",
            skipExistingFileName: true
        })
        const downloader2 = new Downloader({
            url: `http://www.${host}.com/contentType`,
            directory: "./downloads",
            skipExistingFileName: true,
            cloneFiles: true
        })
        await downloader.download();
        await downloader2.download();
        await verifyFile('./downloads/contentType.jpeg', 23642);
        const files = fs.readdirSync('./downloads');
        expect(files.length).toBe(1)
    })

    it('Should get NaN in onProgress', async () => {
        const host = randomHost()
        nock(`http://www.${host}.com`)
            .get('/contentType')
            .reply(200, (uri, requestBody) => {
                return fs.createReadStream(Path.join(__dirname, 'fixtures/Desert.jpg'))
            }, {
                'Content-Type': 'image/jpeg',
            })
        const downloader = new Downloader({
            url: `http://www.${host}.com/contentType`,
            directory: "./downloads",
            cloneFiles: false,
            onProgress: (p, chunk, remaining) => {
                expect(isNaN(p)).toBe(true)
                expect(isNaN(remaining)).toBe(true)
                expect(Object.getPrototypeOf(chunk).constructor.name).toBe('Buffer')
            }
        })

        await downloader.download();       
        await verifyFile('./downloads/contentType.jpeg', 23642);
    })

    it('Should download a picture and overwrite the name', async () => {
        const host = randomHost()
        nock(`http://www.${host}.com`)
            .get('/Desert.jpg')
            .reply(200, (uri, requestBody) => {
                return fs.createReadStream(Path.join(__dirname, 'fixtures/Desert.jpg'))
            }, {
                'Content-Type': 'image/jpeg',
                'Content-Length': '23642'
            })
        const downloader = new Downloader({
            url: `http://www.${host}.com/Desert.jpg`,
            directory: "./downloads",
            cloneFiles: false,
            fileName: 'alternativeName.jpg'
        })
        
        await downloader.download();
        await verifyFile('./downloads/alternativeName.jpg', 23642);
    })

    it('Should download into a nested non-existing path', async () => {
        const host = randomHost()
        nock(`http://www.${host}.com`)
            .get('/Desert.jpg')
            .reply(200, (uri, requestBody) => {

                return fs.createReadStream(Path.join(__dirname, 'fixtures/Desert.jpg'))
            }, {
                'Content-Type': 'image/jpeg',
                'Content-Length': '23642'
            })
        const downloader = new Downloader({
            url: `http://www.${host}.com/Desert.jpg`,
            directory: "./downloads/May/2020",
            cloneFiles: false
        })
        
        await downloader.download();
        await verifyFile('./downloads/May/2020/Desert.jpg', 23642);
    })

    // **Assumes an already existing Desert.js file  */
    it('Should create a number-appended file', async () => {

        const host = randomHost()
        nock(`http://www.${host}.com`)
            .get('/Desert.jpg')
            .reply(200, (uri, requestBody) => {
                return fs.createReadStream(Path.join(__dirname, 'fixtures/Desert.jpg'))
            }, {
                'Content-Type': 'image/jpeg',
                'Content-Length': '23642'
            })
        const downloader = new Downloader({
            url: `http://www.${host}.com/Desert.jpg`,
            directory: "./downloads/May/2020",
        })
        
        await downloader.download();
        await verifyFile('./downloads/May/2020/Desert_2.jpg', 23642);

    })

    it('Should handle a file without content-length', async () => {
        const host = randomHost()
        nock(`http://www.${host}.com`)
            .get('/Koala.jpg')
            .reply(200, (uri, requestBody) => {
                return fs.createReadStream(Path.join(__dirname, 'fixtures/Koala.jpg'))
            }, {
                'Content-Type': 'image/jpeg',
                'Content-Length': '845941'
            })
        const downloader = new Downloader({
            url: `http://www.${host}.com/Koala.jpg`,
            directory: "./downloads",
        })
        
        await downloader.download();
        await verifyFile('./downloads/Koala.jpg');
    })

    it('Should handle a file without content-type', async () => {
        const host = randomHost()
        nock(`http://www.${host}.com`)
            .get('/Lighthouse.jpg')
            .reply(200, (uri, requestBody) => {

                return fs.createReadStream(Path.join(__dirname, 'fixtures/Lighthouse.jpg'))
            }, {
                'Content-Type': 'image/jpeg',
                'Content-Length': '845941'
            })
        const downloader = new Downloader({
            url: `http://www.${host}.com/Lighthouse.jpg`,
            directory: "./downloads",
        })
        
        await downloader.download();
        await verifyFile('./downloads/Lighthouse.jpg');
    })

    it('Should download a picture and get the name from content-disposition ', async () => {
        const host = randomHost()
        nock(`http://www.${host}.com`)
            .get('/contentDisposition')
            .reply(200, (uri, requestBody) => {
                return fs.createReadStream(Path.join(__dirname, 'fixtures/Hydrangeas.jpg'))
            }, {
                'Content-Type': 'image/jpeg',
                'Content-Disposition': 'Content-Disposition: attachment; filename="contentDispositionFile.jpg"',
                'Content-Length': '845941'
            })
        const downloader = new Downloader({
            url: `http://www.${host}.com/contentDisposition`,
            directory: "./downloads"
        })

        await downloader.download();
        await verifyFile('./downloads/contentDispositionFile.jpg');
    })


    it('Should download a picture with a querystring after the extension ', async () => {
        const host = randomHost()
        nock(`http://www.${host}.com`)
            .get('/Hydrangeas.jpg?width=400&height=300')
            .reply(200, (uri, requestBody) => {

                return fs.createReadStream(Path.join(__dirname, 'fixtures/Hydrangeas.jpg'))
            }, {
                'Content-Type': 'image/jpeg',
                'Content-Length': '845941'
            })

        const downloader = new Downloader({
            url: `http://www.${host}.com/Hydrangeas.jpg?width=400&height=300`,
            directory: "./downloads"
        })
        
        await downloader.download();
        await verifyFile('./downloads/Hydrangeas.jpg');
    })

    it('Should download two pictures, with name appending', async () => {
        try {

            const host = randomHost()
            nock(`http://www.${host}.com`)
                .get('/Koala.jpg')
                .reply(200, (uri, requestBody) => {
                    return fs.createReadStream(Path.join(__dirname, 'fixtures/Koala.jpg'))
                }, {
                    'Content-Type': 'image/jpeg',
                    'Content-Length': '29051'
                }).persist()
            const downloader = new Downloader({
                url: `http://www.${host}.com/Koala.jpg`,
                directory: "./downloads",
                cloneFiles: false
            })
            
            await downloader.download();
            await verifyFile('./downloads/Koala.jpg', 29051);

            const downloader2 = new Downloader({
                url: `http://www.${host}.com/Koala.jpg`,
                directory: "./downloads",
            })
            await downloader2.download();
        } catch (error) {
            console.log(error)
            throw error
        }
    })

    it('Should download an image, with shouldBufferResponse', async () => {
        const stream = fs.createReadStream(Path.join(__dirname, 'fixtures/Koala.jpg'));
  
        const chunks = []
        for await (let chunk of stream) {
            chunks.push(chunk)
        }

        const buffer = Buffer.concat(chunks);
        const host = randomHost();
        nock(`http://www.${host}.com`)
            .get('/Koala.jpg')
            .reply(200, (uri, requestBody) => {
                return buffer

            }, {
                'Content-Type': 'image/jpeg',
                'Content-Length': '29051'
            })

        try {
            const downloader = new Downloader({
                url: `http://www.${host}.com/Koala.jpg`,
                directory: "./downloads",
                cloneFiles: false,
                fileName: 'buffer.jpeg',
                shouldBufferResponse: true
            })
            
            await downloader.download();
        } catch (error) {
            throw error;
        } finally {
            await verifyFile('./downloads/buffer.jpeg', 29051);
        }
    })

    it('Should repeat a request few times and fail', async () => {
        const host = randomHost()
        nock(`http://www.${host}.com`)
            .get('/400')
            .reply(400).persist()
        var error;
        try {
            var counter = 0;
            const downloader = new Downloader({
                url: `http://www.${host}.com/400`,
                directory: "./downloads",
                maxAttempts: 3,
                onError: function () {
                    counter++;
                },
            })
            
            await downloader.download();
        } catch (e) {
            debugger;
            error = e
        } finally{
            expect(counter).toBe(3)
            expect(error.message).toBe('Request failed with status code 400')
        }
    })

    it('Should repeat fail after first attempt, because of shouldStop hook', async () => {
        const host = randomHost()
        nock(`http://www.${host}.com`)
            .get('/404')
            .reply(404).persist()

        try {
            var counter = 0;
            const downloader = new Downloader({
                url: `http://www.${host}.com/404`,
                directory: "./downloads",
                maxAttempts: 3,
                onError: function () {
                    counter++;
                },
                shouldStop: function (e) {
                    if (e.statusCode && e.statusCode === 404) {
                        return true;
                    }
                }
            })
            
            await downloader.download();
        } catch (error) {
            expect(counter).toBe(1);
            expect(error.message).toBe('Request failed with status code 404')
            expect(error.statusCode).toBe(404);        
        }

    })

    it('Should fail once and finally fail', async () => {
        const host = randomHost()
        nock(`http://www.${host}.com`)
            .get('/500')
            .reply(500).persist()
        var onErrorCount = 0;
        try {
            const downloader = new Downloader({
                timeout: 1000,
                url: `http://www.${host}.com/500`,
                directory: "./downloads",
                maxAttempts: 1,
                onError: (e) => {
                    onErrorCount++;
                }
            })
            await downloader.download();

        } catch (error) {
            
        } finally {
            expect(onErrorCount).toBe(1)
        }
    })

    it('Should use onResponse to stop download', async function () {
        const host = randomHost()
        fs.unlinkSync('./downloads/Koala.jpg')
        nock(`http://www.${host}.com`)
            .get('/Koala.jpg')
            .reply(200, (uri, requestBody) => {
                return fs.createReadStream(Path.join(__dirname, 'fixtures/Koala.jpg'))
            }, {
                'message': 'terminate'
            }).persist()

        const downloader = new Downloader({
            timeout: 1000,
            maxAttempts: 4,
            onResponse: function (response) {
                if (response.headers['message'] === 'terminate') {
                    return false;
                }
            },
            url: `http://www.${host}.com/Koala.jpg`,
            directory: "./downloads",
        })

        let fileExists = false
        await downloader.download();
        try {
            await verifyFile('./downloads/Koala.jpg', 29051);
            fileExists = true//Aint supposed to reach this, verifyFile should throw an error.
        } catch (error) {}

        if (fileExists) throw new Error("Download hasn't stopped")
    })

    it('Should use onResponse to continue download', async function () {
        const host = randomHost()
        nock(`http://www.${host}.com`)
            .get('/Koala.jpg')
            .reply(200, (uri, requestBody) => {
                return fs.createReadStream(Path.join(__dirname, 'fixtures/Koala.jpg'))
            }, { 'message': 'do not terminate' }).persist()

        const downloader = new Downloader({
            timeout: 1000,
            maxAttempts: 4,
            onResponse: function (response) {
                if (response.headers['message'] !== 'terminate') { 
                    return;
                }
                
                return false;
            },
            fileName: 'yoyo.jpg',
            url: `http://www.${host}.com/Koala.jpg`,
            directory: "./downloads",
        })

        try {
            const prom = await downloader.download();
        } catch (error) {
            
        } finally {       
            await verifyFile('./downloads/yoyo.jpg', 29051);
        }
    })

    it('Should use shouldCotinue to stop download', async function () {
        const host = randomHost()
        nock(`http://www.${host}.com`)
            .get('/Koala.jpg')
            .reply(200, (uri, requestBody) => {
                return fs.createReadStream(Path.join(__dirname, 'fixtures/Koala.jpg'))
            }, { 'message': 'terminate' }).persist()

            let error;
        const downloader = new Downloader({
            timeout: 1000,
            maxAttempts: 4,
            onResponse: function (response) {
                if (response.headers['message'] === 'terminate') {
                    return false;
                }               
                return false;
            },
            fileName: 'yoyo2.jpg',
            url: `http://www.${host}.com/Koala.jpg`,
            directory: "./downloads",
        })

        try {
            const prom = await downloader.download();  
            await verifyFile('./downloads/yoyo2.jpg', 29051);
        } catch (e) {
            error=e;            
        } finally {
            if(!error.code === 'ENOENT'){
                throw error;
            }
        }
    })

    
    it('Should get the underlying responseBody an Error, as JSON', async function () {


        const host = randomHost()
        nock(`http://www.${host}.com`)
            .get('/Koala.jpg')
            .reply(400, (uri, requestBody) => {
                return {
                    customErrorCode: 'SOME_CODE'
                    
                }
            }, { 'message': 'terminate' }).persist()

        let error;
        const downloader = new Downloader({

            fileName: 'yoyo2.jpg',
            url: `http://www.${host}.com/Koala.jpg`,
            directory: "./downloads",

        })

        try {
            await downloader.download();


        } catch (e) {
            const body = e.responseBody;
            
            expect(body.customErrorCode).toBe('SOME_CODE')
        }
    })

    it('Should get the underlying responseBody an Error, as string', async function () {


        const host = randomHost()
        nock(`http://www.${host}.com`)
            .get('/Koala.jpg')
            .reply(400, (uri, requestBody) => {
                return 'SOME_CODE'
                    
                
            }, { 'message': 'terminate' }).persist()

        let error;
        const downloader = new Downloader({

            fileName: 'yoyo2.jpg',
            url: `http://www.${host}.com/Koala.jpg`,
            directory: "./downloads",

        })

        try {
            await downloader.download();


        } catch (e) {
            const body = e.responseBody;
            
            expect(body).toBe('SOME_CODE')
        }
    })
})


function randomHost(length = 5) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function timeout(mil) {
    return new Promise((res) => {
        setTimeout(() => {
            res();
        }, mil)
    })
}

/**
    *
    * @param {string} path
    * @param {number} [size]
    */
function verifyFile(path, size) {
    return new Promise((resolve, reject) => {
        fs.readFile(path, (err, data) => {
            if (err)
                return reject(err);
            if (!size || data.length == size) {
                resolve();
            } else {
                reject(err);
            }
        });

    })

}

function doesFileExist(path) {
    return new Promise((resolve, reject) => {
        fs.readFile(path, (err, data) => {
            if (err)
                return resolve(false);
            resolve(true);
        });
    })
}
