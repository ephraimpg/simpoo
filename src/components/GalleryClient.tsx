"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { GALLERY_CATEGORIES, type GalleryCategory, type GalleryItem } from "@/lib/content-schema";
import { PhotoArt, categoryMotif } from "./PhotoArt";

/**
 * Responsive gallery with category filters and a full-screen lightbox.
 * Placeholder tiles are clearly labelled as illustrations, never as photographs.
 */
export function GalleryClient({ items }: { items: GalleryItem[] }) {
  const [filter, setFilter] = useState<GalleryCategory | "all">("all");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const list = items.filter((i) => i.published);
    return (filter === "all" ? list : list.filter((i) => i.category === filter)).sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );
  }, [items, filter]);

  const active = activeIndex !== null ? filtered[activeIndex] : null;

  const close = useCallback(() => setActiveIndex(null), []);
  const step = useCallback(
    (dir: number) => {
      setActiveIndex((idx) => {
        if (idx === null || filtered.length === 0) return idx;
        return (idx + dir + filtered.length) % filtered.length;
      });
    },
    [filtered.length],
  );

  useEffect(() => {
    if (activeIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [activeIndex, close, step]);

  return (
    <div>
      <div role="toolbar" aria-label="Filter photos by category" className="flex flex-wrap justify-center gap-2 sm:gap-3">
        {GALLERY_CATEGORIES.map((cat) => {
          const selected = filter === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setFilter(cat.id);
                setActiveIndex(null);
              }}
              aria-pressed={selected}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                selected
                  ? "bg-maroon-800 text-white shadow-[0_10px_24px_-12px_rgba(10,23,49,0.8)]"
                  : "border border-ink-200 bg-white text-ink-600 hover:border-maroon-300 hover:text-ink-900"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-ink-200 bg-maroon-50/40 p-12 text-center">
          <p className="font-heading text-lg font-semibold text-ink-800">No photos in this category yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-500">
            Approved photographs will appear here once they have been added by the school.
          </p>
        </div>
      ) : (
        <ul className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item, index) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setActiveIndex(index)}
                className="card group block w-full overflow-hidden !p-0 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_48px_-20px_rgba(10,23,49,0.35)]"
                aria-label={`Open image: ${item.title}`}
              >
                {item.src && !item.isPlaceholder ? (
                  <img
                    src={item.src}
                    alt={item.alt || item.title}
                    loading="lazy"
                    className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                ) : (
                  <PhotoArt
                    motif={categoryMotif(item.category)}
                    className="aspect-[4/3] w-full transition-transform duration-500 group-hover:scale-[1.04]"
                    label="Photo to be added"
                  />
                )}
                <div className="flex items-center justify-between gap-3 px-5 py-4">
                  <div>
                    <p className="font-heading text-sm font-semibold text-ink-900">{item.title}</p>
                    <p className="mt-0.5 text-xs text-ink-500">{item.caption}</p>
                  </div>
                  <span
                    aria-hidden="true"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-maroon-50 text-ink-700 transition-colors group-hover:bg-maroon-700 group-hover:text-white"
                  >
                    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 4H4v8M4 4l7 7M8 16h8V8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Full-screen lightbox */}
      {active ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Photo viewer: ${active.title}`}
          className="fixed inset-0 z-[70] flex flex-col bg-maroon-950/97 backdrop-blur-sm"
          onClick={close}
        >
          <div className="flex items-center justify-between px-4 py-4 sm:px-6">
            <p className="font-heading text-sm font-semibold text-white sm:text-base">
              {active.title}
              <span className="ml-2 text-xs font-normal text-maroon-200">
                {filtered.indexOf(active) + 1} / {filtered.length}
              </span>
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                close();
              }}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:border-maroon-300 hover:text-maroon-200"
              aria-label="Close photo viewer"
              autoFocus
            >
              <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="flex flex-1 items-center justify-center px-3 pb-2 sm:px-16" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous photo"
              className="absolute left-2 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-maroon-900/70 text-white transition-colors hover:border-maroon-300 hover:text-maroon-200 sm:left-6"
            >
              <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 4l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {active.src && !active.isPlaceholder ? (
              <img
                src={active.src}
                alt={active.alt || active.title}
                className="max-h-[72vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
              />
            ) : (
              <div className="w-full max-w-4xl overflow-hidden rounded-2xl shadow-2xl">
                <PhotoArt motif={categoryMotif(active.category)} className="aspect-[16/10] w-full" label={null} />
              </div>
            )}

            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next photo"
              className="absolute right-2 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-maroon-900/70 text-white transition-colors hover:border-maroon-300 hover:text-maroon-200 sm:right-6"
            >
              <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M8 4l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          <div className="px-6 pb-8 pt-3 text-center" onClick={(e) => e.stopPropagation()}>
            <p className="mx-auto max-w-2xl text-sm text-maroon-100">{active.caption}</p>
            {active.isPlaceholder || !active.src ? (
              <p className="mx-auto mt-2 max-w-2xl text-xs text-maroon-200/90">
                Illustrated placeholder — this is not a photograph of the school. Approved school
                photographs will replace it.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
