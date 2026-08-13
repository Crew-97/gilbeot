import './globals.css'
import { StoreProvider } from '@/components/StoreProvider'
import { TabBar } from '@/components/TabBar'

// 파비콘은 app/icon.svg 파일 규약으로 자동 주입된다. 여기에 적지 않는다
export const metadata = {
  title: '길벗 — 먼저 간 사람의 발자국',
  description:
    '화물기사의 현장 경험을 AI 음성 인터뷰로 모아 지식 카드로 연결하는 서비스예요. 도착지 주변의 시행착오를 먼저 가본 기사의 경험으로 줄이세요.',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body className="antialiased">
        <StoreProvider>
          {children}
          <TabBar />
        </StoreProvider>
      </body>
    </html>
  )
}
