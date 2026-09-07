import { useState } from 'react';
import { ArrowUpRight, Mail, Phone } from 'lucide-react';
import { certifications, ending, islands, profile, researchInterests, vision } from '../data/content';

/* 공통: 화면 헤더 (아이브로우 + 세리프 타이틀). data-part → 화면 전환 시 순차 등장 */
function SectionHead({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div data-part className="mb-8 md:mb-10 [text-shadow:0_2px_28px_rgba(0,18,48,0.55)]">
      <p className="font-heading text-[11px] md:text-xs font-medium tracking-[0.18em] uppercase text-ocean-200/80">
        {eyebrow}
      </p>
      <h2 className="mt-2 font-serif text-[2.2rem] md:text-[3.2rem] leading-[1.02] tracking-[-0.01em] text-ocean-50">
        {title}
      </h2>
      {sub && <p className="mt-3 max-w-[560px] text-[15px] text-ocean-50/80 leading-relaxed break-keep">{sub}</p>}
    </div>
  );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      data-part
      className={`rounded-[22px] border border-white/10 bg-white/[0.045] backdrop-blur-md p-5 md:p-6 ${className}`}
    >
      {children}
    </div>
  );
}

const Badge = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center gap-1.5 rounded bg-ocean-50/10 px-2.5 py-1 font-heading text-[11px] font-semibold tracking-[0.04em] text-ocean-50">
    <span className="h-1.5 w-1.5 rounded-full bg-lime" />
    {children}
  </span>
);

const Label = ({ children }: { children: React.ReactNode }) => (
  <p className="font-heading text-[11px] font-semibold tracking-[0.14em] uppercase text-ocean-200">{children}</p>
);

