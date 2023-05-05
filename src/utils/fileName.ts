import sanitize from 'sanitize-filename';
import * as path from 'path';
import * as mime from 'mime-types';
import { promises as fs } from 'fs';
import * as crypto from 'crypto';
import { IncomingHttpHeaders } from 'http';

/**
 *
 * @param {string} url
 * @return {string} fileName
 */
function deduceFileNameFromUrl(url: string): string {
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
function deduceFileName(url: string, headers: IncomingHttpHeaders): string {
  // First option
  const fileNameFromContentDisposition = getFileNameFromContentDisposition(
    //@ts-ignore
    headers['content-disposition'] || headers['Content-Disposition']
  );
  if (fileNameFromContentDisposition) return fileNameFromContentDisposition;

  // Second option
  if (path.extname(url)) {
    // First check if the url even has an extension
    const fileNameFromUrl = deduceFileNameFromUrl(url);
    if (fileNameFromUrl) return fileNameFromUrl;
  }

  // Third option
  const fileNameFromContentType = getFileNameFromContentType(
    //@ts-ignore
    headers['content-type'] || headers['Content-Type'],
    url
  );
  if (fileNameFromContentType) return fileNameFromContentType;

  // Fallback option
  return sanitize(url);
}

function removeQueryString(url: string): string {
  return url.split(/[?#]/)[0];
}

function getFileNameFromContentType(contentType: string, url: string): string {
  let extension = mime.extension(contentType);

  url = removeQueryString(url);
  const fileNameWithoutExtension = removeExtension(path.basename(url));
  return `${sanitize(fileNameWithoutExtension)}.${extension}`;
}

function getFileNameFromContentDisposition(contentDisposition: string): string {
  if (!contentDisposition || !contentDisposition.includes('filename=')) {
    return '';
  }
  let filename = '';
  var filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
  var matches = filenameRegex.exec(contentDisposition);
  if (matches != null && matches[1]) {
    filename = matches[1].replace(/['"]/g, '');
  }

  return filename ? sanitize(filename) : '';
}

function removeExtension(str: string): string {
  const arr = str.split('.');
  if (arr.length === 1) {
    return str;
  }
  return arr.slice(0, -1).join('.');
}

async function exists(path: string): Promise<boolean> {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 *
 * @param {string} finalpath
 */
function getTempFilePath(finalpath: string): string {
  return `${finalpath}.download`;
}

export  { deduceFileName, exists, getTempFilePath };
