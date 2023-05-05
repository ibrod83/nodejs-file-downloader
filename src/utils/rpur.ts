import { createDelay } from './delay';

interface RPURConfig {
    onError?: (error: Error, attempts: number) => void | Promise<void>;
    shouldStop?: (error: Error) => boolean | Promise<boolean>;
    onAttempt?: (attempts: number) => void | Promise<void>;
    delay?: number;
    maxAttempts?: number;
    timeout?: number;
}

async function rpur(
    promiseFactory: () => Promise<any>,
    config: RPURConfig = {},
    attempts: number = 0
): Promise<any> {
    const dummy = () => false;
    const shouldStop = config.shouldStop || dummy;
    const delay = config.delay || null;
    const maxAttempts = config.maxAttempts || 3;
    const timeout = config.timeout || 0;

    var newAttempts = attempts + 1;
    try {
       

        if (config.onAttempt) {
            await config.onAttempt(attempts + 1);
        }
        const promise = promiseFactory();
        const result = await promiseWithTimeout(promise, timeout);
        return result;
    } catch (error: any) {
        if (config.onError) {
            await config.onError(error, newAttempts);
        }

        if ((await shouldStop(error)) || newAttempts == maxAttempts) throw error;

        if (delay) {
            await createDelay(delay);
        }

        return await rpur(promiseFactory, config, newAttempts); // Calls itself, as long as there are retries left.
    }
}

function promiseWithTimeout(promise: Promise<any>, time: number): Promise<any> {
    return new Promise(async (resolve, reject) => {
        let timeout: NodeJS.Timeout | undefined;

        if (time) {
            timeout = setTimeout(() => {
                reject(new Error('Promise timed out as defined in the config'));
            }, time);
        }

        try {
            const result = await promise;
            resolve(result);
        } catch (error) {
            reject(error);
        } finally {
            if (timeout) clearTimeout(timeout);
        }
    });
}

export default rpur;