/* ---------------- Profile ---------------- */
export function ProfileSection() {
  return (
    <div className="mx-auto w-full max-w-[1100px]">
      <SectionHead eyebrow="01 · Profile" title="Education & Research" sub={profile.tagline} />
      <div className="grid gap-4 md:grid-cols-12">
        <Card className="md:col-span-7">
          <Label>Education</Label>
          <h3 className="mt-2 font-serif text-2xl md:text-[1.8rem] leading-tight text-ocean-50">{profile.university_short}</h3>
          <p className="mt-0.5 text-sm text-ocean-50/60">{profile.university}</p>
          <ul className="mt-4 space-y-1.5 text-[14.5px] text-ocean-50/85 leading-relaxed">
            <li>{profile.degree}</li>
            <li>{profile.double_major}</li>
          </ul>
          <p className="mt-4 font-heading text-sm text-ocean-50/60">
            GPA <span className="font-semibold text-ocean-50">{profile.gpa}</span>
          </p>
        </Card>

        <Card className="md:col-span-5">
          <Label>Research Experience</Label>
          <p className="mt-2 font-heading text-xs tracking-[0.06em] text-ocean-200/80">Jul – Aug 2026</p>
          <h3 className="mt-1 font-semibold text-ocean-50">Visiting Undergraduate Researcher</h3>
          <p className="mt-1 text-[14.5px] text-ocean-50/85">ETRI (Electronics and Telecommunications Research Institute)</p>
          <p className="mt-2 text-[12.5px] leading-relaxed text-ocean-50/55">
            Spatial Media Research Laboratory · Spatial Content Research Division · Spatial Intelligence Research Section · Daejeon, Korea
          </p>
        </Card>

        <Card className="md:col-span-8">
          <div className="flex items-baseline justify-between gap-4">
            <Label>Certifications</Label>
            <span className="font-heading text-xs tracking-[0.08em] text-ocean-200/80">자격증 · {certifications.length}</span>
          </div>
          <ul className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {certifications.map((c) => (
              <li key={c.name} className="flex flex-col gap-1.5 rounded-[16px] border border-white/10 bg-white/[0.04] p-3.5">
                <span className="inline-flex w-fit items-center gap-1.5 rounded bg-ocean-50/10 px-2 py-0.5 font-heading text-[10px] font-semibold tracking-[0.08em] uppercase text-ocean-50/85">
                  <span className="h-1 w-1 rounded-full bg-lime" />
                  {c.area}
                </span>
                <p className="font-heading text-[14px] font-semibold leading-snug text-ocean-50">{c.name}</p>
                <p className="text-[12.5px] text-ocean-50/80">{c.name_ko}</p>
                <p className="mt-auto text-[11px] leading-relaxed text-ocean-50/50">{c.issuer}</p>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="md:col-span-4">
          <Label>Research Interests</Label>
          <ul className="mt-4 flex flex-wrap gap-2">
            {researchInterests.map((t) => (
              <li key={t} className="rounded border border-ocean-200/30 bg-ocean-200/10 px-3 py-1.5 text-[12.5px] text-ocean-50">
                {t}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

/* ---------------- Experience (서브 탭: Awards / Projects / Activities) ---------------- */
export function ExperienceSection() {
  const [g, setG] = useState(0);
  const group = islands[g];
  return (
    <div className="mx-auto w-full max-w-[1100px]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHead eyebrow="02 · Experience" title="Awards, Projects & Activities" />
        <div data-part role="tablist" aria-label="Experience groups" className="mb-8 md:mb-10 flex gap-1.5 rounded border border-white/15 bg-white/[0.06] p-1 backdrop-blur-md">
          {islands.map((isl, i) => (
            <button
              key={isl.id}
              type="button"
              role="tab"
              aria-selected={i === g}
              onClick={() => setG(i)}
              className={`rounded px-3.5 py-1.5 font-heading text-[12.5px] font-medium transition-all duration-300 ${
                i === g ? 'bg-lime text-ocean-800' : 'text-ocean-50/75 hover:text-ocean-50 hover:bg-white/10'
              }`}
            >
              {isl.label}
              <span className="ml-1.5 opacity-60">{isl.items.length}</span>
            </button>
          ))}
        </div>
      </div>

      <div key={group.id} className="grid gap-3.5 md:grid-cols-2 lg:grid-cols-4">
        {group.items.map((it) => (
          <Card key={it.title} className="flex flex-col gap-2.5 !p-4">
            <p className="font-heading text-[10.5px] tracking-[0.06em] text-ocean-200/80">{it.meta}</p>
            <h4 className="text-[14.5px] font-semibold leading-snug text-ocean-50">{it.title}</h4>
            <p className="text-[12.5px] leading-relaxed text-ocean-50/70">{it.background}</p>
            <p className="text-[12px] leading-relaxed text-ocean-50/50">
              <span className="font-heading text-[10px] font-semibold tracking-[0.1em] uppercase text-ocean-200/70">Role · </span>
              {it.role}
            </p>
            <div className="mt-auto pt-1">
              <Badge>{it.result}</Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Vision ---------------- */
export function VisionSection() {
  return (
    <div className="mx-auto w-full max-w-[1100px]">
      <SectionHead eyebrow="03 · Vision" title={vision.headline} />
      <ol className="grid gap-4 md:grid-cols-3">
        {vision.lines.map((line, i) => (
          <li key={line}>
            <Card className="h-full">
              <p className="font-serif text-3xl text-ocean-200/70">0{i + 1}</p>
              <p className="mt-3 text-[15px] leading-relaxed text-ocean-50/90 break-keep">{line}</p>
            </Card>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ---------------- Contact ---------------- */
export function ContactSection() {
  return (
    <div className="mx-auto w-full max-w-[1100px]">
      <div className="text-center [text-shadow:0_2px_28px_rgba(0,18,48,0.55)]">
        <p data-part className="text-ocean-50/75">{ending.line_ko}</p>
        <h2 data-part className="mt-3 font-serif text-[3rem] md:text-[5.5rem] leading-none tracking-[-0.02em] text-ocean-50">
          {ending.line_en}
        </h2>
        <div data-part className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <a
            href={`mailto:${profile.email}`}
            className="inline-flex items-center gap-2 rounded bg-lime px-6 py-3 font-heading text-sm font-semibold text-ocean-800 transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
          >
            <Mail size={15} strokeWidth={2.2} />
            {profile.email}
          </a>
          <a
            href={profile.phone_href}
            className="inline-flex items-center gap-2 rounded border border-white/15 bg-white/[0.06] px-6 py-3 font-heading text-sm font-medium text-ocean-50 transition-all duration-200 hover:bg-white/10"
          >
            <Phone size={15} strokeWidth={2} />
            {profile.phone}
          </a>
          <a
            href={profile.cv_pdf}
            download="Yewon_Kim_CV.pdf"
            className="inline-flex items-center gap-1.5 rounded border border-white/15 bg-white/[0.06] px-6 py-3 font-heading text-sm font-medium text-ocean-50 transition-all duration-200 hover:bg-white/10"
          >
            Download CV
            <ArrowUpRight size={14} strokeWidth={2} />
          </a>
        </div>
      </div>
      <footer data-part className="mt-16 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-5 md:flex-row">
        <p className="font-heading text-xs tracking-[0.04em] text-ocean-50/45">{ending.credit}</p>
        <p className="font-heading text-xs tracking-[0.04em] text-ocean-50/45">{profile.subtitle}</p>
      </footer>
    </div>
  );
}
