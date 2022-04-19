import { ElementType } from 'react'

export type RemotePageRoute = {
    path: string
    getPage: () => Promise<{ default: ElementType }>
}

export function createRemoteAppRoutes(routes: RemotePageRoute[]) {
    return routes
}
