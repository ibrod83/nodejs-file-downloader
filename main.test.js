// const axios = require('axios');

const expect = require('expect')
// const request = require('supertest');
// const { app, server } = require('./testServer');

// var MockAdapter = require("axios-mock-adapter");
// var mock = new MockAdapter(axios);
const fs = require('fs');
const Path = require('path');
const rimraf = require('rimraf')
const Downloader = require('./Downloader');
const { Readable } = require('stream');
// const http = require('http')
// const https = require('https')
const nock = require('nock')






describe('Main tests', () => {

    // beforeEach((done) => {
    //     rimraf.sync("./downloads");
    //     // console.log('done')
    //     // deleteFolderRecursive('./downloads')
    //     done();
    // })

    before((done) => {
        rimraf.sync("./downloads");
        // console.log('done')
        // deleteFolderRecursive('./downloads')
        done();
    })

    // after((done) => {
    //     if(server){
    //       server.close();  
    //     }

    //     done();
    // })








    it('Should download a picture and use content-type', async () => {

        const host = randomHost()
        nock(`http://www.${host}.com`)
            .get('/contentType1')
            .reply(200, (uri, requestBody) => {

                return fs.createReadStream(Path.join(__dirname, 'fixtures/Desert.jpg'))
                //   fs.readFile(Path.join(__dirname, 'fixtures/Desert.jpg'), cb) // Error-first callback
            }, {
                'Content-Type': 'image/jpeg',
                'Content-Length': '23642'
            })
        const downloader = new Downloader({
            url: `http://www.${host}.com/contentType1`,
            directory: "./downloads",
            cloneFiles: false,
            onProgress: (p, chunk) => {
                // debugger;
                expect(!isNaN(parseFloat(p)) && isFinite(p)).toBe(true)
                expect(Object.getPrototypeOf(chunk).constructor.name).toBe('Buffer')

            },
            onResponse: (r) => {

                expect(r.constructor.name).toBe('IncomingMessage');
            }
        })

        // debugger;
        await downloader.download();
        // debugger
        await verifyFile('./downloads/contentType1.jpeg', 23642);
        //  console.log(verify)


    })

    it('Should get the deduced name', async () => {
        let deducedName;
        const host = randomHost()
        nock(`http://www.${host}.com`)
            .get('/contentType')
            .reply(200, (uri, requestBody) => {

                return fs.createReadStream(Path.join(__dirname, 'fixtures/Desert.jpg'))
                //   fs.readFile(Path.join(__dirname, 'fixtures/Desert.jpg'), cb) // Error-first callback
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
                // return 'yoyoyoy'
            }
        })

        // debugger;
        await downloader.download();
        expect(deducedName).toBe('contentType.jpeg')
        // debugger
        await verifyFile('./downloads/contentType.jpeg', 23642);
        //  console.log(verify)


    })

    it('Should override the deduced name', async () => {
        let deducedName;
        const host = randomHost()
        nock(`http://www.${host}.com`)
            .get('/contentType')
            .reply(200, (uri, requestBody) => {

                return fs.createReadStream(Path.join(__dirname, 'fixtures/Desert.jpg'))
                //   fs.readFile(Path.join(__dirname, 'fixtures/Desert.jpg'), cb) // Error-first callback
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

        // debugger;
        await downloader.download();
        expect(deducedName).toBe('contentType.jpeg')
        // debugger
        await verifyFile('./downloads/override.jpg', 23642);
        //  console.log(verify)


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
                //   fs.readFile(Path.join(__dirname, 'fixtures/Desert.jpg'), cb) // Error-first callback
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

        // debugger;
        await downloader.download();
        // await downloader.download();
        await downloader2.download();
        // debugger
        await verifyFile('./downloads/testfile.jpg', 23642);
        expect(downloadTimes).toBe(1);
        //  console.log(verify)
    })

    it ('Should skip same name request, without config.fileName', async () => {

        const host = randomHost()      
        nock(`http://www.${host}.com`)
            .get('/contentType')
            .reply(200, (uri, requestBody) => {

                return fs.createReadStream(Path.join(__dirname, 'fixtures/Desert.jpg'))
                //   fs.readFile(Path.join(__dirname, 'fixtures/Desert.jpg'), cb) // Error-first callback
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
                //   fs.readFile(Path.join(__dirname, 'fixtures/Desert.jpg'), cb) // Error-first callback
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
        const files = fs.readdirSync('./downloads')
        // console.log(files)
        expect(files.length).toBe(1)
        // let error=false;
        // try {
        //     //Make sure no clone is present
        //     await verifyFile('./downloads/testfile2_2.jpg', 23642);
        // } catch (e) {
        //     error = true
        // }
        // expect(error).toBe(true);
    })

    it('Should get NaN in onProgress', async () => {

        const host = randomHost()
        nock(`http://www.${host}.com`)
            .get('/contentType')
            .reply(200, (uri, requestBody) => {

                return fs.createReadStream(Path.join(__dirname, 'fixtures/Desert.jpg'))
                //   fs.readFile(Path.join(__dirname, 'fixtures/Desert.jpg'), cb) // Error-first callback
            }, {
                'Content-Type': 'image/jpeg',
            })
        const downloader = new Downloader({
            url: `http://www.${host}.com/contentType`,
            directory: "./downloads",
            cloneFiles: false,
            onProgress: (p, chunk, remaining) => {
                // debugger;
                expect(isNaN(p)).toBe(true)
                expect(isNaN(remaining)).toBe(true)
                expect(Object.getPrototypeOf(chunk).constructor.name).toBe('Buffer')
            }

        })

        // debugger;
        await downloader.download();
        // debugger
        await verifyFile('./downloads/contentType.jpeg', 23642);
        //  console.log(verify)


    })

    it('Should download a picture and overwrite the name', async () => {
        // mock.onGet("/Desert.jpg").reply(
        //     200,
        //     fs.createReadStream(Path.join(__dirname, 'fixtures/Desert.jpg')),
        //     {
        //         'Content-Type': 'image/jpeg',
        //         'Content-Length': '23642'
        //     }

        // )
        const host = randomHost()
        nock(`http://www.${host}.com`)
            .get('/Desert.jpg')
            .reply(200, (uri, requestBody) => {

                return fs.createReadStream(Path.join(__dirname, 'fixtures/Desert.jpg'))
                //   fs.readFile(Path.join(__dirname, 'fixtures/Desert.jpg'), cb) // Error-first callback
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
        //   console.log(downloader)
        // debugger;
        await downloader.download();

        await verifyFile('./downloads/alternativeName.jpg', 23642);
        //  console.log(verify)


    })

    it('Should download into a nested non-existing path', async () => {
        // mock.onGet("/Desert.jpg").reply(
        //     200,
        //     fs.createReadStream(Path.join(__dirname, 'fixtures/Desert.jpg')),
        //     {
        //         'Content-Type': 'image/jpeg',
        //         'Content-Length': '23642'
        //     }

        // )
        const host = randomHost()
        nock(`http://www.${host}.com`)
            .get('/Desert.jpg')
            .reply(200, (uri, requestBody) => {

                return fs.createReadStream(Path.join(__dirname, 'fixtures/Desert.jpg'))
                //   fs.readFile(Path.join(__dirname, 'fixtures/Desert.jpg'), cb) // Error-first callback
            }, {
                'Content-Type': 'image/jpeg',
                'Content-Length': '23642'
            })
        const downloader = new Downloader({
            url: `http://www.${host}.com/Desert.jpg`,
            directory: "./downloads/May/2020",
            cloneFiles: false
        })
        //   console.log(downloader)
        // debugger;
        await downloader.download();

        await verifyFile('./downloads/May/2020/Desert.jpg', 23642);
        //  console.log(verify)


    })

    // **Assumes an already existing Desert.js file  */
    it('Should create a number-appended file', async () => {
        // mock.onGet("/Desert.jpg").reply(
        //     200,
        //     fs.createReadStream(Path.join(__dirname, 'fixtures/Desert.jpg')),
        //     {
        //         'Content-Type': 'image/jpeg',
        //         'Content-Length': '845941'
        //     }

        // )
        const host = randomHost()
        nock(`http://www.${host}.com`)
            .get('/Desert.jpg')
            .reply(200, (uri, requestBody) => {

                return fs.createReadStream(Path.join(__dirname, 'fixtures/Desert.jpg'))
                //   fs.readFile(Path.join(__dirname, 'fixtures/Desert.jpg'), cb) // Error-first callback
            }, {
                'Content-Type': 'image/jpeg',
                'Content-Length': '23642'
            })
        const downloader = new Downloader({
            url: `http://www.${host}.com/Desert.jpg`,
            directory: "./downloads/May/2020",
            // cloneFiles: true
        })
        //   console.log(downloader)
        // debugger;
        await downloader.download();

        await verifyFile('./downloads/May/2020/Desert_2.jpg', 23642);
        //  console.log(verify)


    })

    it('Should handle a file without content-length', async () => {

        // mock.onGet("/Koala.jpg").reply(
        //     200,
        //     fs.createReadStream(Path.join(__dirname, 'fixtures/Koala.jpg')),
        //     {
        //         'Content-Type': 'image/jpeg',
        //         // 'Content-Length': '845941'
        //     }

        // )
        const host = randomHost()
        nock(`http://www.${host}.com`)
            .get('/Koala.jpg')
            .reply(200, (uri, requestBody) => {

                return fs.createReadStream(Path.join(__dirname, 'fixtures/Koala.jpg'))
                //   fs.readFile(Path.join(__dirname, 'fixtures/Desert.jpg'), cb) // Error-first callback
            }, {
                'Content-Type': 'image/jpeg',
                'Content-Length': '845941'
            })
        const downloader = new Downloader({
            url: `http://www.${host}.com/Koala.jpg`,
            directory: "./downloads",
            // onProgress: (p) => { }
        })
        // .on('progress', (p) => { })
        //   console.log(downloader)
        // debugger;
        await downloader.download();

        await verifyFile('./downloads/Koala.jpg');
        //  console.log(verify)


    })

    it('Should handle a file without content-type', async () => {

        // mock.onGet("/Lighthouse.jpg").reply(
        //     200,
        //     fs.createReadStream(Path.join(__dirname, 'fixtures/Lighthouse.jpg')),
        //     {
        //         // 'Content-Type': 'image/jpeg',
        //         // 'Content-Length': '845941'
        //     }

        // )
        const host = randomHost()
        nock(`http://www.${host}.com`)
            .get('/Lighthouse.jpg')
            .reply(200, (uri, requestBody) => {

                return fs.createReadStream(Path.join(__dirname, 'fixtures/Lighthouse.jpg'))
                //   fs.readFile(Path.join(__dirname, 'fixtures/Desert.jpg'), cb) // Error-first callback
            }, {
                'Content-Type': 'image/jpeg',
                'Content-Length': '845941'
            })
        const downloader = new Downloader({
            url: `http://www.${host}.com/Lighthouse.jpg`,
            directory: "./downloads",
        })
        // .on('progress', (p) => { })
        //   console.log(downloader)
        // debugger;
        await downloader.download();

        await verifyFile('./downloads/Lighthouse.jpg');
        //  console.log(verify)


    })

    it('Should download a picture and get the name from content-disposition ', async () => {
        // rimraf.sync('./')
        // mock.onGet("/contentDisposition").reply(
        //     200,
        //     fs.createReadStream(Path.join(__dirname, 'fixtures/Hydrangeas.jpg')),
        //     {
        //         'Content-Disposition': 'Content-Disposition: attachment; filename="contentDispositionFile.jpg"'
        //         // 'Content-Type': 'image/jpeg',
        //         // 'Content-Length': '845941'
        //     }

        // )
        const host = randomHost()
        nock(`http://www.${host}.com`)
            .get('/contentDisposition')
            .reply(200, (uri, requestBody) => {

                return fs.createReadStream(Path.join(__dirname, 'fixtures/Hydrangeas.jpg'))
                //   fs.readFile(Path.join(__dirname, 'fixtures/Desert.jpg'), cb) // Error-first callback
            }, {
                'Content-Type': 'image/jpeg',
                'Content-Disposition': 'Content-Disposition: attachment; filename="contentDispositionFile.jpg"',
                'Content-Length': '845941'
            })
        const downloader = new Downloader({
            url: `http://www.${host}.com/contentDisposition`,
            directory: "./downloads"
        })
        // .on('progress',(p)=>{})
        //   console.log(downloader)
        // debugger;
        await downloader.download();

        await verifyFile('./downloads/contentDispositionFile.jpg');
        //  console.log(verify)


    })


    it('Should download a picture with a querystring after the extension ', async () => {

        // mock.onGet("/Hydrangeas.jpg?width=400&height=300").reply(
        //     200,
        //     fs.createReadStream(Path.join(__dirname, 'fixtures/Hydrangeas.jpg')),
        //     {
        //         'Content-Type': 'image/jpeg',
        //         // 'Content-Length': '845941'
        //     }

        // )

        const host = randomHost()
        nock(`http://www.${host}.com`)
            .get('/Hydrangeas.jpg?width=400&height=300')
            .reply(200, (uri, requestBody) => {

                return fs.createReadStream(Path.join(__dirname, 'fixtures/Hydrangeas.jpg'))
                //   fs.readFile(Path.join(__dirname, 'fixtures/Desert.jpg'), cb) // Error-first callback
            }, {
                'Content-Type': 'image/jpeg',
                'Content-Length': '845941'
            })

        const downloader = new Downloader({
            url: `http://www.${host}.com/Hydrangeas.jpg?width=400&height=300`,
            directory: "./downloads"
        })
        // .on('progress', (p) => { })
        //   console.log(downloader)
        // debugger;
        await downloader.download();

        await verifyFile('./downloads/Hydrangeas.jpg');
        //  console.log(verify)


    })



    it('Should download two pictures, with name appending', async () => {
        try {
            // mock.onGet("/Koala.jpg").reply(
            //     200,
            //     fs.createReadStream(Path.join(__dirname, 'fixtures/Koala.jpg')),
            //     {
            //         'Content-Type': 'image/jpeg',
            //         'Content-Length': '29051'
            //     }

            // )
            const host = randomHost()
            nock(`http://www.${host}.com`)
                .get('/Koala.jpg')
                .reply(200, (uri, requestBody) => {

                    return fs.createReadStream(Path.join(__dirname, 'fixtures/Koala.jpg'))
                    //   fs.readFile(Path.join(__dirname, 'fixtures/Desert.jpg'), cb) // Error-first callback
                }, {
                    'Content-Type': 'image/jpeg',
                    'Content-Length': '29051'
                }).persist()
            const downloader = new Downloader({
                url: `http://www.${host}.com/Koala.jpg`,
                directory: "./downloads",
                cloneFiles: false
            })
            //   console.log(downloader)
            // debugger;
            await downloader.download();

            await verifyFile('./downloads/Koala.jpg', 29051);

            const downloader2 = new Downloader({
                url: `http://www.${host}.com/Koala.jpg`,
                directory: "./downloads",
            })
            //   console.log(downloader)
            // debugger;
            await downloader2.download();


            // await verifyFile('./downloads/Koala2.jpg', 780831);
            //  console.log(verify)


        } catch (error) {
            console.log(error)
            throw error
        }

    })

    it('Should download an image, with shouldBufferResponse', async () => {
        // rimraf.sync(Path.join(__dirname, 'fixtures/Koala.jpg'))
        const stream = fs.createReadStream(Path.join(__dirname, 'fixtures/Koala.jpg'));
        // const buffer=[]
        const chunks = []
        for await (let chunk of stream) {
            chunks.push(chunk)
        }

        const buffer = Buffer.concat(chunks)

        // mock.onGet("/Koala.jpg").reply(
        //     200,
        //     buffer,
        //     {
        //         'Content-Type': 'image/jpeg',
        //         'Content-Length': '29051'
        //     }

        // )
        const host = randomHost()
        nock(`http://www.${host}.com`)
            .get('/Koala.jpg')
            .reply(200, (uri, requestBody) => {

                return buffer
                //   fs.readFile(Path.join(__dirname, 'fixtures/Desert.jpg'), cb) // Error-first callback
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
            //   console.log(downloader)
            // debugger;
            await downloader.download();


        } catch (error) {
            throw error;
            // debugger;

        } finally {
            // debugger
            await verifyFile('./downloads/buffer.jpeg', 29051);
        }




    })

    it('Should repeat a request few times and fail', async () => {



        const host = randomHost()
        // mock.onGet("/400").reply(400)
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
                    // debugger
                    counter++;
                },

            })
            //   console.log(downloader)
            // debugger;
            await downloader.download();
            // await downloader.request();
            // debugger;
            // await downloader.save();

            // await verifyFile('./downloads/Koala.jpg', 29051);
        } catch (e) {
            debugger;
            error=e
            // expect(counter).toBe(3)
            // expect(counter).toBe(3)
            // expect(error.message).toBe('Request failed with status code 400')
            // debugger;
        }finally{
            expect(counter).toBe(3)
            expect(error.message).toBe('Request failed with status code 400')
        }




    })


    it('Should repeat fail after first attempt, because of shouldStop hook', async () => {



        const host = randomHost()
        // mock.onGet("/400").reply(400)
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
                    // debugger
                    if (e.statusCode && e.statusCode === 404) {
                        return true;
                    }
                }
            })
            //   console.log(downloader)
            // debugger;
            await downloader.download();
            // await downloader.request();
            // debugger;
            // await downloader.save();

            // await verifyFile('./downloads/Koala.jpg', 29051);
        } catch (error) {
            // expect(counter).toBe(3)
            expect(counter).toBe(1)
            expect(error.message).toBe('Request failed with status code 404')
            expect(error.statusCode).toBe(404)
            // debugger;
        }




    })




    it('Should fail once and finally fail', async () => {


        const host = randomHost()
        // mock.onGet("/500").reply(500);
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
                    // debugger;
                    onErrorCount++;
                    // console.log(e.message)
                }

            })

            // var onErrorCount = 0
            // downloader.on('error', (e) => {
            //     // debugger;
            //     onErrorCount++;
            //     // console.log(e.message)
            // })
            await downloader.download();

        } catch (error) {
            // debugger;
        } finally {
            // debugger;
            // expect(s.constructor.name).toBe('ReadStream')
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
            // debugMode:true,
            maxAttempts: 4,
            // fileName: 'yoyo',
            onResponse: function (response) {
                // debugger;
                if (response.headers['message'] === 'terminate') {
                    return false;//Stop the download
                }
                // return true;
            },
            url: `http://www.${host}.com/Koala.jpg`,
            directory: "./downloads",

        })

        let fileExists = false
        await downloader.download();


        try {
            await verifyFile('./downloads/Koala.jpg', 29051);
            fileExists = true//Aint supposed to reach this, verifyFile should throw an error.
        } catch (error) {
            // debugger
            //The "error" should be caught here, and the test should pass
            // debugger

        }

        // debugger
        if (fileExists) throw new Error("Download hasn't stopped")

        // throw new Error();


        // debugger;


    })


    it('Should use onResponse to continue download', async function () {

        // const stream = fs.createReadStream(Path.join(__dirname, 'fixtures/Koala.jpg'));
        // mock.onGet("/koala.jpg").reply(function (config) {
        //     return [
        //         200,
        //         stream,
        //         {'message':'do not terminate'}
        //     ];
        // });
        // debugger
        // fs.unlinkSync('./downloads/Koala.jpg')
        // debugger
        const host = randomHost()
        nock(`http://www.${host}.com`)
            .get('/Koala.jpg')
            .reply(200, (uri, requestBody) => {
                // debugger
                // console.log('YOYO')
                return fs.createReadStream(Path.join(__dirname, 'fixtures/Koala.jpg'))
                //   fs.readFile(Path.join(__dirname, 'fixtures/Desert.jpg'), cb) // Error-first callback
            }, { 'message': 'do not terminate' }).persist()


        const downloader = new Downloader({
            timeout: 1000,
            // debugMode:true,
            maxAttempts: 4,
            onResponse: function (response) {
                if (response.headers['message'] !== 'terminate') {
                    // return true
                    // debugger;
                    return;

                }
                // debugger
                return false;
            },
            fileName: 'yoyo.jpg',
            url: `http://www.${host}.com/Koala.jpg`,
            directory: "./downloads",

        })



        // debugger;
        // try {
        try {
            const prom = await downloader.download();
        } catch (error) {
            // debugger
        } finally {
            // debugger
            await verifyFile('./downloads/yoyo.jpg', 29051);
        }

        // } catch (error) {
        // debugger
        // return;
        // }

        // throw new Error();





    })

    it('Should use shouldCotinue to stop download', async function () {

        // const stream = fs.createReadStream(Path.join(__dirname, 'fixtures/Koala.jpg'));
        // mock.onGet("/koala.jpg").reply(function (config) {
        //     return [
        //         200,
        //         stream,
        //         {'message':'do not terminate'}
        //     ];
        // });
        // debugger
        // fs.unlinkSync('./downloads/Koala.jpg')
        // debugger
        const host = randomHost()
        nock(`http://www.${host}.com`)
            .get('/Koala.jpg')
            .reply(200, (uri, requestBody) => {
                // debugger
                // console.log('YOYO')
                return fs.createReadStream(Path.join(__dirname, 'fixtures/Koala.jpg'))
                //   fs.readFile(Path.join(__dirname, 'fixtures/Desert.jpg'), cb) // Error-first callback
            }, { 'message': 'terminate' }).persist()

            let error;
        const downloader = new Downloader({
            timeout: 1000,
            // debugMode:true,
            maxAttempts: 4,
            onResponse: function (response) {
                if (response.headers['message'] === 'terminate') {
                    // return true
                    // debugger;
                    return false

                }
                // debugger
                return false;
            },
            fileName: 'yoyo2.jpg',
            url: `http://www.${host}.com/Koala.jpg`,
            directory: "./downloads",

        })



        // debugger;
        // try {
        try {
            const prom = await downloader.download();
            // debugger
            await verifyFile('./downloads/yoyo2.jpg', 29051);
            debugger
        } catch (e) {
            // console.log(e)
            error=e;
            // debugger
            // if(!error.code === 'ENOENT'){
            //     throw error;
            // }
            // console.log('error reached')
            // debugger
        }finally {
            if(!error.code === 'ENOENT'){
                throw error;
            }
            // debugger
            // console.log('finally reached')
            // await verifyFile('./downloads/yoyo.jpg', 29051);
        }

        // } catch (error) {
        // debugger
        // return;
        // }

        // throw new Error();





    })

    it('Should get the underlying response object from an Error, stream it and present the content', async function () {


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
            const response = e.response;
            let str = ""
            response.on('data', function (chunk) { 
                str += chunk;
            });

            response.on('end', function () {
                const body = JSON.parse(str)              
                expect(body.customErrorCode).toBe('SOME_CODE')
            });

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
            // console.log('err', err)
            if (err)
                return reject(err)

            if (!size || data.length == size) {
                resolve()
            } else {
                reject(err)
            }

        });

    })

}

function doesFileExist(path) {
    return new Promise((resolve, reject) => {
        fs.readFile(path, (err, data) => {
            // console.log('err', err)
            if (err)
                return resolve(false)

            resolve(true)

        });

    })
}
