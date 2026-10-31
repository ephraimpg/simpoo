import { getContent } from "@/lib/store";

/**
 * Floating WhatsApp button — rendered ONLY when an official WhatsApp number has
 * been configured in the admin dashboard. It is never guessed.
 */
export function WhatsAppButton() {
  const { site } = getContent();
  if (!site.whatsapp) return null;

  const digits = site.whatsapp.replace(/[^\d]/g, "");
  const international = digits.startsWith("254") ? digits : `254${digits.replace(/^0/, "")}`;
  const href = `https://wa.me/${international}?text=${encodeURIComponent(
    "Hello Mainflow School, I would like to enquire about admissions.",
  )}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-semibold text-ink-950 shadow-[0_12px_28px_-10px_rgba(0,0,0,0.5)] transition-transform duration-300 hover:scale-105 sm:bottom-7 sm:right-7"
      aria-label="Chat with the school on WhatsApp"
    >
      <svg viewBox="0 0 32 32" className="h-5 w-5" fill="currentColor" aria-hidden="true">
        <path d="M16 3C9.4 3 4 8.3 4 14.9c0 2.6.8 5 2.3 7L4 29l7.3-2.3c1.9 1 3.9 1.5 4.7 1.5 6.6 0 12-5.3 12-11.9C28 8.3 22.6 3 16 3zm0 21.8c-1.5 0-3.2-.5-4.6-1.3l-.3-.2-4.3 1.4 1.4-4.2-.2-.3c-1-1.5-1.5-3.2-1.5-4.9C6.5 9.7 10.7 5.5 16 5.5S25.5 9.7 25.5 14.9 21.3 24.8 16 24.8zm6.1-8c-.3-.2-2-1-2.3-1.1-.3-.1-.5-.2-.7.2s-.9 1.1-1.1 1.3c-.2.2-.4.2-.7.1-.3-.2-1.4-.5-2.6-1.6-1-.9-1.6-1.9-1.8-2.3-.2-.3 0-.5.1-.7l.5-.6c.2-.2.2-.3.3-.6.1-.2 0-.4 0-.6-.1-.2-.7-1.8-1-2.4-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.1-1.2 2.8s1.2 3.2 1.4 3.4c.2.2 2.4 3.7 5.9 5.1.8.4 1.5.6 2 .7.8.3 1.6.2 2.2.1.7-.1 2-.8 2.3-1.6.3-.8.3-1.5.2-1.6-.1-.2-.3-.3-.6-.4z" />
      </svg>
      <span className="hidden sm:inline">WhatsApp us</span>
    </a>
  );
}
