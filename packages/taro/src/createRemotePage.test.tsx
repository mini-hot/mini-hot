import React from 'react'
import { createRemotePage } from './createRemotePage'

test('createRemotePage', () => {
    const Page = createRemotePage(async () => {
        return { default: () => <div></div> }
    })
    expect(<Page></Page>).toMatchSnapshot()
})
