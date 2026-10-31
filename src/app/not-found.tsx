import Link from "next/link";

export default function NotFound() {
  return (
    <section className="flex min-h-[60vh] items-center justify-center bg-maroon-50/60 px-4 py-20">
      <div className="max-w-lg text-center">
        <p className="font-heading text-7xl font-extrabold text-maroon-700">404</p>
        <h1 className="mt-4 font-heading text-2xl font-bold text-ink-900">Page not found</h1>
        <p className="mt-3 text-ink-600">
          The page you are looking for does not exist or may have been moved.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/" className="btn-maroon">
            Back to home
          </Link>
          <Link href="/contact" className="btn-outline-dark">
            Contact the school
          </Link>
        </div>
      </div>
    </section>
  );
}
