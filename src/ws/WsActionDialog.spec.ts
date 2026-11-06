import { afterEach, describe, expect, it } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import PrimeVue from 'primevue/config'
import WsActionDialog from './WsActionDialog.vue'

window.matchMedia ??= ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} })) as never

let w: VueWrapper | undefined
afterEach(() => { w?.unmount(); w = undefined; document.body.innerHTML = '' })

async function labels(props: Record<string, unknown>) {
  w = mount(WsActionDialog, { attachTo: document.body, global: { plugins: [PrimeVue] }, props: { visible: true, header: '확인 창', ...props } })
  await flushPromises()
  return [...document.querySelectorAll('.p-dialog-footer button')].map((b) => b.textContent?.trim())
}

describe('확인 창 버튼 이름(D7 · F-41)', () => {
  it('실행 버튼은 하는 일 이름, 닫기는 「취소」', async () => {
    expect(await labels({ confirmLabel: '삭제' })).toEqual(['취소', '삭제'])
  })
  it('경계: 실행이 취소 동작이면 닫기는 「취소하지 않음」', async () => {
    expect(await labels({ confirmLabel: '참여취소' })).toEqual(['취소하지 않음', '참여취소'])
  })
  it('닫기 이름을 직접 줄 수 있다', async () => {
    expect(await labels({ confirmLabel: '발송', cancelLabel: '닫기' })).toEqual(['닫기', '발송'])
  })
})
