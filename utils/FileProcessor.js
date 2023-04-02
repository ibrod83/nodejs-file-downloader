const path = require('path');
const fs = require('fs');

class FileProcessor {
    constructor(config) {


        this.originalFileName = config.fileName;
        this.fileExtension = path.extname(this.originalFileName);
        this.fileNameWithoutExtension = config.fileName.split('.').slice(0, -1).join('.')
        this.basePath = config.path[config.path.length - 1] === '/' ? config.path : config.path + '/';

        this.useSynchronousMode = config.useSynchronousMode || false;

    }


    getAvailableFileName() {
        if (this.useSynchronousMode) {
            // console.log('useSynchronousMode')
            return this.createNewFileNameSync(this.originalFileName);
        }

        return new Promise(async (resolve) => {
            // console.log('useSynchronousMode!!',this.useSynchronousMode)
            try {
                const name = await this.createNewFileName(this.originalFileName);
                resolve(name);
            } catch (error) {
                reject(error);
            }

        })

    }

    pathExistsSync(path) {
        return fs.existsSync(path);
    }


    pathExists(path) {
        if (this.useSynchronousMode) {
            return this.pathExistsSync(path);
        }

        return new Promise((resolve, reject) => {
            fs.access(path, (err) => {
                if (err) {
                    resolve(false)
                } else {
                    resolve(true)
                }
            });
        })
    }


    createNewFileNameSync(fileName, counter = 1) {


        if (!this.pathExistsSync(this.basePath + fileName)) {
            return fileName;
        }

        counter = counter + 1;
        let newFileName = this.fileNameWithoutExtension + "_" + counter + this.fileExtension;

        return this.createNewFileNameSync(newFileName, counter);

    }

    async createNewFileName(fileName, counter = 1) {


        if (! await this.pathExists(this.basePath + fileName)) {

            return fileName;
        }

        counter = counter + 1;
        let newFileName = this.fileNameWithoutExtension + "_" + counter + this.fileExtension;

        return await this.createNewFileName(newFileName, counter);

    }


}

module.exports = FileProcessor;
