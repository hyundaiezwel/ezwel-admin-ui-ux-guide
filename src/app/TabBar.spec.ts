import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import TabBar from './TabBar.vue'
import { close, open, tabs } from './tabs'

// 닫기 호출을 세되 실제 닫기는 그대로 한다
vi.mock('./tabs', async (orig) => {
  const m = await orig<typeof import('./tabs')>()
  return { ...m, close: vi.fn(m.close) }
})

/**
 * 상단 탭 줄 키보드 · 화면낭독기(점검 F-13).
 * 탭은 첫 화면(고정) · A · B 셋, B 선택으로 시작한다. 탭 상태는 모듈 전역이라 매번 고정 탭만 남긴다.
 */
const HOME = '/sp/home'
const A = '/sp/intake'
const B = '/sp/company'

let w: VueWrapper | undefined
let router: Router

const visit = async (p: string) => { await router.push(p); open(p) }

beforeEach(async () => {
  router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/:p(.*)*', component: { template: '<div/>' } }] })
  for (const t of [...tabs.items]) if (!t.fixed) close(t.path, router)
  await visit(HOME); await visit(A); await visit(B)
  vi.mocked(close).mockClear()
  w = mount(TabBar, { attachTo: document.body, global: { plugins: [router] } })
  await flushPromises()
})
afterEach(() => { w?.unmount(); w = undefined; document.body.innerHTML = '' })

const tab = (p: string) => w!.get(`[data-tab-key="${p}"]`)
const focused = () => (document.activeElement as HTMLElement | null)?.dataset.tabKey
const key = async (p: string, k: string) => { await tab(p).trigger('keydown', { key: k }); await flushPromises() }

describe('상단 탭 줄 키보드(F-13)', () => {
  it('Tab 정지점은 선택된 탭 하나', () => {
    expect(tab(B).attributes('tabindex')).toBe('0')
    expect(tab(HOME).attributes('tabindex')).toBe('-1')
    expect(tab(A).attributes('tabindex')).toBe('-1')
  })

  it('탭 이름은 화면 이름만', () => {
    for (const t of tabs.items) expect(tab(t.path).attributes('aria-label')).toBe(t.title)
  })

  it('× 는 마우스 전용 — Tab · 화면낭독기에서 빠짐', () => {
    const x = tab(B).get('button')
    expect(x.attributes('tabindex')).toBe('-1')
    expect(x.attributes('aria-hidden')).toBe('true')
  })

  it('마지막 탭에서 → 는 처음 탭으로 포커스만 옮김(화면 그대로)', async () => {
    await key(B, 'ArrowRight')
    expect(focused()).toBe(HOME)
    expect(router.currentRoute.value.path).toBe(B)
    expect(tabs.active).toBe(B)
  })

  it('← · Home · End', async () => {
    await key(A, 'ArrowLeft'); expect(focused()).toBe(HOME)
    await key(A, 'Home'); expect(focused()).toBe(HOME)
    await key(A, 'End'); expect(focused()).toBe(B)
  })

  it('Delete 로 닫고 포커스는 새 선택 탭', async () => {
    await key(B, 'Delete')
    expect(close).toHaveBeenCalledWith(B, router)
    await flushPromises()
    open(router.currentRoute.value.path) // 셸이 라우트 변경 때 하는 일
    await flushPromises()
    expect(tabs.items.some((t) => t.path === B)).toBe(false)
    expect(focused()).toBe(tabs.active)
  })

  it('고정 탭에서 Delete 는 아무 일 없음 · Backspace 로는 닫히지 않음', async () => {
    await key(HOME, 'Delete')
    await key(B, 'Backspace')
    expect(close).not.toHaveBeenCalled()
    expect(tabs.items).toHaveLength(3)
  })

  it('× 마우스 클릭은 지금처럼 닫음', async () => {
    await tab(A).get('button').trigger('click')
    await flushPromises()
    expect(close).toHaveBeenCalledWith(A, router)
    expect(tabs.items.some((t) => t.path === A)).toBe(false)
  })
})
