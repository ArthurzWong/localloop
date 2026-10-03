"use client";

import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Home", icon: "⌂" },
  { href: "/discover", label: "Explore", icon: "⌕" },
  { href: "/map", label: "Map", icon: "◈" },
  { href: "/saved", label: "Saved", icon: "♡" },
  { href: "/profile", label: "Profile", icon: "☺" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-line bg-white/95 backdrop-blur"
    >
      <ul className="mx-auto flex max-w-3xl items-stretch justify-between px-2">
        {TABS.map((tab) => {
          const active = isActive(tab.href);
          return (
            <li key={tab.href} className="flex-1">
              <a
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 py-2.5 text-[0.68rem] font-semibold ${
                  active ? "text-clay" : "text-muted"
                }`}
              >
                <span aria-hidden className="text-lg leading-none">
                  {tab.icon}
                </span>
                {tab.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}