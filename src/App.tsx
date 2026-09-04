import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ArrowDown, Download } from 'lucide-react';
import { hero, navLinks, profile } from './data/content';

/* ---------- constants ---------- */
const NAV_LINKS = navLinks;
// TODO: 최종적으로는 바다/돌고래 영상으로 교체 (같은 방식으로 src만 바꾸면 됨)
const VIDEO_SRC =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260511_080827_a9e5ad52-b6ee-4e79-b393-d936f179cfd7.mp4';

/* ---------- LogoMark ---------- */
function LogoMark() {
  return (
    <svg width="44" height="26" viewBox="0 0 44 26" fill="none" aria-hidden="true">
      <rect x="0" y="3" width="14" height="20" rx="3" fill="white" />
      <rect x="16" y="3" width="12" height="20" rx="3" fill="white" />
      <rect x="30" y="3" width="14" height="20" rx="3" fill="white" />
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

  /* fade-in */
  useEffect(() => {
    setMounted(true);
  }, []);

  /* ---------- Effect 1 — Frame capture (boomerang setup) ---------- */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let capturing = true;
    let lastTime = -1;
    let rafId = 0;
    let vfcId = 0;
    const MAX_WIDTH = 960;
    const frames: HTMLCanvasElement[] = [];

    const hasVFC = 'requestVideoFrameCallback' in HTMLVideoElement.prototype;

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
    };

    const loop = () => {
      if (!capturing) return;
      captureFrame();
      if (hasVFC) {
        vfcId = (video as HTMLVideoElement & {
          requestVideoFrameCallback: (cb: () => void) => number;
        }).requestVideoFrameCallback(loop);
      } else {
        rafId = requestAnimationFrame(loop);
      }
    };

    const onLoaded = () => {
      video.play().catch(() => {});
      loop();
    };

    const onEnded = () => {
      capturing = false;
      framesRef.current = frames;
      setFramesReady(true);
    };

    video.addEventListener('loadedmetadata', onLoaded);
    video.addEventListener('ended', onEnded);
    if (video.readyState >= 1) onLoaded();

    return () => {
      capturing = false;
      cancelAnimationFrame(rafId);
      if (hasVFC && vfcId) {
        (video as HTMLVideoElement & {
          cancelVideoFrameCallback: (id: number) => void;
        }).cancelVideoFrameCallback(vfcId);
      }
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

  /* ---------- Effect 3 — Parallax mouse tracking (gsap) ---------- */
  useEffect(() => {
    const strength = 20;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let rafId = 0;

    const onMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      targetX = ((e.clientX - cx) / cx) * strength;
      targetY = ((e.clientY - cy) / cy) * strength;
    };

    const tick = () => {
      currentX += (targetX - currentX) * 0.06;
      currentY += (targetY - currentY) * 0.06;
      if (videoBgRef.current) {
        gsap.set(videoBgRef.current, { x: currentX, y: currentY });
      }
      rafId = requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', onMove);
    rafId = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  const fadeIn = mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6';

  return (
    <div className="min-h-screen bg-black text-white font-body overflow-x-hidden">
      {/* 1. Video background layer */}
      <div
        ref={videoBgRef}
        className="fixed top-0 left-0 w-full h-full z-0 scale-[1.08] origin-center"
      >
        <video
          ref={videoRef}
          src={VIDEO_SRC}
          muted
          playsInline
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

      {/* 2. Hero title */}
      <div
        className={`fixed left-0 right-0 z-20 w-full px-4 transition-all duration-1000 ${fadeIn}`}
        style={{ top: '126px' }}
      >
        <h1 className="hero-title select-none">{hero.title}</h1>
      </div>

      {/* 3. Nav */}
      <nav className="fixed top-5 left-1/2 -translate-x-1/2 z-50 whitespace-nowrap">
        <div className="liquid-glass flex items-center gap-6 rounded px-4 py-2.5">
          <LogoMark />
          <div className="flex items-center gap-5">
            {NAV_LINKS.map((label) => (
              <a
                key={label}
                href={`#${label.toLowerCase()}`}
                className="text-sm font-body font-light text-white/70 hover:text-white transition-colors duration-200"
              >
                {label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-3 ml-4">
            <a
              href={`mailto:${profile.email}`}
              className="text-sm font-body font-light text-white/70 hover:text-white transition-colors duration-200"
            >
              Email
            </a>
            <a
              href={profile.cv_pdf}
              download
              className="liquid-glass-strong text-sm font-body font-medium text-white rounded px-4 py-1.5 transition-all duration-200 hover:scale-[1.04] hover:shadow-[0_0_16px_2px_rgba(255,255,255,0.12)] active:scale-[0.97]"
            >
              CV
            </a>
          </div>
        </div>
      </nav>

      {/* 4. Bottom row */}
      <div
        className={`fixed bottom-12 left-0 right-0 px-10 flex items-end justify-between z-20 transition-all duration-1000 delay-300 ${fadeIn}`}
      >
        <p className="text-sm font-body font-light text-white/75 max-w-[220px] leading-relaxed">
          {hero.left}
        </p>

        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 flex items-center gap-3">
          <a
            href="#profile"
            className="group relative bg-white text-black text-sm font-body font-medium rounded px-6 py-3 overflow-hidden active:scale-[0.97] transition-all duration-200 shadow-[0_0_0_0_rgba(255,255,255,0)] hover:shadow-[0_0_24px_4px_rgba(255,255,255,0.25)] hover:scale-[1.03] inline-flex items-center gap-2"
          >
            <span className="relative z-10 inline-flex items-center gap-2">
              {hero.primaryCta}
              <ArrowDown size={14} strokeWidth={2} />
            </span>
            <span className="absolute inset-0 bg-gradient-to-b from-white to-white/85 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </a>
          <a
            href={profile.cv_pdf}
            download
            className="liquid-glass group text-white text-sm font-body font-medium rounded px-6 py-3 active:scale-[0.97] transition-all duration-200 hover:scale-[1.03] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_0_20px_2px_rgba(255,255,255,0.07)] inline-flex items-center gap-2"
          >
            {hero.secondaryCta}
            <Download size={14} strokeWidth={2} />
          </a>
        </div>

        <p className="text-sm font-body font-light text-white/75 max-w-[220px] leading-relaxed text-right">
          {hero.right}
        </p>
      </div>
    </div>
  );
}
