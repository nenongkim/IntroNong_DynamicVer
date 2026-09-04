import { useEffect, useRef } from 'react';

/**
 * 전경 기포 레이어 (Canvas 2D).
 * 배경 영상·돌고래보다 앞에 있고, 커서 반대 방향으로 흘러 깊이감을 만든다.
 * DPR 상한 2, 탭 비활성 시 rAF 중단.
 */
interface Bubble {
  x: number;
  y: number;
  r: number;
  vy: number;
  ph: number;
  amp: number;
  a: number;
}

export default function Bubbles({
  reduced = false,
  intensity = 1,
}: {
  reduced?: boolean;
  /** 0~1 · 기포 개수·밝기 배율 */
  intensity?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = 0;
    let H = 0;
    let bubbles: Bubble[] = [];
    let rafId = 0;
    let running = true;
    let last = performance.now();
    let targetMX = 0;
    let mx = 0;

    const spawn = (anywhere: boolean): Bubble => {
      const r = 1.2 + Math.random() * 3.6;
      return {
        x: Math.random() * W,
        y: anywhere ? Math.random() * H : H + r + Math.random() * 40,
        r,
        vy: 16 + Math.random() * 28 + r * 4,
        ph: Math.random() * Math.PI * 2,
        amp: 6 + Math.random() * 10,
        a: (0.18 + Math.random() * 0.4) * intensity,
      };
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.max(18, Math.min(70, Math.round((W * H) / 32000))) * intensity);
      bubbles = Array.from({ length: n }, () => spawn(true));
    };

    const onMove = (e: MouseEvent) => {
      targetMX = e.clientX / W - 0.5;
    };

    const frame = (now: number) => {
      if (!running) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      mx += (targetMX - mx) * 0.08;
      const drift = reduced ? 0 : -mx * 36; // 커서 반대 방향
      ctx.clearRect(0, 0, W, H);
      ctx.lineWidth = 1;
      for (const b of bubbles) {
        b.y -= b.vy * dt;
        b.x += (Math.sin(now * 0.001 + b.ph) * b.amp * 0.6 + drift) * dt;
        if (b.y < -b.r * 2) Object.assign(b, spawn(false));
        if (b.x < -10) b.x = W + 10;
        else if (b.x > W + 10) b.x = -10;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,255,255,${b.a})`;
        ctx.stroke();
        ctx.fillStyle = `rgba(255,255,255,${b.a * 0.18})`;
        ctx.fill();
      }
      rafId = requestAnimationFrame(frame);
    };

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(rafId);
      } else if (!running) {
        running = true;
        last = performance.now();
        rafId = requestAnimationFrame(frame);
      }
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMove);
    document.addEventListener('visibilitychange', onVisibility);
    rafId = requestAnimationFrame(frame);

    return () => {
      running = false;
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [reduced, intensity]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="fixed inset-0 z-[3] w-full h-full pointer-events-none"
    />
  );
}
