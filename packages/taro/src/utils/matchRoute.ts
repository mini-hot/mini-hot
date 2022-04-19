import { pathToRegexp, TokensToRegexpOptions, ParseOptions } from 'path-to-regexp'
import { RemotePageRoute } from 'src/createRemoteAppRoutes'

const { hasOwnProperty } = Object.prototype
const cache = new Map()

function decodeParam(val: any) {
    try {
        return decodeURIComponent(val)
    } catch (err) {
        return val
    }
}

type matchRouteTuple = [RemotePageRoute | undefined, object]

const notMatch: matchRouteTuple = [undefined, {}]

export default function matchRoute(
    routes: RemotePageRoute[],
    inputPath: string,
    // 默认区分大小写
    matchOptions: TokensToRegexpOptions & ParseOptions = { sensitive: true }
): matchRouteTuple {
    let matchIndex = -1
    const params: any = {}
    for (let index = 0; index < routes.length; index++) {
        let { path } = routes[index]

        const cacheKey = path
        let regexp = cache.get(path)
        if (!regexp) {
            const keys: any[] = []
            regexp = {
                keys,
                pattern: pathToRegexp(path || '', keys, matchOptions),
            }
            cache.set(cacheKey, regexp)
        }

        const m = regexp.pattern.exec(inputPath)

        if (m) {
            matchIndex = index
            for (let i = 1; i < m.length; i++) {
                const key = regexp.keys[i - 1]
                const prop = key.name
                const value = m[i]
                if (value !== undefined || !hasOwnProperty.call(params, prop)) {
                    if (key.repeat) {
                        params[prop] = value ? value.split(key.delimiter).map(decodeParam) : []
                    } else {
                        params[prop] = value ? decodeParam(value) : value
                    }
                }
            }
            break
        }
    }

    if (matchIndex >= 0) {
        const route = routes[matchIndex]
        return [route, params]
    } else {
        return notMatch
    }
}
