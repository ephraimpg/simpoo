export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "left";
}) {
  const centered = align === "center";
  return (
    <div className={centered ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      {eyebrow ? <p className={`eyebrow ${centered ? "" : "text-left"}`}>{eyebrow}</p> : null}
      <h2 className="mt-3 text-3xl font-bold text-ink-900 sm:text-4xl">{title}</h2>
      {description ? (
        <p className={`mt-5 text-base leading-relaxed text-ink-600 sm:text-lg ${centered ? "mx-auto" : ""}`}>
          {description}
        </p>
      ) : null}
      <div className={`mt-6 h-1 w-20 rounded-full bg-maroon-700 ${centered ? "mx-auto" : ""}`} />
    </div>
  );
}
