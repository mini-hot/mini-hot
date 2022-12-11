# mini-hot
**⚠️注意：该方案使用的开源库已被[微信官方禁用](https://developers.weixin.qq.com/community/develop/doc/0000ae500e4fd0541f2ea33755b801?highLine=%25E8%25A7%25A3%25E9%2587%258A%25E5%2599%25A8%25E4%25BD%25BF%25E7%2594%25A8%25E8%25A7%2584%25E8%258C%2583)，谨慎使用！**

<a href="https://www.npmjs.com/package/@mini-hot/taro"><img src="https://img.shields.io/npm/v/@mini-hot/taro.svg?style=flat-square&colorB=51C838" alt="NPM Version"></a>

[Demo 工程](https://github.com/mini-hot/mini-hot-demo)

## API

### `createRemotePage` - 单个页面远程加载

```ts
// SomePage.ts
import { createRemotePage } from '@mini-hot/taro'
export default createRemotePage(() => import('./SomePage'))
```

### `createRemoteApp` - 小程序 SPA 化后远程加载

```ts
// SPA.ts
import { createRemoteApp } from '@mini-hot/taro'
export default createRemoteApp(() => import('./routes'))
```

```ts
// routes.ts
import { createRemoteAppRoutes } from '@mini-hot/taro'

export default createRemoteAppRoutes([
    {
        path: '/PageA/:code',
        // PageA 不继续分块
        getPage: async () => require('./PageA'),
    },
    {
        path: '/PageB',
        // PageB 继续分块
        getPage: () => import('./PageB'),
    },
])
```

## 相关

[jsjs](https://github.com/bramblex/jsjs)  
[JS-Interpreter](https://github.com/NeilFraser/JS-Interpreter)  
[eval5](https://github.com/bplok20010/eval5)  
[taro-dynamic-import-weapp](https://github.com/JiyuShao/taro-dynamic-import-weapp)
