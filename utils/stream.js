const fs = require("fs");
const stream = require("stream");
const util = require('util');
const pipelinePromisified = util.promisify(stream.pipeline);


function bufferToReadableStream(buffer) {
  const readable = new stream.Stream.Readable({
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
  * @return {Promie<WritableStream>}
  */
function createWriteStream(fullPath) {
  return fs.createWriteStream(fullPath)
}

/**
     * 
     * @param {stream.Readable} stream 
     * @returns 
     */
async function createBufferFromResponseStream(stream) {
  const chunks = []
  for await (let chunk of stream) {
    chunks.push(chunk)
  }

  const buffer = Buffer.concat(chunks)
  return buffer;
}

async function pipeStreams(arrayOfStreams) {
  await pipelinePromisified(...arrayOfStreams);
}

async function getStringFromStream(stream) {
  const buffer = await createBufferFromResponseStream(stream);
  return buffer.toString();
}



module.exports = { bufferToReadableStream, createWriteStream, createBufferFromResponseStream, pipeStreams,getStringFromStream }