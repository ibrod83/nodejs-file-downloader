const capitalize = (s) => {
    if (typeof s !== 'string') return ''
    return s.charAt(0).toUpperCase() + s.slice(1)
}

const isJson = (string)=> {
    try {
        JSON.parse(string)
        return true;
    } catch (error) {
        return false;
    }
}


module.exports= {
    capitalize,
    isJson
}