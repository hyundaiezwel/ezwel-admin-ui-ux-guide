<script setup lang="ts">
/**
 * 열린 화면 탭(MDI).
 *
 * 모양은 **H-PMS 1차 탭**(`HpTabBar` · layout.css `.hp-tab-bar`)을 따른다(D7, 2026-09-28).
 *   흰 줄 위 밑줄형 — 활성은 진한 글자 600 + 밑줄 2px, 탭 사이 세로선(1 × 16), 이름은 탭 가운데.
 *   오른쪽 24칸은 평소 점 하나, 올리거나 활성이면 닫기(×)가 그 자리에 뜬다.
 * 바꾼 것 둘 — 쉬는 탭 글자는 H-PMS #9aa0a8(흰 바탕 2.6)이 대비 미달이라 --ws-text-muted(5.02)를 쓴다.
 * H-PMS의 "데이터 다시 불러오기" 버튼은 화면마다 재조회 연결이 있어야 해 옮기지 않았다.
 * **폭은 176px 고정이다.** 내용에 맞추면 탭을 열 때마다 이미 열린 탭이 움직여서 같은 탭이
 * 같은 자리에 있지 않다(DS1 docs/navigation.md §3 — 사용자 결정 2026-09-21).
 *
 * 넘치면 좌우 버튼이 나온다. 스크롤바를 드러내지 않는 이유는 업무 화면에서 휠이
 * 본문 스크롤과 다투기 때문이다.
 *
 * 키보드(점검 F-13): 선택된 탭만 Tab 정지점, ← → Home End로 이동, Delete로 닫기(브라우저 탭과 같음).
 * × 는 마우스 전용이다 — 탭마다 Tab이 두 번 멈추고 화면낭독기가 「… 탭 닫기」를 탭 이름처럼 읽었다.
 */
