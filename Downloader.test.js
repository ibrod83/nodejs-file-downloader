
const axios = require('axios');
const expect = require('expect')
var MockAdapter = require("axios-mock-adapter");
var mock = new MockAdapter(axios);
const fs = require('fs');
const Path = require('path');
const rimraf = require('rimraf')
const Downloader = require('./Downloader');



describe('Downloader tests', () => {

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

  

    it('Should download a picture', async () => {
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
            directory: "./downloads",
            cloneFiles: false,
            // fileName:'yoyo2.jpg'
        })
            .on('progress', (p, chunk) => {
                // console.log(p, chunk)
                expect(!isNaN(parseFloat(p)) && isFinite(p)).toBe(true)
                expect(Object.getPrototypeOf(chunk).constructor.name).toBe('Buffer')

            })
            .on('response', (r) => {
                // console.log(Object.getPrototypeOf(r).constructor.name)
                expect(r).toHaveProperty('data');
                expect(r).toHaveProperty('headers');
            })
        //   console.log(downloader)
        // debugger;
        await downloader.download();

        await verifyFile('./downloads/Desert.jpg', 845941);
        //  console.log(verify)

        console.log('Download complete')
    })

    it('Should download a picture and overwrite the name', async () => {
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
            directory: "./downloads",
            cloneFiles: false,
            fileName: 'alternativeName.jpg'
        })
        //   console.log(downloader)
        // debugger;
        await downloader.download();

        await verifyFile('./downloads/alternativeName.jpg', 845941);
        //  console.log(verify)

        console.log('Download complete')
    })

    it('Should download into a nested non-existing path', async () => {
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
            cloneFiles: false
        })
        //   console.log(downloader)
        // debugger;
        await downloader.download();

        await verifyFile('./downloads/May/2020/Desert.jpg', 845941);
        //  console.log(verify)

        console.log('Download complete')
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
            directory: "./downloads",
            // cloneFiles: true
        })
        //   console.log(downloader)
        // debugger;
        await downloader.download();

        await verifyFile('./downloads/Desert2.jpg', 845941);
        //  console.log(verify)

        console.log('Download complete')
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
            directory: "./downloads"            
        }).on('progress',(p)=>{})
        //   console.log(downloader)
        // debugger;
        await downloader.download();

        await verifyFile('./downloads/Koala.jpg');
        //  console.log(verify)

        console.log('Download complete')
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
            directory: "./downloads"            
        }).on('progress',(p)=>{})
        //   console.log(downloader)
        // debugger;
        await downloader.download();

        await verifyFile('./downloads/Lighthouse.jpg');
        //  console.log(verify)

        console.log('Download complete')
    })

    

    // it('Should download two pictures, with name appending', async () => {
    //     try {
    //         mock.onGet("/Koala.jpg").reply(
    //             200,
    //             fs.createReadStream(Path.join(__dirname, 'fixtures/Koala.jpg')),
    //             {
    //                 'Content-Type': 'image/jpeg',
    //                 'Content-Length': '780831'
    //             }

    //         )
    //         const downloader = new Downloader({
    //             url: '/Koala.jpg',
    //             directory: "./downloads",
    //             cloneFiles: false
    //         })
    //         //   console.log(downloader)
    //         // debugger;
    //         await downloader.download();

    //         await verifyFile('./downloads/Koala.jpg', 780831);

    //         const downloader2 = new Downloader({
    //             url: '/Koala.jpg',
    //             directory: "./downloads",
    //         })
    //         //   console.log(downloader)
    //         // debugger;
    //         await downloader2.download();


    //         // await verifyFile('./downloads/Koala2.jpg', 780831);
    //         //  console.log(verify)

    //         console.log('Download complete')
    //     } catch (error) {
    //         console.log(error)
    //         throw error
    //     }

    // })



})

