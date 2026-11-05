import { describe, expect, it } from 'vitest'
import { defaultOptions } from '@primevue/core/config'
import { ARIA_KO } from './localeKo'

describe('PrimeVue 읽기 문구 한국어(F-18)', () => {
  it('라이브러리 기본 aria 키를 빠짐없이 옮겼고, 영어 낱말이 남지 않는다', () => {
    const keys = Object.keys(defaultOptions.locale!.aria!)
    expect(Object.keys(ARIA_KO).sort()).toEqual(keys.sort())
    for (const [k, v] of Object.entries(ARIA_KO)) expect(v.replace(/\{\w+\}/g, ''), k).not.toMatch(/[A-Za-z]/)
  })
})
