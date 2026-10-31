"use client";

import { useState } from "react";
import type { SectionProps } from "../CbcApp";
import { CbcBadge, CbcButton, CbcNotice, CbcTextarea } from "../ui";
import { SectionHeader } from "./common";

/**
 * AI Learning Assistant.
 *
 * Two clearly separated modes:
 *  - Curriculum lookup: searches the seeded curriculum reference — always
 *    available, answers are sourced and never invented.
 *  - AI suggestions: only works when an AI provider is configured on the
 *    server. When it isn't, we say exactly that instead of faking replies.
 */

interface Match {
  gradeLabel: string;
  learningArea: string;
  strand: string;
  substrand: string;
  code: string;
  outcome: string;
}

type Source = "curriculum-reference" | "ai-generated" | null;

const SUGGESTIONS = [
  "Counting numbers 1 to 10",
  "listening and speaking",
  "fractions",
  "photosynthesis",
];

export function AssistantSection({ ctx }: SectionProps) {
  const [mode, setMode] = useState<"lookup" | "ai">("lookup");
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [source, setSource] = useState<Source>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [needsConfig, setNeedsConfig] = useState(false);

  async function ask(text: string, askMode: "lookup" | "ai") {
    const q = text.trim();
    if (q.length < 3) {
      setError("Please type a question (at least 3 characters).");
      return;
    }
    setBusy(true);
    setError(null);
    setAnswer(null);
    setMatches([]);
    setNeedsConfig(false);
    setSource(null);
    try {
      const res = await fetch("/api/cbc/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode: askMode, prompt: q }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 503 && json.needsConfiguration) {
        setNeedsConfig(true);
        setError(json.error ?? "AI suggestions are not configured on this server.");
        return;
      }
      if (!res.ok || !json.ok) {
        setError(json.error ?? "The assistant could not answer that. Try again.");
        return;
      }
      setAnswer(json.answer as string);
      setSource(json.source as Source);
      setMatches((json.matches as Match[]) ?? []);
    } catch {
      setError("Network error — check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <SectionHeader
        title="AI Learning Assistant"
        hint="Ask about CBC outcomes, or draft lesson ideas and practice questions."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Composer */}
        <div className="cbc-card">
          <div className="mb-3 flex flex-wrap gap-1.5" role="tablist" aria-label="Assistant mode">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "lookup"}
              onClick={() => setMode("lookup")}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                mode === "lookup" ? "bg-maroon-700 text-white" : "text-ink-600 hover:bg-ink-50"
              }`}
            >
              Curriculum lookup
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "ai"}
              onClick={() => setMode("ai")}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                mode === "ai" ? "bg-maroon-700 text-white" : "text-ink-600 hover:bg-ink-50"
              }`}
            >
              AI suggestions
            </button>
          </div>

          <CbcNotice kind={mode === "lookup" ? "ok" : "info"}>
            {mode === "lookup" ? (
              <>
                <strong>Verified source:</strong> answers come from the seeded curriculum reference
                (KICD-aligned outcome codes) — never invented.
              </>
            ) : (
              <>
                <strong>AI-generated:</strong> suggestions are drafts from an AI provider and must be
                reviewed against official curriculum designs before classroom use.
              </>
            )}
          </CbcNotice>

          <form
            className="mt-4"
            onSubmit={(e) => {
              e.preventDefault();
              void ask(prompt, mode);
            }}
          >
            <label className="block">
              <span className="mb-1 block text-[13px] font-semibold text-ink-900">
                {mode === "lookup"
                  ? "Search a topic, strand or outcome code"
                  : "What would you like help preparing?"}
              </span>
              <CbcTextarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                placeholder={
                  mode === "lookup"
                    ? "e.g. counting numbers 1–10, PP.1.1, listening and speaking"
                    : "e.g. generate 5 practice questions on Grade 4 fractions with answers"
                }
              />
            </label>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <CbcButton type="submit" disabled={busy}>
                {busy ? "Working…" : mode === "lookup" ? "Search curriculum" : "Generate suggestions"}
              </CbcButton>
              {prompt ? (
                <CbcButton type="button" variant="ghost" onClick={() => setPrompt("")}>
                  Clear
                </CbcButton>
              ) : null}
              {busy ? (
                <span className="text-xs text-ink-500" role="status">
                  Asking…
                </span>
              ) : null}
            </div>
          </form>

          <div className="mt-4 border-t border-ink-100 pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Try</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setPrompt(s);
                    void ask(s, mode);
                  }}
                  className="rounded-full border border-ink-200 bg-white px-2.5 py-1 text-xs font-medium text-ink-600 transition-colors hover:border-maroon-300 hover:text-maroon-800"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Result */}
        <div className="cbc-card">
          <div className="flex items-center justify-between gap-2 border-b border-ink-100 pb-3">
            <h2 className="font-heading text-base font-bold text-ink-900">Answer</h2>
            {source ? (
              <CbcBadge tone={source === "curriculum-reference" ? "blue" : "amber"}>
                {source === "curriculum-reference" ? "Verified curriculum" : "AI-generated"}
              </CbcBadge>
            ) : null}
          </div>

          {error ? (
            <div className="mt-3">
              <CbcNotice kind="err">{error}</CbcNotice>
              {needsConfig ? (
                <p className="mt-2 text-xs leading-relaxed text-ink-500">
                  To enable AI suggestions, add <code className="rounded bg-ink-100 px-1">AI_API_KEY</code>{" "}
                  (and optionally <code className="rounded bg-ink-100 px-1">AI_BASE_URL</code> /{" "}
                  <code className="rounded bg-ink-100 px-1">AI_MODEL</code>) to{" "}
                  <code className="rounded bg-ink-100 px-1">.env.local</code> and restart the
                  server. Curriculum lookup above works with no configuration.
                </p>
              ) : null}
            </div>
          ) : null}

          {answer ? (
            <div className="mt-3 space-y-3">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-700">{answer}</p>

              {matches.length ? (
                <ul className="space-y-2">
                  {matches.map((m) => (
                    <li key={`${m.code}-${m.outcome}`} className="rounded-lg border border-ink-100 bg-white px-3 py-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded bg-ink-900 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                          {m.code}
                        </span>
                        <span className="text-xs font-semibold text-ink-700">
                          {m.gradeLabel} · {m.learningArea}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-ink-800">{m.outcome}</p>
                      <p className="mt-0.5 text-xs text-ink-500">
                        {m.strand} → {m.substrand}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : !error ? (
            <p className="mt-4 text-sm text-ink-500">
              Ask a question on the left. Curriculum lookup searches the seeded reference data;
              AI suggestions draft lesson ideas and practice questions when an AI provider is
              configured.
            </p>
          ) : null}

          <div className="mt-5 border-t border-ink-100 pt-3 text-xs leading-relaxed text-ink-500">
            This assistant never replaces official KICD curriculum designs — confirm exact outcome
            wording and assessment standards against the official documents before classroom use.
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-ink-500">
        Signed in as {ctx.me.fullName} · requests are rate-limited per account.
      </p>
    </div>
  );
}
