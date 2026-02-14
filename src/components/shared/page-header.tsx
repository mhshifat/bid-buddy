/**
 * Page Header — hero-style header with animated SVG geometric background,
 * gradient accent line, and storytelling layout.
 *
 * This is a Server Component — no "use client" needed since it has
 * no hooks or event handlers.
 */

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  /** Optional icon to show beside the title */
  icon?: React.ElementType;
  /** Optional accent color class for the gradient line, e.g. "from-blue-500 via-emerald-500 to-violet-500" */
  accentGradient?: string;
}

export function PageHeader({
  title,
  description,
  children,
  icon: Icon,
  accentGradient = "from-primary/60 via-primary/30 to-transparent",
}: PageHeaderProps) {
  return (
    <div className="animate-fade-in-up stagger-1 relative overflow-hidden rounded-2xl border bg-gradient-to-br from-card via-card to-primary/[0.02] p-6 md:p-8">
      {/* Background SVG decoration */}
      <PageHeaderBgSvg />

      {/* Top gradient accent line */}
      <div
        className={`absolute left-0 top-0 h-[2px] w-full bg-gradient-to-r ${accentGradient} opacity-60`}
      />

      <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Title & description */}
        <div className="max-w-2xl">
          <div className="flex items-center gap-2.5 mb-1.5">
            {Icon && (
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 animate-float">
                <Icon className="h-4 w-4 text-primary" />
              </div>
            )}
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          </div>
          {description && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* Right slot — action buttons */}
        {children && (
          <div className="flex items-center gap-2 shrink-0">{children}</div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Decorative background SVG
// ---------------------------------------------------------------------------

function PageHeaderBgSvg() {
  return (
    <svg
      className="absolute inset-0 h-full w-full pointer-events-none"
      viewBox="0 0 800 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {/* Flowing dotted path */}
      <path
        d="M0 100 Q200 40 400 100 T800 100"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="6 6"
        opacity="0.06"
        className="text-primary"
      />

      {/* Decorative circles */}
      <circle cx="700" cy="50" r="80" stroke="currentColor" strokeWidth="0.5" opacity="0.04" className="text-primary animate-spin-slow" />
      <circle cx="700" cy="50" r="50" stroke="currentColor" strokeWidth="0.5" opacity="0.03" className="text-primary" />

      {/* Grid dots */}
      {Array.from({ length: 16 }).map((_, i) => (
        <circle
          key={i}
          cx={i * 52 + 10}
          cy="180"
          r="0.8"
          fill="currentColor"
          opacity="0.05"
          className="text-foreground"
        />
      ))}
    </svg>
  );
}
