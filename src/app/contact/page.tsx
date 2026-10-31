import type { Metadata } from "next";
import { getContent } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { EnquiryForm } from "@/components/EnquiryForm";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Contact Mainflow School in Ngong, Kajiado County: phone 0725 958 589 / 0722 751 770, email mainflowp@yahoo.com, P.O. Box 1199, Ngong Hills.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  const { site } = getContent();
  const telHref = (p: string) => `tel:${p.replace(/[^\d]/g, "").replace(/^0/, "+254")}`;

  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="We would love to hear from you"
        description="Call, email or visit Mainflow School in Ngong, Kajiado County. Our office is ready to help with admissions and general enquiries."
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Contact" }]}
      />

      <section className="section bg-white">
        <div className="container-page grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
          {/* Contact details */}
          <Reveal>
            <SectionHeading align="left" eyebrow="Reach us" title="Contact details" />
            <ul className="mt-8 space-y-4">
              {site.phones.map((phone) => (
                <li key={phone}>
                  <a href={telHref(phone)} className="card card-hover flex items-center gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-maroon-800 text-maroon-200">
                      <svg viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                        <path d="M4.2 2.5c.5 0 1 .3 1.2.8l1.3 3a1.4 1.4 0 0 1-.4 1.6L5 9a11 11 0 0 0 5 5l1.1-1.3c.4-.4 1-.6 1.6-.4l3 1.3c.5.2.8.7.8 1.2v2.4c0 .9-.8 1.7-1.7 1.5C8.4 18 2 11.6 1.7 4.2 1.7 3.3 2.4 2.5 3.3 2.5h.9z" />
                      </svg>
                    </span>
                    <span>
                      <span className="block text-xs uppercase tracking-wider text-ink-400">Phone</span>
                      <span className="font-heading text-lg font-bold text-ink-900">{phone}</span>
                    </span>
                  </a>
                </li>
              ))}
              <li>
                <a href={`mailto:${site.email}`} className="card card-hover flex items-center gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-maroon-800 text-maroon-200">
                    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                      <rect x="2" y="4" width="16" height="12" rx="2" />
                      <path d="M3 6l7 5 7-5" strokeLinecap="round" />
                    </svg>
                  </span>
                  <span>
                    <span className="block text-xs uppercase tracking-wider text-ink-400">Email</span>
                    <span className="break-all font-heading text-lg font-bold text-ink-900">{site.email}</span>
                  </span>
                </a>
              </li>
              <li>
                <div className="card flex items-center gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-maroon-800 text-maroon-200">
                    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                      <rect x="3" y="4" width="14" height="12" rx="2" />
                      <path d="M3 8h14" strokeLinecap="round" />
                    </svg>
                  </span>
                  <span>
                    <span className="block text-xs uppercase tracking-wider text-ink-400">Postal address</span>
                    <span className="font-heading text-base font-bold text-ink-900">{site.postalAddress}</span>
                  </span>
                </div>
              </li>
            </ul>
          </Reveal>

          {/* Contact form */}
          <Reveal delayMs={120}>
            <div id="contact-form" className="card scroll-mt-24 !p-6 sm:!p-8">
              <h2 className="font-heading text-2xl font-bold text-ink-900">Send us a message</h2>
              <p className="mt-2 text-sm text-ink-600">
                Fill in the form and the school office will get back to you. For urgent matters,
                please call instead.
              </p>
              <div className="mt-6">
                <EnquiryForm type="general" compact />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Visit band */}
      <section className="section bg-maroon-900">
        <div className="container-page grid items-center gap-8 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="eyebrow !text-maroon-200">Visit the school</p>
            <h2 className="mt-3 font-heading text-3xl font-bold text-white">You are welcome to visit</h2>
            <p className="mt-4 max-w-2xl text-maroon-100">
              Parents and guardians are welcome to see the school during working hours. Please call
              ahead so that a member of staff can receive you, show you around and answer your
              questions.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            <a href={telHref(site.phones[0])} className="btn-light">
              Call {site.phones[0]}
            </a>
            <a
              href={`mailto:${site.email}`}
              className="btn-outline-light"
            >
              Email the office
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
