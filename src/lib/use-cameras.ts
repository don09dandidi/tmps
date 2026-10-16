import { DEFAULT_CAMERAS } from "@/lib/defaults";
import type { Camera } from "@/lib/types";
import { useLocalStorageState } from "@/lib/use-local-storage";

/** Single source for where cameras are persisted (was the literal "cameras" repeated in 3 places). */
export const CAMERAS_STORAGE_KEY = "cameras";

/**
 * DIP (lightweight): pages ask for "the cameras" and don't know that they live in
 * localStorage or under which key. Moving them to an API means changing this one file.
 */
export function useCameras() {
  return useLocalStorageState<Camera[]>(CAMERAS_STORAGE_KEY, DEFAULT_CAMERAS);
}
