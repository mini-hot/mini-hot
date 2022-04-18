const fse = require('fs-extra');
const md5 = require('md5');
/**
 * 对目录内容生成hash
 */
export function getDirectoryHash(dir, ignore) {
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
            hashArr.push(getDirectoryHash(childDirs[i], ignore));
        }
        return md5(hashArr.join('') + dirNameHash);
    }
    return '';
}
