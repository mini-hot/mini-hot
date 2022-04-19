const fse = require('fs-extra')
const colors = require('colors')

export function setMiniProjectIgnore(projectConfigPath: string, hotUpdateAssetsOutputPath: string) {
    try {
        const projectConfig = fse.readJsonSync(projectConfigPath)
        if (!projectConfig.packOptions) {
            projectConfig.packOptions = {}
        }
        const { ignore = [] } = projectConfig.packOptions
        const hotUpdateIgnoreConfig = {
            type: 'folder',
            value: hotUpdateAssetsOutputPath
        }
        const isAdded = ignore.some(i => JSON.stringify(i) === JSON.stringify(hotUpdateIgnoreConfig))
        if (isAdded) return

        ignore.push(hotUpdateIgnoreConfig)

        projectConfig.packOptions.ignore = ignore

        fse.writeFileSync(projectConfigPath, JSON.stringify(projectConfig, null, 2));
    } catch (error) {
        console.log(error)
        console.log(colors.yellow('⚠️ 热更新文件忽略配置失败，请自行配置project.config.json！'))
    }
}