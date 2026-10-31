import Link from "next/link";

/** Reusable admissions call-to-action band. */
export function CtaBand({
  title = "Give your child a strong start",
  text = "Admissions enquiries are open. Speak with the school office or send an enquiry online — we will guide you through the application process step by step.",
}: {
  title?: string;
  text?: string;
}) {
  return (
    <section className="relative overflow-hidden bg-maroon-900">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(700px 260px at 15% 0%, rgba(204,115,130,0.22), transparent 65%), radial-gradient(700px 300px at 90% 110%, rgba(117,26,41,0.55), transparent 60%)",
        }}
      />
      <div className="container-page relative grid items-center gap-10 py-16 md:py-20 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="eyebrow !text-maroon-200">Admissions</p>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">{title}</h2>
          <p className="mt-4 max-w-2xl text-maroon-100">{text}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
          <Link href="/admissions#enquiry" className="btn-light">
            Enquire About Admission
          </Link>
          <a href="tel:+254725958589" className="btn-outline-light">
            Call 0725 958 589
          </a>
        </div>
      </div>
    </section>
  );
}
