import type { Metadata } from "next";
import Link from "next/link";
import { getContent } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { FaqList } from "@/components/FaqList";
import { EnquiryForm } from "@/components/EnquiryForm";

export const metadata: Metadata = {
  title: "Admissions — How to Apply",
  description:
    "How to apply to Mainflow School, Ngong: admission steps, required documents, school visits, FAQs and an online enquiry form. Call 0725 958 589.",
  alternates: { canonical: "/admissions" },
};

export default function AdmissionsPage() {
  const { admissions, faqs } = getContent();

  return (
    <>
      <PageHeader
        eyebrow="Admissions"
        title="Join the Mainflow family"
        description={admissions.intro}
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Admissions" }]}
      />

      {/* Steps */}
      <section className="section bg-white">
        <div className="container-page">
          <Reveal>
            <SectionHeading
              eyebrow="How to apply"
              title="Five simple steps to admission"
              description="Our admissions team guides every family through the process personally."
            />
          </Reveal>
          <ol className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {admissions.steps.map((step, i) => (
              <Reveal key={step.title} delayMs={i * 80} as="li">
                <div className="card card-hover h-full">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-maroon-700 font-heading text-base font-bold text-ink-900">
                    {i + 1}
                  </span>
                  <h3 className="mt-4 font-heading text-base font-bold text-ink-900">{step.title.replace(/^\d+\.\s*/, "")}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-600">{step.description}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* Grades + documents + visits + fees */}
      <section className="section bg-maroon-50/60">
        <div className="container-page grid gap-6 lg:grid-cols-2">
          <Reveal>
            <div className="card h-full">
              <h2 className="font-heading text-xl font-bold text-ink-900">Grades open for admission</h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-600">{admissions.gradesOffered}</p>
            </div>
          </Reveal>
          <Reveal delayMs={80}>
            <div className="card h-full">
              <h2 className="font-heading text-xl font-bold text-ink-900">School visits</h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-600">{admissions.visits}</p>
            </div>
          </Reveal>
          <Reveal delayMs={120}>
            <div className="card h-full">
              <h2 className="font-heading text-xl font-bold text-ink-900">Required documents</h2>
              <p className="mt-2 text-xs font-medium uppercase tracking-wider text-maroon-600">
                Typical requirements — the school office confirms the final list
              </p>
              <ul className="mt-4 space-y-2.5">
                {admissions.documents.map((doc) => (
                  <li key={doc} className="flex items-start gap-2.5 text-sm text-ink-700">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-maroon-100 text-ink-700">
                      <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <path d="M2.5 6.5l2.5 2.5 4.5-5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    {doc}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delayMs={160}>
            <div className="card h-full border-maroon-200 bg-maroon-50/50">
              <h2 className="font-heading text-xl font-bold text-ink-900">School fees</h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-700">{admissions.feesNote}</p>
              <a href="tel:+254725958589" className="btn-maroon mt-5">
                Call for the fee structure
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Enquiry form */}
      <section id="enquiry" className="section scroll-mt-24 bg-white">
        <div className="container-page grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <Reveal>
            <SectionHeading
              align="left"
              eyebrow="Admission enquiry"
              title="Request a call back from the office"
              description="Fill in the form and a member of the school office will contact you to guide you through the next steps. You can also call us directly."
            />
            <div className="mt-8 space-y-3">
              <a href="tel:+254725958589" className="card card-hover flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-maroon-800 text-maroon-200">
                  <svg viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                    <path d="M4.2 2.5c.5 0 1 .3 1.2.8l1.3 3a1.4 1.4 0 0 1-.4 1.6L5 9a11 11 0 0 0 5 5l1.1-1.3c.4-.4 1-.6 1.6-.4l3 1.3c.5.2.8.7.8 1.2v2.4c0 .9-.8 1.7-1.7 1.5C8.4 18 2 11.6 1.7 4.2 1.7 3.3 2.4 2.5 3.3 2.5h.9z" />
                  </svg>
                </span>
                <span>
                  <span className="block text-xs uppercase tracking-wider text-ink-400">Call</span>
                  <span className="font-heading font-bold text-ink-900">0725 958 589</span>
                </span>
              </a>
              <a href="tel:+254722751770" className="card card-hover flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-maroon-800 text-maroon-200">
                  <svg viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                    <path d="M4.2 2.5c.5 0 1 .3 1.2.8l1.3 3a1.4 1.4 0 0 1-.4 1.6L5 9a11 11 0 0 0 5 5l1.1-1.3c.4-.4 1-.6 1.6-.4l3 1.3c.5.2.8.7.8 1.2v2.4c0 .9-.8 1.7-1.7 1.5C8.4 18 2 11.6 1.7 4.2 1.7 3.3 2.4 2.5 3.3 2.5h.9z" />
                  </svg>
                </span>
                <span>
                  <span className="block text-xs uppercase tracking-wider text-ink-400">Call</span>
                  <span className="font-heading font-bold text-ink-900">0722 751 770</span>
                </span>
              </a>
              <a href="mailto:mainflowp@yahoo.com" className="card card-hover flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-maroon-800 text-maroon-200">
                  <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <rect x="2" y="4" width="16" height="12" rx="2" />
                    <path d="M3 6l7 5 7-5" strokeLinecap="round" />
                  </svg>
                </span>
                <span>
                  <span className="block text-xs uppercase tracking-wider text-ink-400">Email</span>
                  <span className="break-all font-heading font-bold text-ink-900">mainflowp@yahoo.com</span>
                </span>
              </a>
            </div>
          </Reveal>

          <Reveal delayMs={120}>
            <div className="card !p-6 sm:!p-8">
              <EnquiryForm type="admission" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* FAQs */}
      <section className="section bg-maroon-50/60">
        <div className="container-page max-w-4xl">
          <Reveal>
            <SectionHeading
              eyebrow="FAQs"
              title="Admissions questions, answered"
              description="Here are the questions parents ask us most often."
            />
          </Reveal>
          <Reveal>
            <div className="mt-12">
              <FaqList items={faqs} />
            </div>
          </Reveal>
          <Reveal>
            <p className="mt-8 text-center text-sm text-ink-500">
              Still have a question? Call{" "}
              <a href="tel:+254725958589" className="link-accent">
                0725 958 589
              </a>{" "}
              or{" "}
              <Link href="/contact" className="link-accent">
                contact us
              </Link>
              .
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
