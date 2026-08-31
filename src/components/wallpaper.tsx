import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ImagePlus } from "lucide-react";
import { useLedger } from "@/lib/ledger-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const PAPER = "#F3EEE6";

export const WALL_COLORS = [
  { name: "素纸", hex: null as string | null },
  { name: "暖米", hex: "#E8DCC8" },
  { name: "梨黄", hex: "#E6C97A" },
  { name: "竹青", hex: "#5E7A5C" },
  { name: "月白", hex: "#D7E2DC" },
  { name: "雾蓝", hex: "#5A6E82" },
  { name: "胭脂", hex: "#C45C4A" },
  { name: "墨色", hex: "#1C1917" },
];

export function isPhotoWall(wallpaper: string | null): boolean {
  return Boolean(wallpaper && wallpaper.startsWith("data:"));
}

export function wallSolid(wallpaper: string | null): string | null {
  if (!wallpaper) return null;
  if (wallpaper.startsWith("#")) return wallpaper;
  return null;
}

export function wallNeedsLightText(wallpaper: string | null): boolean {
  if (isPhotoWall(wallpaper)) return true;
  const hex = wallSolid(wallpaper);
  if (!hex) return false;
  const n = hex.replace("#", "");
  const r = Number.parseInt(n.slice(0, 2), 16);
  const g = Number.parseInt(n.slice(2, 4), 16);
  const b = Number.parseInt(n.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 140;
}

export function WallpaperLayer() {
  const wallpaper = useLedger((s) => s.wallpaper);
  if (!wallpaper) return null;
  if (isPhotoWall(wallpaper)) {
    return (
      <>
        <img src={wallpaper} alt="" className="pointer-events-none absolute inset-0 -z-10 size-full object-cover" />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-wash" />
      </>
    );
  }
  const color = wallSolid(wallpaper);
  if (!color) return null;
  return <div className="pointer-events-none absolute inset-0 -z-10" style={{ background: color }} />;
}

export function WallpaperControls() {
  const inputRef = useRef<HTMLInputElement>(null);
  const wallpaper = useLedger((s) => s.wallpaper);
  const setWallpaperFile = useLedger((s) => s.setWallpaperFile);
  const setWallpaperColor = useLedger((s) => s.setWallpaperColor);
  const [open, setOpen] = useState(false);
  const light = wallNeedsLightText(wallpaper);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) {
            void setWallpaperFile(file);
            setOpen(false);
          }
        }}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={light ? "text-primary-fg hover:bg-elevated/50" : undefined}
        aria-label="更换背景"
        onClick={() => setOpen(true)}
      >
        <ImagePlus />
      </Button>
      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[100] flex items-end justify-center bg-overlay md:items-center"
              onClick={() => setOpen(false)}
            >
              <div
                className="w-full max-w-md rounded-t-xl bg-surface px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[var(--shadow-sheet)] md:rounded-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <p className="font-display text-xl text-fg">更换背景</p>
                <p className="mt-1 text-sm text-muted">上传照片，或选一块纯色。素纸是原来的底。</p>
                <button
                  type="button"
                  className="mt-4 flex h-11 w-full items-center justify-center rounded-full bg-primary text-sm text-primary-fg"
                  onClick={() => inputRef.current?.click()}
                >
                  上传图片
                </button>
                <p className="mt-4 text-xs text-muted">纯色</p>
                <div className="mt-2 grid grid-cols-4 gap-3">
                  {WALL_COLORS.map((c) => {
                    const hex = c.hex ?? PAPER;
                    const on = c.hex === null ? !wallpaper : wallpaper === c.hex;
                    return (
                      <button
                        key={c.name}
                        type="button"
                        className="flex flex-col items-center gap-1"
                        onClick={() => {
                          void setWallpaperColor(c.hex);
                          setOpen(false);
                        }}
                      >
                        <span
                          className={cn(
                            "size-12 rounded-full shadow-[var(--shadow-border)]",
                            on && "ring-2 ring-fg ring-offset-2 ring-offset-surface",
                          )}
                          style={{ background: hex }}
                        />
                        <span className="text-[11px] text-muted">{c.name}</span>
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  className="mt-4 h-11 w-full rounded-full bg-elevated text-sm text-fg shadow-[var(--shadow-border)]"
                  onClick={() => setOpen(false)}
                >
                  取消
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
