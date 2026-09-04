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

## 히어로 동작 (App.tsx)

- **영상 부메랑**: `<video>`를 한 번 재생하면서 매 프레임을 오프스크린 캔버스(최대 960px)로 캡처 → 재생이 끝나면 캔버스 배열을 30fps로 정방향·역방향 왕복 렌더. `video.currentTime`은 쓰지 않는다.
- **패럴랙스**: `mousemove` → target(±20px) → 매 프레임 `lerp 0.06` → `gsap.set(x, y)` 로 배경 레이어 이동.
- **리퀴드 글래스**: `.liquid-glass` / `.liquid-glass-strong` (backdrop-filter + 마스크 그라데이션 테두리).

## 남은 작업

- [ ] 배경 영상을 바다/돌고래 톤으로 교체 (`VIDEO_SRC` 한 줄)
- [ ] Profile / Experience / Vision / Contact 섹션을 새 스택으로 이식 (`legacy/` 참고)
- [ ] `public/assets/cv.pdf` 추가 (현재 CV 버튼은 404)
- [ ] 호스팅 결정 (GitHub Pages: public 필요 / Cloudflare Pages·Netlify: private 가능)
