import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export default function AccountMenu() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  if (!user) {
    return (
      <Button asChild variant="outline" size="sm">
        <Link to="/login">Sign In</Link>
      </Button>
    );
  }

  const initial = user.email?.[0]?.toUpperCase() ?? "U";

  const handleSignOut = async () => {
    await signOut();
    setOpen(false);
    navigate("/");
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        aria-expanded={open}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground"
      >
        {initial}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close account menu"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <Card className="absolute right-0 top-12 z-50 w-56 p-3 shadow-card">
            <p className="truncate px-1 text-xs text-muted-foreground">Signed in as</p>
            <p className="truncate px-1 pb-2 text-sm font-semibold text-foreground">{user.email}</p>
            <Button variant="outline" size="sm" className="w-full gap-2" onClick={handleSignOut}>
              <LogOut className="h-3.5 w-3.5" />
              Log out
            </Button>
          </Card>
        </>
      )}
    </div>
  );
}