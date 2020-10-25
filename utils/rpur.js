const {createDelay} = require('./delay')


/**
 * 
 * @param {Function} promiseFactory 
 * @param {Object} config 
 * @param {Function} [config.onError] 
 * @param {Function} [config.shouldStop] 
 * @param {Function}  [config.onAttempt]  
 * @param {number}  [config.delay]  
 * @param {number}  [config.maxAttempts]   
 * @param {number}  [config.timeout]   
 * @returns {Promise}
 */
// async function repeatPromiseUntilResolved(...args) {//Destructuring arguments in order to avoid having the "attempts" counter as part of the API.
module.exports = async function rpur(promiseFactory,config={}) {
    // const promiseFactory = args[0]
    // const config = args[1]
    // const attempts = args[2] || 0
    // debugger;
    const attempts = arguments[2] || 0
    // console.log(attempts)
    // const {maxRetries} = config  
    // debugger;
    const dummy = () => false;
    const shouldStop = config.shouldStop || dummy;
    const delay = config.delay || null;
    const maxAttempts = config.maxAttempts || 3;
    const timeout = config.timeout || 0
    try {
        var newAttempts = attempts + 1;

        // console.log('Attempt number: ',attempts+1)
        if (config.onAttempt) {
            await config.onAttempt(attempts + 1)
        }
        // debugger;
        const promise = promiseFactory();
        const result = await promiseWithTimeout(promise, timeout);
        // const result = await promiseFactory();
        return result;
    } catch (error) {

        // debugger;
        // console.log('Retrying failed promise');
        // const newAttempts = attempts + 1;
        if (config.onError) {
            // debugger;
            await config.onError(error, newAttempts)
        }


        if (await shouldStop(error) || newAttempts == maxAttempts)
            throw error;
        // console.log('Attempts', newAttempts)
        // if (newAttempts == maxAttempts) {//If it reached the maximum allowed number of retries, it throws an error.
        //     throw error;
        // }

        if (delay) {
            await createDelay(delay);
        }

        return await rpur(promiseFactory, config, newAttempts);//Calls it self, as long as there are retries left.
    }

}



function promiseWithTimeout(promise, time) {
    // debugger;
    return new Promise(async (resolve, reject) => {
        if (time) {
            var timeout = setTimeout(() => {
                // console.log('timed out!')
                reject(new Error('Promise timed out as defined in the config'))
            }, time)
        }
        try {
            const result = await promise;           
            resolve(result);
        } catch (error) {
            reject(error);
        }finally{
            clearTimeout(timeout);
        }

    })
}
