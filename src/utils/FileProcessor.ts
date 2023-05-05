import * as path from 'path';
import * as fs from 'fs';

interface Config {
  fileName: string;
  path: string;
  useSynchronousMode?: boolean;
}

export class FileProcessor {
  private originalFileName: string;
  private fileExtension: string;
  private fileNameWithoutExtension: string;
  private basePath: string;
  private useSynchronousMode: boolean;

  constructor(config: Config) {
    this.originalFileName = config.fileName;
    this.fileExtension = path.extname(this.originalFileName);
    this.fileNameWithoutExtension = config.fileName.split('.').slice(0, -1).join('.');
    this.basePath = config.path[config.path.length - 1] === '/' ? config.path : config.path + '/';
    this.useSynchronousMode = config.useSynchronousMode || false;
  }

  getAvailableFileName(): Promise<string> | string {
    if (this.useSynchronousMode) {
      return this.createNewFileNameSync(this.originalFileName);
    }

    return new Promise(async (resolve,reject) => {
      try {
        const name = await this.createNewFileName(this.originalFileName);
        resolve(name);
      } catch (error) {
        reject(error);
      }
    });
  }

  private pathExistsSync(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  private pathExists(filePath: string): Promise<boolean> | boolean {
    if (this.useSynchronousMode) {
      return this.pathExistsSync(filePath);
    }

    return new Promise((resolve) => {
      fs.access(filePath, (err) => {
        if (err) {
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }

  private createNewFileNameSync(fileName: string, counter = 1): string {
    if (!this.pathExistsSync(this.basePath + fileName)) {
      return fileName;
    }

    counter = counter + 1;
    let newFileName = this.fileNameWithoutExtension + "_" + counter + this.fileExtension;

    return this.createNewFileNameSync(newFileName, counter);
  }

  private async createNewFileName(fileName: string, counter = 1): Promise<string> {
    if (!(await this.pathExists(this.basePath + fileName))) {
      return fileName;
    }

    counter = counter + 1;
    let newFileName = this.fileNameWithoutExtension + "_" + counter + this.fileExtension;

    return await this.createNewFileName(newFileName, counter);
  }
}


