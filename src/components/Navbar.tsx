"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/academics", label: "Academics" },
  { href: "/school-life", label: "School Life" },
  { href: "/admissions", label: "Admissions" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? "border-maroon-800/60 bg-maroon-900/95 shadow-[0_10px_30px_-18px_rgba(6,15,33,0.9)] backdrop-blur"
          : "border-maroon-800/40 bg-maroon-900"
      }`}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-maroon-700 focus:px-4 focus:py-2 focus:font-semibold focus:text-ink-900"
      >
        Skip to main content
      </a>
      <div className="container-page flex h-18 items-center justify-between py-3 md:h-20">
        <Link href="/" aria-label="Mainflow School — home">
          <Logo onDark />
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={`rounded-full px-3.5 py-2 text-sm font-medium transition-colors duration-200 ${
                isActive(link.href)
                  ? "bg-white/10 text-maroon-200"
                  : "text-maroon-50 hover:bg-white/5 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/admissions#enquiry" className="btn-light ml-3 !px-5 !py-2.5 text-[13px]">
            Enquire Now
          </Link>
          <Link
            href="/login"
            aria-label="Staff login"
            className="ml-2 rounded-full px-3 py-2 text-xs font-medium text-maroon-300 underline-offset-4 transition-colors hover:text-white hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon-200"
          >
            Staff
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 text-white transition-colors hover:border-maroon-300 hover:text-maroon-200 lg:hidden"
        >
          <span className="relative block h-4 w-6">
            <span
              className={`absolute left-0 h-0.5 w-6 rounded bg-current transition-all duration-300 ${
                open ? "top-1.5 rotate-45" : "top-0"
              }`}
            />
            <span
              className={`absolute left-0 top-1.5 h-0.5 w-6 rounded bg-current transition-all duration-300 ${
                open ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`absolute left-0 h-0.5 w-6 rounded bg-current transition-all duration-300 ${
                open ? "top-1.5 -rotate-45" : "top-3"
              }`}
            />
          </span>
        </button>
      </div>

      {/* Mobile menu */}
      <div
        id="mobile-menu"
        className={`fixed inset-x-0 top-18 bottom-0 z-40 overflow-y-auto bg-maroon-900/98 backdrop-blur transition-all duration-300 md:top-20 lg:hidden ${
          open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0"
        }`}
      >
        <nav aria-label="Mobile navigation" className="container-page flex flex-col gap-1 py-6">
          {NAV_LINKS.map((link, i) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              style={{ transitionDelay: open ? `${60 + i * 40}ms` : "0ms" }}
              className={`flex items-center justify-between rounded-xl px-4 py-4 font-heading text-lg font-semibold transition-all duration-300 ${
                isActive(link.href)
                  ? "bg-white/10 text-maroon-200"
                  : "text-white hover:bg-white/5"
              } ${open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}
            >
              {link.label}
              <svg viewBox="0 0 20 20" className="h-4 w-4 text-maroon-300" fill="currentColor" aria-hidden="true">
                <path d="M7.3 4.3a1 1 0 0 1 1.4 0l6 6a1 1 0 0 1 0 1.4l-6 6a1 1 0 1 1-1.4-1.4L12.58 11 7.3 5.7a1 1 0 0 1 0-1.4z" />
              </svg>
            </Link>
          ))}
          <Link
            href="/admissions#enquiry"
            onClick={() => setOpen(false)}
            className="btn-light mt-4 w-full"
          >
            Enquire About Admission
          </Link>
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="mt-3 rounded-xl border border-white/20 px-4 py-3 text-center text-sm font-semibold text-maroon-100 transition-colors hover:border-maroon-300 hover:text-white"
          >
            Staff login
          </Link>
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-maroon-50">
            <p className="font-semibold text-white">Call the school office</p>
            <a href="tel:+254725958589" className="mt-2 block text-maroon-200 hover:underline">
              0725 958 589
            </a>
            <a href="tel:+254722751770" className="block text-maroon-200 hover:underline">
              0722 751 770
            </a>
            <a href="mailto:mainflowp@yahoo.com" className="mt-2 block break-all text-maroon-50 hover:text-white hover:underline">
              mainflowp@yahoo.com
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
}
