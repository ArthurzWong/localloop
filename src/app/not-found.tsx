import Link from "next/link";

export default function NotFound() {
  return (
    <div className="ll-card space-y-3 p-8 text-center">
      <p className="text-4xl" aria-hidden>
        🧭
      </p>
      <h1 className="font-display text-2xl font-semibold">We can&apos;t find that place</h1>
      <p className="text-sm text-muted">
        It may have been removed, or it was never verified. LocalLoop never invents a listing to fill a gap.
      </p>
      <div className="flex flex-wrap justify-center gap-2 pt-1">
        <Link href="/places" className="ll-btn ll-btn-primary">
          Browse local places
        </Link>
        <Link href="/" className="ll-btn ll-btn-ghost">
          Back home
        </Link>
      </div>
    </div>
  );
}