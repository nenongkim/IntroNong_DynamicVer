import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ArrowDown, Download } from 'lucide-react';
import Bubbles from './components/Bubbles';
import { hero, navLinks, profile } from './data/content';

/* ---------- constants ---------- */
const NAV_LINKS = navLinks;
// Pexels (무료, CORS 허용): 빛줄기가 비치는 푸른 물속, 떠오르는 기포. 1080p 24fps
const VIDEO_SRC = 'https://videos.pexels.com/video-files/2632737/2632737-hd_1920_1080_24fps.mp4';
const MAX_WIDTH = 720;   // 캡처 프레임 가로 상한 (메모리)
const MAX_FRAMES = 144;  // 24fps × 6s. 넘으면 캡처를 멈추고 부메랑 시작

const REDUCED =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// 저사양/모바일: 프레임 캡처 대신 네이티브 루프
const LOW_POWER =
  typeof window !== 'undefined' &&
  (window.matchMedia('(max-width: 767px)').matches ||
    ((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8) < 4);

/* ---------- Dolphin mark (nav logo) ---------- */
function DolphinMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 100" className={className} aria-hidden="true" fill="currentColor">
      <path d="M8 56 C20 40 45 30 80 32 C95 33 105 22 112 18 C118 26 116 34 110 38 C130 40 150 44 168 50 C172 44 178 36 190 34 C186 44 184 50 180 56 C186 60 190 68 192 74 C180 70 172 64 166 60 C150 66 120 72 96 70 C84 76 78 88 66 86 C70 80 74 74 78 70 C50 70 25 66 8 56 Z" />
    </svg>
  );
}

