# /api/structure 프롬프트 설계 v0.3

> 준비용 문서. 해커톤 당일에는 프롬프트가 `app/api/structure/route.js`의 상수로 들어간다.
>
> **번호 주의.** 이전 판(v0.2)이 쓰던 `#8` `#9` `#10`은 이 파일의 자체 번호였고,
> `AGENTS.md`·`기능명세서`·`ERD`가 공유하는 번호 체계와 뜻이 달랐다. 아래로 통합됐다.
>
> | 이전 표기 | 결과 |
> |---|---|
> | #8 응답 스키마 | **확정.** `AGENTS.md` AI 프롬프트 절과 `docs/API.md` A-2가 정본 |
> | #9 카테고리별 정보 요소 | **미결정이 아니었다.** `기능명세서 6-3`에 이미 확정돼 있고 이 프롬프트와 일치한다 |
> | #10 LLM 프로바이더 | **확정.** 공유 번호 #26. `gemini-3.6-flash`, 타임아웃 20초 |
>
> 미결정의 정본 목록은 `AGENTS.md` 미결정 절 하나뿐이다.

## 시스템 프롬프트 정본

**`ai/system_prompt.txt`** 가 프롬프트 원문의 단일 정본이다.

- 테스트 스크립트(`ai/run_tests.mjs`)가 이 파일을 읽어 사용한다
- 당일 route.js 구현 시에도 이 파일 내용을 그대로 상수로 옮긴다
- 프롬프트를 수정할 때는 이 파일만 고치고 `node ai/run_tests.mjs`로 12케이스 회귀 확인

프롬프트 구성: 비환각 절대 규칙 5개 → 작업 순서 **5단계**(판정 → 카드 추출 → **정보 요소 충족도** → 관계 판정 → 후속 질문) → 출력 JSON 형식 → few-shot 예시 2개(유효+similar / 무효).

**v0.3 변경 2건** (2026-08-12)

| 변경 | 이유 |
|---|---|
| `elementCheck` 출력 추가 (3단계 신설) | 기획서 18-확정 15와 시연 8단계의 O/X 화면이 이 값을 요구한다. 모델은 이미 부족 요소를 판단해 후속 질문을 만들고 있었으므로 중간 판단을 꺼낸 것이다 |
| `relation` 값 `same` → `similar` | ERD `relation_type`이 `similar`다. AGENTS.md ENUM 규칙이 개명을 금지한다 |

`test_utterances.json`의 기대값도 `similar:card_010`으로 함께 바꿨다. **재실행이 필요하다.**

## 사용자 메시지 템플릿

요청마다 아래 형식으로 조립한다. 기존 카드는 FE의 store가 동일 장소의 published 카드만 추려 보낸다
(서버리스는 무상태이므로 서버가 카드를 기억하지 않는다). 기존 카드는 최대 20건으로 자른다.

```text
[질문]
{인터뷰 질문 텍스트}

[장소 맥락]
장소: {placeName} ({category})
관련 센터: {centerName}

[기존 카드 주장 목록] (동일 장소, 다른 기사)
1. ({cardId}) {title} — {reason}
(없으면 "없음")

[이번 인터뷰에서 이미 생성된 카드]
1. ({cardId}) {title} — {reason}
(없으면 "없음")

[기사 답변 STT]
"{sttText}"
```

## 테스트 실행법

```text
1. Google AI Studio에서 API 키 발급 (무료 티어, 결제 등록 불필요)
2. PowerShell에서:  $env:GEMINI_API_KEY = "발급받은키"
3. move-ai 폴더에서:  node ai/run_tests.mjs
4. 결과는 콘솔 + ai/results/ 폴더에 JSON으로 저장
```

- 일부 케이스만: `$env:CASE_IDS = "t01,t07,t10"` 설정 후 실행
- 모델 변경: `$env:GEMINI_MODEL = "모델명"` (기본 gemini-3.6-flash — 2.5 세대는 신규 키에서 사용 불가)
- 키는 환경변수로만. 어떤 파일에도 커밋 금지 (AGENTS.md)

## 호출 파라미터·후처리 메모

- temperature 0 (판정 일관성), responseMimeType은 application/json으로 강제
- 무료 티어 분당 요청 제한이 있어 스크립트는 호출 사이에 대기(기본 5초)를 둔다. 429 응답 시 자동 재시도
- 서버 코드에서 모순 검증 가능: verdict가 valid인데 cards가 빈 배열이면 응답 자체가 모순 → 재시도/폴백
- JSON 파싱 실패 시 1회 재시도, 재실패 시 캐시 폴백 (AGENTS.md 규칙).
  캐시 폴백에는 시연 시나리오와 짝이 맞는 응답(t01 기대 출력)을 포함해 데모가 멈추지 않게 한다
- 보상 계산은 프롬프트가 아니라 store 책임: verdict=valid이고 게시 완료된 첫 기여 +100P,
  이후 별도 카드(relation이 duplicate가 아닌 것)의 확인·게시 시 +10P/건 (인터뷰당 +50P 상한)
- relation=duplicate 카드는 생성·보상 없이 "이미 말씀해주신 내용이에요" 안내에만 사용
- relation=conflict 카드는 정상 게시하되 관리자 검토 신호로 표시 (자동 삭제·병합 금지)
- **placeName은 저장에 쓰지 않는다.** store가 요청에 실어 보낸 place.id를 붙이고,
  category가 center_tip이면 place_id를 null로 둔다. AI가 시드에 없는 장소명을 만들 수 있기 때문이다
  (t07이 category=gas인데 placeName에 센터명을 반환한 사례. 공유 미정 #27 해소)
- 타임아웃 20초. 골든 테스트 최대 지연 15.9초(t03)보다 여유를 둔 값이다
