import { ArrowUpRight, Mail, Phone } from 'lucide-react';
import { ending, islands, profile, researchInterests, vision } from '../data/content';

/* 공통: 섹션 헤더 (아이브로우 + 세리프 타이틀) */
function SectionHead({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="mb-12 md:mb-16">
      <p className="font-heading text-[11px] md:text-xs font-medium tracking-[0.18em] uppercase text-ocean-200/80">
        {eyebrow}
      </p>
      <h2 className="mt-3 font-serif text-[2.4rem] md:text-[3.6rem] leading-[1.02] tracking-[-0.01em] text-ocean-50">
        {title}
      </h2>
      {sub && <p className="mt-4 max-w-[560px] text-ocean-50/70 leading-relaxed break-keep">{sub}</p>}
    </div>
  );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-[22px] border border-white/10 bg-white/[0.045] backdrop-blur-md p-6 md:p-7 ${className}`}
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

/* ---------------- Profile ---------------- */
export function ProfileSection() {
  return (
    <section id="profile" className="scroll-mt-20 px-6 md:px-10 py-24 md:py-32">
      <div className="mx-auto max-w-[1180px]">
        <SectionHead eyebrow="01 · Profile" title="Education & Research" sub={profile.tagline} />
        <div className="grid gap-5 md:grid-cols-12">
          <Card className="md:col-span-7">
            <p className="font-heading text-[11px] font-semibold tracking-[0.14em] uppercase text-ocean-200">
              Education
            </p>
            <h3 className="mt-3 font-serif text-2xl md:text-[1.9rem] leading-tight text-ocean-50">
              {profile.university_short}
            </h3>
            <p className="mt-1 text-sm text-ocean-50/60">{profile.university}</p>
            <ul className="mt-5 space-y-2 text-[15px] text-ocean-50/85 leading-relaxed">
              <li>{profile.degree}</li>
              <li>{profile.double_major}</li>
            </ul>
            <p className="mt-5 font-heading text-sm text-ocean-50/60">
              GPA <span className="font-semibold text-ocean-50">{profile.gpa}</span>
            </p>
          </Card>

          <Card className="md:col-span-5">
            <p className="font-heading text-[11px] font-semibold tracking-[0.14em] uppercase text-ocean-200">
              Research Experience
            </p>
            <p className="mt-3 font-heading text-xs tracking-[0.06em] text-ocean-200/80">Jul – Aug 2026</p>
            <h3 className="mt-1 font-semibold text-ocean-50">Visiting Undergraduate Researcher</h3>
            <p className="mt-1 text-[15px] text-ocean-50/85">
              ETRI (Electronics and Telecommunications Research Institute)
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-ocean-50/55">
              Spatial Media Research Laboratory · Spatial Content Research Division · Spatial Intelligence
              Research Section · Daejeon, Korea
            </p>
          </Card>

          <Card className="md:col-span-12">
            <p className="font-heading text-[11px] font-semibold tracking-[0.14em] uppercase text-ocean-200">
              Research Interests
            </p>
            <ul className="mt-4 flex flex-wrap gap-2.5">
              {researchInterests.map((t) => (
                <li
                  key={t}
                  className="rounded border border-ocean-200/30 bg-ocean-200/10 px-3.5 py-1.5 text-[13px] text-ocean-50"
                >
                  {t}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Experience ---------------- */
export function ExperienceSection() {
  return (
    <section id="experience" className="scroll-mt-20 px-6 md:px-10 py-24 md:py-32">
      <div className="mx-auto max-w-[1180px]">
        <SectionHead
          eyebrow="02 · Experience"
          title="Awards, Projects & Activities"
          sub="공모전과 프로젝트, 학내 활동에서 배경 · 역할 · 성과를 한눈에."
        />
        <div className="space-y-14">
          {islands.map((group) => (
            <div key={group.id}>
              <div className="mb-5 flex items-baseline gap-3">
                <h3 className="font-serif text-2xl md:text-[1.9rem] text-ocean-50">{group.label}</h3>
                <span className="font-heading text-xs tracking-[0.08em] text-ocean-200/80">
                  {group.label_ko} · {group.items.length}
                </span>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {group.items.map((it) => (
                  <Card key={it.title} className="flex flex-col gap-3">
                    <p className="font-heading text-[11px] tracking-[0.06em] text-ocean-200/80">{it.meta}</p>
                    <h4 className="font-semibold leading-snug text-ocean-50">{it.title}</h4>
                    <p className="text-[13.5px] leading-relaxed text-ocean-50/70">{it.background}</p>
                    <p className="text-[13px] leading-relaxed text-ocean-50/50">
                      <span className="font-heading text-[10px] font-semibold tracking-[0.1em] uppercase text-ocean-200/70">
                        Role ·{' '}
                      </span>
                      {it.role}
                    </p>
                    <div className="mt-auto pt-1">
                      <Badge>{it.result}</Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Vision ---------------- */
export function VisionSection() {
  return (
    <section id="vision" className="scroll-mt-20 px-6 md:px-10 py-24 md:py-32">
      <div className="mx-auto max-w-[1180px]">
        <SectionHead eyebrow="03 · Vision" title={vision.headline} />
        <ol className="grid gap-5 md:grid-cols-3">
          {vision.lines.map((line, i) => (
            <li key={line}>
              <Card className="h-full">
                <p className="font-serif text-3xl text-ocean-200/70">0{i + 1}</p>
                <p className="mt-4 text-[15.5px] leading-relaxed text-ocean-50/90 break-keep">{line}</p>
              </Card>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ---------------- Contact ---------------- */
export function ContactSection() {
  return (
    <section id="contact" className="scroll-mt-20 px-6 md:px-10 pt-24 md:pt-32 pb-12">
      <div className="mx-auto max-w-[1180px]">
        <div className="text-center">
          <p className="text-ocean-50/70">{ending.line_ko}</p>
          <h2 className="mt-3 font-serif text-[3rem] md:text-[5.5rem] leading-none tracking-[-0.02em] text-ocean-50">
            {ending.line_en}
          </h2>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
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
              download
              className="inline-flex items-center gap-1.5 rounded border border-white/15 bg-white/[0.06] px-6 py-3 font-heading text-sm font-medium text-ocean-50 transition-all duration-200 hover:bg-white/10"
            >
              Download CV
              <ArrowUpRight size={14} strokeWidth={2} />
            </a>
          </div>
        </div>
        <footer className="mt-24 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 md:flex-row">
          <p className="font-heading text-xs tracking-[0.04em] text-ocean-50/45">{ending.credit}</p>
          <p className="font-heading text-xs tracking-[0.04em] text-ocean-50/45">{profile.subtitle}</p>
        </footer>
      </div>
    </section>
  );
}
