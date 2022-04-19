export function getPathAndQuery(originPath: string) {
    const [path, query] = originPath.split('?')
    return {
        path,
        query: query ? parseQuery('?' + query) : {}
    }
}

type Params = {
    [name: string]: string
}

function parseQuery(queryString?: string, leadingCharacter = '?'): Params {
    if (!queryString || queryString[0] != leadingCharacter) {
        return {}
    }

    let query: any = {}
    let queryParts = queryString.slice(1).split('&')
    for (let i = 0, len = queryParts.length; i < len; i++) {
        const x = queryParts[i].split('=')
        query[x[0]] = x[1] ? decodeURIComponent(x[1]) : ''
    }
    return query
}
