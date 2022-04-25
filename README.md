# mini-hot

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
