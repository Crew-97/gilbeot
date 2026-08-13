'use client'

// 앱 전체 상태를 들고 있는 Provider. 상태 모양과 변경 규약은 lib/store.js 참조
// 화면은 useStore() 로 { state, setState } 를 받아 store 함수에 넘긴다
//   조회: getCards(state, 조건)
//   변경: const r = unlockCard(state, driverId, cardId); setState(r.state); r.ok 로 분기
//
// sessionStorage 보존 (해소 34): 같은 탭에서는 새로고침, 주소 직접 입력에도 상태가 유지된다
// 새 탭이나 시크릿 창은 시드로 시작한다 — 리허설을 처음부터 다시 돌릴 때는 새 탭을 연다

import { createContext, useContext, useEffect, useState } from 'react'
import { createInitialState } from '@/lib/store'

const StoreContext = createContext(null)
const STORAGE_KEY = 'gilbeot-demo-state'

function loadStoredState() {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    // 저장분이 깨졌으면 시드로 시작한다. 시연이 멈추는 것보다 낫다
    return null
  }
}

export function StoreProvider({ children }) {
  // 서버 렌더와 첫 클라이언트 렌더는 시드로 일치시키고, 마운트 후에 저장분으로 교체한다
  const [state, setState] = useState(createInitialState)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const stored = loadStoredState()
    if (stored) setState(stored)
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // 저장 실패는 무시한다. 상태는 메모리에 그대로 있다
    }
  }, [state, hydrated])

  return (
    <StoreContext.Provider value={{ state, setState }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  return useContext(StoreContext)
}
