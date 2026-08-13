// Mock 배지. 트럭커 연동을 전제한 가짜 데이터 옆에 붙인다
// 대상: 배차, 위치·운행, 센터 방문 횟수, 반복 정차, 운행 종료 이벤트, 센터 요약 3종, 관리자 방문 통계
// 어디까지가 실제 동작이고 어디부터가 Mock 인지 화면에서 구분되게 하는 것이 목적이다

export function MockBadge({ className = '' }) {
  return (
    <span
      className={
        'inline-flex items-center rounded-xs border border-hairline bg-sunken px-1.5 py-0.5 text-micro font-bold tracking-wide text-ink-500 ' +
        className
      }
    >
      Mock 데이터
    </span>
  )
}
