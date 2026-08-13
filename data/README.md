# data/ — 시연용 시드 데이터

**전량 시연용 Mock이다.** 실제 화물센터 운영 데이터가 아니다. 센터·장소 이름은 실재하는 지명을 참고했지만 좌표·주소·수치는 전부 시연용 근사값이다. 공공데이터 API를 호출하지 않는다.

## 파일과 대응 엔티티

| 파일 | 엔티티 | 건수 | 성격 |
|---|---|---|---|
| `centers.json` | freight_center | 3 | 화물센터. `visit_count`·요약 3종(`logistics_cost` 원 / `avg_stay_minutes` 분 / `handled_items` 쉼표 구분)은 트럭커 연동을 전제한 **Mock** — 화면에 Mock 배지를 붙인다 |
| `places.json` | place | 7 | 센터 주변 장소. `category`는 gas / food / rest만 (center_tip은 장소에 쓰지 않는다) |
| `drivers.json` | driver | 3 | 기사. `repeat_visit`은 인터뷰 후보의 근거가 되는 **Mock 운행 데이터** |
| `cards.json` | knowledge_card | 13 | 지식 카드 (published 12 + review 1). 전부 10P 잠금 — 무료 카드 없음 |

- 명명: `snake_case` 단수형. camelCase 변환은 `lib/dataSource.js`가 한 번만 한다
- 날짜: ISO8601 +09:00 / 빈 값: 빈 문자열 `""` / 없는 관계: `null`
- `place_id: null`이면 화물센터 자체에 대한 카드 (`category: center_tip`)

## 시연 20단계 ↔ 시드 매핑

| 시연 단계 | 시드 |
|---|---|
| 시연 주인공 | `driver_001` 김영수 (56세, 경력 3년, 수도권) |
| 2. 도착지 입력 | `center_002` 군포 복합물류센터 |
| 3. 도착지 브리핑 | `center_002` 카드 4장. **휴게소·쉼터 0건은 의도된 빈 상태 시연** |
| 4. 해금 체험 | `card_011` |
| 8. 운행 중 조회 1차 위치 | `place_007` (다른 센터 소속 — 0건 → 위치 이동 후 갱신 시연) |
| 9. 인터뷰 후보 | `driver_001`의 `place_005` 반복 방문 9회 |
| 15. 유사도 판정 대상 | `card_010` (`cross_check_count` 0 → 1이 되는 장면을 보여준다) |
| 18. 순환 해금 | `card_012` |
| 19~20. 관리자 검토 | `card_006` (review 상태, 도움 안 됐어요 37건) / 교차 검증 예시 `card_003` (4명 확인) |

## 바꾸면 안 되는 것

- **id 전부** — 시연 대본과 AI 폴백 응답이 id를 직접 참조한다
- `card_010`의 `cross_check_count: 0` (시연 15단계에서 올라가는 값)
- `driver_001`의 `point_balance: 0` (시연 1단계에서 가입 +100P를 store가 지급한다)
