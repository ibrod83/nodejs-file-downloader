/**
 * 
 * @param {string} url
 * @return {boolean} 
 */
function isDataUrl(url) {
    if (!url || !url.startsWith("data:image"))
        return false

    return true;
}

/**
 * 
 * @param {string} dataurl 
 * @return {string}
 */
function getDataUrlExtension(dataurl) {
    return dataurl.split('/')[1].split(';')[0]
}


module.exports = {isDataUrl,getDataUrlExtension}