export function FaqList({ items }: { items: { question: string; answer: string }[] }) {
  if (items.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-ink-200 bg-maroon-50/50 p-6 text-sm text-ink-500">
        No questions have been published yet. Please contact the school office for any enquiry.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <details
          key={item.question}
          className="group card overflow-hidden !p-0 transition-colors hover:border-maroon-300"
          open={i === 0}
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 font-heading text-base font-semibold text-ink-900 [&::-webkit-details-marker]:hidden">
            {item.question}
            <span
              aria-hidden="true"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-maroon-50 text-ink-700 transition-transform duration-300 group-open:rotate-45"
            >
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor">
                <path d="M8 2a1 1 0 0 1 1 1v4h4a1 1 0 1 1 0 2H9v4a1 1 0 1 1-2 0V9H3a1 1 0 1 1 0-2h4V3a1 1 0 0 1 1-1z" />
              </svg>
            </span>
          </summary>
          <p className="px-6 pb-6 text-sm leading-relaxed text-ink-600">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
