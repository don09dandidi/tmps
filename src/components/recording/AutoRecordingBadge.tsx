/** "auto" mode: recording is motion-triggered on the backend, so the UI only shows a badge. */
export function AutoRecordingBadge() {
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-background/90 px-2 py-1 backdrop-blur">
      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        Auto
      </span>
    </div>
  );
}
