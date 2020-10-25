
const axios = require('axios');
const expect = require('expect')
var MockAdapter = require("axios-mock-adapter");
var mock = new MockAdapter(axios);
const fs = require('fs');
const Path = require('path');
const rimraf = require('rimraf')
const Downloader = require('./Downloader');



describe('Downloader tests', () => {

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



    it('Should download a picture and use content-type', async () => {
        mock.onGet("/contentType").reply(
            200,
            fs.createReadStream(Path.join(__dirname, 'fixtures/Desert.jpg')),
            {
                'Content-Type': 'image/jpeg',
                'Content-Length': '23642'
            }

        )
        const downloader = new Downloader({
            url: '/contentType',
            directory: "./downloads",
            cloneFiles: false,
            onProgress:(p, chunk) => {
                // console.log(p, chunk)
                expect(!isNaN(parseFloat(p)) && isFinite(p)).toBe(true)
                expect(Object.getPrototypeOf(chunk).constructor.name).toBe('Buffer')

            },
            onResponse:(r) => {
                // console.log(Object.getPrototypeOf(r).constructor.name)
                expect(r).toHaveProperty('data');
                expect(r).toHaveProperty('headers');
            }
            // fileName:'yoyo2.jpg'
        })
            // .on('progress', (p, chunk) => {
            //     // console.log(p, chunk)
            //     expect(!isNaN(parseFloat(p)) && isFinite(p)).toBe(true)
            //     expect(Object.getPrototypeOf(chunk).constructor.name).toBe('Buffer')

            // })
            // .on('response', (r) => {
            //     // console.log(Object.getPrototypeOf(r).constructor.name)
            //     expect(r).toHaveProperty('data');
            //     expect(r).toHaveProperty('headers');
            // })
        //   console.log(downloader)
        // debugger;
        await downloader.download();

        await verifyFile('./downloads/contentType.jpeg', 23642);
        //  console.log(verify)

        
    })

    it('Should download a picture and overwrite the name', async () => {
        mock.onGet("/Desert.jpg").reply(
            200,
            fs.createReadStream(Path.join(__dirname, 'fixtures/Desert.jpg')),
            {
                'Content-Type': 'image/jpeg',
                'Content-Length': '23642'
            }

        )
        const downloader = new Downloader({
            url: '/Desert.jpg',
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
        mock.onGet("/Desert.jpg").reply(
            200,
            fs.createReadStream(Path.join(__dirname, 'fixtures/Desert.jpg')),
            {
                'Content-Type': 'image/jpeg',
                'Content-Length': '23642'
            }

        )
        const downloader = new Downloader({
            url: '/Desert.jpg',
            directory: "./downloads/May/2020",
            cloneFiles: false
        })
        //   console.log(downloader)
        // debugger;
        await downloader.download();

        await verifyFile('./downloads/May/2020/Desert.jpg', 23642);
        //  console.log(verify)

        
    })

    //**Assumes an already existing Desert.js file  */
    it('Should create a number-appended file', async () => {
        mock.onGet("/Desert.jpg").reply(
            200,
            fs.createReadStream(Path.join(__dirname, 'fixtures/Desert.jpg')),
            {
                'Content-Type': 'image/jpeg',
                'Content-Length': '845941'
            }

        )
        const downloader = new Downloader({
            url: '/Desert.jpg',
            directory: "./downloads/May/2020",
            // cloneFiles: true
        })
        //   console.log(downloader)
        // debugger;
        await downloader.download();

        await verifyFile('./downloads/May/2020/Desert2.jpg', 23642);
        //  console.log(verify)

        
    })

    it('Should handle a file without content-length', async () => {

        mock.onGet("/Koala.jpg").reply(
            200,
            fs.createReadStream(Path.join(__dirname, 'fixtures/Koala.jpg')),
            {
                'Content-Type': 'image/jpeg',
                // 'Content-Length': '845941'
            }

        )
        const downloader = new Downloader({
            url: '/Koala.jpg',
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

        mock.onGet("/Lighthouse.jpg").reply(
            200,
            fs.createReadStream(Path.join(__dirname, 'fixtures/Lighthouse.jpg')),
            {
                // 'Content-Type': 'image/jpeg',
                // 'Content-Length': '845941'
            }

        )
        const downloader = new Downloader({
            url: '/Lighthouse.jpg',
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
        mock.onGet("/contentDisposition").reply(
            200,
            fs.createReadStream(Path.join(__dirname, 'fixtures/Hydrangeas.jpg')),
            {
                'Content-Disposition': 'Content-Disposition: attachment; filename="contentDispositionFile.jpg"'
                // 'Content-Type': 'image/jpeg',
                // 'Content-Length': '845941'
            }

        )
        const downloader = new Downloader({
            url: '/contentDisposition',
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

        mock.onGet("/Hydrangeas.jpg?width=400&height=300").reply(
            200,
            fs.createReadStream(Path.join(__dirname, 'fixtures/Hydrangeas.jpg')),
            {
                'Content-Type': 'image/jpeg',
                // 'Content-Length': '845941'
            }

        )
        const downloader = new Downloader({
            url: '/Hydrangeas.jpg?width=400&height=300',
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
            mock.onGet("/Koala.jpg").reply(
                200,
                fs.createReadStream(Path.join(__dirname, 'fixtures/Koala.jpg')),
                {
                    'Content-Type': 'image/jpeg',
                    'Content-Length': '29051'
                }

            )
            const downloader = new Downloader({
                url: '/Koala.jpg',
                directory: "./downloads",
                cloneFiles: false
            })
            //   console.log(downloader)
            // debugger;
            await downloader.download();

            await verifyFile('./downloads/Koala.jpg', 29051);

            const downloader2 = new Downloader({
                url: '/Koala.jpg',
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
        const stream = fs.createReadStream(Path.join(__dirname, 'fixtures/Koala.jpg'));
        // const buffer=[]
        const chunks = []
        for await (let chunk of stream) {
            chunks.push(chunk)
        }

        const buffer = Buffer.concat(chunks)

        mock.onGet("/Koala.jpg").reply(
            200,
            buffer,
            {
                'Content-Type': 'image/jpeg',
                'Content-Length': '29051'
            }

        )

        try {
            const downloader = new Downloader({
                url: '/Koala.jpg',
                directory: "./downloads",
                cloneFiles: false,
                shouldBufferResponse: true
            })
            //   console.log(downloader)
            // debugger;
            await downloader.download();

            // await verifyFile('./downloads/Koala.jpg', 29051);
        } catch (error) {
            debugger;
        }




    })

    it('Should repeat a request few times and fail', async () => {



        mock.onGet("/400").reply(400)

        try {
            const downloader = new Downloader({
                url: '/400',
                directory: "./downloads",
                maxAttempts:3
            })
            //   console.log(downloader)
            // debugger;
            await downloader.download();
            // await downloader.request();
            debugger;
            // await downloader.save();

            // await verifyFile('./downloads/Koala.jpg', 29051);
        } catch (error) {
            // expect(1+2).toBe(1)
            expect(error.message).toBe('Request failed with status code 400')
            // debugger;
        }




    })


    it('Should fail twice and finally succeed', async () => {
        const stream = fs.createReadStream(Path.join(__dirname, 'fixtures/Koala.jpg'));

        let counter = 0;
        mock.onGet("/400").reply(function (config) {
            // debugger;
            let status;
            counter++
            if (counter < 3) {
                status = 400
            } else {
                status = 200
            }
            return [
                status,
                stream,
                {'Content-Type': 'image/jpeg'}
            ];
        });

        try {
            var onErrorCount = 0

            const downloader = new Downloader({
                timeout: 1000,
                url: '/400',
                directory: "./downloads",
                maxAttempts:3,
                onError:(e) => {
                    debugger;
                    onErrorCount++;
                    // console.log(e.message)
                }

            })
            //   console.log(downloader)
            // debugger;
            // var onErrorCount = 0
            // downloader.on('error', (e) => {
            //     debugger;
            //     onErrorCount++;
            //     // console.log(e.message)
            // })
            // await downloader.download();
           const request =  await downloader.request()
            await downloader.save()
            // debugger;
            var s = request.data;
            // debugger;
            
            
            
        } catch (error) {
            // debugger;
        }finally{
            // debugger;
            expect(s.constructor.name).toBe('ReadStream')
            expect(onErrorCount).toBe(2)
            await verifyFile('./downloads/400.jpeg', 29051);
        }




    })

    it('Should fail once and finally fail', async () => {
   

       
        mock.onGet("/500").reply(500);
        var onErrorCount = 0;
        try {
            const downloader = new Downloader({
                timeout: 1000,
                url: '/500',
                directory: "./downloads",
                maxAttempts:1,
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
        }finally{
            // debugger;
            // expect(s.constructor.name).toBe('ReadStream')
            expect(onErrorCount).toBe(1)
        }




    })

    // it('Should fail three times during stream', async function() {
    //     // this.timeout(10000)
        
    //     mock.onGet("/fileThatDoesntExist").reply(function (config) {
    //         // debugger;
    //         const stream = fs.createReadStream(Path.join(__dirname, 'fixtures/Desert.jpg'));
    //         stream.destroy();
           
    //         return [
    //             200,
    //             stream,
    //             {}
    //         ];
    //     });

    //     try {
    //         const downloader = new Downloader({
    //             timeout: 1000,
    //             url: '/fileThatDoesntExist',
    //             directory: "./downloads",

    //         })

    //         var onErrorCount = 0
    //         downloader.on('error', (e) => {
    //             onErrorCount++;
    //         })
    //        const request =  await downloader.request()
    //        debugger;
    //         await downloader.save()
    //         debugger;
    //         // await downloader.download();
            
            
    //     } catch (error) {
    //         debugger;
    //         // console.log(error)
    //     }finally{
    //         debugger;
    //         expect(onErrorCount).toBe(3)
    //     }




    // })



})

