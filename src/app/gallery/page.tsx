import type { Metadata } from "next";
import Link from "next/link";
import { getContent } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { GalleryClient } from "@/components/GalleryClient";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Gallery — Photos of School Life",
  description:
    "Photo gallery of Mainflow School, Ngong: classroom learning, science activities, sports, creativity and school events.",
  alternates: { canonical: "/gallery" },
};

export default function GalleryPage() {
  const { gallery } = getContent();
  const hasRealPhotos = gallery.some((g) => g.published && g.src && !g.isPlaceholder);

  return (
    <>
      <PageHeader
        eyebrow="Gallery"
        title="Photos from our school"
        description="Browse classroom learning, science activities, sport, creativity and school events at Mainflow School."
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Gallery" }]}
      />

      <section className="section bg-white">
        <div className="container-page">
          {!hasRealPhotos ? (
            <Reveal>
              <div className="mb-10 rounded-2xl border border-dashed border-maroon-400 bg-maroon-50/60 p-5 text-sm text-ink-700">
                <p className="font-semibold">📸 Approved school photographs are on the way.</p>
                <p className="mt-1 text-ink-600">
                  The tiles below are clearly-labelled illustrations, not photographs of the school.
                  Genuine school photographs will be published here once provided and approved by the
                  school — including written permission for any image showing identifiable children.
                </p>
              </div>
            </Reveal>
          ) : null}

          <GalleryClient items={gallery} />

          <Reveal>
            <div className="mt-14 rounded-3xl bg-maroon-50/70 p-8 text-center sm:p-10">
              <h2 className="font-heading text-xl font-bold text-ink-900">Photography & permissions</h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-ink-600">
                The school publishes photographs only with the permission of parents and guardians.
                If you have photographs from school events you would like to share, or need to
                request the removal of an image, please{" "}
                <Link href="/contact" className="link-accent">
                  contact the school office
                </Link>
                .
              </p>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
