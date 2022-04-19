"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizePublicPath = exports.getModuleId = exports.isDynamicDep = void 0;
function isDynamicDep(dep) {
    if (!dep || !dep.type) {
        return false;
    }
    return dep.type.startsWith('import()');
}
exports.isDynamicDep = isDynamicDep;
function getModuleId(module) {
    return module.userRequest || module._identifier;
}
exports.getModuleId = getModuleId;
function normalizePublicPath(url) {
    if (url[url.length - 1] !== '/')
        return url;
    return url.slice(0, -1);
}
exports.normalizePublicPath = normalizePublicPath;
