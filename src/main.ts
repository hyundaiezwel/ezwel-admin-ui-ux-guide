import { createApp } from 'vue'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import Tooltip from 'primevue/tooltip'
import App from './App.vue'
import { router } from './router'
import { WsPreset } from './ws/preset'
import { ARIA_KO } from './app/localeKo'
import './app/theme'
import './ws/tokens.css'
import './ws/base.css'
import './ws/layout.css'
import './ws/primitives.css'
import './ws/controls.css'
import './ws/primevue.css'
import './grid/tabulator-ws.css'

createApp(App)
  .use(router)
  .use(PrimeVue, {
    theme: {
      preset: WsPreset,
      options: {
        // 토큰과 같은 스위치를 쓴다 — theme.ts가 html에 박는 속성
        darkModeSelector: '[data-theme="dark"]',
        // 레이어에 넣어 우리 규칙(primevue.css)이 순서와 무관하게 이기게 한다
        cssLayer: { name: 'primevue', order: 'reset, primevue' },
      },
    },
    ripple: false,
    // 화면낭독기 읽기 문구를 한국어로(쪽 이동 「First Page」 · 창 닫기 「Close」가 영어로 읽혔다)
    locale: { aria: ARIA_KO },
  })
  .use(ToastService)
  .directive('tooltip', Tooltip)
  .mount('#app')
