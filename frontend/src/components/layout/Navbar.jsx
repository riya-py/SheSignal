import { useState } from "react";
import { Menu, Bell } from "lucide-react";
import { ShieldHeart } from "lucide-react";
import ThemeToggle from "@/components/layout/ThemeToggle";
import NavMenu from "@/components/layout/NavMenu";
import AccountMenu from "@/components/layout/AccountMenu";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            className="flex h-10 w-10 items-center justify-center rounded-full text-foreground hover:bg-muted"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft">
              <ShieldHeart className="h-5 w-5" />
            </span>
            <div className="leading-tight">
              <p className="font-display text-lg font-extrabold tracking-tight text-foreground">
                SheSignal
              </p>
              <p className="hidden text-xs text-muted-foreground sm:block">
                Safer journeys. Stronger communities.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            aria-label="Notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-foreground hover:bg-muted"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent" />
          </button>
          <AccountMenu />
        </div>
      </div>

      {menuOpen && <NavMenu onClose={() => setMenuOpen(false)} />}
    </header>
  );
}