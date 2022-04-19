import { makeQueryablePromise } from './makeQueryablePromise'

export function createPromise<T>(promise: Promise<T>, timeout: number = 0) {
    let resPromise = promise
    if (timeout > 0) {
        const timeoutPromise = new Promise<any>((_resolve, reject) =>
            setTimeout(() => reject(`[mini-hot]: 加载远程资源超时，当前设置的超时时间为「${timeout} ms」`), timeout)
        )
        resPromise = Promise.race([promise, timeoutPromise])
    }
    return makeQueryablePromise(resPromise)
}
