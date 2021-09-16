const sanitize = require('sanitize-filename');
const path = require('path');
var mime = require('mime-types')
const { promises: Fs } = require('fs')







/**
   * 
   * @param {string} url 
   * @return {string} fileName
   */
function deduceFileNameFromUrl(url) {
  const cleanUrl = removeQueryString(url);
  const baseName = sanitize(path.basename(cleanUrl));
  return baseName;

}


/**
 * Deduce the fileName, covering various scenarios.
 * @param {string} url
 * @param {Object} headers
 * @return {string} fileName
 */
function deduceFileName(url, headers) {

  //First option
  const fileNameFromContentDisposition = getFileNameFromContentDisposition(headers['content-disposition'] || headers['Content-Disposition']);
  // console.log('filenamecontentdisposition', fileNameFromContentDisposition)
  if (fileNameFromContentDisposition) return fileNameFromContentDisposition;

  //Second option
  if (path.extname(url)) {//First check if the url even has an extension
    const fileNameFromUrl = deduceFileNameFromUrl(url);
    if (fileNameFromUrl) return fileNameFromUrl;
  }

  //Third option
  const fileNameFromContentType = getFileNameFromContentType(headers['content-type'] || headers['Content-Type'], url)
  if (fileNameFromContentType) return fileNameFromContentType


  //Fallback option
  return sanitize(url)


}


function removeQueryString(url) {
  return url.split(/[?#]/)[0];
}

function getFileNameFromContentType(contentType, url) {

  // var contentType = this.response.headers['content-type'] || this.response.headers['Content-Type'];
  // console.log(contentType)
  let extension = mime.extension(contentType)

  url = removeQueryString(url);
  const fileNameWithoutExtension = removeExtension(path.basename(url));
  return `${sanitize(fileNameWithoutExtension)}.${extension}`;
}


function getFileNameFromContentDisposition(contentDisposition) {
  if (!contentDisposition || !contentDisposition.includes('filename=')) {
    return "";
  }
  let filename = "";
  var filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
  var matches = filenameRegex.exec(contentDisposition);
  if (matches != null && matches[1]) {
    filename = matches[1].replace(/['"]/g, '');
  }

  return filename ? sanitize(filename) : "";
}

function removeExtension(str) {
  const arr = str.split('.');
  if (arr.length == 1) {
    return str;
  }
  return arr.slice(0, -1).join('.')



}

async function exists(path) {
  try {
    await Fs.access(path)
    return true
  } catch {
    return false
  }
}

module.exports = { deduceFileName, exists }