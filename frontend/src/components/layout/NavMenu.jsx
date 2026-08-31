import { NavLink } from "react-router-dom";
import { MapPin, ShieldAlert, LayoutDashboard, PlusCircle, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const LINKS = [
  { to: "/", label: "Safety Map", icon: MapPin },
  { to: "/report", label: "Report an Issue", icon: PlusCircle },
  { to: "/route-safety", label: "Route Safety", icon: ShieldAlert },
  { to: "/dashboard", label: "Community Dashboard", icon: LayoutDashboard },
];

export default function NavMenu({ onClose }) {
  return (
    <>
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-[1px]"
      />
      <Card className="fixed left-3 top-16 z-50 w-56 p-2 shadow-card">
        <div className="mb-1 flex items-center justify-between px-2 py-1">
          <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Menu
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <nav className="flex flex-col gap-0.5">
          {LINKS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"
                )
              }
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
      </Card>
    </>
  );
}