import type { Metadata } from "next";
import Link from "next/link";
import { getContent } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { CtaBand } from "@/components/CtaBand";

export const metadata: Metadata = {
  title: "Academics — Curriculum & Learning Areas",
  description:
    "Curriculum, learning areas, teaching approach, assessments and educational progression at Mainflow School, Ngong, Kajiado County.",
  alternates: { canonical: "/academics" },
};

export default function AcademicsPage() {
  const { academics } = getContent();

  return (
    <>
      <PageHeader
        eyebrow="Academics"
        title="Learning built on strong foundations"
        description="Structured teaching, constant assessment and personal attention help every learner at Mainflow progress with confidence."
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Academics" }]}
      />

      {/* Curriculum & grades — honest confirmation notes */}
      <section className="section bg-white">
        <div className="container-page grid gap-6 lg:grid-cols-2">
          <Reveal>
            <div className="card h-full border-maroon-200 bg-maroon-50/40">
              <p className="eyebrow">Curriculum</p>
              <h2 className="mt-3 font-heading text-2xl font-bold text-ink-900">Our curriculum</h2>
              <p className="mt-4 text-[15px] leading-relaxed text-ink-700">{academics.curriculumStatement}</p>
              <p className="mt-4 rounded-xl border border-dashed border-maroon-400 bg-white/70 px-4 py-3 text-xs text-ink-600">
                ✓ The school follows the Competency-Based Education (CBE) curriculum. Call{" "}
                <a href="tel:+254725958589" className="font-semibold text-ink-800 underline decoration-maroon-500 underline-offset-2">
                  0725 958 589
                </a>{" "}
                for details on how CBE is delivered at each level.
              </p>
            </div>
          </Reveal>
          <Reveal delayMs={100}>
            <div className="card h-full border-maroon-200 bg-maroon-50/40">
              <p className="eyebrow">Grades offered</p>
              <h2 className="mt-3 font-heading text-2xl font-bold text-ink-900">Classes & grades</h2>
              <p className="mt-4 text-[15px] leading-relaxed text-ink-700">{academics.gradesStatement}</p>
              <p className="mt-4 rounded-xl border border-dashed border-maroon-400 bg-white/70 px-4 py-3 text-xs text-ink-600">
                ✓ We never assume which grades are available — the school confirms the classes open
                for the current term.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Teaching approach */}
      <section className="section bg-maroon-50/60">
        <div className="container-page grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <SectionHeading align="left" eyebrow="Teaching approach" title="How we teach" description={academics.approach} />
          </Reveal>
          <Reveal delayMs={100}>
            <ul className="space-y-4">
              {[
                "Small, focused lessons with clear examples and guided practice",
                "Learning by doing — practical work, group activities and projects",
                "Constant assessment to identify and support learners early",
                "Regular homework and revision to build discipline and confidence",
                "A warm, disciplined classroom culture where every child participates",
              ].map((item) => (
                <li key={item} className="card flex items-start gap-3 !p-4">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-maroon-800 text-maroon-200">
                    <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M2.5 6.5l2.5 2.5 4.5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span className="text-sm leading-relaxed text-ink-700">{item}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* Learning areas */}
      <section className="section bg-white">
        <div className="container-page">
          <Reveal>
            <SectionHeading
              eyebrow="Learning areas"
              title="Where learning happens"
              description="Our learning areas develop knowledge, skills and character together — from numbers and letters to science, creativity and digital skills."
            />
          </Reveal>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {academics.learningAreas.map((area, i) => (
              <Reveal key={area.title} delayMs={i * 70}>
                <article className="card card-hover h-full">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-maroon-800 to-maroon-600 font-heading text-sm font-bold text-maroon-200">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <h3 className="mt-4 font-heading text-lg font-bold text-ink-900">{area.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-600">{area.description}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Assessment & progression */}
      <section className="section bg-maroon-900">
        <div className="container-page grid gap-8 lg:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-3xl border border-white/10 bg-white/5 p-8 sm:p-10">
              <p className="eyebrow !text-maroon-200">Assessment</p>
              <h2 className="mt-3 font-heading text-2xl font-bold text-white">How we measure progress</h2>
              <p className="mt-4 leading-relaxed text-maroon-50">{academics.assessments}</p>
            </div>
          </Reveal>
          <Reveal delayMs={100}>
            <div className="h-full rounded-3xl border border-white/10 bg-white/5 p-8 sm:p-10">
              <p className="eyebrow !text-maroon-200">Progression</p>
              <h2 className="mt-3 font-heading text-2xl font-bold text-white">Where learners go next</h2>
              <p className="mt-4 leading-relaxed text-maroon-50">{academics.progression}</p>
              <Link href="/admissions" className="btn-light mt-6">
                Start an admission enquiry
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <CtaBand title="See the school in person" text="The best way to understand our teaching is to visit. Call the office to book a school visit during working hours." />
    </>
  );
}
