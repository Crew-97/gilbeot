'use client'

import { createContext, useContext } from 'react'

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  return <StoreContext.Provider value={null}>{children}</StoreContext.Provider>
}

export function useStore() {
  return useContext(StoreContext)
}
