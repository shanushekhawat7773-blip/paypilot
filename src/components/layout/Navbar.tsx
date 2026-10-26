"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PlayIcon, ShieldCheckIcon } from "@/components/ui/Icons";

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { href: "/console", label: "Console" },
    { href: "/rules", label: "Rules & Policy" },
    { href: "/activity", label: "Activity Ledger" },
  ];

  return (
    <header className="w-full bg-paper-100 hairline-b sticky top-0 z-40 backdrop-blur-sm bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-6">
          <Link href="/" className="flex items-center space-x-2 group">
            <span className="font-serif text-2xl font-bold tracking-tight text-ink group-hover:text-navy transition-colors">
              PayPilot
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-navy inline-block mb-1"></span>
          </Link>
          <span className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded text-xs font-mono font-medium bg-paper-300 text-ink-muted hairline-border">
            PayPal Agent Leash
          </span>
        </div>

        {/* Links */}
        <nav className="hidden sm:flex items-center space-x-1" aria-label="Main Navigation">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                  isActive
                    ? "bg-paper-300 text-ink font-semibold"
                    : "text-ink-muted hover:text-ink hover:bg-paper-200"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Actions / Status */}
        <div className="flex items-center space-x-3">
          <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded bg-green-50 text-status-allowed text-xs font-mono hairline-border">
            <span className="w-2 h-2 rounded-full bg-status-allowed animate-pulse"></span>
            <span>PayPal Sandbox Active</span>
          </div>

          <Link
            href="/console?demo=1"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-navy text-white text-xs font-medium rounded hover:bg-navy-hover transition-colors shadow-sm"
          >
            <PlayIcon size={14} />
            <span>90s Demo</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
