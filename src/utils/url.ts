/**
 * 
 * @param {string} url
 * @return {boolean} 
 */
function isDataUrl(url: string): boolean {
    if (!url || !url.startsWith("data:image")) return false;
    return true;
  }
  
  /**
   * 
   * @param {string} dataurl 
   * @return {string}
   */
  function getDataUrlExtension(dataurl: string): string {
    return dataurl.split('/')[1].split(';')[0];
  }
  
  export  { isDataUrl, getDataUrlExtension };
  