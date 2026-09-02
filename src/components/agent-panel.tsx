import { useEffect, useRef, useState } from "react";
import {
  Bot,
  ImagePlus,
  Loader2,
  Mic,
  PenLine,
  Send,
  Settings2,
  Square,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { agentAsk } from "@/lib/agent-server";
import { agentContext } from "@/lib/agent-context";
import { dbGetMeta, dbSetMeta } from "@/lib/ledger-db";
import { fileToJpegDataUrl, useLedger } from "@/lib/ledger-store";
import { leafLabel } from "@/lib/categories";
import { shanghaiDayValue } from "@/lib/ledger";
import { Button } from "@/components/ui/button";
import type { AgentDraft, AgentHistoryMsg, AgentImageInput } from "@/lib/agent-types";

type UiMsg =
  | { id: string; role: "user"; text: string; imageUrl?: string; imageName?: string }
  | { id: string; role: "bot"; text: string; error?: boolean }
  | { id: string; role: "drafts"; text: string; drafts: AgentDraft[] };

function nid() {
  return `a-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;
}

// Keep the conversation alive when the floating window is closed.
let liveMsgs: UiMsg[] = [];
let liveEdits: Record<string, AgentDraft> = {};

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  length: number;
  [index: number]: { transcript: string };
};
type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: SpeechRecognitionResultLike[];
};
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
};
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function speechCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const QUICK_CHIPS = [
  {
    id: "analyze",
    label: "分析本月支出",
    icon: TrendingUp,
    text: "帮我分析这个月的支出：钱主要花在了哪里，跟上月比有什么变化，再给几条实用的建议。",
  },
  {
    id: "record",
    label: "口述记账",
    icon: PenLine,
    text: "买杯咖啡 18 元，打车去公司 12.5 元",
  },
  { id: "shot", label: "截图识别记账", icon: ImagePlus },
  { id: "voice", label: "语音记账", icon: Mic },
] as const;

export function AgentFloatingChat() {
  const recordMany = useLedger((s) => s.recordMany);
  const cats = useLedger((s) => s.cats);
  const [open, setOpen] = useState(false);
  const [msgs, setMsgsState] = useState<UiMsg[]>(() => liveMsgs);
  const [edits, setEditsState] = useState<Record<string, AgentDraft>>(() => liveEdits);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const [listening, setListening] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [savedKey, setSavedKey] = useState("");
  const [keyDraft, setKeyDraft] = useState("");

  const msgsRef = useRef(msgs);
  const editsRef = useRef(edits);
  const busyRef = useRef(false);
  const mountedRef = useRef(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const shotRef = useRef<HTMLInputElement>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);

  const setMsgs = (updater: (prev: UiMsg[]) => UiMsg[]) => {
    const next = updater(msgsRef.current);
    msgsRef.current = next;
    liveMsgs = next;
    if (mountedRef.current) setMsgsState(next);
  };
  const patchEdits = (next: Record<string, AgentDraft>) => {
    editsRef.current = next;
    liveEdits = next;
    if (mountedRef.current) setEditsState(next);
  };

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      recRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    void dbGetMeta<string>("agentDeepseekKey").then((k) => {
      if (k) {
        setSavedKey(k);
        setKeyDraft(k);
      }
    });
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs, busy, savingId]);

  const finish = async (
    text: string,
    image?: AgentImageInput | null,
  ): Promise<void> => {
    const raw = text.trim();
    if (busyRef.current) return;
    if (!raw && !image) return;
    const userText =
      raw ||
      (image ? (image.name ? `识别这张截图（${image.name}）并记账` : "识别这张截图并记账") : "");
    setMsgs((prev) => [
      ...prev,
      {
        id: nid(),
        role: "user",
        text: userText,
        imageUrl: image?.dataUrl,
        imageName: image?.name,
      },
    ]);
    setInput("");
    busyRef.current = true;
    setBusy(true);

    const history: AgentHistoryMsg[] = [];
    for (const m of msgsRef.current) {
      if (m.role === "user") {
        const note = m.imageUrl ? (m.text ? `（另附了一张截图）` : "（上传了一张截图）") : "";
        if (m.text || note) history.push({ role: "user", text: `${m.text}${note}`.trim() });
      } else if (m.role === "bot") {
        history.push({ role: "assistant", text: m.text });
      } else {
        const text = m.text
          ? `${m.text}（本次已生成 ${m.drafts.length} 笔草稿，待用户确认后入账）`
          : "";
        if (text) history.push({ role: "assistant", text });
      }
    }

    let result;
    try {
      result = await agentAsk({
        data: {
          key: savedKey || undefined,
          msgs: history,
          image: image ?? null,
          context: agentContext(),
        },
      });
    } catch (err) {
      const raw = err instanceof Error ? err.message : "";
      const staticNote =
        /404|not found|fetch failed|failed to fetch|load failed|network error/i.test(raw)
          ? "AI 服务当前不可用：纯静态托管没有后端。请用 npm run dev 本地运行，或部署到带服务端的平台（如 Vercel）后再试。"
          : raw;
      result = {
        ok: false as const,
        error: staticNote || "AI 服务暂不可用，请稍后再试",
      };
    } finally {
      busyRef.current = false;
      if (mountedRef.current) setBusy(false);
    }

    if (!result.ok) {
      setMsgs((prev) => [
        ...prev,
        { id: nid(), role: "bot", text: result.error, error: true },
      ]);
      return;
    }
    if (result.drafts.length > 0) {
      setMsgs((prev) => [
        ...prev,
        { id: nid(), role: "drafts", text: result.reply, drafts: result.drafts },
      ]);
    } else {
      setMsgs((prev) => [...prev, { id: nid(), role: "bot", text: result.reply }]);
    }
  };

  const runChip = async (id: string) => {
    if (id === "analyze" || id === "record") {
      const text = QUICK_CHIPS.find((q) => q.id === id);
      if (text && "text" in text) await finish(text.text);
      return;
    }
    if (id === "shot") {
      shotRef.current?.click();
      return;
    }
    if (id === "voice") {
      await startVoice();
    }
  };

  const pickShot = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.message("请选择图片文件");
      return;
    }
    setIngesting(true);
    try {
      const dataUrl = await fileToJpegDataUrl(file);
      if (dataUrl.length > 1_450_000) {
        toast.error("这张图太大了，识别不了，换一张清晰的小图试试");
        return;
      }
      await finish("", { dataUrl, name: file.name });
    } catch {
      toast.error("无法读取这张图片");
    } finally {
      if (mountedRef.current) setIngesting(false);
    }
  };

  const startVoice = async () => {
    const Ctor = speechCtor();
    if (!Ctor) {
      toast.message("当前浏览器不支持语音，试试 Chrome 或 Edge，或直接打字");
      return;
    }
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const rec = new Ctor();
    rec.lang = "zh-CN";
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;
    recRef.current = rec;
    setListening(true);
    let finalText = "";
    rec.onresult = (event) => {
      let interim = "";
      for (let i = 0; i < event.results.length; i += 1) {
        const res = event.results[i];
        const piece = res[0]?.transcript ?? "";
        if (res.isFinal) finalText += piece;
        else interim += piece;
      }
      setInput(interim || finalText);
    };
    rec.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        toast.message("没有麦克风权限，请允许后重试");
      } else if (event.error === "no-speech") {
        toast.message("没听到声音，再试一次");
      }
      recRef.current = null;
      if (mountedRef.current) setListening(false);
    };
    rec.onend = () => {
      recRef.current = null;
      if (mountedRef.current) setListening(false);
      const said = finalText.trim();
      if (said) {
        setInput("");
        void finish(said);
      }
    };
    try {
      rec.start();
    } catch {
      recRef.current = null;
      if (mountedRef.current) setListening(false);
      toast.message("麦克风启动失败，请检查浏览器权限");
    }
  };

  const clearChat = () => {
    setMsgs(() => []);
    patchEdits({});
  };

  const saveKey = () => {
    const key = keyDraft.trim();
    if (!key) {
      toast.message("先粘贴一个 DeepSeek API Key");
      return;
    }
    setSavedKey(key);
    void dbSetMeta("agentDeepseekKey", key);
    toast.success("已保存到本机浏览器");
  };

  const removeKey = () => {
    setSavedKey("");
    setKeyDraft("");
    void dbSetMeta("agentDeepseekKey", "");
    toast.message("已移除本机密钥");
  };

  const saveDrafts = async (bubble: UiMsg) => {
    if (bubble.role !== "drafts" || savingId) return;
    setSavingId(bubble.id);
    try {
      const list = bubble.drafts.map((d, i) => {
        const draft = editsRef.current[`${bubble.id}-${i}`] ?? d;
        return { ...draft, note: draft.note ?? "" };
      });
      const n = await recordMany(list);
      const doneId = bubble.id;
      setMsgs((prev) =>
        prev.map((m) =>
          m.id === doneId
            ? {
                id: nid(),
                role: "bot",
                text:
                  n > 0
                    ? `已记 ${n} 笔，去概览就能看到`
                    : "这几笔看起来已经入过了，没有重复添加。",
              }
            : m,
        ),
      );
    } catch {
      toast.error("保存失败，请再试一次");
    } finally {
      if (mountedRef.current) setSavingId(null);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        aria-label="打开 AI 记账助手"
        onClick={() => setOpen(true)}
        className="absolute right-3 bottom-24 z-30 grid size-14 place-items-center rounded-full bg-primary text-primary-fg shadow-sheet transition-transform duration-150 ease-out hover:scale-105 active:scale-95"
      >
        <Bot className="size-7" strokeWidth={1.8} />
      </button>
    );
  }

  return (
    <div className="absolute inset-x-3 bottom-24 z-40 flex max-h-[calc(100dvh-8rem)] flex-col overflow-hidden rounded-2xl bg-elevated shadow-sheet ledger-enter">
      <div className="flex shrink-0 items-center gap-3 px-4 pt-3 pb-2.5">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
          <Bot className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg leading-tight text-fg">AI 记账助手</p>
          <p className="mt-0.5 text-xs text-muted">DeepSeek 驱动 · 截图 / 语音 / 支出分析</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="连接设置"
          className={cn(showKey && "bg-elevated text-fg")}
          onClick={() => setShowKey((v) => !v)}
        >
          <Settings2 />
        </Button>
        {msgs.length > 0 ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="清空对话"
            onClick={clearChat}
          >
            <Trash2 />
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="收起对话窗口"
          onClick={() => setOpen(false)}
        >
          <X />
        </Button>
      </div>

      {showKey ? (
        <div className="shrink-0 border-t border-border px-4 py-3">
          <div className="flex gap-2">
            <input
              type="password"
              value={keyDraft}
              onChange={(e) => setKeyDraft(e.target.value)}
              placeholder="DeepSeek API Key（sk-…）"
              autoComplete="off"
              className="h-11 min-w-0 flex-1 rounded-md bg-surface px-3 text-sm text-fg shadow-[var(--shadow-border)] placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-fg/20"
            />
            <Button type="button" onClick={saveKey}>
              保存
            </Button>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-subtle">
            不填也能用：默认 Key 已内置，仅在当前机器有效；线上部署请改用环境变量 DEEPSEEK_API_KEY（优先）。
            {savedKey ? (
              <button type="button" className="ml-2 text-muted underline" onClick={removeKey}>
                移除本机 Key
              </button>
            ) : null}
          </p>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-2 pb-1">
        {msgs.length === 0 ? (
          <div>
            <p className="text-sm leading-relaxed text-muted">
              把想记的账说成一句话、发一张支付截图，或按一下麦克风；也可以让我分析这个月花得怎么样。
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {QUICK_CHIPS.map((q) => {
                const Icon = q.icon;
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => void runChip(q.id)}
                    className="inline-flex h-10 items-center gap-1.5 rounded-full bg-surface px-3.5 text-sm text-fg shadow-[var(--shadow-border)] transition-shadow hover:shadow-[var(--shadow-border-hover)] disabled:opacity-40"
                    disabled={busy}
                  >
                    <Icon className="size-4 text-primary" />
                    {q.label}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div ref={scrollRef} className="flex flex-col gap-3">
            {msgs.map((m) => (
              <Bubble
                key={m.id}
                msg={m}
                cats={cats}
                edits={edits}
                savingId={savingId}
                onEdit={patchEdits}
                onSave={() => void saveDrafts(m)}
              />
            ))}
            {busy ? (
              <div className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2 text-sm text-muted shadow-[var(--shadow-border)]">
                <Loader2 className="size-4 animate-spin" />
                <span>{ingesting ? "正在读取截图…" : "记账助手思考中"}</span>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <form
        className="flex shrink-0 gap-2 border-t border-border px-4 pt-3 pb-4"
        onSubmit={(e) => {
          e.preventDefault();
          void finish(input);
        }}
      >
        <input
          ref={shotRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            void pickShot(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="shrink-0 bg-surface"
          aria-label="上传支付截图"
          disabled={busy || ingesting}
          onClick={() => shotRef.current?.click()}
        >
          <ImagePlus />
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className={cn("shrink-0 bg-surface", listening && "bg-primary text-primary-fg")}
          aria-label={listening ? "停止录音" : "语音记账"}
          disabled={busy || ingesting}
          onClick={() => void startVoice()}
        >
          {listening ? <Square /> : <Mic />}
        </Button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={listening ? "正在听…" : "说一句就记账，比如“午饭 25 元”"}
          className="h-11 min-w-0 flex-1 rounded-md bg-surface px-3 text-sm text-fg shadow-[var(--shadow-border)] placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-fg/20"
        />
        <Button
          type="submit"
          size="icon"
          className="shrink-0"
          disabled={busy || ingesting || !input.trim()}
          aria-label="发送"
        >
          <Send />
        </Button>
      </form>
    </div>
  );
}

function Bubble({
  msg,
  cats,
  edits,
  savingId,
  onEdit,
  onSave,
}: {
  msg: UiMsg;
  cats: ReturnType<typeof useLedger.getState>["cats"];
  edits: Record<string, AgentDraft>;
  savingId: string | null;
  onEdit: (next: Record<string, AgentDraft>) => void;
  onSave: () => void;
}) {
  if (msg.role === "user") {
    return (
      <div className="ml-auto flex max-w-[88%] flex-col items-end gap-1.5">
        {msg.imageUrl ? (
          <img
            src={msg.imageUrl}
            alt={msg.imageName ?? "上传的截图"}
            className="max-h-40 w-full rounded-lg bg-surface object-contain shadow-[var(--shadow-border)]"
          />
        ) : null}
        <p className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-fg">{msg.text}</p>
      </div>
    );
  }
  if (msg.role === "drafts") {
    return (
      <div className="rounded-lg bg-surface px-3 py-3 shadow-[var(--shadow-border)]">
        {msg.text ? <AgentText text={msg.text} className="mb-3 text-sm text-fg" /> : null}
        <ul className="flex flex-col gap-3">
          {msg.drafts.map((d, i) => {
            const key = `${msg.id}-${i}`;
            return (
              <li key={key}>
                <DraftEditor
                  draft={edits[key] ?? d}
                  cats={cats}
                  onChange={(next) => onEdit({ ...edits, [key]: next })}
                />
              </li>
            );
          })}
        </ul>
        <Button
          type="button"
          className="mt-3 w-full"
          disabled={savingId === msg.id}
          onClick={onSave}
        >
          {savingId === msg.id ? "正在入账…" : `记下 ${msg.drafts.length} 笔`}
        </Button>
      </div>
    );
  }
  return (
    <div className="max-w-[92%]">
      <AgentText
        text={msg.text}
        className={cn(
          "rounded-lg px-3 py-2 text-sm shadow-[var(--shadow-border)]",
          msg.error ? "bg-surface text-danger" : "bg-surface text-fg",
        )}
      />
    </div>
  );
}

function DraftEditor({
  draft,
  cats,
  onChange,
}: {
  draft: AgentDraft;
  cats: ReturnType<typeof useLedger.getState>["cats"];
  onChange: (next: AgentDraft) => void;
}) {
  const today = shanghaiDayValue(Date.now());
  const [amount, setAmount] = useState((draft.amountFen / 100).toFixed(2));
  const [merchant, setMerchant] = useState(draft.merchant);
  const [note, setNote] = useState(draft.note ?? "");
  const [date, setDate] = useState(draft.date ?? today);
  const sync = (amountV: string, merchantV: string, noteV: string, dateV: string) => {
    const fen = Math.round(Number.parseFloat(amountV) * 100);
    onChange({
      ...draft,
      amountFen: Number.isFinite(fen) && fen > 0 ? fen : draft.amountFen,
      merchant: merchantV.trim() || draft.merchant,
      note: noteV,
      date: dateV,
    });
  };
  return (
    <div className="rounded-lg bg-elevated px-3 py-3 shadow-[var(--shadow-border)]">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-fg">
          {leafLabel(cats, draft.category)}
          <span className={cn("ml-1.5 text-xs", draft.direction === "income" ? "text-income" : "text-muted")}>
            {draft.direction === "income" ? "收入" : "支出"}
          </span>
        </p>
        <input
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            sync(amount, merchant, note, e.target.value);
          }}
          className="h-8 w-32 rounded-md bg-surface px-2 text-xs text-fg shadow-[var(--shadow-border)]"
        />
      </div>
      <label className="mt-2 block">
        <span className="text-xs text-muted">金额（元）</span>
        <input
          inputMode="decimal"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            sync(e.target.value, merchant, note, date);
          }}
          className="mt-1 h-10 w-full rounded-md bg-surface px-3 font-display text-lg text-fg tabular-nums shadow-[var(--shadow-border)]"
        />
      </label>
      <label className="mt-2 block">
        <span className="text-xs text-muted">商家</span>
        <input
          value={merchant}
          onChange={(e) => {
            setMerchant(e.target.value);
            sync(amount, e.target.value, note, date);
          }}
          className="mt-1 h-10 w-full rounded-md bg-surface px-3 text-sm text-fg shadow-[var(--shadow-border)]"
        />
      </label>
      <label className="mt-2 block">
        <span className="text-xs text-muted">备注</span>
        <input
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            sync(amount, merchant, e.target.value, date);
          }}
          placeholder="可省略"
          className="mt-1 h-10 w-full rounded-md bg-surface px-3 text-sm text-fg shadow-[var(--shadow-border)] placeholder:text-subtle"
        />
      </label>
    </div>
  );
}

/** Safe, tiny Markdown renderer: paragraphs, “- ” lists and **bold**. */
function AgentText({ text, className }: { text: string; className?: string }) {
  const lines = text.split("\n");
  const blocks: { kind: "list" | "para"; items: string[] }[] = [];
  let current: { kind: "list" | "para"; items: string[] } | null = null;
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      current = null;
      continue;
    }
    const list = /^\s*(?:[-*•]|\d+[.、])\s+/.test(line);
    const kind: "list" | "para" = list ? "list" : "para";
    if (!current || current.kind !== kind) {
      current = { kind, items: [] };
      blocks.push(current);
    }
    current.items.push(list ? line.replace(/^\s*(?:[-*•]|\d+[.、])\s+/, "") : line);
  }
  return (
    <div className={cn("space-y-1.5 leading-relaxed", className)}>
      {blocks.map((b, bi) =>
        b.kind === "list" ? (
          <ul key={bi} className="flex flex-col gap-1">
            {b.items.map((item, ii) => (
              <li key={ii} className="flex gap-1.5">
                <span className="select-none text-muted">·</span>
                <span className="min-w-0">{inlineText(item)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p key={bi}>{inlineText(b.items.join(" "))}</p>
        ),
      )}
    </div>
  );
}

function inlineText(raw: string) {
  const parts = raw.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code key={i} className="rounded-sm bg-border/60 px-1 py-0.5 text-[0.9em]">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}
