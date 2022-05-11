import Taro, { getCurrentInstance } from '@tarojs/taro'
import React from 'react'
import { Component, ElementType, Ref } from 'react'
import { RemotePageRoute } from './createRemoteAppRoutes'
import { ROUTE_PATH_KEY } from './utils/constants'
import { createPromise } from './utils/createPromise'
import { QueryableProps } from './utils/makeQueryablePromise'
import matchRoute from './utils/matchRoute'
import { taroPageLifecycleNames } from './utils/taroPageLifecycleNames'
import { getPathAndQuery } from './utils/urlUtils'

type createRemoteAppOptions = {
    onFinish?: () => void
    onLoading?: () => ElementType
    onError?: (reload: () => void) => ElementType
    onNotFound?: () => ElementType
    prefetch?: boolean
    timeout?: number
    routePathKey?: string
}

export function createRemoteApp(
    getRoutes: () => Promise<{ default: RemotePageRoute[] }>,
    options?: createRemoteAppOptions
) {
    const opts: createRemoteAppOptions = {
        prefetch: true,
        ...options,
    }

    let getRoutesPromise: (Promise<{ default: RemotePageRoute[] }> & QueryableProps) | undefined = undefined

    if (opts.prefetch) {
        getRoutesPromise = createPromise(getRoutes(), opts.timeout)
    }

    return class RemoteAppWrapper extends Component {
        constructor(props: any) {
            super(props)
            if (getRoutesPromise === undefined) {
                getRoutesPromise = createPromise(getRoutes(), opts.timeout)
            } else if (getRoutesPromise?.isRejected()) {
                // 重试
                getRoutesPromise = createPromise(getRoutes(), opts.timeout)
            }
        }

        $instance = getCurrentInstance()

        reload = () => {
            getRoutesPromise = createPromise(getRoutes(), opts.timeout)
            this.load()
        }

        componentDidMount = () => {
            this.load()
        }

        load = () => {
            const LoadingCom = opts?.onLoading?.()

            this.setState({
                status: 'loading',
                LoadingCom: LoadingCom || null,
            })

            getRoutesPromise?.then(
                ({ default: routes }) => {
                    const originParams = this.$instance.router?.params || {}
                    const originPath = decodeURIComponent(originParams[opts.routePathKey || ROUTE_PATH_KEY] || '')

                    const { path, query = {} } = getPathAndQuery(originPath)

                    let RemotePage: ElementType | null = null

                    const [route, params] = matchRoute(routes, path)

                    if (route) {
                        const { getPage } = route
                        getPage().then(
                            ({ default: RemotePage }) => {
                                this.setState({
                                    RemotePage,
                                    status: 'resolved',
                                    routerInfo: { query, params, path: originPath },
                                })
                                opts.onFinish?.()
                            },
                            () => {
                                const ErrorComp = opts.onError?.(this.reload)
                                this.setState({
                                    status: 'rejected',
                                    ErrorComp: ErrorComp || null,
                                })
                            }
                        )
                    } else {
                        const NotFundPage = opts.onNotFound?.()
                        if (NotFundPage) {
                            RemotePage = NotFundPage
                        } else {
                            console.error('[mini-hot]: 无法匹配到页面')
                        }

                        this.setState({
                            RemotePage,
                            status: 'resolved',
                        })

                        opts.onFinish?.()
                    }
                },
                () => {
                    const ErrorComp = opts.onError?.(this.reload)
                    this.setState({
                        status: 'rejected',
                        ErrorComp: ErrorComp || null,
                    })
                }
            )
        }

        state: {
            RemotePage: ElementType | undefined
            status: 'loading' | 'resolved' | 'rejected'
            ErrorComp: ElementType | undefined
            LoadingCom: ElementType | undefined
            routerInfo: object
        } = {
            status: 'loading',
            RemotePage: undefined,
            ErrorComp: undefined,
            LoadingCom: undefined,
            routerInfo: {},
        }

        hasHandleTaroPageLifecycle = false
        handleTaroPageLifecycle = (ref: Ref<ElementType>) => {
            if (this.hasHandleTaroPageLifecycle) {
                return
            }
            this.hasHandleTaroPageLifecycle = true

            // 补偿首次 didShow 事件
            ref?.['componentDidShow']?.()

            // 页面事件透传
            taroPageLifecycleNames.forEach((name) => {
                // 如果未设置分享，则取消分享
                if (!ref?.['onShareAppMessage']) {
                    Taro.hideShareMenu()
                }
                ;(this as any)[name] = (...args: any) => {
                    return ref?.[name]?.(...args)
                }
            })
        }

        // 强行触发分享事件，用户没有再关掉
        onShareAppMessage() {
            return {}
        }

        renderComp = () => {
            const { status, RemotePage, LoadingCom, ErrorComp } = this.state
            if (status === 'resolved' && RemotePage) {
                return (
                    <RemotePage
                        ref={(ref: Ref<ElementType>) => {
                            Taro.nextTick(() => {
                                this.handleTaroPageLifecycle(ref)
                            })
                        }}
                        {...this.state.routerInfo}
                    ></RemotePage>
                )
            }

            if (status === 'loading' && LoadingCom) {
                return <LoadingCom />
            }

            if (status === 'rejected' && ErrorComp) {
                return <ErrorComp />
            }

            return null
        }

        render() {
            return this.renderComp()
        }
    }
}
