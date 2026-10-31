export function LogoMark({ className = "h-11" }: { className?: string }) {
  return (
    <img
      src="/images/mainflow-logo-mark.png"
      alt="Mainflow School logo"
      width={447}
      height={201}
      className={`rounded-lg bg-white object-contain p-1 ${className}`}
    />
  );
}

export function Logo({ onDark = false }: { onDark?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <LogoMark className="h-12 w-auto" />
      <span className="flex flex-col leading-tight">
        <span
          className={`font-heading text-[17px] font-bold tracking-tight sm:text-lg ${
            onDark ? "text-white" : "text-ink-950"
          }`}
        >
          Mainflow <span className={onDark ? "text-maroon-300" : "text-maroon-700"}>School</span>
        </span>
        <span
          className={`text-[11px] font-medium uppercase tracking-[0.18em] ${
            onDark ? "text-maroon-100" : "text-ink-500"
          }`}
        >
          Unlock Every Potential
        </span>
      </span>
    </span>
  );
}
