import Link from "next/link";
import { Logo } from "./Logo";
import { getContent } from "@/lib/store";

export function Footer() {
  const { site } = getContent();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-maroon-950 text-maroon-50">
      <div className="container-page grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-4 lg:py-20">
        <div className="max-w-sm">
          <Logo onDark />
          <p className="mt-4 font-heading text-sm font-semibold uppercase tracking-[0.22em] text-maroon-300">
            Unlock Every Potential
          </p>
          <p className="mt-4 text-sm leading-relaxed text-maroon-100">
            A private school in Ngong, Kajiado County, Kenya, committed to strong
            academic foundations, good values and a caring learning environment.
          </p>
        </div>

        <nav aria-label="Footer navigation">
          <h2 className="font-heading text-sm font-semibold uppercase tracking-[0.18em] text-maroon-300">
            Explore
          </h2>
          <ul className="mt-5 space-y-3 text-sm">
            {[
              { href: "/about", label: "About Us" },
              { href: "/academics", label: "Academics" },
              { href: "/school-life", label: "School Life" },
              { href: "/admissions", label: "Admissions" },
              { href: "/gallery", label: "Gallery" },
              { href: "/contact", label: "Contact" },
            ].map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-maroon-100 transition-colors hover:text-maroon-200">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="font-heading text-sm font-semibold uppercase tracking-[0.18em] text-maroon-300">
            Contact
          </h2>
          <ul className="mt-5 space-y-3 text-sm text-maroon-100">
            {site.phones.map((phone) => (
              <li key={phone}>
                <a
                  href={`tel:${phone.replace(/\s/g, "")}`}
                  className="transition-colors hover:text-maroon-200"
                >
                  {phone}
                </a>
              </li>
            ))}
            <li>
              <a href={`mailto:${site.email}`} className="break-all transition-colors hover:text-maroon-200">
                {site.email}
              </a>
            </li>
            <li>{site.postalAddress}</li>
          </ul>
        </div>

        <div>
          <h2 className="font-heading text-sm font-semibold uppercase tracking-[0.18em] text-maroon-300">
            Visit
          </h2>
          <p className="mt-5 text-sm leading-relaxed text-maroon-100">
            You are welcome to visit the school during working hours. Please call ahead so a member
            of staff can receive you.
          </p>
          <Link
            href="/admissions#enquiry"
            className="btn-outline-light mt-6 w-full !border-maroon-400/70 !text-maroon-100"
          >
            Enquire About Admission
          </Link>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-3 py-6 text-xs text-maroon-200 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} Mainflow School, Ngong, Kajiado County. All rights reserved.
          </p>
          <p className="max-w-xl">
            Details on this site are published in good faith and are subject to confirmation by the
            school office.
          </p>
          <Link href="/login" className="transition-colors hover:text-maroon-200">
            Staff login
          </Link>
        </div>
      </div>
    </footer>
  );
}
