"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Moon, ScanLine, SunMedium } from "lucide-react";

import { logoutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppTheme } from "@/components/theme/app-providers";
import { resolveScanDestination } from "@/lib/scan";
import { isScanShortcut, SCAN_SHORTCUT_LABEL } from "@/lib/shortcuts";
import type { ActiveAppUser } from "@/lib/types";

type BottomToolbarProps = {
  isSupabaseConfigured: boolean;
  session: ActiveAppUser | null;
};

const AUTO_SCAN_DELAY_MS = 180;

function getShortcutLabel() {
  if (typeof navigator === "undefined") {
    return SCAN_SHORTCUT_LABEL;
  }

  const userAgent = navigator.userAgent || "";
  const modifier = /mac|iphone|ipad|ipod/i.test(userAgent) ? "⌘" : "Ctrl";

  return `${modifier} + /`;
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT" ||
    target.isContentEditable
  );
}

export function BottomToolbar({ isSupabaseConfigured, session }: BottomToolbarProps) {
  const { theme, toggleTheme } = useAppTheme();
  const pathname = usePathname();
  const router = useRouter();
  const scanLauncherRef = useRef<HTMLButtonElement>(null);
  const scanInputRef = useRef<HTMLInputElement>(null);
  const [scanValue, setScanValue] = useState("");
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [scanError, setScanError] = useState("");
  const canScan = Boolean(session?.department);
  const shortcutLabel = getShortcutLabel();
  const launcherLabel = canScan ? "Scan Order" : "Sign in to enable scanning";

  function openScanDialog() {
    if (!canScan) {
      return;
    }

    setIsScanOpen(true);
  }

  function closeScanDialog() {
    setIsScanOpen(false);
    setScanValue("");
    setScanError("");
    scanLauncherRef.current?.focus();
  }

  function routeScan(scanInput: string) {
    const nextRoute = resolveScanDestination(scanInput, session?.department?.slug);

    if (!nextRoute) {
      setScanError("Unrecognized order");
      return;
    }

    setScanError("");
    setIsScanOpen(false);
    setScanValue("");
    startTransition(() => {
      router.push(nextRoute);
    });
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isScanOpen) {
        event.preventDefault();
        closeScanDialog();
        return;
      }

      if (!isScanShortcut(event)) {
        return;
      }

      if (!isScanOpen && isEditableTarget(event.target)) {
        return;
      }

      if (!canScan) {
        return;
      }

      event.preventDefault();
      setIsScanOpen(true);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isScanOpen, canScan]);

  useEffect(() => {
    if (!isScanOpen) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      scanInputRef.current?.focus();
      scanInputRef.current?.select();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [isScanOpen]);

  useEffect(() => {
    const normalizedValue = scanValue.trim();

    if (!isScanOpen || !canScan || !normalizedValue) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const nextRoute = resolveScanDestination(normalizedValue, session?.department?.slug);

      if (!nextRoute) {
        setScanError("Unrecognized order");
        return;
      }

      setScanError("");
      setIsScanOpen(false);
      setScanValue("");
      startTransition(() => {
        router.push(nextRoute);
      });
    }, AUTO_SCAN_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [scanValue, isScanOpen, canScan, session?.department?.slug, router]);

  return (
    <>
      {isScanOpen ? (
        <div className="fixed inset-0 z-[60] flex items-start justify-center bg-slate-950/20 px-4 py-16 backdrop-blur-sm dark:bg-black/60">
          <button
            aria-label="Close scan dialog"
            className="absolute inset-0"
            onClick={closeScanDialog}
            type="button"
          />
          <div className="relative z-10 w-full max-w-2xl rounded-[1.75rem] border border-border/70 bg-background/95 p-5 shadow-[0_40px_120px_-40px_rgba(15,23,42,0.65)] backdrop-blur dark:bg-background/90 dark:shadow-[0_32px_96px_-40px_rgba(0,0,0,0.9)]">
            <div className="space-y-2">
              <p className="text-sm font-semibold tracking-wide text-foreground">Scan Intake</p>
              <p className="text-sm text-muted-foreground">
                Scan a label or type a value to route it for {session?.department?.name ?? "the active department"}.
              </p>
            </div>

            <form
              className="mt-4"
              onSubmit={(event) => {
                event.preventDefault();
                routeScan(scanValue);
              }}
            >
              <Input
                ref={scanInputRef}
                autoComplete="off"
                className="h-14 rounded-2xl px-4 text-base"
                disabled={!canScan}
                onChange={(event) => {
                  setScanValue(event.target.value);
                  setScanError("");
                }}
                placeholder={canScan ? "Scan order, work order, or label value" : "Sign in to enable scanning"}
                value={scanValue}
              />
              {scanError ? <p className="mt-2 text-sm text-destructive">{scanError}</p> : null}
            </form>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span suppressHydrationWarning>Shortcut: {shortcutLabel}</span>
              <span>Scans route automatically. Press Esc to close.</span>
            </div>
          </div>
        </div>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-50 px-3 pb-3">
        <div className="mx-auto grid max-w-7xl gap-3 rounded-[1.5rem] border border-border/70 bg-background/90 px-4 py-3 shadow-[0_24px_90px_-38px_rgba(15,23,42,0.6)] backdrop-blur supports-[backdrop-filter]:bg-background/85 md:grid-cols-[minmax(0,1fr)_minmax(20rem,32rem)_minmax(0,1fr)] md:items-center">
          <div className="flex min-w-0 items-center gap-3">
            <div className="rounded-2xl bg-primary/12 p-2 text-primary">
              <ScanLine className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold tracking-wide text-foreground">Flow Ops</p>
              <p className="truncate text-xs text-muted-foreground">
                {isSupabaseConfigured
                  ? session
                    ? `${session.displayName} in ${session.department?.name ?? "No department"}`
                    : pathname === "/login"
                      ? "Sign in to begin."
                      : "Not signed in."
                  : "Supabase setup required."}
              </p>
            </div>
          </div>

          <div className="w-full md:justify-self-center">
            <button
              ref={scanLauncherRef}
              aria-expanded={isScanOpen}
              aria-haspopup="dialog"
              className="flex h-11 w-full items-center justify-between rounded-xl border border-input bg-background px-3 text-left text-sm shadow-xs transition-[color,background-color,box-shadow] outline-none hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canScan}
              onClick={() => openScanDialog()}
              type="button"
            >
              <span className="font-medium text-foreground">{launcherLabel}</span>
              <span suppressHydrationWarning className="text-xs text-muted-foreground">
                {shortcutLabel}
              </span>
            </button>
          </div>

          <div className="flex min-w-0 items-center justify-end gap-2 md:justify-self-end">
            <Button
              aria-label="Toggle theme"
              onClick={toggleTheme}
              type="button"
              variant="outline"
            >
              {theme === "dark" ? <SunMedium className="size-4" /> : <Moon className="size-4" />}
            </Button>

            {session ? (
              <form action={logoutAction}>
                <Button type="submit" variant="outline">
                  <LogOut className="size-4" />
                  Log out
                </Button>
              </form>
            ) : (
              <Button disabled variant="outline">
                Log out
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
