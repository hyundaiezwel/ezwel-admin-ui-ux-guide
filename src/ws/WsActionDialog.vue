<script setup lang="ts">
/**
 * 처리 확인 팝업 — 사유 · 날짜 · 대외 통지 안내를 조합한다.
 *
 * AS-IS 모달 21개 대부분이 이 틀의 부분집합이다(A2) — 세션 만료 · 참여불가 경고만 따로다. 조합만 다르다:
 *   확인서파기     사유 + 경고 + 통지        등록승인   날짜 + 통지
 *   이용정지       사유 선택 7종 + 통지      엑셀 사유  선택 3종 + 직접 입력(10~200자)
 *
 * 통지 안내를 **버튼 바로 위**에 둔다. AS-IS는 안내문이 날짜 칸 아래 본문 글자로 섞여 있어,
 * 확인을 누르는 순간 "문자가 나간다"는 것이 눈에 들어오지 않는다.
 * 대상 건수를 제목 아래에 박는다 — 몇 곳에 보내는지 모르고 누르는 일을 막는다.
 */
import { computed, nextTick, ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Textarea from 'primevue/textarea'
import RadioButton from 'primevue/radiobutton'
import DatePicker from 'primevue/datepicker'

export interface ActionPayload { option: string | null; text: string; date: Date | null }

const props = defineProps<{
  header: string
  /** 대상 요약 — "선택한 12개 기업" */
  target?: string
  /** 대외 통지 — "기업담당자에게 입금 요청 LMS 및 E-Mail이 발송됩니다." */
  notice?: string
  /** 되돌리기 어려운 결과를 미리 알리는 경고 */
  warn?: string
  reason?: { label: string; required?: boolean; min?: number; max?: number; options?: string[]; other?: string; placeholder?: string }
  date?: { label: string }
  /** 실행 버튼 — 하는 일 이름으로(「삭제」「참여취소」「다운로드」). 없으면 「확인」(UI-34) */
  confirmLabel?: string
  /** 닫기 버튼. 없으면 「취소」, 실행 버튼이 취소 동작(「참여취소」)이면 헷갈리지 않게 「취소하지 않음」 */
  cancelLabel?: string
  danger?: boolean
}>()
const dismissLabel = computed(() => props.cancelLabel ?? (props.confirmLabel?.includes('취소') ? '취소하지 않음' : '취소'))
const visible = defineModel<boolean>('visible', { required: true })
const emit = defineEmits<{ confirm: [payload: ActionPayload] }>()

const option = ref<string | null>(null)
const text = ref('')
const picked = ref<Date | null>(null)
const touched = ref(false)
/** 창을 연 요소 — 닫히면(Esc · 취소 · 확인) 키보드 선택 위치를 여기로 돌린다 */
let opener: HTMLElement | null = null
watch(visible, (v) => {
  if (v) { option.value = null; text.value = ''; picked.value = null; touched.value = false; opener = document.activeElement as HTMLElement | null; return }
  const back = opener
  opener = null
  // PrimeVue Dialog 도 연 순간의 포커스로 돌리지만, Esc(useEscapeToClose)로 닫을 때 놓치는 일이 있어 한 번 더 확인한다
  nextTick(() => { const a = document.activeElement; if (back?.isConnected && (!a || a === document.body || !a.isConnected || a.closest('.p-dialog'))) back.focus() })
})

/** 글자 칸이 필요한가 — 선택지가 없으면 늘, 있으면 "직접 입력"을 골랐을 때만 */
const needText = computed(() => !!props.reason && (!props.reason.options || option.value === props.reason.other))
type Field = 'opt' | 'text' | 'date'
/** 첫 오류 칸과 문구 — 칸은 aria-invalid · aria-describedby 연결과 포커스 이동에 쓴다 */
const fail = computed<{ field: Field; msg: string } | null>(() => {
  const r = props.reason
  if (r?.options && !option.value) return { field: 'opt', msg: `${r.label}를 선택해 주세요.` }
  if (needText.value && r) {
    const n = text.value.trim().length
    if ((r.required || r.options) && n === 0) return { field: 'text', msg: `${r.label}를 입력해 주세요.` }
    if (r.min && n < r.min) return { field: 'text', msg: `최소 ${r.min}자 이상 입력해 주세요.` }
  }
  if (props.date && !picked.value) return { field: 'date', msg: `${props.date.label}을 선택해 주세요.` }
  return null
})
const error = computed(() => fail.value?.msg ?? null)
/** 이 칸이 지금 보이는 오류의 칸인가 */
const bad = (f: Field) => touched.value && fail.value?.field === f
const errAttrs = (f: Field) => (bad(f) ? { 'aria-invalid': true, 'aria-describedby': 'ad-err' } : {})
const FIRST: Record<Field, string> = { opt: '#ad-o0', text: '#ad-text', date: '#ad-date' }

function confirm() {
  touched.value = true
  if (fail.value) {
    const q = FIRST[fail.value.field]
    nextTick(() => document.querySelector<HTMLElement>(`.p-dialog ${q}`)?.focus())
    return
  }
  emit('confirm', { option: option.value, text: text.value.trim(), date: picked.value })
  visible.value = false
}
</script>

<template>
  <Dialog v-model:visible="visible" modal :header="header" :style="{ width: '480px' }" :draggable="false">
    <div class="ad">
      <p v-if="target" class="ad__target">{{ target }}</p>
      <p v-if="warn" class="ad__warn" role="note">{{ warn }}</p>

      <!-- 선택지 묶음(라디오)은 묶음 전체에 필수 · 오류를 연결한다 -->
      <fieldset v-if="reason?.options" class="ad__opts" role="radiogroup" aria-required="true" v-bind="errAttrs('opt')">
        <legend class="ws-req">{{ reason.label }}</legend>
        <div v-for="(o, i) in reason.options" :key="o" class="ws-radio">
          <RadioButton v-model="option" :input-id="`ad-o${i}`" name="ad-opt" :value="o" />
          <label :for="`ad-o${i}`">{{ o }}</label>
        </div>
      </fieldset>

      <div v-if="needText && reason" class="ad__text">
        <label v-if="!reason.options" for="ad-text" :class="{ 'ws-req': reason.required }">{{ reason.label }}</label>
        <Textarea
          id="ad-text" v-model="text" rows="4" fluid :maxlength="reason.max" :placeholder="reason.placeholder"
          :invalid="bad('text')" :aria-label="reason.options ? `${reason.other} 내용` : undefined"
          :aria-required="reason.required || !!reason.options || undefined" v-bind="errAttrs('text')"
        />
        <p v-if="reason.max" class="ad__cnt" aria-live="polite">{{ text.length }} / {{ reason.max }}자</p>
      </div>

      <div v-if="date" class="ad__date">
        <label for="ad-date" class="ws-req">{{ date.label }}</label>
        <DatePicker v-model="picked" input-id="ad-date" date-format="yy.mm.dd" placeholder="YYYY.MM.DD" show-icon icon-display="input" :show-on-focus="false" :min-date="new Date()" :invalid="bad('date')" :pt="{ pcInputText: { root: { 'aria-required': true, ...errAttrs('date') } } }" />
      </div>

      <slot />

      <p v-if="touched && error" id="ad-err" class="ws-err" role="alert">{{ error }}</p>
      <p v-if="notice" class="ad__notice"><b>대외 통지</b>{{ notice }}</p>
    </div>
    <template #footer>
      <Button :label="dismissLabel" severity="secondary" outlined data-testid="ad-cancel" @click="visible = false" />
      <Button :label="confirmLabel ?? '확인'" :severity="danger ? 'danger' : undefined" @click="confirm" />
    </template>
  </Dialog>
</template>

<style scoped>
.ad { display: grid; gap: var(--ws-gap-inter); }
.ad__target { font-weight: 600; }
.ad__warn {
  padding: var(--ws-gap-intra) var(--ws-gap-inter); border-left: 3px solid var(--ws-text-danger); border-radius: var(--ws-radius-sm);
  background: var(--ws-surface-danger); color: var(--ws-text); line-height: 1.5;
}
.ad__opts { display: grid; gap: var(--ws-gap-intra); margin: 0; padding: 0; border: 0; }
.ad__opts legend { margin-bottom: var(--ws-gap-intra); color: var(--ws-text-sub); }
.ad__text, .ad__date { display: grid; gap: var(--ws-gap-item); }
.ad__text label, .ad__date label { color: var(--ws-text-sub); }
.ad__cnt { color: var(--ws-text-muted); font-size: var(--ws-font-size-sm); text-align: right; }
.ad__notice {
  display: flex; gap: var(--ws-gap-intra); padding: var(--ws-gap-intra) var(--ws-gap-inter); border-radius: var(--ws-radius);
  background: var(--ws-surface-info); color: var(--ws-text); line-height: 1.5;
}
.ad__notice b { flex: none; color: var(--ws-text-link); }
</style>
