import { useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { Card } from "@/components/ui/card";

// No notification backend/data model exists yet - this makes the bell
// functional (opens/closes, shows an honest empty state) instead of being a
// dead button. When real notifications exist, replace the empty state below
// with a mapped list and only show the unread dot when count > 0.
export default function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const hasUnread = false;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        aria-haspopup="menu"
        aria-expanded={open}
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-foreground hover:bg-muted"
      >
        <Bell className="h-5 w-5" />
        {hasUnread && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent" />}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close notifications"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <Card className="absolute right-0 top-12 z-50 w-72 p-4 shadow-card">
            <p className="mb-3 text-sm font-bold text-foreground">Notifications</p>
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <BellOff className="h-4.5 w-4.5" />
              </span>
              <p className="text-sm font-medium text-foreground">No notifications yet</p>
              <p className="max-w-[15rem] text-xs text-muted-foreground">
                You'll see alerts here about reports near your saved routes and areas.
              </p>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}