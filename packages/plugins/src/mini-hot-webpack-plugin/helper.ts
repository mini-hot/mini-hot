export function isDynamicDep(dep) {
    if (!dep || !dep.type) {
        return false
    }
    return dep.type.startsWith('import()')
}

export function getModuleId(module) {
    return module.userRequest || module._identifier
}

export function normalizePublicPath(str) {
    return str.replace(/[\/]+$/, '') 
}

export function normalizeHotUpdateAssetsOutputPath(str) {
    return '/' + str.replace(/^[\/]+/, '')
}