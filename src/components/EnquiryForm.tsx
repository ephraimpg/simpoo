"use client";

import { useState, type FormEvent } from "react";
import { GRADE_OPTIONS, type FieldErrors } from "@/lib/validation";

type Status = "idle" | "submitting" | "success" | "error";

export function EnquiryForm({
  type = "admission",
  compact = false,
}: {
  type?: "admission" | "general";
  compact?: boolean;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "submitting") return;
    setServerError(null);
    setReference(null);
    setStatus("submitting");

    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload = {
      type,
      guardianName: String(fd.get("guardianName") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      email: String(fd.get("email") ?? ""),
      gradeOfInterest: String(fd.get("gradeOfInterest") ?? ""),
      message: String(fd.get("message") ?? ""),
      website: String(fd.get("website") ?? ""),
    };

    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        fieldErrors?: FieldErrors;
        id?: string;
      };

      if (res.status === 429) {
        setStatus("error");
        setServerError(
          "Too many submissions from this device. Please wait a few minutes, or call the school office directly.",
        );
        return;
      }

      if (!res.ok || !data.ok) {
        if (data.fieldErrors) {
          setErrors(data.fieldErrors);
          setStatus("error");
          setServerError("Please correct the highlighted fields and try again.");
        } else {
          setStatus("error");
          setServerError(data.error ?? "Something went wrong. Please try again or call the school office.");
        }
        return;
      }

      setErrors({});
      setReference(data.id ?? null);
      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
      setServerError("Network error. Please check your connection and try again, or call the school office.");
    }
  }

  const err = (field: keyof FieldErrors) =>
    errors[field] ? (
      <p id={`${field}-error`} className="mt-1.5 text-xs font-medium text-maroon-600">
        {errors[field]}
      </p>
    ) : null;

  const invalid = (field: keyof FieldErrors) => (errors[field] ? "field-error" : "");

  if (status === "success") {
    return (
      <div
        role="status"
        className="rounded-2xl border border-ink-300 bg-ink-50 p-8 text-center"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-ink-900 text-white">
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h3 className="mt-4 font-heading text-xl font-bold text-ink-900">Thank you — your enquiry has been received</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-600">
          A member of the school office will contact you soon. If you need help urgently, please call
          <a href="tel:+254725958589" className="mx-1 font-semibold text-ink-800 underline decoration-maroon-500 underline-offset-4">
            0725 958 589
          </a>
          or
          <a href="tel:+254722751770" className="mx-1 font-semibold text-ink-800 underline decoration-maroon-500 underline-offset-4">
            0722 751 770
          </a>.
        </p>
        {reference ? (
          <p className="mt-3 text-xs text-ink-500">
            Your reference: <span className="font-mono font-semibold">{reference.slice(0, 8).toUpperCase()}</span>
          </p>
        ) : null}
        <button type="button" onClick={() => setStatus("idle")} className="btn-outline-dark mt-6">
          Send another enquiry
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {status === "error" && serverError ? (
        <div role="alert" className="rounded-xl border border-maroon-300 bg-maroon-50 px-4 py-3 text-sm font-medium text-maroon-700">
          {serverError}
        </div>
      ) : null}

      <div className={`grid gap-5 ${compact ? "" : "sm:grid-cols-2"}`}>
        <div>
          <label htmlFor="guardianName" className="mb-1.5 block text-sm font-semibold text-ink-800">
            Guardian / parent name <span className="text-maroon-500">*</span>
          </label>
          <input
            id="guardianName"
            name="guardianName"
            type="text"
            autoComplete="name"
            required
            aria-invalid={!!errors.guardianName}
            aria-describedby={errors.guardianName ? "guardianName-error" : undefined}
            className={`field ${invalid("guardianName")}`}
            placeholder="e.g. Jane Wanjiru"
          />
          {err("guardianName")}
        </div>
        <div>
          <label htmlFor="phone" className="mb-1.5 block text-sm font-semibold text-ink-800">
            Phone number <span className="text-maroon-500">*</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? "phone-error" : undefined}
            className={`field ${invalid("phone")}`}
            placeholder="e.g. 0725 958 589"
          />
          {err("phone")}
        </div>
      </div>

      <div className={`grid gap-5 ${compact ? "" : "sm:grid-cols-2"}`}>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-ink-800">
            Email address <span className="font-normal text-ink-400">(optional)</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            className={`field ${invalid("email")}`}
            placeholder="you@example.com"
          />
          {err("email")}
        </div>
        {type === "admission" ? (
          <div>
            <label htmlFor="gradeOfInterest" className="mb-1.5 block text-sm font-semibold text-ink-800">
              Grade of interest <span className="font-normal text-ink-400">(optional)</span>
            </label>
            <select
              id="gradeOfInterest"
              name="gradeOfInterest"
              defaultValue=""
              className={`field ${invalid("gradeOfInterest")}`}
            >
              <option value="">Select a grade…</option>
              {GRADE_OPTIONS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
            {err("gradeOfInterest")}
          </div>
        ) : null}
      </div>

      <div>
        <label htmlFor="message" className="mb-1.5 block text-sm font-semibold text-ink-800">
          How can we help? <span className="text-maroon-500">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={compact ? 4 : 5}
          required
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "message-error" : undefined}
          className={`field resize-y ${invalid("message")}`}
          placeholder="Tell us about your child and what you would like to know…"
        />
        {err("message")}
      </div>

      {/* Honeypot — invisible to humans, catches naive bots */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex flex-col gap-4 pt-1 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={status === "submitting"}
          className="btn-maroon w-full sm:w-auto"
        >
          {status === "submitting" ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
                <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              </svg>
              Sending…
            </>
          ) : (
            "Send enquiry"
          )}
        </button>
        <p className="text-xs text-ink-500">
          Your details are used only to respond to your enquiry.
        </p>
      </div>
    </form>
  );
}
