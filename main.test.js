const expect = require('expect')
const fs = require('fs');
const Path = require('path');
const rimraf = require('rimraf')
const {Downloader} = require('./Downloader');
const { Readable } = require('stream');
const nock = require('nock')

describe('Main tests', () => {
    before((done) => {
        rimraf.sync("./downloads");
        done();
    })

    it('Should download a file using POST method', async () => {
        const host = randomHost()
        nock(`http://www.${host}.com`)
            .post('/post')
            .reply(200, (uri, requestBody) => {
                return fs.createReadStream(Path.join(__dirname, 'fixtures/Desert.jpg'))
            },{
                'Content-Type': 'image/jpeg',
                'Content-Length': '23642'
            })
        const downloader = new Downloader({
            url: `http://www.${host}.com/post`,
            directory: "./downloads",
            method: 'POST'
           
        })
        const { downloadStatus, filePath } = await downloader.download();
        expect(downloadStatus).toBe('COMPLETE')
        expect(filePath).toBe('./downloads/post.jpeg')
        await verifyFile('./downloads/post.jpeg', 23642);

   
    })

    it('Should download a picture from data URI', async () => {

        const downloader = new Downloader({
            url: `data:image/jpeg;base64,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`,
            directory: "./downloads",
            onProgress: (p, chunk) => {
                expect(p).toBe('100.00')
            },
            onResponse: (r) => {
                expect(r.constructor.name).toBe('IncomingMessage');
            }
        })
        const { downloadStatus, filePath } = await downloader.download();
        expect(downloadStatus).toBe('COMPLETE')
        expect(filePath).toBe('./downloads/9k=.jpeg')
        await verifyFile(filePath, 2339);
    })

    it('Should download a picture from data URI, with custom name', async () => {

        const downloader = new Downloader({
            fileName: "buba.jpeg",
            url: `data:image/jpeg;base64,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`,
            directory: "./downloads",
            onProgress: (p, chunk) => {
                expect(p).toBe('100.00')
            },
            onResponse: (r) => {
                expect(r.constructor.name).toBe('IncomingMessage');
            },
            onBeforeSave: (r) => {
                return r.split(".")[0] + "2" + ".jpeg"
            }
        })
        const { downloadStatus, filePath } = await downloader.download();
        expect(downloadStatus).toBe('COMPLETE')
        expect(filePath).toBe('./downloads/buba2.jpeg')
        await verifyFile(filePath, 2339);
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
        const { downloadStatus, filePath } = await downloader.download();
        expect(downloadStatus).toBe('COMPLETE')
        expect(filePath).toBe('./downloads/contentType1.jpeg')
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

        const { downloadStatus, filePath } = await downloader.download();
        expect(deducedName).toBe('contentType.jpeg')
        expect(downloadStatus).toBe('COMPLETE')
        expect(filePath).toBe('./downloads/contentType.jpeg')
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

    it('Should skip same name request', async () => {
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
            cloneFiles: true
        })

        const downloader2 = new Downloader({
            url: `http://www.${host}.com/contentType`,
            directory: "./downloads",
            fileName: "testfile.jpg",
            cloneFiles: true,
            skipExistingFileName: true
        })

        var { downloadStatus, filePath } = await downloader.download();
        expect(downloadStatus).toBe('COMPLETE')
        expect(filePath).toBe('./downloads/testfile.jpg')
        var { downloadStatus, filePath } = await downloader2.download();
        expect(downloadStatus).toBe('ABORTED')
        expect(filePath).toBe(null)
        await verifyFile('./downloads/testfile.jpg', 23642);
        expect(downloadTimes).toBe(1);
    })

    it('Should skip same name request, without config.fileName', async () => {

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
            skipExistingFileName: true
        })

        var { filePath, downloadStatus } = await downloader.download();
        expect(filePath).toBe('./downloads/testfile2.jpg')
        expect(downloadStatus).toBe('COMPLETE')
        var { filePath, downloadStatus } = await downloader2.download();
        expect(filePath).toBe(null)
        expect(downloadStatus).toBe('ABORTED')
        await verifyFile('./downloads/testfile2.jpg', 23642);
        let error = false;
        try {
            //Make sure no clone is present
            await verifyFile('./downloads/testfile2_2.jpg', 23642);
        } catch (e) {
            error = true
        }
        expect(error).toBe(true);
    })

    it('Should skip file saving based on skipexisting flag, despite usage of onBeforeSave', async () => {
        rimraf.sync("./downloads");
        const host = randomHost()
        let timesSaved = 0;
        nock(`http://www.${host}.com`)
            .get('/contentType')
            .reply(200, (uri, requestBody) => {              
                return fs.createReadStream(Path.join(__dirname, 'fixtures/Desert.jpg'))
            }, {
                'Content-Type': 'image/jpeg',
                'Content-Length': '23642'
            }).persist()
        const downloader = new Downloader({
            url: `http://www.${host}.com/contentType`,
            directory: "./downloads",
            onBeforeSave: (deducedName) => {
                timesSaved++
                return deducedName;
            }
        })

        const downloader2 = new Downloader({
            url: `http://www.${host}.com/contentType`,
            directory: "./downloads",
            skipExistingFileName: true,
            onBeforeSave: (deducedName) => {
                timesSaved++//The hook should not be called because skipExistingFileName is true
                const fileExt = Path.extname(deducedName);
                if (fileExt) return `${"aaa"}-${"bbb"}${fileExt}`;
                return deducedName;
              }
        })

        var { downloadStatus, filePath } = await downloader.download();
        expect(downloadStatus).toBe('COMPLETE')
        expect(filePath).toBe('./downloads/contentType.jpeg')
        var { downloadStatus, filePath } = await downloader2.download();
        expect(downloadStatus).toBe('ABORTED')
        expect(filePath).toBe(null)
        await verifyFile('./downloads/contentType.jpeg', 23642);
        expect(timesSaved).toBe(1);
    });

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
        var { filePath, downloadStatus } = await downloader.download();
        expect(filePath).toBe('./downloads/contentType.jpeg')
        expect(downloadStatus).toBe('COMPLETE')
        var { filePath, downloadStatus } = await downloader2.download();
        expect(filePath).toBe(null)
        expect(downloadStatus).toBe('ABORTED')
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
        } finally {
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
        var { filePath, downloadStatus } = await downloader.download();
        expect(filePath).toBe(null)
        expect(downloadStatus).toBe('ABORTED')

        try {
            await verifyFile('./downloads/Koala.jpg', 29051);
            fileExists = true//Aint supposed to reach this, verifyFile should throw an error.
        } catch (error) { }

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
            error = e;
        } finally {
            if (!error.code === 'ENOENT') {
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

