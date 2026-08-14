const TESTIMONIALS = [
  {
    quote:
      "We replaced three separate tools with SyncDoc. Our spec docs stay in sync with engineering the same day they're written.",
    name: "Priya Nandakumar",
    role: "Head of Product, Fintra",
  },
  {
    quote:
      "The real-time editing is genuinely instant. Two of us can be in the same paragraph and nothing ever gets clobbered.",
    name: "Marcus Webb",
    role: "Staff Engineer, Loopline",
  },
  {
    quote:
      "Version history alone paid for the upgrade. We can see exactly who changed what, and roll back in one click.",
    name: "Elena Rossi",
    role: "Ops Lead, Fieldnote",
  },
];

export default function Testimonials() {
  return (
    <section className="px-6 py-24 max-w-6xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-3xl sm:text-4xl font-bold mb-4">Trusted by fast-moving teams</h2>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {TESTIMONIALS.map((t) => (
          <figure key={t.name} className="glass-card p-6">
            <blockquote className="text-ink-300 text-sm leading-relaxed mb-6">"{t.quote}"</blockquote>
            <figcaption className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-brand-gradient grid place-items-center text-xs font-semibold">
                {t.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div>
                <div className="text-sm font-medium">{t.name}</div>
                <div className="text-xs text-ink-500">{t.role}</div>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
