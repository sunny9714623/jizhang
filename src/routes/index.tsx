import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChartColumn, LayoutGrid, MessageCircle, Moon, Plus, Sun, User, WalletCards } from "lucide-react";
import { Toaster } from "sonner";
import { Composer } from "@/components/composer";
import { RestoreSheet } from "@/components/restore-sheet";
import { ImportView } from "@/components/import-view";
import { MoreView } from "@/components/more-view";
import { Overview } from "@/components/overview";
import { StatsView } from "@/components/stats-view";
import { TxDetail, TxList } from "@/components/tx-list";
import { Button } from "@/components/ui/button";
import { WallpaperControls, WallpaperLayer, isPhotoWall, wallNeedsLightText } from "@/components/wallpaper";
import { monthLabel } from "@/lib/ledger";
import { txsInLedger, inLedger } from "@/lib/ledgers";
import { dueRecurring, fireDueNotifications, recordedToday } from "@/lib/remind";
import { useLedger, type Tab } from "@/lib/ledger-store";
import { BooksView } from "@/components/ledger-dir";
import { cn } from "@/lib/utils";
import { useCloud } from "@/lib/cloudbase/cloud-store";
import { LoginGate } from "@/components/cloud/login-gate";
import { AgentFloatingChat } from "@/components/agent-panel";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const hydrate = useLedger((s) => s.hydrate);
  const importFiles = useLedger((s) => s.importFiles);
  const ingestText = useLedger((s) => s.ingestText);
  const liveCapture = useLedger((s) => s.liveCapture);
  const recurringAll = useLedger((s) => s.recurring);
  const txsAll = useLedger((s) => s.txs);
  const usingSample = useLedger((s) => s.usingSample);
  const ledgerId = useLedger((s) => s.ledgerId);
  const ledgers = useLedger((s) => s.ledgers);
  const txs = txsInLedger(txsAll, ledgerId);
  const recurring = inLedger(recurringAll, ledgerId);
  const notifications = useLedger((s) => s.notifications);
  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    const stop = (e: Event) => e.preventDefault();
    document.addEventListener("gesturestart", stop);
    document.addEventListener("gesturechange", stop);
    return () => {
      document.removeEventListener("gesturestart", stop);
      document.removeEventListener("gesturechange", stop);
    };
  }, []);

  useEffect(() => {
    if (!notifications) return;
    fireDueNotifications({
      due: dueRecurring(recurring),
      needRecord: !usingSample && !recordedToday(txs),
    });
  }, [recurring, txs, usingSample, notifications]);

  useEffect(() => {
    const hasFiles = (e: DragEvent) => e.dataTransfer?.types?.includes("Files") ?? false;
    const onDragOver = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
    };
    const onDrop = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      void importFiles(Array.from(e.dataTransfer?.files ?? []));
    };
    const onPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      const text = e.clipboardData?.getData("text") ?? "";
      if (text) void ingestText(text);
      const files = Array.from(e.clipboardData?.files ?? []);
      if (files.length) void importFiles(files);
    };
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("drop", onDrop);
    window.addEventListener("paste", onPaste);
    return () => {
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("drop", onDrop);
      window.removeEventListener("paste", onPaste);
    };
  }, [importFiles, ingestText]);

  useEffect(() => {
    if (!liveCapture) return;
    const onVis = () => {
      if (document.visibilityState !== "visible") return;
      void navigator.clipboard.readText().then((text) => {
        if (text) void ingestText(text, { quiet: true });
      }).catch(() => {
        /* 无剪贴板权限时忽略，用户可点「剪贴板」 */
      });
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [liveCapture, ingestText]);

  const tab = useLedger((s) => s.tab);
  const setTab = useLedger((s) => s.setTab);
  const month = useLedger((s) => s.month);
  const cloudLedgers = useLedger((s) => s.cloudLedgers);
  const openComposer = useLedger((s) => s.openComposer);
  const wallpaper = useLedger((s) => s.wallpaper);
  const dark = useLedger((s) => s.dark);
  const toggleDark = useLedger((s) => s.toggleDark);
  const cloudActivate = useLedger((s) => s.cloudActivate);
  const cloudPull = useLedger((s) => s.cloudPull);
  const photoWall = isPhotoWall(wallpaper);
  const lightTitle = wallNeedsLightText(wallpaper);

  const cloudReady = useCloud((s) => s.ready);
  const cloudUser = useCloud((s) => s.user);
  const cloudError = useCloud((s) => s.error);
  const cloudBoot = useCloud((s) => s.boot);
  const activeFamilyId = useCloud((s) => s.activeFamilyId);
  const localOnly = useCloud((s) => s.localOnly);
  const setLocalOnly = useCloud((s) => s.setLocalOnly);
  const enterDemo = useCloud((s) => s.enterDemo);
  const reload = useCloud((s) => s.reload);
  const resetAuth = useCloud((s) => s.resetAuth);

  useEffect(() => {
    void cloudBoot();
  }, [cloudBoot]);

  useEffect(() => {
    if (!cloudUser || !cloudPull) return;
    const pullIfVisible = () => {
      if (document.visibilityState === "visible") void cloudPull();
    };
    // 回到前台立刻拉取 + 家庭模式每 20 秒刷新一次，
    // 这样其他家庭成员新增/修改/删除的流水能尽快出现，不必手动点“从云端拉取”。
    document.addEventListener("visibilitychange", pullIfVisible);
    const timer = window.setInterval(pullIfVisible, 20000);
    return () => {
      document.removeEventListener("visibilitychange", pullIfVisible);
      window.clearInterval(timer);
    };
  }, [cloudUser, cloudPull]);

  useEffect(() => {
    if (!cloudReady) return;
    if (cloudUser) {
      setLocalOnly(false);
      if (activeFamilyId) void cloudActivate(activeFamilyId, null);
    } else {
      void cloudActivate(null, null);
    }
  }, [cloudReady, cloudUser, activeFamilyId, cloudActivate, setLocalOnly]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  if (cloudReady && !cloudUser && !localOnly) {
    return (
      <div className="relative h-full overflow-hidden bg-bg text-fg">
        <div className="mx-auto h-full w-full max-w-md">
          <LoginGate
            error={cloudError}
            onSkip={() => setLocalOnly(true)}
            onDemo={enterDemo}
            onLoggedIn={() => void reload()}
            onRetry={() => void reload()}
            onResetAuth={() => void resetAuth()}
          />
          <Toaster
            theme="light"
            position="top-center"
            toastOptions={{
              classNames: {
                toast: "bg-elevated text-fg border-border shadow-[var(--shadow-border)]",
              },
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative h-full overflow-hidden bg-bg text-fg md:flex md:justify-center"
      data-wallpaper={wallpaper ? "on" : undefined}
    >
      {photoWall ? (
        <img
          src={wallpaper!}
          alt=""
          className="pointer-events-none fixed inset-0 hidden size-full object-cover md:block"
        />
      ) : wallpaper ? (
        <div
          className="pointer-events-none fixed inset-0 hidden size-full md:block"
          style={{ background: wallpaper }}
        />
      ) : null}
      <div
        className={cn(
          "relative z-10 mx-auto flex h-full w-full max-w-md flex-col overflow-hidden",
          wallpaper ? "md:shadow-[var(--shadow-border)]" : "bg-surface md:shadow-[var(--shadow-border)]",
        )}
      >
        <WallpaperLayer />
        <header
          className={cn(
            "relative z-10 flex items-center gap-2 px-5 pt-5 pb-3",
            wallpaper ? "bg-transparent" : "bg-surface",
          )}
        >
          <div className="min-w-0 flex-1">
            <button
              type="button"
              className="block w-full min-w-0 text-left"
              onClick={() => setTab("books")}
              aria-label="打开账本管理"
            >
              <p className={cn("font-display text-3xl leading-tight", lightTitle ? "text-primary-fg" : "text-fg")}>
                {ledgers.find((l) => l.id === ledgerId)?.name ??
                  cloudLedgers.find((l) => l._id === ledgerId)?.name ??
                  "月梨账单"}
              </p>
            </button>
            <p className={cn("mt-1 text-xs", lightTitle ? "text-primary-fg/80" : "text-muted")}>
              {monthLabel(month)}
            </p>
          </div>
          <WallpaperControls />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={dark ? "切换浅色模式" : "切换深色模式"}
            className={cn("shrink-0", lightTitle ? "text-primary-fg hover:bg-elevated/50" : undefined)}
            onClick={toggleDark}
          >
            {dark ? <Sun /> : <Moon />}
          </Button>
          {tab !== "import" && tab !== "books" ? (
            <Button size="sm" className="shrink-0" onClick={openComposer}>
              <Plus />
              记一笔
            </Button>
          ) : null}
        </header>

        <main className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-4">
          {tab === "home" ? <Overview /> : null}
          {tab === "list" ? <TxList /> : null}
          {tab === "stats" ? <StatsView /> : null}
          {tab === "import" ? <ImportView /> : null}
          {tab === "more" ? <MoreView /> : null}
          {tab === "books" ? <BooksView /> : null}
        </main>

        <nav className="frost relative z-20 flex shrink-0 border-t border-border bg-surface px-2 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <TabBtn id="home" label="概览" icon={LayoutGrid} active={tab === "home"} onClick={setTab} />
          <TabBtn id="list" label="流水" icon={WalletCards} active={tab === "list"} onClick={setTab} />
          <TabBtn id="stats" label="统计" icon={ChartColumn} active={tab === "stats"} onClick={setTab} />
          <TabBtn id="import" label="入账" icon={MessageCircle} active={tab === "import"} onClick={setTab} />
          <TabBtn id="more" label="我的" icon={User} active={tab === "more"} onClick={setTab} />
        </nav>

        <AgentFloatingChat />
        <TxDetail />
        <Composer />
        <RestoreSheet />
        <Toaster
          theme="light"
          position="top-center"
          toastOptions={{
            classNames: {
              toast: "bg-elevated text-fg border-border shadow-[var(--shadow-border)]",
            },
          }}
        />
      </div>
    </div>
  );
}

function TabBtn({
  id,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  id: Tab;
  label: string;
  icon: typeof LayoutGrid;
  active: boolean;
  onClick: (tab: Tab) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      className={cn(
        "flex h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs",
        active ? "text-fg" : "text-subtle",
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon className="size-5" strokeWidth={active ? 2 : 1.6} />
      {label}
    </button>
  );
}
