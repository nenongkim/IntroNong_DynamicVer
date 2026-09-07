# IntroNong — Yewon Kim Interactive Portfolio

김예원 인터랙티브 포트폴리오. v0.2부터 **Vite + React + TypeScript + Tailwind CSS** 스택으로 재구성했습니다.

## 실행

```bash
npm install
npm run dev        # http://127.0.0.1:5173 (포트가 겹치면 --port 5180)
npm run build      # dist/ 생성 (타입체크 포함)
npm run preview    # 빌드 결과 미리보기
```

## 구조

```
index.html              Vite 엔트리
src/main.tsx            React 마운트
src/App.tsx             풀스크린 히어로 (영상 부메랑 배경 · 리퀴드 글래스 네비 · 패럴랙스)
src/index.css           폰트 import · Tailwind · liquid-glass / hero-title 스타일
src/data/content.ts     모든 텍스트 콘텐츠 (CV 단일 소스) — 문구 수정은 여기서
tailwind.config.js      heading/body/dirtyline 폰트, rounded 기본값 = 9999px(pill)
legacy/                 v0.1 바닐라 버전 (돌고래 스크롤 씬 5개). 참고용, 빌드에 포함되지 않음
```

## 히어로 (App.tsx) — v0.4 "수면 아래" 에디토리얼

퀄리티 기준: motionsites.ai 의 Aethera 히어로 (시네마틱 풍경 + 에디토리얼 세리프 + 절제된 UI). 구조가 아니라 완성도를 참고했고, 컨셉은 바다 + 돌고래를 유지한다.

- **배경 — LivingWater (WebGL)**: 사용자가 제작한 정지 이미지 4장(`public/assets/scenes/scene-1~4.jpg`, 모바일용 `-sm`)을 프래그먼트 셰이더로 "살아 있는 바닷속"처럼 렌더링한다.
  - 물결 굴절(다층 sin + value noise), 수면 쪽 코스틱 반짝임, 느리게 흔들리는 빛줄기, 비네트
  - **다이브 인**: 로드 후 카메라가 점근적으로 밀고 들어가며(zoom 1→1.11) 가라앉고(drift), 스크롤하면 더 깊이 들어간다. 텍스트는 반대로 가라앉으며 사라진다.
  - **섹션별 장면**: 스크롤로 현재 섹션을 감지해 배경을 자동 전환 (`content.ts` 의 `sectionScenes`: 히어로·Profile → Shallows, Experience → Lagoon, Vision → Coral Reef, Contact → Deep Blue). 전환은 노이즈 변위 디졸브 1.6s.
  - **가독성**: 히어로를 벗어나면 셰이더 `uDim` 이 1 로 올라가 배경을 어둡고 채도 낮은 딥오션 톤으로 바꾼다(움직임은 유지). 본문 레이어에 `ocean-800/30` 틴트, 섹션 제목에 그림자.
  - **텍스트는 고정**: 레퍼런스(ai-workflow-agents)처럼 글자에는 패럴랙스·침강이 없고 배경만 움직인다. 등장 애니메이션은 최초 1회.
  - DPR 상한 1.5, 탭 비활성 시 정지. reduced-motion 이면 정지 이미지 + 전환만.
  - 장면 추가/교체: `content.ts` 의 `scenes` 배열과 `public/assets/scenes/` 만 수정.
- **수면 안개**: 상단 0→68% 구간에 sky-50 그라데이션(`.surface-mist`)을 올려 "수면 근처가 가장 밝다"는 기획 의도를 살리고, 텍스트를 딥블루(sky-800)로 올린다.
- **타이포**: 헤드라인 Instrument Serif(에디토리얼), `*강조*` 단어는 이탤릭 + sky-400. UI/아이브로우 Inter, 한글 Pretendard. `content.ts`의 `hero.headline` 에서 별표로 강조 단어를 지정한다.
- **등장 시퀀스 (gsap)**: 배경 14초 느린 줌 → 네비 → 헤드라인 단어별 마스크 슬라이드업(stagger 0.055) → 아이브로우/태그라인/CTA 순차 페이드업 → 스크롤 힌트.
- **패럴랙스**: 배경 ±18px, 텍스트는 반대 방향 ±7px (시차 강조). 전경 기포 캔버스는 커서 반대 방향으로 흐른다.
- **필름 그레인**: SVG feTurbulence 노이즈, soft-light 35%.
- **리퀴드 글래스**: `.liquid-glass` 는 이후 섹션(카드·패널)용으로 CSS에 유지.

## 남은 작업

- [ ] 배경 영상을 바다/돌고래 톤으로 교체 (`VIDEO_SRC` 한 줄)
- [ ] Profile / Experience / Vision / Contact 섹션을 새 스택으로 이식 (`legacy/` 참고)
- [ ] `public/assets/cv.pdf` 추가 (현재 CV 버튼은 404)
- [ ] 호스팅 결정 (GitHub Pages: public 필요 / Cloudflare Pages·Netlify: private 가능)
