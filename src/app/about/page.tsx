import type { Metadata } from "next";
import { getContent } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { CtaBand } from "@/components/CtaBand";
import { PhotoArt } from "@/components/PhotoArt";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Mainflow School in Ngong, Kajiado County — our introduction, philosophy, vision, mission, values and leadership.",
  alternates: { canonical: "/about" },
};

/** Small chip marking content that awaits official confirmation from the school. */
function PendingChip() {
  return (
    <span className="chip-pending" title="This information is a placeholder awaiting official confirmation from the school administration.">
      <span aria-hidden="true">✎</span> Awaiting school confirmation
    </span>
  );
}

export default function AboutPage() {
  const { about } = getContent();

  return (
    <>
      <PageHeader
        eyebrow="About us"
        title="A school that knows and values every child"
        description="Mainflow School is a private school serving families in Ngong, Kajiado County, Kenya."
        breadcrumb={[{ label: "Home", href: "/" }, { label: "About Us" }]}
      />

      {/* Introduction + history */}
      <section className="section bg-white">
        <div className="container-page grid items-start gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <Reveal>
            <SectionHeading align="left" eyebrow="Our story" title="Introduction" />
            <p className="mt-5 text-[17px] leading-relaxed text-ink-700">{about.introduction}</p>

            <div className="mt-10 flex items-center gap-3">
              <h3 className="font-heading text-xl font-bold text-ink-900">History</h3>
              <PendingChip />
            </div>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-600">{about.history}</p>

            <div className="mt-10 flex items-center gap-3">
              <h3 className="font-heading text-xl font-bold text-ink-900">Educational philosophy</h3>
              <PendingChip />
            </div>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-600">{about.philosophy}</p>
          </Reveal>

          <Reveal delayMs={120}>
            <figure className="overflow-hidden rounded-3xl border border-ink-100 shadow-[0_24px_60px_-30px_rgba(10,23,49,0.4)]">
              <PhotoArt motif="campus" className="aspect-[4/3] w-full" label="Photo to be added" />
              <figcaption className="bg-maroon-50 px-5 py-4 text-xs text-ink-500">
                Illustrated placeholder — an approved photograph of the school will appear here once
                provided by the school administration.
              </figcaption>
            </figure>
          </Reveal>
        </div>
      </section>

      {/* Vision & mission */}
      <section className="section bg-maroon-900">
        <div className="container-page grid gap-8 lg:grid-cols-2">
          {[
            { title: "Our vision", text: about.vision },
            { title: "Our mission", text: about.mission },
          ].map((item, i) => (
            <Reveal key={item.title} delayMs={i * 100}>
              <div className="h-full rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur sm:p-10">
                <div className="flex items-center gap-3">
                  <span className="h-1 w-10 rounded-full bg-maroon-700" />
                  <h2 className="font-heading text-2xl font-bold text-white">{item.title}</h2>
                </div>
                <p className="mt-5 text-lg leading-relaxed text-maroon-50">{item.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="section bg-white">
        <div className="container-page">
          <Reveal>
            <SectionHeading
              eyebrow="Our values"
              title="The principles we live by"
              description="These values guide how we teach, how we care for our learners and how we work with families."
            />
          </Reveal>
          <div className="mt-6 flex justify-center">
            <PendingChip />
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {about.values.map((value, i) => (
              <Reveal key={value.title} delayMs={i * 70}>
                <div className="card card-hover h-full">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-maroon-100 text-maroon-600">
                      <svg viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                        <path d="M10 1.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.8L10 1.5z" />
                      </svg>
                    </span>
                    <h3 className="font-heading text-lg font-bold text-ink-900">{value.title}</h3>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-ink-600">{value.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership */}
      <section className="section bg-maroon-50/60">
        <div className="container-page">
          <Reveal>
            <SectionHeading
              eyebrow="Leadership"
              title="Meet our leadership"
              description="Leadership information is published once confirmed by the school administration."
            />
          </Reveal>
          <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-2">
            {about.leadership.map((leader, i) => (
              <Reveal key={`${leader.role}-${i}`} delayMs={i * 90}>
                <div className="card h-full">
                  <div className="flex items-center gap-4">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-maroon-800 font-heading text-lg font-bold text-maroon-200">
                      {leader.role.charAt(0)}
                    </span>
                    <div>
                      <p className="font-heading text-lg font-bold text-ink-900">{leader.name}</p>
                      <p className="text-sm font-medium text-maroon-600">{leader.role}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-ink-600">{leader.bio}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
