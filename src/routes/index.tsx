import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Settings, Signal } from "lucide-react";
import { CameraModal } from "@/components/CameraModal";
import { CameraTile } from "@/components/CameraTile";
import { useCameras } from "@/lib/use-cameras";
import type { Camera } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Live Cameras" },
      { name: "description", content: "Minimal live streaming camera dashboard." },
      { property: "og:title", content: "Live Cameras" },
      { property: "og:description", content: "Minimal live streaming camera dashboard." },
    ],
  }),
  component: Index,
});

function Index() {
  const [cameras, setCameras, hydrated] = useCameras();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Camera | null>(null);

  const filtered = cameras.filter((c) =>
    (c.name + c.location).toLowerCase().includes(query.toLowerCase()),
  );

  const liveCount = cameras.filter((c) => c.status === "live").length;

  const toggleRecording = (id: string) => {
    setCameras((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isRecording: !c.isRecording } : c)),
    );
    // Keep the fullscreen modal's copy in sync if that camera is open.
    setSelected((prev) =>
      prev && prev.id === id ? { ...prev, isRecording: !prev.isRecording } : prev,
    );
  };

  // Avoid a hydration flash of default/empty state before localStorage loads.
  if (!hydrated) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-foreground text-background">
              <Signal className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-sm font-medium tracking-tight">Cameras</h1>
              <p className="text-xs text-muted-foreground">
                {liveCount} live · {cameras.length - liveCount} offline
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-64 max-w-[45%]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground/30"
              />
            </div>
            <Link
              to="/settings"
              className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Settings"
            >
              <Settings className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((cam) => (
            <CameraTile
              key={cam.id}
              camera={cam}
              onOpen={setSelected}
              onToggleRecording={toggleRecording}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-24 text-center text-sm text-muted-foreground">No cameras found.</div>
        )}
      </main>

      {selected && (
        <CameraModal
          camera={selected}
          onClose={() => setSelected(null)}
          onToggleRecording={toggleRecording}
        />
      )}
    </div>
  );
}
