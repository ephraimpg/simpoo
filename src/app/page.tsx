import Link from "next/link";
import { getContent } from "@/lib/store";
import { PhotoArt, categoryMotif } from "@/components/PhotoArt";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { CtaBand } from "@/components/CtaBand";

const FEATURES = [
  {
    title: "Academic Growth",
    text: "Strong foundations in literacy, numeracy and thinking skills, taught with patience and structured practice so every child progresses with confidence.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M12 3L2 8l10 5 10-5-10-5z" strokeLinejoin="round" />
        <path d="M6 10.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-5.5" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Learner Development",
    text: "Sport, music, drama, art and club activities — a rich co-curricular programme that builds well-rounded children who are confident, creative and ready for the next stage of school.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Supportive Environment",
    text: "A safe, disciplined and caring atmosphere where teachers know each learner by name and no child is left behind.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M12 21s-7-4.6-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.4-7 10-7 10z" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Parent Partnership",
    text: "Regular communication, open visits and honest feedback — because the best results happen when home and school work as one team.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
        <path d="M2 20c0-3.3 2.7-5 6-5s6 1.7 6 5M14 15.5c.9-.3 1.9-.5 3-.5 3.3 0 5 1.7 5 5" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function HomePage() {
  const content = getContent();
  const { site, home, academics } = content;
  const galleryPreview = content.gallery.filter((g) => g.published).slice(0, 6);

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="relative isolate overflow-hidden bg-maroon-900">
        <div className="absolute inset-0">
          <PhotoArt motif="hero" className="hero-art h-full w-full" label={null} />
          <div className="absolute inset-0 bg-gradient-to-r from-maroon-950/92 via-maroon-900/78 to-maroon-900/35" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-maroon-950/70 to-transparent" />
        </div>

        <div className="container-page relative grid min-h-[78vh] content-center gap-10 py-20 lg:grid-cols-[1.15fr_0.85fr] lg:py-28">
          <div className="animate-fade-up">
            <p className="eyebrow !text-maroon-200">Ngong · Kajiado County · Kenya</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-extrabold leading-[1.08] text-white sm:text-5xl lg:text-6xl">
              Building Bright Futures{" "}
              <span className="relative whitespace-nowrap text-maroon-200">
                Through Learning
                <span className="absolute -bottom-2 left-0 h-1 w-full rounded-full bg-maroon-700/70" />
              </span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-relaxed text-maroon-50 sm:text-lg">
              {home.supporting}
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/about" className="btn-light">
                Explore Our School
              </Link>
              <Link href="/admissions#enquiry" className="btn-outline-light">
                Enquire About Admission
              </Link>
            </div>
            <dl className="mt-12 grid max-w-xl grid-cols-2 gap-x-6 gap-y-4 border-t border-white/15 pt-6 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-maroon-200">Classes</dt>
                <dd className="mt-1 font-semibold text-white">Early years to Grade 9</dd>
              </div>
              <div>
                <dt className="text-maroon-200">Call the office</dt>
                <dd className="mt-1">
                  <a href={`tel:${site.phones[0].replace(/\s/g, "")}`} className="font-semibold text-maroon-200 hover:underline">
                    {site.phones[0]}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-maroon-200">Email</dt>
                <dd className="mt-1">
                  <a href={`mailto:${site.email}`} className="break-all font-semibold text-white hover:text-maroon-200">
                    {site.email}
                  </a>
                </dd>
              </div>
            </dl>
          </div>

          <aside className="float-slow hidden rounded-3xl border border-white/15 bg-white/10 p-8 backdrop-blur-md lg:block">
            <p className="eyebrow !text-maroon-200">Why families choose Mainflow</p>
            <ul className="mt-5 space-y-5">
              {[
                "Caring, family-like environment where every child is known by name",
                "Strong academic foundations for the transition to primary school",
                "Open-door policy for parents and guardians",
                "Conveniently located in Ngong, Kajiado County",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-maroon-50">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-maroon-700 text-ink-900">
                    <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M2.5 6.5l2.5 2.5 4.5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      {/* ---------- Welcome ---------- */}
      <section className="section bg-white">
        <div className="container-page grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <SectionHeading
              align="left"
              eyebrow="Karibu Mainflow"
              title="A welcoming school community in Ngong"
              description={content.about.introduction}
            />
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/about" className="btn-maroon">
                About our school
              </Link>
              <Link href="/contact" className="btn-outline-dark">
                Contact the office
              </Link>
            </div>
          </Reveal>

          <Reveal delayMs={120}>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { label: "Curriculum", value: "CBE curriculum", note: "Competency-Based Education" },
                { label: "Learning stage", value: "Early years to Grade 9", note: "Classes confirmed on request" },
                { label: "Enrolment", value: "Open enquiries", note: "Speak to the office today" },
                { label: "Contact", value: site.phones[0], note: site.email },
              ].map((stat) => (
                <div key={stat.label} className="card card-hover">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-maroon-600">{stat.label}</p>
                  <p className="mt-2 font-heading text-lg font-bold text-ink-900">{stat.value}</p>
                  <p className="mt-1 text-sm text-ink-500">{stat.note}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- Feature cards ---------- */}
      <section className="section bg-maroon-50/60">
        <div className="container-page">
          <Reveal>
            <SectionHeading
              eyebrow="Why Mainflow"
              title="Everything your child needs to thrive"
              description="Four commitments that shape teaching, care and partnership at Mainflow School."
            />
          </Reveal>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature, i) => (
              <Reveal key={feature.title} delayMs={i * 90}>
                <article className="card card-hover h-full">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-maroon-800 text-maroon-200">
                    {feature.icon}
                  </div>
                  <h3 className="mt-5 font-heading text-lg font-bold text-ink-900">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-ink-600">{feature.text}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Academics preview ---------- */}
      <section className="section bg-white">
        <div className="container-page">
          <Reveal>
            <SectionHeading
              eyebrow="Academics"
              title="A strong foundation for every learner"
              description={academics.approach}
            />
          </Reveal>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {academics.learningAreas.slice(0, 6).map((area, i) => (
              <Reveal key={area.title} delayMs={i * 70}>
                <div className="card card-hover h-full">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-maroon-100 font-heading text-sm font-bold text-maroon-600">
                      {i + 1}
                    </span>
                    <h3 className="font-heading text-base font-bold text-ink-900">{area.title}</h3>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-ink-600">{area.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <div className="mt-12 text-center">
              <Link href="/academics" className="btn-maroon">
                Explore academics
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- Gallery preview ---------- */}
      <section className="section bg-maroon-50/60">
        <div className="container-page">
          <Reveal>
            <SectionHeading
              eyebrow="School life"
              title="Moments from our school community"
              description="A glimpse of learning, play and creativity at Mainflow. Approved school photographs are added here as they become available."
            />
          </Reveal>
          <div className="mt-12 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3">
            {galleryPreview.map((item, i) => (
              <Reveal key={item.id} delayMs={i * 60}>
                <figure className="card overflow-hidden !p-0 transition-transform duration-300 hover:-translate-y-1">
                  {item.src && !item.isPlaceholder ? (
                    <img src={item.src} alt={item.alt || item.title} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                  ) : (
                    <PhotoArt
                      motif={categoryMotif(item.category)}
                      className="aspect-[4/3] w-full"
                      label="Photo to be added"
                    />
                  )}
                  <figcaption className="px-4 py-3 text-sm font-medium text-ink-700">{item.title}</figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <div className="mt-12 text-center">
              <Link href="/gallery" className="btn-outline-dark">
                View full gallery
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
