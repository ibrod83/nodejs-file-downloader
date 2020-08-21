const path = require('path');
const fs = require('fs');


class FileProcessor {
    constructor(config) {

        // console.log(config)
        // debugger;
        this.originalFileName = config.fileName;
        this.fileExtension = path.extname(this.originalFileName);
        this.fileNameWithoutExtension = config.fileName.split('.').slice(0, -1).join('.')
        this.basePath = config.path[config.path.length - 1] === '/' ? config.path : config.path + '/';

        // console.log(this);
    }

    // async getAvailableFileName() {
    getAvailableFileName() {

        // return await this.createNewFileName(this.originalFileName);
        return this.createNewFileName(this.originalFileName);
    }

    // pathExists(path) {
    //     return new Promise((resolve, reject) => {
    //         fs.open(path, 'r', (err, fd) => {
    //             if (err) {
    //                 // debugger;
    //                 if (err.code === 'ENOENT') {
    //                     return resolve(false)
    //                 }

    //                 reject(err)
    //             } else {
    //                 // debugger;
    //                 resolve(true)
    //             }


    //         });
    //     })

    // }
    pathExists(path) {
        if(fs.existsSync(path)) return true;

        return false;

    }

    // async createNewFileName(fileName, counter = 1) {
    createNewFileName(fileName, counter = 1) {


        // if (! await this.fileNameExists(fileName)) {
        if (!this.fileNameExists(fileName)) {
            // console.log('new file name', newFileName)
            return fileName;
        }

        counter = counter + 1;
        let newFileName = this.fileNameWithoutExtension + counter + this.fileExtension;

        // return await this.createNewFileName(newFileName, counter);
        return this.createNewFileName(newFileName, counter);

    }


    fileNameExists(fileName) {
        return this.pathExists(this.basePath + fileName);
        // debugger;
        // return new Promise((resolve, reject) => {
        //     fs.open(this.basePath + fileName, 'r', (err) => {
        //         debugger;
        //         if (err) {
        //             if (err.code === 'ENOENT') {
        //                 // console.error('myfile does not exist');
        //                 return resolve(false);
        //             }

        //             reject(err);
        //         }

        //         resolve(true);
        //     });
        // })

        // if (fs.existsSync(this.basePath+fileName)) {
        //     // console.log(`file ${fileName} already exists!`);
        //     return true;
        // }
        // // console.log(`file ${fileName} is being created for the first time`);
        // return false;

    }
}

module.exports = FileProcessor;
