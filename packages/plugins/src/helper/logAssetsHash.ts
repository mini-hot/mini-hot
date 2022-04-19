import { getDirectoryHash } from './getDirectoryHash'
const path = require('path')
const colors = require('colors')

export function logAssetsHash(outputPath, hotUpdateAssetsOutputPath) {
    const remoteAbsolutePath = path.join(outputPath, hotUpdateAssetsOutputPath)
    const basicHash = getDirectoryHash(outputPath, remoteAbsolutePath)
    const remoteHash = getDirectoryHash(remoteAbsolutePath)
    console.log(colors.green(`\n💟 无法热更新内容hash: ${basicHash} \n`))
    console.log(colors.green(`\n💓 支持热更新内容hash: ${remoteHash} \n`))
}
