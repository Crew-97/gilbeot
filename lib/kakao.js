'use client'

const KAKAO_MAP_SCRIPT_ID = 'kakao-map-sdk'
const KAKAO_MAP_SCRIPT_URL = 'https://dapi.kakao.com/v2/maps/sdk.js'
const LOAD_TIMEOUT_MS = 10000

let loadPromise = null

function getKakaoMaps() {
  return window.kakao?.maps ?? null
}

function findKakaoScript() {
  return (
    document.getElementById(KAKAO_MAP_SCRIPT_ID) ||
    document.querySelector(`script[src^="${KAKAO_MAP_SCRIPT_URL}"]`)
  )
}

function loadScript(appKey) {
  return new Promise((resolve) => {
    let script = findKakaoScript()
    const createdByLoader = !script
    let timeoutId
    let settled = false

    const finish = (maps) => {
      if (settled) return
      settled = true
      clearTimeout(timeoutId)
      script?.removeEventListener('load', initialize)
      script?.removeEventListener('error', fail)

      if (!maps && createdByLoader) script?.remove()
      resolve(maps)
    }

    const initialize = () => {
      const maps = getKakaoMaps()
      if (!maps || typeof maps.load !== 'function') {
        finish(null)
        return
      }

      try {
        maps.load(() => finish(getKakaoMaps()))
      } catch {
        finish(null)
      }
    }

    const fail = () => finish(null)

    timeoutId = setTimeout(fail, LOAD_TIMEOUT_MS)

    if (getKakaoMaps()) {
      initialize()
      return
    }

    if (!script) {
      script = document.createElement('script')
      script.id = KAKAO_MAP_SCRIPT_ID
      script.src = `${KAKAO_MAP_SCRIPT_URL}?appkey=${encodeURIComponent(appKey)}&autoload=false`
      script.async = true
    }

    script.addEventListener('load', initialize, { once: true })
    script.addEventListener('error', fail, { once: true })

    if (createdByLoader) {
      try {
        document.head.appendChild(script)
      } catch {
        finish(null)
      }
    }
  })
}

export async function loadKakaoMaps() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return null

  const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY?.trim()
  if (!appKey) return null

  if (!loadPromise) {
    const pending = loadScript(appKey).catch(() => null)
    loadPromise = pending

    pending.then((maps) => {
      if (!maps && loadPromise === pending) loadPromise = null
    })
  }

  return loadPromise
}
