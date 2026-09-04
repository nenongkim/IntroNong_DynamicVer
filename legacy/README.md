# IntroNong — Yewon Kim Interactive Portfolio

"돌고래 한 마리가 바다를 헤엄치며 김예원을 소개하는" 스크롤 기반 · 커서 반응형 싱글 페이지 포트폴리오.

## 실행

빌드 스텝 없음. 정적 서버로 열면 됩니다.

```bash
npx serve .          # 또는 python -m http.server 8080
```

## 구조

```
index.html        마크업 (sticky stage + 5 scenes + 섬 패널)
styles.css        디자인 토큰 · 레이아웃 · CSS 변수 기반 애니메이션
script.js         스크롤 엔진 · 커서 반응 · Canvas FX · 섬 패널/슬라이더
data/content.js   모든 텍스트 콘텐츠 (CV 단일 소스) — 문구 수정은 여기서
assets/           SVG/PDF 에셋 (현재 플레이스홀더, README 참고)
```

## 동작 원리

- `section.cinema` (height = 100vh + 4000px) 안의 `div.stage` 가 sticky로 고정되고, 스크롤 거리 `s`(0~4000)만 바뀝니다.
- JS는 매 프레임 `s`를 `lerp(0.14)`로 스무딩하고, 씬별 `smoothstep` 구간으로 활성도를 계산해 `:root` CSS 변수(`--s1`~`--s5`, `--dolphin-*`, `--mx/--my`, `--bg`)만 갱신합니다. 실제 transform/opacity는 CSS가 변수를 읽어 그립니다.
- 커서는 `pointermove` → `lerp(0.12)` → `--mx/--my`(-0.5~0.5). 레이어마다 다른 계수로 패럴랙스.
- 기포·빛줄기는 Canvas 2D (`#fx`), DPR 상한 2, 탭 비활성 시 rAF 중단.
- 외부 JS 라이브러리 없음. 섬 클릭 시 돌고래 이동(0.8s)과 패널 열림/닫힘 같은 이산 트윈도 같은 rAF 루프와 CSS 애니메이션으로 처리합니다. (기획서의 GSAP은 필요해지면 도입)

## 개발용 URL 파라미터

| 파라미터 | 예 | 설명 |
|---|---|---|
| `?s=N` | `?s=2200` | 스크롤과 무관하게 진행도를 N(0~4000)에 고정. 씬 구간·계수 튜닝용 |
| `&open=I` | `?s=2200&open=0` | 섬 I(0·1·2)의 패널을 자동으로 연다 |

## 씬 구간 (s)

| Scene | 구간 | 내용 |
|---|---|---|
| 1 Opening | 0 – 700 | 이름 · 태그라인 · 커서 추종 돌고래 |
| 2 Education | 700 – 1500 | 건물 실루엣(창문 점등) · 학력/연구 카드 |
| 3 Experience | 1500 – 2900 | 섬 3개 클릭 → 패널 → 카드 슬라이더 |
| 4 Vision | 2900 – 3600 | What I want to do |
| 5 Ending | 3600 – 4000 | Where to next? · 연락처 · CV |

## 남은 결정 사항 (기획서 §7)

- [ ] Scene 3 섬 구성 확정 (현재: Awards / Projects / Activities)
- [ ] 기본 언어 (현재: 한국어 UI + 영문 CV 콘텐츠)
- [ ] Vision 3문장 최종 문구
- [ ] 이름 표기 (현재: 히어로는 `Yewon Kim`만)
- [ ] 최종 에셋 교체 (`assets/README.md`)
