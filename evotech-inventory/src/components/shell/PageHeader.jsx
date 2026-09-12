export function PageHeader({ title, subtitle, children }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-line bg-bg/90 px-5 backdrop-blur-sm sm:px-6">
      <div className="min-w-0">
        <h1 className="truncate text-[15px] font-medium text-fg">{title}</h1>
        {subtitle && <div className="truncate text-2xs text-faint">{subtitle}</div>}
      </div>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </header>
  );
}
