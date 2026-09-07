import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import Bubbles from './components/Bubbles';
import LivingWater from './components/LivingWater';
import { ContactSection, ExperienceSection, ProfileSection, VisionSection } from './components/Sections';
import { hero, profile, scenes, sectionScenes } from './data/content';

/* ---------- constants ---------- */
const REDUCED =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// 저사양/모바일: 축소 이미지
const LOW_POWER =
  typeof window !== 'undefined' &&
  (window.matchMedia('(max-width: 767px)').matches ||
    ((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8) < 4);

/* 화면(슬라이드) 정의 — 순서가 곧 좌우 이동 순서 */
const SLIDES = [
  { id: 'top', label: 'Home', label_ko: '홈' },
  { id: 'profile', label: 'Profile', label_ko: '프로필' },
  { id: 'experience', label: 'Experience', label_ko: '경험' },
  { id: 'vision', label: 'Vision', label_ko: '비전' },
  { id: 'contact', label: 'Contact', label_ko: '연락' },
] as const;
type SlideId = (typeof SLIDES)[number]['id'];
const SLIDE_MS = 850;

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

const indexOfHash = () => {
  const h = (typeof location !== 'undefined' ? location.hash.replace('#', '') : '') as SlideId;
  const i = SLIDES.findIndex((s) => s.id === h);
  return i < 0 ? 0 : i;
};

export default function App() {
  const [index, setIndex] = useState(indexOfHash);
  const indexRef = useRef(index);
  const animating = useRef(false);
  const slideRefs = useRef<(HTMLElement | null)[]>([]);

  const heroRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const hintRef = useRef<HTMLAnchorElement>(null);
  const edgesRef = useRef<HTMLDivElement>(null);

  const tokens = useMemo(() => tokenize(hero.headline), []);
  const current = SLIDES[index];
  const prev = index > 0 ? SLIDES[index - 1] : null;
  const next = index < SLIDES.length - 1 ? SLIDES[index + 1] : null;
  const scene = sectionScenes[current.id] ?? 0;

  /* ---------- 화면 전환 ---------- */
  const goTo = useCallback((target: number) => {
    const from = indexRef.current;
    const to = Math.max(0, Math.min(SLIDES.length - 1, target));
    if (to === from || animating.current) return;
    const dir = to > from ? 1 : -1;
    const outEl = slideRefs.current[from];
    const inEl = slideRefs.current[to];
    indexRef.current = to;
    setIndex(to);
    history.replaceState(null, '', `#${SLIDES[to].id}`);
    if (!outEl || !inEl) return;

    if (REDUCED) {
      gsap.set(outEl, { autoAlpha: 0, x: 0 });
      gsap.set(inEl, { autoAlpha: 1, x: 0 });
      return;
    }
    animating.current = true;
    gsap.killTweensOf([outEl, inEl]);
    const tl = gsap.timeline({ onComplete: () => { animating.current = false; } });
    tl.to(outEl, { x: -70 * dir, autoAlpha: 0, duration: SLIDE_MS / 1000 * 0.55, ease: 'power2.in' }, 0)
      .fromTo(inEl, { x: 90 * dir, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: SLIDE_MS / 1000, ease: 'expo.out' }, 0.22);
    // 들어오는 화면의 내부 요소 순차 등장
    const parts = inEl.querySelectorAll<HTMLElement>('[data-part]');
    if (parts.length) tl.fromTo(parts, { y: 22, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9, stagger: 0.07, ease: 'expo.out' }, 0.35);
  }, []);

  /* 초기 표시 상태 */
  useEffect(() => {
    slideRefs.current.forEach((el, i) => { if (el) gsap.set(el, { autoAlpha: i === indexRef.current ? 1 : 0 }); });
  }, []);

  /* 키보드 · 휠 · 스와이프 · 해시 */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') goTo(indexRef.current + 1);
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') goTo(indexRef.current - 1);
    };
    let wheelLock = 0;
    const onWheel = (e: WheelEvent) => {
      // 화면 안 스크롤 영역이 아직 스크롤할 수 있으면 화면 전환하지 않는다
      const scroller = (e.target as HTMLElement).closest<HTMLElement>('[data-scroll]');
      if (scroller) {
        const canDown = scroller.scrollTop + scroller.clientHeight < scroller.scrollHeight - 2;
        const canUp = scroller.scrollTop > 2;
        if ((e.deltaY > 0 && canDown) || (e.deltaY < 0 && canUp)) return;
      }
      const now = Date.now();
      if (now < wheelLock || Math.abs(e.deltaY) < 24) return;
      wheelLock = now + SLIDE_MS + 350;
      goTo(indexRef.current + (e.deltaY > 0 ? 1 : -1));
    };
    let tx = 0, ty = 0;
    const onTouchStart = (e: TouchEvent) => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; };
    const onTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - tx;
      const dy = e.changedTouches[0].clientY - ty;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.3) goTo(indexRef.current + (dx < 0 ? 1 : -1));
    };
    const onHash = () => goTo(indexOfHash());
    window.addEventListener('keydown', onKey);
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('hashchange', onHash);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('hashchange', onHash);
    };
  }, [goTo]);

  /* ---------- 최초 등장 시퀀스 (gsap) ---------- */
  useEffect(() => {
    const heroEl = heroRef.current;
    if (!heroEl) return;
    const words = heroEl.querySelectorAll<HTMLElement>('.hl-word');
    const rest = heroEl.querySelectorAll<HTMLElement>('[data-reveal]');

    if (REDUCED || indexRef.current !== 0) {
      gsap.set([heroEl, navRef.current, hintRef.current, edgesRef.current, rest], { autoAlpha: 1, y: 0 });
      gsap.set(words, { yPercent: 0, rotate: 0 });
      return;
    }
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.set(heroEl, { autoAlpha: 1 })
      .fromTo(navRef.current, { y: -12, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.2 }, 0.2)
      .fromTo(words, { yPercent: 110, rotate: 2 }, { yPercent: 0, rotate: 0, duration: 1.3, stagger: 0.055 }, 0.35)
      .fromTo(rest, { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.1, stagger: 0.14 }, 0.9)
      .fromTo([edgesRef.current, hintRef.current], { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.15 }, 1.8);
    return () => { tl.kill(); };
  }, []);

  const onHero = index === 0;
  const navLink = (id: SlideId, label: string) => (
    <button
      key={id}
      type="button"
      onClick={() => goTo(SLIDES.findIndex((s) => s.id === id))}
      aria-current={current.id === id ? 'page' : undefined}
      className={`font-heading text-[13px] font-medium transition-opacity duration-200 ${current.id === id ? 'opacity-100 underline underline-offset-[6px] decoration-lime' : 'opacity-60 hover:opacity-100'}`}
    >
      {label}
    </button>
  );

  return (
    <div className="relative h-[100svh] min-h-[600px] overflow-hidden bg-ocean-800 text-ocean-800 font-body">
      {/* 1. 배경 — 화면마다 다른 바다 (WebGL) */}
      <div className="fixed top-0 left-0 w-full h-full z-0">
        <LivingWater scenes={scenes.map((s) => (LOW_POWER ? s.srcSm : s.src))} active={scene} dim={onHero ? 0 : 1} reduced={REDUCED} />
      </div>
      <div className={`surface-mist fixed inset-0 z-[1] pointer-events-none transition-opacity duration-1000 ${onHero ? 'opacity-100' : 'opacity-0'}`} />
      <div className="grain fixed inset-0 z-[2] pointer-events-none" aria-hidden="true" />
      <Bubbles reduced={REDUCED} intensity={0.55} />

      {/* 2. Nav */}
      <nav
        ref={navRef}
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 opacity-0 transition-[padding,background-color,color] duration-500 ${
          onHero ? 'py-6 text-ocean-800' : 'py-4 text-ocean-50 bg-ocean-800/40 backdrop-blur-md border-b border-white/10'
        }`}
      >
        <button type="button" onClick={() => goTo(0)} className="flex items-center gap-2.5" aria-label="Home">
          <DolphinMark className="w-9 h-[18px]" />
          <span className="font-heading text-[15px] font-semibold tracking-tight">Yewon Kim</span>
        </button>
        <div className="hidden md:flex items-center gap-8">
          {SLIDES.slice(1).map((s) => navLink(s.id, s.label))}
        </div>
        <a
          href={profile.cv_pdf}
          download
          className={`font-heading text-[13px] font-medium rounded px-4 py-2 transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] ${
            onHero ? 'bg-ocean-800 text-ocean-50' : 'bg-lime text-ocean-800'
          }`}
        >
          Download CV
        </a>
      </nav>

      {/* 3. 화면들 */}
      {/* Home */}
      <section
        ref={(el) => { slideRefs.current[0] = el; }}
        id="top"
        aria-hidden={index !== 0}
        className={`absolute inset-0 z-20 ${index === 0 ? '' : 'pointer-events-none'}`}
      >
        <div
          ref={heroRef}
          className="absolute left-0 right-0 px-6 md:px-10 opacity-0"
          style={{ top: 'clamp(112px, 17vh, 176px)' }}
        >
          <div className="hero-glow pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[150%] w-[min(120vw,1400px)] -translate-x-1/2 -translate-y-1/2" aria-hidden="true" />
          <div className="mx-auto max-w-[1180px] text-center">
            <p data-reveal className="font-heading text-[11px] md:text-xs font-medium tracking-[0.18em] uppercase text-ocean-800/60">
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
            <p data-reveal className="mt-5 md:mt-6 mx-auto max-w-[560px] text-[15px] md:text-base leading-relaxed text-ocean-800/90 break-keep">
              {hero.tagline}
            </p>
            <div data-reveal className="mt-7 md:mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
              <button
                type="button"
                onClick={() => goTo(1)}
                className="group inline-flex items-center gap-2 bg-lime text-ocean-800 font-heading text-sm font-semibold rounded px-6 py-3 transition-all duration-200 hover:scale-[1.03] hover:shadow-[0_10px_30px_-8px_rgba(12,68,124,0.45)] active:scale-[0.97]"
              >
                {hero.primaryCta}
                <ArrowRight size={14} strokeWidth={2.2} className="transition-transform duration-300 group-hover:translate-x-0.5" />
              </button>
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
        <a
          ref={hintRef}
          href="#profile"
          onClick={(e) => { e.preventDefault(); goTo(1); }}
          className="absolute bottom-7 left-1/2 -translate-x-1/2 flex items-center gap-2 font-heading text-[11px] tracking-[0.16em] uppercase text-ocean-50/70 hover:text-ocean-50 opacity-0"
        >
          {hero.scrollHint}
          <ArrowRight size={12} className="hint-nudge" />
        </a>
      </section>

      {/* 본문 화면 */}
      {[ProfileSection, ExperienceSection, VisionSection, ContactSection].map((Comp, k) => {
        const i = k + 1;
        return (
          <section
            key={SLIDES[i].id}
            ref={(el) => { slideRefs.current[i] = el; }}
            id={SLIDES[i].id}
            aria-hidden={index !== i}
            className={`absolute inset-0 z-20 text-ocean-50 ${index === i ? '' : 'pointer-events-none'}`}
          >
            <div data-scroll className="scroll-slim h-full overflow-y-auto overflow-x-hidden">
              <div className="min-h-full flex flex-col justify-center px-6 md:px-20 xl:px-40 2xl:px-48 pt-24 pb-24">
                <Comp />
              </div>
            </div>
          </section>
        );
      })}

      {/* 4. 좌우 전환 버튼 (이전/다음 화면 이름) */}
      <div ref={edgesRef} className="pointer-events-none fixed inset-x-0 top-1/2 z-40 -translate-y-1/2 flex items-center justify-between px-3 md:px-6 opacity-0">
        <EdgeButton dir="prev" slide={prev} light={!onHero} onClick={() => goTo(index - 1)} />
        <EdgeButton dir="next" slide={next} light={!onHero} onClick={() => goTo(index + 1)} />
      </div>

      {/* 5. 진행 표시 */}
      <div className={`fixed bottom-6 left-1/2 z-40 -translate-x-1/2 flex items-center gap-3 ${onHero ? 'hidden' : ''}`}>
        <span className="font-heading text-[11px] tracking-[0.16em] text-ocean-50/70">{String(index + 1).padStart(2, '0')}</span>
        <div className="flex items-center gap-1.5">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={s.label}
              onClick={() => goTo(i)}
              className={`h-1.5 rounded transition-all duration-300 ${i === index ? 'w-6 bg-lime' : 'w-1.5 bg-white/40 hover:bg-white/70'}`}
            />
          ))}
        </div>
        <span className="font-heading text-[11px] tracking-[0.16em] text-ocean-50/70">{String(SLIDES.length).padStart(2, '0')}</span>
      </div>
    </div>
  );
}

/* 가장자리 버튼: 원형 화살표 + 이웃 화면 이름 (레퍼런스 space-planet 방식) */
function EdgeButton({
  dir, slide, light, onClick,
}: {
  dir: 'prev' | 'next';
  slide: { label: string; label_ko: string } | null;
  light: boolean;
  onClick: () => void;
}) {
  if (!slide) return <span />;
  const Icon = dir === 'prev' ? ArrowLeft : ArrowRight;
  const ink = light ? 'text-ocean-50' : 'text-ocean-800';
  const ring = light ? 'border-white/30 bg-white/10 hover:bg-white/20' : 'border-ocean-800/25 bg-white/40 hover:bg-white/65';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${dir === 'prev' ? 'Previous' : 'Next'}: ${slide.label}`}
      className={`pointer-events-auto group flex items-center gap-3 ${dir === 'next' ? 'flex-row-reverse' : ''} ${ink}`}
    >
      <span className={`grid h-12 w-12 place-items-center rounded border backdrop-blur-md transition-all duration-300 group-hover:scale-105 ${ring}`}>
        <Icon size={18} strokeWidth={2} className={`transition-transform duration-300 ${dir === 'prev' ? 'group-hover:-translate-x-0.5' : 'group-hover:translate-x-0.5'}`} />
      </span>
      <span className={`hidden xl:flex flex-col ${dir === 'next' ? 'items-end' : 'items-start'} leading-tight`}>
        <span className="font-heading text-[10px] tracking-[0.2em] uppercase opacity-60">{dir === 'prev' ? 'Prev' : 'Next'}</span>
        <span className="font-heading text-sm font-semibold tracking-[0.04em] uppercase">{slide.label}</span>
      </span>
    </button>
  );
}