import { computed, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { close, tabs, type Tab } from './tabs'

const router = useRouter()
const scroller = ref<HTMLElement | null>(null)
const overflow = ref(false)

const measure = () => {
  const el = scroller.value
  overflow.value = !!el && el.scrollWidth > el.clientWidth + 1
}
const active = computed(() => tabs.active)
/** Delete 로 닫은 뒤 새 선택 탭으로 키보드 선택 위치를 옮길 차례인지 */
let refocus = false
watch([() => tabs.items.length, active], async () => {
  await nextTick()
  measure()
  if (refocus) focusActive()
}, { immediate: true })

const move = (d: 1 | -1) => scroller.value?.scrollBy({ left: d * 360, behavior: 'smooth' })

/** 탭 줄 안에서 i번째 탭으로 키보드 선택 위치를 옮긴다 — 끝에서 처음으로 돈다 */
const focusTab = async (i: number) => {
  const n = tabs.items.length
  if (!n) return
  await nextTick()
  scroller.value?.querySelectorAll<HTMLElement>('[role="tab"]')[(i + n) % n]?.focus()
}

/** Delete 로 닫은 뒤 — 선택 탭이 남은 탭 가운데 있으면 그리로 키보드 선택 위치를 옮긴다 */
const focusActive = () => {
  const i = tabs.items.findIndex((x) => x.path === tabs.active)
  if (i < 0) return
  refocus = false
  focusTab(i)
}

/** 브라우저 탭과 같은 키 — 사용자가 탭 줄에서 누른 때만이라 본문 포커스를 뺏지 않는다 */
const onTabKey = (e: KeyboardEvent, t: Tab, i: number) => {
  if (e.isComposing) return
  const last = tabs.items.length - 1
  if (e.key === 'ArrowRight') { e.preventDefault(); return focusTab(i + 1) }
  if (e.key === 'ArrowLeft') { e.preventDefault(); return focusTab(i - 1) }
  if (e.key === 'Home') { e.preventDefault(); return focusTab(0) }
  if (e.key === 'End') { e.preventDefault(); return focusTab(last) }
  if (e.key === 'Delete') {
    e.preventDefault()
    if (t.fixed) return
    // 선택 탭(active)은 라우트가 바뀐 뒤 셸이 고친다 — 닫혔으면 「옮길 것」만 적어 두고 위 watch 가 옮긴다
    refocus = true
    close(t.path, router)
    if (tabs.items.some((x) => x.path === t.path)) refocus = false
    else focusActive()
  }
}
</script>

<template>
  <div class="tb">
    <button v-if="overflow" class="tb__nav" type="button" aria-label="이전 탭 보기" @click="move(-1)">‹</button>
    <div ref="scroller" class="tb__scroll" role="tablist" aria-label="열린 화면">
      <div
        v-for="(t, i) in tabs.items"
        :key="t.path"
        class="tb__item"
        :class="{ 'is-on': t.path === active }"
        role="tab"
        :aria-selected="t.path === active"
        :aria-label="t.title"
        :aria-keyshortcuts="t.fixed ? undefined : 'Delete'"
        :tabindex="t.path === active ? 0 : -1"
        :data-tab-key="t.path"
        @click="router.push(t.path)"
        @keydown.enter="router.push(t.path)"
        @keydown.space.prevent="router.push(t.path)"
        @keydown="onTabKey($event, t, i)"
      >
        <span class="tb__label" :title="t.title">{{ t.title }}</span>
        <span class="tb__slot">
          <span class="tb__dot" aria-hidden="true" />
          <button v-if="!t.fixed" class="tb__x" type="button" tabindex="-1" aria-hidden="true" :title="`${t.title} 탭 닫기 (Delete)`" @mousedown.prevent @click.stop="close(t.path, router)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </span>
      </div>
    </div>
    <button v-if="overflow" class="tb__nav" type="button" aria-label="다음 탭 보기" @click="move(1)">›</button>
  </div>
</template>

<style scoped>
.tb {
  --tab-w: 176px;
  flex: none;
  display: flex;
  align-items: stretch;
  gap: 4px;
  height: calc(var(--ws-tab-h) + 8px);
  padding: 0 12px;
  background: var(--ws-surface);
  border-bottom: 1px solid var(--ws-border);
}
.tb__scroll { flex: 1; min-width: 0; display: flex; align-items: stretch; gap: 2px; overflow-x: auto; scrollbar-width: none; }
.tb__scroll::-webkit-scrollbar { display: none; }

.tb__item {
  position: relative;
  flex: none;
  width: var(--tab-w);
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
  border-bottom: 2px solid transparent;
  color: var(--ws-text-muted);
  font-size: var(--ws-font-size-md);
  white-space: nowrap;
  cursor: pointer;
}
/* 탭 사이 세로선 — 첫 탭 앞에는 없다 */
.tb__item:not(:first-child)::before {
  content: ''; position: absolute; left: 0; top: 50%; transform: translateY(-50%);
  width: 1px; height: 16px; background: var(--ws-border);
}
.tb__item:hover { color: var(--ws-text); }
.tb__item.is-on { color: var(--ws-text); font-weight: 600; border-bottom-color: var(--ws-text); }
.tb__item:focus-visible { outline: none; box-shadow: inset 0 0 0 2px var(--ws-field-border-focus); }
/* 이름은 오른쪽 24칸(점 · 닫기)을 뺀 나머지 폭의 가운데 — H-PMS와 같다. 탭 정가운데보다 15px 왼쪽이지만 글자 폭을 30px 더 쓴다 */
.tb__label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; text-align: center; }

/* 오른쪽 24칸 — 평소 점, 올리거나 활성 · 키보드로 들어오면 닫기. 고정 탭은 점만 */
.tb__slot { position: relative; flex: none; width: 24px; height: 24px; }
.tb__dot { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 6px; height: 6px; border-radius: 50%; background: var(--ws-border-grid); }
.tb__x {
  position: absolute; inset: 0; display: grid; place-items: center; padding: 0; border: 0; border-radius: var(--ws-radius-sm);
  background: none; color: var(--ws-text-muted); cursor: pointer; opacity: 0;
}
.tb__item:hover .tb__x, .tb__item.is-on .tb__x, .tb__item:focus-within .tb__x { opacity: 1; }
.tb__item:hover .tb__slot:has(.tb__x) .tb__dot, .tb__item.is-on .tb__dot, .tb__item:focus-within .tb__slot:has(.tb__x) .tb__dot { display: none; }
.tb__x:hover { background: var(--ws-surface-hover); color: var(--ws-text); }
.tb__nav { flex: none; width: 24px; border: 0; background: none; color: var(--ws-text-sub); font-size: 18px; cursor: pointer; }
</style>
