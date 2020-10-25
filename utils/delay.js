
function createDelay(mil){
    return new Promise((resolve)=>{
        setTimeout(() => {
            resolve();
        }, mil);
    })
}

module.exports={
    createDelay
}