import './globals.css'
import { StoreProvider } from '@/components/StoreProvider'
import { TabBar } from '@/components/TabBar'

// 정식 길벗 로고를 파비콘과 홈 화면 아이콘으로 사용한다
export const metadata = {
  title: '길벗 — 먼저 간 사람의 발자국',
  description:
    '화물기사의 현장 경험을 AI 음성 인터뷰로 모아 지식 카드로 연결하는 서비스예요. 도착지 주변의 시행착오를 먼저 가본 기사의 경험으로 줄이세요.',
  icons: {
    icon: [{ url: '/logo.png', type: 'image/png', sizes: '256x256' }],
    shortcut: ['/logo.png'],
    apple: [{ url: '/logo.png', type: 'image/png', sizes: '256x256' }],
  },
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
