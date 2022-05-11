import React, { Component, ElementType, Ref } from 'react'
import { QueryableProps } from './utils/makeQueryablePromise'
import { taroPageLifecycleNames } from './utils/taroPageLifecycleNames'
import Taro from '@tarojs/taro'
import { createPromise } from './utils/createPromise'

type CreateRemotePageOptions = {
    onFinish?: () => void
    onLoading?: () => ElementType
    onError?: (reload: () => void) => ElementType
    prefetch?: boolean
    timeout?: number
}

export function createRemotePage(getPage: () => Promise<{ default: ElementType }>, options?: CreateRemotePageOptions) {
    const opts: CreateRemotePageOptions = {
        prefetch: true,
        ...options,
    }

    let getPagePromise: (Promise<{ default: ElementType }> & QueryableProps) | undefined = undefined

    if (opts.prefetch) {
        getPagePromise = createPromise(getPage(), opts.timeout)
    }

    return class RemotePageWrapper extends Component {
        constructor(props: any) {
            super(props)
            if (getPagePromise === undefined) {
                getPagePromise = createPromise(getPage(), opts.timeout)
            } else if (getPagePromise?.isRejected()) {
                // 重试
                getPagePromise = createPromise(getPage(), opts.timeout)
            }
        }

        reload = () => {
            getPagePromise = createPromise(getPage(), opts.timeout)
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

            getPagePromise?.then(
                ({ default: RemotePage }) => {
                    this.setState({
                        RemotePage,
                        status: 'resolved',
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
        }

        state: {
            RemotePage: ElementType | undefined
            status: 'loading' | 'resolved' | 'rejected'
            ErrorComp: ElementType | undefined
            LoadingCom: ElementType | undefined
        } = {
            status: 'loading',
            RemotePage: undefined,
            ErrorComp: undefined,
            LoadingCom: undefined,
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
