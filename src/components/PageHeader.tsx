import Link from "next/link";

export function PageHeader({
  eyebrow,
  title,
  description,
  breadcrumb,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  breadcrumb?: { label: string; href?: string }[];
}) {
  return (
    <section className="relative overflow-hidden bg-maroon-900">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(900px 320px at 85% -10%, rgba(204,115,130,0.24), transparent 60%), radial-gradient(700px 300px at -10% 120%, rgba(117,26,41,0.5), transparent 60%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
          backgroundSize: "26px 26px",
        }}
      />
      <div className="container-page relative py-14 md:py-20">
        {breadcrumb ? (
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex flex-wrap items-center gap-2 text-xs font-medium text-maroon-200">
              {breadcrumb.map((crumb, i) => (
                <li key={crumb.label} className="flex items-center gap-2">
                  {i > 0 && <span aria-hidden="true">/</span>}
                  {crumb.href ? (
                    <Link href={crumb.href} className="transition-colors hover:text-maroon-200">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span aria-current="page" className="text-maroon-200">
                      {crumb.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        ) : null}
        {eyebrow ? <p className="eyebrow !text-maroon-200">{eyebrow}</p> : null}
        <h1 className="mt-3 max-w-3xl text-3xl font-bold text-white sm:text-4xl lg:text-[2.9rem]">
          {title}
        </h1>
        {description ? (
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-maroon-100 sm:text-lg">
            {description}
          </p>
        ) : null}
      </div>
      <div className="h-1 w-full bg-gradient-to-r from-maroon-700 via-maroon-400 to-maroon-700" />
    </section>
  );
}
