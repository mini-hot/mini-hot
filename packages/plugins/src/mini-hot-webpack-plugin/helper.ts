export function isDynamicDep(dep) {
    if (!dep || !dep.type) {
        return false
    }
    return dep.type.startsWith('import()')
}

export function getModuleId(module) {
    return module.userRequest || module._identifier
}

export function normalizePublicPath(url) {
    if (url[url.length - 1] !== '/') return url
    return url.slice(0, -1)
}
