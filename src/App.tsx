import { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import Bubbles from './components/Bubbles';
import { hero, navLinks, profile } from './data/content';

/* ---------- constants ---------- */
// Pexels (무료, CORS 허용) · 돌고래 두 마리가 수면을 향해 올라가는 장면. 1080p 30fps, 17s
const VIDEO_SRC = 'https://videos.pexels.com/video-files/5277928/5277928-hd_1920_1080_30fps.mp4';
const VIDEO_SRC_SMALL = 'https://videos.pexels.com/video-files/5277928/5277928-hd_1280_720_30fps.mp4'; // 4MB, 모바일/저사양
const VIDEO_START = 9;   // 이 시점부터 캡처 (돌고래가 가까이 오는 구간)
const MAX_WIDTH = 720;   // 캡처 프레임 가로 상한 (메모리)
const MAX_FRAMES = 180;  // 30fps × 6s. 넘으면 캡처를 멈추고 부메랑 시작

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

/* headline 문자열 → 단어 토큰 (*강조*). 강조 뒤에 바로 붙는 구두점은 같은 토큰의 suffix 로 */
type Token = { word: string; em: boolean; suffix: string };
function tokenize(src: string): Token[] {
  const out: Token[] = [];
  let em = false;
  for (const chunk of src.split('*')) {
    const words = chunk.split(' ');
    words.forEach((w, i) => {
      if (!w) return;
      // 이전 청크가 강조였고, 이 청크가 공백 없이 구두점으로 시작하면 이어 붙인다
      if (i === 0 && !em && out.length && /^[,.!?;:]+$/.test(w) && !chunk.startsWith(' ')) {
        out[out.length - 1].suffix += w;
        return;
      }
      out.push({ word: w, em, suffix: '' });
    });
    em = !em;
  }
  return out;
}

export default function App() {
  const [framesReady, setFramesReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const videoBgRef = useRef<HTMLDivElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<HTMLCanvasElement[]>([]);
  const heroRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);

  const tokens = useMemo(() => tokenize(hero.headline), []);

  /* ---------- Effect 1 — Frame capture (boomerang setup) ---------- */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // 시작 지점 이동 (네이티브 루프 모드에서도 적용)
    const seek = () => {
      if (video.currentTime < VIDEO_START - 0.2) video.currentTime = VIDEO_START;
    };

    if (LOW_POWER || REDUCED) {
      const onLoop = () => { if (video.currentTime < VIDEO_START - 0.2) video.currentTime = VIDEO_START; };
      video.addEventListener('loadedmetadata', seek);
      video.addEventListener('timeupdate', onLoop);
      if (video.readyState >= 1) seek();
      return () => {
        video.removeEventListener('loadedmetadata', seek);
        video.removeEventListener('timeupdate', onLoop);
      };
    }

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
      if (video.currentTime < VIDEO_START - 0.05) return;
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
      seek();
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

  /* ---------- Effect 3 — 등장 시퀀스 (gsap) ---------- */
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const words = hero.querySelectorAll<HTMLElement>('.hl-word');
    const rest = hero.querySelectorAll<HTMLElement>('[data-reveal]');

    if (REDUCED) {
      // 애니메이션 없이 즉시 표시 (컨테이너의 opacity-0 클래스를 인라인으로 덮어쓴다)
      gsap.set([hero, navRef.current, hintRef.current, rest], { autoAlpha: 1, y: 0 });
      gsap.set(words, { yPercent: 0, rotate: 0 });
      return;
    }

    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.set(hero, { autoAlpha: 1 })
      // 배경 느린 줌 (Ken Burns)
      .fromTo(videoBgRef.current, { scale: 1.16 }, { scale: 1.06, duration: 14, ease: 'power1.out' }, 0)
      .fromTo(navRef.current, { y: -12, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.2 }, 0.2)
      .fromTo(words, { yPercent: 110, rotate: 2 }, { yPercent: 0, rotate: 0, duration: 1.3, stagger: 0.055 }, 0.35)
      .fromTo(rest, { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.1, stagger: 0.14 }, 0.9)
      .fromTo(hintRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 1 }, 1.8);

    return () => { tl.kill(); };
  }, []);

  /* ---------- Effect 4 — 마우스 패럴랙스 (배경 · 텍스트 반대 방향) ---------- */
  useEffect(() => {
    if (REDUCED) return;
    const BG = 18;
    const TEXT = -7;
    let tx = 0, ty = 0, bx = 0, by = 0, raf = 0;

    const onMove = (e: MouseEvent) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    const tick = () => {
      bx += (tx * BG - bx) * 0.05;
      by += (ty * BG - by) * 0.05;
      if (videoBgRef.current) gsap.set(videoBgRef.current, { x: bx, y: by });
      if (heroRef.current) gsap.set(heroRef.current, { x: bx * (TEXT / BG), y: by * (TEXT / BG) });
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener('mousemove', onMove);
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="min-h-screen bg-ocean-800 text-ocean-800 font-body overflow-x-hidden">
      {/* 1. 원경 — 바닷속 영상 (부메랑) */}
      <div ref={videoBgRef} className="fixed top-0 left-0 w-full h-full z-0 origin-center will-change-transform">
        <video
          ref={videoRef}
          src={LOW_POWER ? VIDEO_SRC_SMALL : VIDEO_SRC}
          muted
          playsInline
          autoPlay
          loop={LOW_POWER || REDUCED}
          preload="auto"
          crossOrigin="anonymous"
          className="w-full h-full object-cover"
          style={{ display: framesReady ? 'none' : 'block' }}
        />
        <canvas
          ref={displayCanvasRef}
          className="w-full h-full object-cover"
          style={{ display: framesReady ? 'block' : 'none' }}
        />
      </div>
      {/* 수면 안개 + 그레인 */}
      <div className="surface-mist fixed inset-0 z-[1] pointer-events-none" />
      <div className="grain fixed inset-0 z-[2] pointer-events-none" aria-hidden="true" />

      {/* 전경 — 기포 (하단 위주, 은은하게) */}
      <Bubbles reduced={REDUCED} intensity={0.55} />

      {/* 2. Nav — 상단이 밝으므로 글래스 없이 딥블루 텍스트 */}
      <nav
        ref={navRef}
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 py-6 opacity-0"
      >
        <a href="#top" className="flex items-center gap-2.5 text-ocean-800" aria-label="Yewon Kim">
          <DolphinMark className="w-9 h-[18px]" />
          <span className="font-heading text-[15px] font-semibold tracking-tight">Yewon Kim</span>
        </a>
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((label) => (
            <a
              key={label}
              href={`#${label.toLowerCase()}`}
              className="font-heading text-[13px] font-medium text-ocean-800/60 hover:text-ocean-800 transition-colors duration-200"
            >
              {label}
            </a>
          ))}
        </div>
        <a
          href={profile.cv_pdf}
          download
          className="bg-ocean-800 text-ocean-50 font-heading text-[13px] font-medium rounded px-4 py-2 transition-all duration-200 hover:scale-[1.03] hover:shadow-[0_8px_24px_-8px_rgba(12,68,124,0.6)] active:scale-[0.97]"
        >
          Download CV
        </a>
      </nav>

      {/* 3. Hero copy — 상단 여백에 에디토리얼 배치 */}
      <div
        ref={heroRef}
        className="fixed left-0 right-0 z-20 px-6 md:px-10 opacity-0"
        style={{ top: 'clamp(112px, 17vh, 176px)' }}
      >
        <div className="mx-auto max-w-[1180px] text-center">
          <p
            data-reveal
            className="font-heading text-[11px] md:text-xs font-medium tracking-[0.18em] uppercase text-ocean-800/60"
          >
            <span className="hidden md:inline">{hero.eyebrow}</span>
            <span className="md:hidden">{hero.eyebrowShort}</span>
          </p>

          <h1 className="hero-headline mt-4 md:mt-6 mx-auto max-w-[16ch]">
            {tokens.map((t, i) => (
              <span key={i}>
                <span className="hl-mask">
                  <span className="hl-word">
                    {t.em ? <em>{t.word}</em> : t.word}
                    {t.suffix}
                  </span>
                </span>
                {i < tokens.length - 1 ? ' ' : ''}
              </span>
            ))}
          </h1>

          <p
            data-reveal
            className="mt-5 md:mt-6 mx-auto max-w-[560px] text-[15px] md:text-base leading-relaxed text-ocean-800/75 break-keep"
          >
            {hero.tagline}
          </p>

          <div data-reveal className="mt-7 md:mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
            <a
              href="#profile"
              className="group inline-flex items-center gap-2 bg-lime text-ocean-800 font-heading text-sm font-semibold rounded px-6 py-3 transition-all duration-200 hover:scale-[1.03] hover:shadow-[0_10px_30px_-8px_rgba(12,68,124,0.45)] active:scale-[0.97]"
            >
              {hero.primaryCta}
              <ArrowDown size={14} strokeWidth={2.2} className="transition-transform duration-300 group-hover:translate-y-0.5" />
            </a>
            <a
              href={profile.cv_pdf}
              download
              className="group inline-flex items-center gap-1.5 font-heading text-sm font-medium text-ocean-800 bg-white/55 backdrop-blur-md rounded px-5 py-3 transition-all duration-200 hover:bg-white/75 hover:scale-[1.03] active:scale-[0.97]"
            >
              {hero.secondaryCta}
              <ArrowUpRight size={14} strokeWidth={2} className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Scroll hint */}
      <div
        ref={hintRef}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 font-heading text-[11px] tracking-[0.16em] uppercase text-ocean-50/70 opacity-0"
        aria-hidden="true"
      >
        {hero.scrollHint}
        <ArrowDown size={12} className="hint-bounce" />
      </div>
    </div>
  );
}
