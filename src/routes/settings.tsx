import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Download, HardDrive, Bell, Camera as CameraIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocalStorageState } from "@/lib/use-local-storage";
import { useCameras } from "@/lib/use-cameras";
import { DEFAULT_NOTIFICATION_SETTINGS, DEFAULT_RECORDING_SETTINGS } from "@/lib/defaults";
import type { Camera, NotificationSettings, RecordingSettings, RecordingMode } from "@/lib/types";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [{ title: "Settings — Live Cameras" }],
  }),
  component: SettingsPage,
});

function SectionCard({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border border-border bg-card p-5">{children}</div>;
}

function CamerasSection() {
  const [cameras, setCameras] = useCameras();

  const updateCamera = (id: string, patch: Partial<Camera>) => {
    setCameras((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Redenumește camerele și adaugă stream URL-ul (de la go2rtc, ex.{" "}
        <code className="rounded bg-muted px-1 py-0.5">
          http://100.x.x.x:1984/api/stream.m3u8?src=cam-01
        </code>
        ) când server-ul e gata pe VAIO.
      </p>
      {cameras.map((cam) => (
        <SectionCard key={cam.id}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={`name-${cam.id}`} className="text-xs">
                Nume
              </Label>
              <Input
                id={`name-${cam.id}`}
                value={cam.name}
                onChange={(e) => updateCamera(cam.id, { name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`location-${cam.id}`} className="text-xs">
                Locație
              </Label>
              <Input
                id={`location-${cam.id}`}
                value={cam.location}
                onChange={(e) => updateCamera(cam.id, { location: e.target.value })}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor={`stream-${cam.id}`} className="text-xs">
                Stream URL (HLS)
              </Label>
              <Input
                id={`stream-${cam.id}`}
                placeholder="http://100.x.x.x:1984/api/stream.m3u8?src=..."
                value={cam.streamUrl ?? ""}
                onChange={(e) => updateCamera(cam.id, { streamUrl: e.target.value || undefined })}
              />
            </div>
            <div className="flex items-center justify-between sm:col-span-2">
              <div className="flex items-center gap-2">
                <Label htmlFor={`status-${cam.id}`} className="text-xs">
                  Status live (test manual, până conectăm serverul)
                </Label>
              </div>
              <Switch
                id={`status-${cam.id}`}
                checked={cam.status === "live"}
                onCheckedChange={(checked) =>
                  updateCamera(cam.id, { status: checked ? "live" : "offline" })
                }
              />
            </div>
          </div>
        </SectionCard>
      ))}
    </div>
  );
}

function RecordingSection() {
  const [cameras, setCameras] = useCameras();
  const [settings, setSettings] = useLocalStorageState<RecordingSettings>(
    "recordingSettings",
    DEFAULT_RECORDING_SETTINGS,
  );

  const setCameraMode = (id: string, mode: RecordingMode) => {
    setCameras((prev) => prev.map((c) => (c.id === id ? { ...c, recordingMode: mode } : c)));
  };

  return (
    <div className="space-y-4">
      <SectionCard>
        <h3 className="mb-3 text-sm font-medium">Prag stocare</h3>
        <p className="mb-3 text-xs text-muted-foreground">
          Când spațiul ocupat de înregistrări trece de acest prag, cele mai vechi fișiere se șterg
          automat (FIFO), ca să nu umple discul VAIO. Necesită backend-ul de retenție rulat pe
          server — setarea de aici doar pregătește configul.
        </p>
        <div className="flex max-w-xs items-center gap-2">
          <Input
            type="number"
            min={10}
            value={settings.retentionThresholdGb}
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                retentionThresholdGb: Number(e.target.value) || 0,
              }))
            }
          />
          <span className="text-sm text-muted-foreground">GB</span>
        </div>
      </SectionCard>

      <SectionCard>
        <h3 className="mb-1 text-sm font-medium">Mod înregistrare per cameră</h3>
        <p className="mb-3 text-xs text-muted-foreground">
          <strong>Auto</strong> = motion-triggered (recomandat — configurat pe server, cu zone
          masking pentru animale/zone nedorite). <strong>Manual</strong> = pornești/oprești tu cu
          butonul din dashboard.
        </p>
        <div className="space-y-3">
          {cameras.map((cam) => (
            <div key={cam.id} className="flex items-center justify-between">
              <span className="text-sm">{cam.name}</span>
              <div className="flex overflow-hidden rounded-md border border-border text-xs">
                <button
                  onClick={() => setCameraMode(cam.id, "auto")}
                  className={`px-3 py-1.5 transition-colors ${
                    cam.recordingMode === "auto"
                      ? "bg-foreground text-background"
                      : "hover:bg-accent"
                  }`}
                >
                  Auto
                </button>
                <button
                  onClick={() => setCameraMode(cam.id, "manual")}
                  className={`px-3 py-1.5 transition-colors ${
                    cam.recordingMode === "manual"
                      ? "bg-foreground text-background"
                      : "hover:bg-accent"
                  }`}
                >
                  Manual
                </button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function NotificationsSection() {
  const [settings, setSettings] = useLocalStorageState<NotificationSettings>(
    "notificationSettings",
    DEFAULT_NOTIFICATION_SETTINGS,
  );

  return (
    <SectionCard>
      <p className="mb-4 text-xs text-muted-foreground">
        Notificările push necesită un backend care detectează mișcarea (ex. Frigate) și trimite
        evenimente către browser/telefon. Setările de mai jos sunt pregătite pentru asta.
      </p>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Notificări activate</p>
            <p className="text-xs text-muted-foreground">
              Primești alertă când o cameră detectează mișcare
            </p>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, enabled: checked }))}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Doar când nu ești acasă</p>
            <p className="text-xs text-muted-foreground">
              Evită notificări inutile când familia e prin preajmă
            </p>
          </div>
          <Switch
            checked={settings.onlyWhenAway}
            disabled={!settings.enabled}
            onCheckedChange={(checked) =>
              setSettings((prev) => ({ ...prev, onlyWhenAway: checked }))
            }
          />
        </div>
      </div>
    </SectionCard>
  );
}

function ExportSection() {
  return (
    <SectionCard>
      <p className="mb-4 text-xs text-muted-foreground">
        Exportul înregistrărilor necesită acces la fișierele stocate pe VAIO. Se activează după ce
        server-ul de recording e conectat.
      </p>
      <button
        disabled
        className="flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm text-muted-foreground opacity-50"
      >
        <Download className="h-4 w-4" />
        Exportă înregistrări (indisponibil încă)
      </button>
    </SectionCard>
  );
}

function SettingsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-6 py-5">
          <Link
            to="/"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-sm font-medium tracking-tight">Settings</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        <Tabs defaultValue="cameras">
          <TabsList className="mb-6">
            <TabsTrigger value="cameras" className="gap-1.5">
              <CameraIcon className="h-3.5 w-3.5" />
              Cameras
            </TabsTrigger>
            <TabsTrigger value="recording" className="gap-1.5">
              <HardDrive className="h-3.5 w-3.5" />
              Recording
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1.5">
              <Bell className="h-3.5 w-3.5" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="export" className="gap-1.5">
              <Download className="h-3.5 w-3.5" />
              Export
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cameras">
            <CamerasSection />
          </TabsContent>
          <TabsContent value="recording">
            <RecordingSection />
          </TabsContent>
          <TabsContent value="notifications">
            <NotificationsSection />
          </TabsContent>
          <TabsContent value="export">
            <ExportSection />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
