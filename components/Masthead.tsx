const SECTIONS = [
  "Politics",
  "Opinions",
  "Style",
  "Investigations",
  "Climate",
  "Well+Being",
  "Business",
  "Tech",
  "World",
  "Sports",
  "|",
  "WP Intelligence",
  "Ripple"
];

export default function Masthead() {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  return (
    <header>
      <div className="max-w-6xl mx-auto px-4 pt-3">
        <div className="flex items-center justify-between text-xs font-ui text-muted border-b border-rule pb-2">
          <span>{today}</span>
          <span className="text-wire font-semibold uppercase tracking-wide text-[11px]">
            Today&apos;s Paper
          </span>
        </div>

        <h1 className="text-center font-display font-900 text-5xl md:text-7xl py-5 tracking-tight capitalize">
          The Washington Host
        </h1>
        <p className="text-center font-ui text-xs normal tracking-[0.2em] text-muted -mt-3 pb-3">
        Democracy Dies in Darkness
        </p>
      </div>

      <nav className="bg-navbar text-black">
        <ul className="max-w-6xl mx-auto px-4 flex flex-wrap justify-center gap-x-8 gap-y-1 py-2.5 text-xs md:text-xs font-ui font-semibold capitalize tracking-wide">
          {SECTIONS.map((s) => (
            <li key={s} className="hover:text-wire cursor-pointer">
              {s}
            </li>
        
          ))}
          
        </ul>
      </nav>
      <div className="mx-auto h-px w-[69%] bg-black" />
    </header>
  );
}