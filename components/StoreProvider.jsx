'use client'

// 앱 전체 상태를 들고 있는 Provider. 상태 모양과 변경 규약은 lib/store.js 참조
// 화면은 useStore() 로 { state, setState } 를 받아 store 함수에 넘긴다
//   조회: getCards(state, 조건)
//   변경: const r = unlockCard(state, driverId, cardId); setState(r.state); r.ok 로 분기

import { createContext, useContext, useState } from 'react'
import { createInitialState } from '@/lib/store'

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const [state, setState] = useState(createInitialState)
  return (
    <StoreContext.Provider value={{ state, setState }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  return useContext(StoreContext)
}
