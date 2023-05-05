import { RedirectableRequest, http, https,  } from 'follow-redirects';
import { ClientRequest, IncomingMessage } from 'http';
import { Readable } from 'stream';

interface RequestConfig {
    [key: string]: any;
    timeout?: number;
}

interface ResponseData {
    dataStream: Readable;
    originalResponse: IncomingMessage;
}

function makeRequest(url: string, config: RequestConfig = {}) {

    let cancelPromiseReject: (reason?: any) => void;
    let responsePromiseReject: (reason?: any) => void;
    let request: RedirectableRequest<ClientRequest, IncomingMessage>;

    const responsePromise: Promise<IncomingMessage> = new Promise((resolve, reject) => {
        responsePromiseReject = reject;
        const protocol = url.trim().startsWith('https') ? https : http;
        request = protocol.request(url, config, (res: IncomingMessage) => {
            resolve(res);
        });
        request.end();
        request.on('error', (e:any) => {
            responsePromiseReject(e);
        });
    });

    const timeoutPromise: Promise<void> = new Promise((resolve, reject) => {
        if (config.timeout) {
            request.setTimeout(config.timeout, () => {
                const customError:any = new Error('Request timed out');
                customError.code = 'ERR_REQUEST_TIMEDOUT';
                reject(customError);
            });
        }
    });

    const cancelPromise: Promise<void> = new Promise((resolve, reject) => {
        cancelPromiseReject = reject;
    });

    async function makeRequestIter(): Promise<ResponseData> {

        const response = await Promise.race([
            responsePromise,
            cancelPromise,
            timeoutPromise,
        ]);

        //@ts-ignore
        const responseIter = response[Symbol.asyncIterator]();

        const data = (async function* () {
            try {
                while (true) {
                    const item = await Promise.race([
                        responseIter.next(),
                        cancelPromise,
                        timeoutPromise,
                    ]);
                    if (item.done) {
                        break;
                    }
                    yield item.value;
                }
            } catch (error) {
                //@ts-ignore
                abort(request);
                throw error;
            }
        })();

        return {
            dataStream: Readable.from(data),
            originalResponse: response as IncomingMessage,
        };
    }

    return {
        makeRequestIter,
        cancel() {
            const customError:any = new Error('Request cancelled');
            customError.code = 'ERR_REQUEST_CANCELLED';
            cancelPromiseReject(customError);
        },
    };
}

function abort(request: ClientRequest): void {
    const majorNodeVersion = process.versions.node.split('.')[0];
    //@ts-ignore
    if (!majorNodeVersion || majorNodeVersion < 14) {
        request.abort();
    } else {
        request.destroy();
    }
}

export default makeRequest;
