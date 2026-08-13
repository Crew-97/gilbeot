import './globals.css'
import { StoreProvider } from '@/components/StoreProvider'

export const metadata = {
  title: '길벗',
  description: '화물기사의 현장 경험을 잇는 지식 공유 서비스',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body className="antialiased">
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  )
}
