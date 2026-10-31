import type { Metadata } from "next";
import Link from "next/link";
import { getContent } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { CtaBand } from "@/components/CtaBand";
import { PhotoArt, categoryMotif } from "@/components/PhotoArt";

export const metadata: Metadata = {
  title: "School Life",
  description:
    "Life at Mainflow School, Ngong — classroom learning, science activities, sport, creativity and school events in a caring community.",
  alternates: { canonical: "/school-life" },
};

const LIFE_AREAS = [
  {
    title: "Classroom learning",
    text: "Structured lessons, reading practice and guided work that build strong foundations in literacy and numeracy.",
    motif: "classroom" as const,
  },
  {
    title: "Science activities",
    text: "Hands-on exploration and simple experiments that teach children to observe, ask questions and think for themselves.",
    motif: "science" as const,
  },
  {
    title: "Sports & games",
    text: "Outdoor play and team games that build coordination, healthy habits and the spirit of fair play.",
    motif: "sports" as const,
  },
  {
    title: "Creativity",
    text: "Art, craft, music and movement give every child a chance to express themselves and discover their talents.",
    motif: "creativity" as const,
  },
  {
    title: "School events",
    text: "Assemblies, celebrations and special days that build community and give learners moments to shine.",
    motif: "events" as const,
  },
  {
    title: "Pastoral care",
    text: "A safe, disciplined and loving environment where teachers know each child and pastoral needs are handled with care.",
    motif: "campus" as const,
  },
];

export default function SchoolLifePage() {
  const { gallery, activities } = getContent();
  const preview = gallery.filter((g) => g.published).slice(0, 6);

  return (
    <>
      <PageHeader
        eyebrow="School life"
        title="A day at Mainflow"
        description="Learning, laughter, sport and creativity — discover what everyday life looks like for our learners in Ngong."
        breadcrumb={[{ label: "Home", href: "/" }, { label: "School Life" }]}
      />

      <section className="section bg-white">
        <div className="container-page">
          <Reveal>
            <SectionHeading
              eyebrow="Our community"
              title="Where children feel they belong"
              description="School life at Mainflow balances clear academic structure with care, play and creativity. Our aim is simple: a place where children are safe, happy and eager to learn."
            />
          </Reveal>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {LIFE_AREAS.map((area, i) => (
              <Reveal key={area.title} delayMs={i * 70}>
                <article className="card card-hover h-full overflow-hidden !p-0">
                  <PhotoArt motif={area.motif} className="aspect-[16/10] w-full" label="Photo to be added" />
                  <div className="p-6">
                    <h3 className="font-heading text-lg font-bold text-ink-900">{area.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-600">{area.text}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-maroon-50/60">
        <div className="container-page">
          <Reveal>
            <SectionHeading
              eyebrow="Beyond the classroom"
              title="Co-curricular activities"
              description="Learning at Mainflow extends past the classroom door. Our co-curricular programme gives every learner the chance to discover talents, make friends and grow in confidence."
            />
          </Reveal>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {activities.map((activity, i) => (
              <Reveal key={activity.title} delayMs={i * 60}>
                <article className="card card-hover h-full">
                  <span className="inline-flex items-center rounded-full bg-maroon-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-maroon-700">
                    Activity
                  </span>
                  <h3 className="mt-3 font-heading text-base font-bold text-ink-950">{activity.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-600">{activity.description}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container-page">
          <Reveal>
            <SectionHeading
              eyebrow="Gallery preview"
              title="Snapshots of school life"
              description="Browse photos by category in our gallery. Photographs are published only when approved by the school."
            />
          </Reveal>
          <div className="mt-12 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3">
            {preview.map((item, i) => (
              <Reveal key={item.id} delayMs={i * 60}>
                <figure className="card overflow-hidden !p-0 transition-transform duration-300 hover:-translate-y-1">
                  {item.src && !item.isPlaceholder ? (
                    <img src={item.src} alt={item.alt || item.title} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                  ) : (
                    <PhotoArt motif={categoryMotif(item.category)} className="aspect-[4/3] w-full" label="Photo to be added" />
                  )}
                  <figcaption className="px-4 py-3 text-sm font-medium text-ink-700">{item.title}</figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <div className="mt-12 text-center">
              <Link href="/gallery" className="btn-maroon">
                Open the full gallery
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <CtaBand title="Come and see school life for yourself" text="Book a visit to Mainflow School and experience our classrooms, grounds and community in person." />
    </>
  );
}
