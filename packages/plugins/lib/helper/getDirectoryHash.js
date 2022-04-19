"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDirectoryHash = void 0;
const fse = require('fs-extra');
const md5 = require('md5');
const path = require('path');
/**
 * 对目录内容生成hash
 */
function getDirectoryHash(dir, ignore) {
    if (!fse.pathExistsSync(dir)) {
        throw new Error(`${dir} 不存在`);
    }
    const stats = fse.statSync(dir);
    if (typeof ignore === 'string' && new RegExp(ignore).test(dir))
        return '';
    if (typeof ignore === 'function' && ignore(dir))
        return '';
    if (ignore instanceof RegExp && ignore.test(dir))
        return '';
    if (stats.isFile()) {
        return md5(fse.readFileSync(dir, 'utf8'));
    }
    else if (stats.isDirectory()) {
        let childDirs = fse.readdirSync(dir);
        childDirs = childDirs.sort();
        const dirNameHash = md5(childDirs.join(''));
        let hashArr = [];
        for (let i = 0; i < childDirs.length; i++) {
            hashArr.push(getDirectoryHash(path.join(dir, childDirs[i]), ignore));
        }
        return md5(hashArr.join('') + dirNameHash);
    }
    return '';
}
exports.getDirectoryHash = getDirectoryHash;
