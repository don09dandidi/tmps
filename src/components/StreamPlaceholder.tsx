import { Wifi } from "lucide-react";

type StreamPlaceholderProps = {
  /** True when the camera should be playing (live and not failed) — dims the icon less. */
  active: boolean;
  /** Icon size, in Tailwind classes (h-8 w-8 / h-12 w-12 etc). */
  iconClassName?: string;
};

/** SRP: the static "no picture" state (scanlines + wifi icon). */
export function StreamPlaceholder({ active, iconClassName = "h-8 w-8" }: StreamPlaceholderProps) {
  return (
    <>
      <div
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, oklch(0 0 0 / 0.06) 0 1px, transparent 1px 3px)",
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <Wifi
          className={`${iconClassName} ${active ? "text-foreground/20" : "text-muted-foreground/30"}`}
        />
      </div>
    </>
  );
}
