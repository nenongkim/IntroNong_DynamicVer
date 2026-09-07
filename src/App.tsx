import { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import Bubbles from './components/Bubbles';
import LivingWater from './components/LivingWater';
import { ContactSection, ExperienceSection, ProfileSection, VisionSection } from './components/Sections';
import { hero, navLinks, profile, scenes, sectionScenes } from './data/content';

/* ---------- constants ---------- */
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
  const [scrolled, setScrolled] = useState(false); // 히어로를 지나면 네비 반전
  const [scene, setScene] = useState(sectionScenes.top ?? 0); // 현재 섹션의 배경 장면

  const videoBgRef = useRef<HTMLDivElement>(null);
  const mistRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const hintRef = useRef<HTMLAnchorElement>(null);

  const tokens = useMemo(() => tokenize(hero.headline), []);

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
      .fromTo(navRef.current, { y: -12, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.2 }, 0.2)
      .fromTo(words, { yPercent: 110, rotate: 2 }, { yPercent: 0, rotate: 0, duration: 1.3, stagger: 0.055 }, 0.35)
      .fromTo(rest, { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.1, stagger: 0.14 }, 0.9)
      .fromTo(hintRef.current, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 1 }, 1.8);

    return () => { tl.kill(); };
  }, []);

  /* ---------- Effect 3.5 — 스크롤: 네비 테마 · 현재 섹션 → 배경 장면 · 수면 안개 페이드 ---------- */
  useEffect(() => {
    const ids = ['contact', 'vision', 'experience', 'profile'];
    const onScroll = () => {
      const vh = window.innerHeight;
      setScrolled(window.scrollY > vh * 0.72);
      // 화면 45% 지점을 지난 가장 아래 섹션이 현재 섹션
      let current = 'top';
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= vh * 0.45) { current = id; break; }
      }
      setScene(sectionScenes[current] ?? 0);
      if (mistRef.current) mistRef.current.style.opacity = String(1 - Math.min(1, window.scrollY / (vh * 0.85)));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <div className="min-h-screen bg-ocean-800 text-ocean-800 font-body overflow-x-hidden">
      {/* 1. 원경 — 살아 움직이는 바닷속 (WebGL, 사용자 제작 이미지 4장) */}
      <div ref={videoBgRef} className="fixed top-0 left-0 w-full h-full z-0">
        <LivingWater scenes={scenes.map((s) => (LOW_POWER ? s.srcSm : s.src))} active={scene} reduced={REDUCED} />
      </div>
      {/* 수면 안개 + 그레인 */}
      <div ref={mistRef} className="surface-mist fixed inset-0 z-[1] pointer-events-none" />
      <div className="grain fixed inset-0 z-[2] pointer-events-none" aria-hidden="true" />

      {/* 전경 — 기포 (하단 위주, 은은하게) */}
      <Bubbles reduced={REDUCED} intensity={0.55} />

      {/* 2. Nav — 상단이 밝으므로 글래스 없이 딥블루 텍스트 */}
      <nav
        ref={navRef}
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 opacity-0 transition-[padding,background-color,color,backdrop-filter] duration-500 ${
          scrolled
            ? 'py-4 text-ocean-50 bg-ocean-800/70 backdrop-blur-md border-b border-white/10'
            : 'py-6 text-ocean-800'
        }`}
      >
        <a href="#top" className="flex items-center gap-2.5" aria-label="Yewon Kim">
          <DolphinMark className="w-9 h-[18px]" />
          <span className="font-heading text-[15px] font-semibold tracking-tight">Yewon Kim</span>
        </a>
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((label) => (
            <a
              key={label}
              href={`#${label.toLowerCase()}`}
              className="font-heading text-[13px] font-medium opacity-60 hover:opacity-100 transition-opacity duration-200"
            >
              {label}
            </a>
          ))}
        </div>
        <a
          href={profile.cv_pdf}
          download
          className={`font-heading text-[13px] font-medium rounded px-4 py-2 transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] ${
            scrolled
              ? 'bg-lime text-ocean-800 hover:shadow-[0_8px_24px_-8px_rgba(232,249,122,0.6)]'
              : 'bg-ocean-800 text-ocean-50 hover:shadow-[0_8px_24px_-8px_rgba(12,68,124,0.6)]'
          }`}
        >
          Download CV
        </a>
      </nav>

      {/* 3. Hero — 한 화면 높이의 일반 섹션. 텍스트는 고정, 배경만 움직인다 */}
      <section id="top" className="relative z-20 h-[100svh] min-h-[640px]">
      <div
        ref={heroRef}
        className="absolute left-0 right-0 px-6 md:px-10 opacity-0"
        style={{ top: 'clamp(112px, 17vh, 176px)' }}
      >
        <div className="hero-glow pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[150%] w-[min(120vw,1400px)] -translate-x-1/2 -translate-y-1/2" aria-hidden="true" />
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
            className="mt-5 md:mt-6 mx-auto max-w-[560px] text-[15px] md:text-base leading-relaxed text-ocean-800/90 break-keep"
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
      <a
        ref={hintRef}
        href="#profile"
        className="absolute bottom-7 right-6 md:right-10 flex items-center gap-2 font-heading text-[11px] tracking-[0.16em] uppercase text-ocean-50/70 hover:text-ocean-50 opacity-0"
      >
        {hero.scrollHint}
        <ArrowDown size={12} className="hint-bounce" />
      </a>
      </section>

      {/* 4. 본문 섹션 — 배경은 고정된 LivingWater 가 섹션마다 다른 장면으로 전환 (셰이더에서 어둡게) */}
      <main className="relative z-30 text-ocean-50 bg-ocean-800/30">
        <ProfileSection />
        <ExperienceSection />
        <VisionSection />
        <ContactSection />
      </main>
    </div>
  );
}
