import * as fs from 'fs';
import * as stream from 'stream';
import * as util from 'util';
const pipelinePromisified = util.promisify(stream.pipeline);

function bufferToReadableStream(buffer: Buffer): stream.Readable {
  const readable = new stream.Readable({
    read() {
      this.push(buffer);
      this.push(null); // Indicates the end of the stream
    },
  });

  return readable;
}

/**
  * 
  * @param {string} fullPath 
  * @return {Promise<fs.WriteStream>}
  */
function createWriteStream(fullPath: string): fs.WriteStream {
  return fs.createWriteStream(fullPath);
}

/**
     * 
     * @param {stream.Readable} input 
     * @returns {Promise<Buffer>}
     */
async function createBufferFromResponseStream(input: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of input) {
    //@ts-ignore
    chunks.push(chunk);
  }

  const buffer = Buffer.concat(chunks);
  return buffer;
}


async function pipeStreams(arrayOfStreams: Array<stream.Stream>): Promise<void> {
  //@ts-ignore
  await pipelinePromisified(...arrayOfStreams);
}

/**
  * 
  * @param {stream.Readable} input 
  * @returns {Promise<string>}
  */
async function getStringFromStream(input:  NodeJS.ReadableStream): Promise<string> {
  const buffer = await createBufferFromResponseStream(input);
  return buffer.toString();
}

export  { bufferToReadableStream, createWriteStream, createBufferFromResponseStream, pipeStreams, getStringFromStream };
