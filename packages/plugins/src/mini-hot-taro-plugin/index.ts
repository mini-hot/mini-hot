import { IPluginContext } from '@tarojs/service'
import MiniRemoteChunkWebpackPlugin from '../mini-hot-webpack-plugin'
import { logAssetsHash } from '../helper/logAssetsHash'
import { startDevServer } from '../helper/startDevServer'
import { setMiniProjectIgnore } from '../helper/setMiniProjectIgnore'

const getPort = require('get-port')
const path = require('path')

export type PluginOptions = {
    publicPath: string
    hotUpdateAssetsOutputPath: string
    entryChunkUseCache: boolean | ((url: string) => string)
    devServerPort: number
}

export default async (ctx: IPluginContext, pluginOpts: PluginOptions) => {
    const { runOpts, paths } = ctx

    if (runOpts.options.platform !== 'weapp') return

    const { publicPath, hotUpdateAssetsOutputPath, entryChunkUseCache, devServerPort = 9090 } = pluginOpts

    const serverPort = await getPort({ port: devServerPort })

    ctx.onBuildStart(() => {
        if (runOpts.options.isWatch) {
            startDevServer(serverPort, paths.outputPath)
        }
    })

    ctx.modifyWebpackChain(({ chain }) => {
        chain
            .plugin('mini-remote-plugin')
            .use(MiniRemoteChunkWebpackPlugin, [
                {
                    publicPath: runOpts.options.isWatch ? `http://127.0.0.1:${serverPort}` : publicPath,
                    hotUpdateAssetsOutputPath,
                    entryChunkUseCache,
                },
            ])
            .end()
    })

    ctx.onBuildFinish(() => {
        setMiniProjectIgnore(path.join(paths.outputPath, 'project.config.json'), hotUpdateAssetsOutputPath)
        if (!runOpts.options.isWatch) {
            logAssetsHash(paths.outputPath, hotUpdateAssetsOutputPath)
        }
    })
}
