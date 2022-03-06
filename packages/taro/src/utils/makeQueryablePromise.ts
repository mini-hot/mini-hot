// copy from :https://stackoverflow.com/questions/21485545/is-there-a-way-to-tell-if-an-es6-promise-is-fulfilled-rejected-resolved

export type QueryableProps = { isResolved: () => boolean; isFulfilled: () => boolean; isRejected: () => boolean }

export function makeQueryablePromise<T>(promise: Promise<T> & Partial<QueryableProps>): Promise<T> & QueryableProps {
    // Don't create a wrapper for promises that can already be queried.
    if (promise.isResolved) return promise as any

    let isResolved = false
    let isRejected = false

    // Observe the promise, saving the fulfillment in a closure scope.
    const result: Promise<T> & QueryableProps = promise.then(
        function (v) {
            isResolved = true
            return v
        },
        function (e) {
            isRejected = true
            throw e
        }
    ) as any
    result.isFulfilled = function () {
        return isResolved || isRejected
    }
    result.isResolved = function () {
        return isResolved
    }
    result.isRejected = function () {
        return isRejected
    }
    return result
}
