<script setup lang="ts">
/**
 * 조회 영역 — 원본 `shbox`.
 *
 * 목록 화면이 똑같이 쓴다. 제목줄(초기화 · 조회(F2) · 상세조회) + 조회 칸 격자 +
 * 아래 가운데 접기 손잡이. 화면은 `<tr>`(항목 이름 `<th>` + 입력칸 `<td>` 쌍)만 넘긴다.
 *
 * **칸 배치는 화면이 정하지 않는다(UI-02).** 이름 칸 160 · 한 줄 3칸 · 좁으면 2칸 → 1칸으로
 * `layout.css`의 격자가 놓는다. 화면이 고를 수 있는 것은 입력칸 폭 셋뿐이다 —
 * 보통(기본) · 길게(`colspan="3"`, 날짜 범위 · 구분+검색어) · 짧게(`td.ws-sh__s`).
 *
 * **상세조회 접기는 조회 항목이 6개를 넘는 화면만 쓴다.** 기본으로 보이는 조건은 3줄까지다.
 *
 * **조회 버튼만 초록이다.** 원본 `.shbox .titbox .btn_cm.pri` 규칙이다.
 * F2는 보이는 화면에서만 받는다(`useHotkey`).
 */
import { ref } from 'vue'
import Button from 'primevue/button'
import { useHotkey } from '../app/useHotkey'

withDefaults(defineProps<{ title?: string }>(), { title: '조회' })
const emit = defineEmits<{ search: []; reset: [] }>()
const detail = ref(false)

useHotkey('F2', () => emit('search'))
</script>

<template>
  <form class="ws-sh" @submit.prevent="emit('search')">
    <div class="ws-tit">
      <div class="ws-tit__l"><h2 class="ws-tit__h">{{ title }}</h2></div>
      <div class="ws-tit__r">
        <Button type="button" severity="secondary" outlined aria-label="조건 초기화" v-tooltip.bottom="'초기화'" @click="emit('reset')">
          <template #icon><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /></svg></template>
        </Button>
        <Button type="submit" label="조회(F2)" />
        <Button v-if="$slots.detail" type="button" severity="secondary" outlined label="상세조회" :aria-expanded="detail" @click="detail = !detail" />
      </div>
    </div>
    <div class="ws-sh__body">
      <table class="ws-tb">
        <tbody>
          <slot />
          <slot v-if="detail" name="detail" />
        </tbody>
      </table>
    </div>
    <button v-if="$slots.detail" type="button" class="ws-sh__fold" :aria-expanded="detail" :aria-label="detail ? '상세 조건 접기' : '상세 조건 펼치기'" @click="detail = !detail" />
  </form>
</template>