export default function App() {
  const [mounted, setMounted] = useState(false);
  const [framesReady, setFramesReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const videoBgRef = useRef<HTMLDivElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<HTMLCanvasElement[]>([]);
  const dolphinRef = useRef<HTMLDivElement>(null);
  const dolphinInnerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);

  /* fade-in */
  useEffect(() => {
    setMounted(true);
  }, []);

  /* ---------- Effect 1 — Frame capture (boomerang setup) ---------- */
  useEffect(() => {
    const video = videoRef.current;
    if (!video || LOW_POWER || REDUCED) return; // 저사양: <video loop> 그대로 사용

    let capturing = true;
    let lastTime = -1;
    let rafId = 0;
    let vfcId = 0;
    const frames: HTMLCanvasElement[] = [];

    type VFCVideo = HTMLVideoElement & {
      requestVideoFrameCallback: (cb: () => void) => number;
      cancelVideoFrameCallback: (id: number) => void;
    };
    const hasVFC = 'requestVideoFrameCallback' in HTMLVideoElement.prototype;

    const finish = () => {
      if (!capturing) return;
      capturing = false;
      video.pause();
      framesRef.current = frames;
      setFramesReady(true);
    };

    const captureFrame = () => {
      if (!capturing) return;
      if (video.readyState < 2 || video.currentTime === lastTime) return;
      lastTime = video.currentTime;
      const scale = Math.min(1, MAX_WIDTH / video.videoWidth);
      const w = Math.round(video.videoWidth * scale);
      const h = Math.round(video.videoHeight * scale);
      if (!w || !h) return;
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, w, h);
      frames.push(c);
      if (frames.length >= MAX_FRAMES) finish();
    };

    const loop = () => {
      if (!capturing) return;
      captureFrame();
      if (!capturing) return;
      if (hasVFC) vfcId = (video as VFCVideo).requestVideoFrameCallback(loop);
      else rafId = requestAnimationFrame(loop);
    };

    const onLoaded = () => {
      video.play().catch(() => {});
      loop();
    };
    const onEnded = () => finish();

    video.addEventListener('loadedmetadata', onLoaded);
    video.addEventListener('ended', onEnded);
    if (video.readyState >= 1) onLoaded();

    return () => {
      capturing = false;
      cancelAnimationFrame(rafId);
      if (hasVFC && vfcId) (video as VFCVideo).cancelVideoFrameCallback(vfcId);
      video.removeEventListener('loadedmetadata', onLoaded);
      video.removeEventListener('ended', onEnded);
    };
  }, []);

  /* ---------- Effect 2 — Boomerang render ---------- */
  useEffect(() => {
    if (!framesReady) return;
    const canvas = displayCanvasRef.current;
    const frames = framesRef.current;
    if (!canvas || frames.length === 0) return;

    canvas.width = frames[0].width;
    canvas.height = frames[0].height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let index = 0;
    let direction = 1;
    let last = performance.now();
    const interval = 1000 / 30;
    let rafId = 0;

    const render = (now: number) => {
      if (now - last >= interval) {
        last = now;
        ctx.drawImage(frames[index], 0, 0);
        index += direction;
        if (index >= frames.length - 1) {
          index = frames.length - 1;
          direction = -1;
        } else if (index <= 0) {
          index = 0;
          direction = 1;
        }
      }
      rafId = requestAnimationFrame(render);
    };
    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [framesReady]);

  /* ---------- Effect 3 — 레이어별 패럴랙스 + 돌고래 커서 추종 (gsap) ---------- */
  useEffect(() => {
    if (REDUCED) return;

    // 원경(영상) < 중경(타이틀) < 근경(돌고래) 순으로 이동량 증가 → 깊이감
    const BG_STRENGTH = 14;
    const TITLE_STRENGTH = -6;   // 반대 방향으로 살짝 → 시차 강조
    const DOLPHIN_FOLLOW = 0.06; // 지연 추종 계수 (기획서 §4)

    let targetX = 0;
    let targetY = 0;
    let bgX = 0;
    let bgY = 0;
    let dX = 0;
    let dY = 0;
    let tilt = 0;
    let rafId = 0;

    const onMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      targetX = (e.clientX - cx) / cx; // -1 ~ 1
      targetY = (e.clientY - cy) / cy;
    };

    const tick = () => {
      bgX += (targetX * BG_STRENGTH - bgX) * 0.06;
      bgY += (targetY * BG_STRENGTH - bgY) * 0.06;
      if (videoBgRef.current) gsap.set(videoBgRef.current, { x: bgX, y: bgY });
      if (titleRef.current)
        gsap.set(titleRef.current, { x: bgX * (TITLE_STRENGTH / BG_STRENGTH), y: bgY * (TITLE_STRENGTH / BG_STRENGTH) });

      // 돌고래: 최대 ±6vw / ±3vh, 이동 방향에 따라 ±6deg 기울기
      const maxX = window.innerWidth * 0.06;
      const maxY = window.innerHeight * 0.03;
      const prev = dX;
      dX += (targetX * maxX - dX) * DOLPHIN_FOLLOW;
      dY += (targetY * maxY - dY) * DOLPHIN_FOLLOW;
      const vel = dX - prev;
      tilt += (Math.max(-6, Math.min(6, vel * 1.6)) - tilt) * 0.1;
      // xPercent: gsap이 transform을 통째로 덮어쓰므로 중앙 정렬(-50%)을 여기서 함께 지정
      if (dolphinRef.current) gsap.set(dolphinRef.current, { x: dX, y: dY, rotation: tilt, xPercent: -50 });

      rafId = requestAnimationFrame(tick);
    };

    // 유영 느낌: 상하 미세 바운스
    const bob = dolphinInnerRef.current
      ? gsap.to(dolphinInnerRef.current, { y: -12, duration: 2.6, yoyo: true, repeat: -1, ease: 'sine.inOut' })
      : null;

    window.addEventListener('mousemove', onMove);
    rafId = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(rafId);
      bob?.kill();
    };
  }, []);

  const fadeIn = mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6';
  const showCanvas = framesReady;

  return (
    <div className="min-h-screen bg-ocean-800 text-ocean-50 font-body overflow-x-hidden">
      {/* 1. 원경 — 바닷속 영상 (부메랑) */}
      <div ref={videoBgRef} className="fixed top-0 left-0 w-full h-full z-0 scale-[1.08] origin-center">
        <video
          ref={videoRef}
          src={VIDEO_SRC}
          muted
          playsInline
          autoPlay
          loop={LOW_POWER || REDUCED}
          preload="auto"
          crossOrigin="anonymous"
          className="w-full h-full object-cover"
          style={{ display: showCanvas ? 'none' : 'block' }}
        />
        <canvas
          ref={displayCanvasRef}
          className="w-full h-full object-cover"
          style={{ display: showCanvas ? 'block' : 'none' }}
        />
      </div>
      {/* 가독성 스크림: 위·아래만 살짝 어둡게 (팔레트 sky-800) */}
      <div className="fixed inset-0 z-[1] pointer-events-none bg-gradient-to-b from-ocean-800/40 via-transparent to-ocean-800/70" />

      {/* 2. 중경 — 타이틀 */}
      <div
        ref={titleRef}
        className={`fixed left-0 right-0 z-20 w-full px-4 transition-all duration-1000 ${fadeIn}`}
        style={{ top: 'clamp(96px, 16vh, 160px)' }}
      >
        <h1 className="hero-title select-none">{hero.title}</h1>
        <p className="mt-5 text-center font-heading text-[13px] md:text-sm font-medium tracking-[0.08em] uppercase text-ocean-50/70">
          {profile.subtitle}
        </p>
      </div>

      {/* 3. 근경 — 돌고래 (커서 지연 추종) */}
      <div
        ref={dolphinRef}
        className={`fixed left-1/2 z-[4] -translate-x-1/2 pointer-events-none transition-opacity duration-1000 delay-200 ${mounted ? 'opacity-100' : 'opacity-0'}`}
        /* -translate-x-1/2 는 gsap 초기화 전 첫 페인트용. 이후엔 gsap xPercent 가 담당 */
        style={{ top: '54%', width: 'clamp(200px, 26vw, 400px)' }}
      >
        <div ref={dolphinInnerRef} className="dolphin-layer">
          <img src="assets/dolphin-side.svg" alt="" draggable={false} className="w-full h-auto" />
        </div>
      </div>

      {/* 전경 — 기포 */}
      <Bubbles reduced={REDUCED} />

      {/* 4. Nav (liquid glass) */}
      <nav className="fixed top-5 left-1/2 -translate-x-1/2 z-50 whitespace-nowrap">
        <div className="liquid-glass flex items-center gap-6 rounded px-4 py-2.5">
          <a href="#top" className="flex items-center gap-2 text-ocean-50" aria-label="Yewon Kim">
            <DolphinMark className="w-9 h-[18px]" />
            <span className="font-heading text-sm font-semibold tracking-tight hidden sm:inline">Yewon Kim</span>
          </a>
          <div className="flex items-center gap-5">
            {NAV_LINKS.map((label) => (
              <a
                key={label}
                href={`#${label.toLowerCase()}`}
                className="font-heading text-sm font-normal text-ocean-50/70 hover:text-ocean-50 transition-colors duration-200"
              >
                {label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-3 ml-4">
            <a
              href={`mailto:${profile.email}`}
              className="font-heading text-sm font-normal text-ocean-50/70 hover:text-ocean-50 transition-colors duration-200"
            >
              Email
            </a>
            <a
              href={profile.cv_pdf}
              download
              className="liquid-glass-strong font-heading text-sm font-medium text-ocean-50 rounded px-4 py-1.5 transition-all duration-200 hover:scale-[1.04] hover:shadow-[0_0_16px_2px_rgba(255,255,255,0.12)] active:scale-[0.97]"
            >
              CV
            </a>
          </div>
        </div>
      </nav>

      {/* 5. Bottom row */}
      <div
        className={`fixed bottom-12 left-0 right-0 px-6 md:px-10 flex items-end justify-between z-20 transition-all duration-1000 delay-300 ${fadeIn}`}
      >
        <p className="text-sm font-body font-normal text-ocean-50/80 max-w-[260px] leading-relaxed break-keep">
          {hero.left}
        </p>

        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 flex items-center gap-3">
          <a
            href="#profile"
            className="group relative bg-lime text-ocean-800 text-sm font-heading font-semibold rounded px-6 py-3 overflow-hidden active:scale-[0.97] transition-all duration-200 shadow-[0_0_0_0_rgba(232,249,122,0)] hover:shadow-[0_0_24px_4px_rgba(232,249,122,0.3)] hover:scale-[1.03] inline-flex items-center gap-2"
          >
            <span className="relative z-10 inline-flex items-center gap-2">
              {hero.primaryCta}
              <ArrowDown size={14} strokeWidth={2.2} />
            </span>
            <span className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </a>
          <a
            href={profile.cv_pdf}
            download
            className="liquid-glass group text-ocean-50 text-sm font-heading font-medium rounded px-6 py-3 active:scale-[0.97] transition-all duration-200 hover:scale-[1.03] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_0_20px_2px_rgba(255,255,255,0.07)] inline-flex items-center gap-2"
          >
            {hero.secondaryCta}
            <Download size={14} strokeWidth={2} />
          </a>
        </div>

        <p className="text-sm font-body font-normal text-ocean-50/80 max-w-[240px] leading-relaxed text-right hidden md:block">
          {hero.right}
        </p>
      </div>

      {/* Scroll hint */}
      <div
        className={`fixed bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 font-heading text-[11px] tracking-[0.16em] uppercase text-ocean-50/50 transition-opacity duration-1000 delay-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}
        aria-hidden="true"
      >
        {hero.scrollHint}
        <ArrowDown size={12} className="hint-bounce" />
      </div>
    </div>
  );
}
