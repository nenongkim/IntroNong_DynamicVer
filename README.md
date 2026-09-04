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

- **배경 영상**: Pexels 5277928 (돌고래 두 마리가 수면으로 올라가는 장면, 1080p, CORS 허용). 9초 지점부터 6초(180프레임, 720px)를 캡처해 30fps 부메랑으로 왕복 재생. 모바일/저사양/reduced-motion 에서는 캡처 없이 `<video loop>` + 9초 시점 루프.
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
