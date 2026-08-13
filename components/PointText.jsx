// 포인트 표시. 부호를 붙이고 반올림하지 않는다 (+100P / -10P / 잔액은 100P)
// 잔액처럼 부호 없이 보여줄 때는 showSign={false}

export function PointText({ amount, showSign = true, className = '' }) {
  const sign = showSign && amount > 0 ? '+' : ''
  return (
    <span className={'font-bold text-ink-000 ' + className}>
      {sign}
      {amount}P
    </span>
  )
}
