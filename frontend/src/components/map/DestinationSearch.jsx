import { useState } from "react";
import { Search, Crosshair } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function DestinationSearch({ onSubmit }) {
  const [value, setValue] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim()) onSubmit?.(value.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Where are you going?"
        className="h-12 pl-11 pr-11 shadow-card"
      />
      <button
        type="submit"
        aria-label="Use current location as destination search"
        className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-primary hover:bg-muted"
      >
        <Crosshair className="h-4 w-4" />
      </button>
    </form>
  );
}