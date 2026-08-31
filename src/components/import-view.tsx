import { useRef, useState } from "react";
import { ClipboardPaste, FileSpreadsheet, HandCoins, ImagePlus } from "lucide-react";
import { formatYuan } from "@/lib/ledger";
import { parsedToTx } from "@/lib/parse-bill";
import { DEMO_MESSAGES } from "@/lib/parse-message";
import { useLedger } from "@/lib/ledger-store";
import { Button } from "@/components/ui/button";
import { CatMark } from "@/components/cat-mark";
import { ChatBox } from "@/components/chat-box";
import { cn } from "@/lib/utils";

const ACCEPT = ".csv,.xls,.xlsx,.txt,image/jpeg,image/png,image/webp";

export function ImportView() {
  const inputRef = useRef<HTMLInputElement>(null);
  const shotRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState("");
  const importFiles = useLedger((s) => s.importFiles);
  const preview = useLedger((s) => s.preview);
  const previewSkipped = useLedger((s) => s.previewSkipped);
  const confirmImport = useLedger((s) => s.confirmImport);
  const cancelPreview = useLedger((s) => s.cancelPreview);
  const dismissSample = useLedger((s) => s.dismissSample);
  const usingSample = useLedger((s) => s.usingSample);
  const openComposer = useLedger((s) => s.openComposer);
  const ingestText = useLedger((s) => s.ingestText);
  const readClipboard = useLedger((s) => s.readClipboard);
  const liveCapture = useLedger((s) => s.liveCapture);
  const setLiveCapture = useLedger((s) => s.setLiveCapture);
  const ingesting = useLedger((s) => s.ingesting);

  const onFiles = (list: FileList | File[] | null) => {
    if (!list) return;
    void importFiles(Array.from(list));
  };

  if (preview && preview.length > 0) {
    const expense = preview
      .filter((r) => r.direction === "expense")
      .reduce((s, r) => s + r.amountFen, 0);
    const income = preview
      .filter((r) => r.direction === "income")
      .reduce((s, r) => s + r.amountFen, 0);
    return (
      <div className="flex h-full min-h-0 flex-col gap-4">
        <section className="shrink-0 rounded-xl bg-elevated px-5 py-4 shadow-[var(--shadow-border)]">
          <p className="font-display text-2xl text-fg">待入册 {preview.length} 笔</p>
          <p className="mt-2 text-sm text-muted">
            微信和支付宝会进同一本账，按餐饮、交通等常用分类入册。支出 {formatYuan(expense)}
            {income ? ` · 收入 ${formatYuan(income)}` : ""}
            {previewSkipped ? ` · 跳过 ${previewSkipped} 条` : ""}
          </p>
        </section>
        <ul className="min-h-0 flex-1 overflow-y-auto rounded-lg bg-elevated shadow-[var(--shadow-border)]">
          {preview.map((row, i) => {
            const tx = parsedToTx(row, "import");
            return (
              <li
                key={`${tx.orderId}-${i}`}
                className="flex items-center gap-3 border-t border-border px-4 py-3 first:border-t-0"
              >
                <CatMark id={tx.category} className="size-8 text-base" />
                <span className="min-w-0 flex-1 truncate text-sm">{tx.merchant}</span>
                <span className="text-sm tabular-nums text-muted">{formatYuan(tx.amountFen)}</span>
              </li>
            );
          })}
        </ul>
        <div className="flex shrink-0 gap-2">
          <Button variant="secondary" className="flex-1" onClick={cancelPreview}>
            取消
          </Button>
          <Button className="flex-1" onClick={() => void confirmImport()}>
            确认入册
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 pb-8">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="sr-only"
        onChange={(e) => {
          onFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={shotRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          onFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <ChatBox />

      <section className="rounded-xl bg-elevated px-5 py-5 shadow-[var(--shadow-border)]">
        <p className="font-display text-2xl text-fg">截图入账</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          支付成功页通常不能复制。把成功页截图保存到相册，在这里选图，对照金额和商家入册。
        </p>
        <Button
          className="mt-4 w-full"
          disabled={ingesting}
          onClick={() => shotRef.current?.click()}
        >
          <ImagePlus />
          {ingesting ? "正在打开截图" : "从相册选支付截图"}
        </Button>
        <p className="mt-3 text-center text-xs text-subtle">也可把截图拖到页面上</p>
      </section>

      <section className="rounded-xl bg-elevated px-5 py-5 shadow-[var(--shadow-border)]">
        <p className="font-display text-2xl text-fg">粘贴支付消息</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          若通知中心或账单详情能复制文字，粘贴后会自动识别。
        </p>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onPaste={(e) => {
            const text = e.clipboardData.getData("text");
            if (!text) return;
            e.preventDefault();
            setDraft("");
            void ingestText(text);
          }}
          placeholder="在这里粘贴支付消息"
          rows={3}
          className="mt-4 w-full resize-none rounded-md bg-surface px-3 py-3 text-sm text-fg shadow-[var(--shadow-border)] placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-fg/20"
        />
        <div className="mt-3 flex gap-2">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => void readClipboard()}
          >
            <ClipboardPaste />
            从剪贴板读取
          </Button>
        </div>
        {draft.trim() ? (
          <Button
            className="mt-3 w-full"
            onClick={() => {
              const text = draft;
              setDraft("");
              void ingestText(text);
            }}
          >
            识别并入账
          </Button>
        ) : null}
        <label className="mt-4 flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={liveCapture}
            onChange={(e) => setLiveCapture(e.target.checked)}
            className="size-4 accent-primary"
          />
          回到月梨时自动读取剪贴板
        </label>
        <p className="mt-3 text-xs text-subtle">没有真实消息时，可点示例看看识别效果</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {DEMO_MESSAGES.map((m) => (
            <button
              key={m.label}
              type="button"
              onClick={() => void ingestText(m.text)}
              className={cn(
                "h-10 rounded-full bg-surface px-3.5 text-sm text-fg shadow-[var(--shadow-border)]",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-xl bg-elevated px-5 py-5 shadow-[var(--shadow-border)]">
        <p className="font-display text-2xl text-fg">从官方账单导入</p>
        <Button className="mt-4 w-full" onClick={() => inputRef.current?.click()}>
          <FileSpreadsheet />
          选择 CSV 或 Excel
        </Button>
      </section>

      <button
        type="button"
        onClick={openComposer}
        className="flex items-center gap-3 rounded-lg bg-elevated px-4 py-4 text-left shadow-[var(--shadow-border)]"
      >
        <HandCoins className="size-5 text-primary" />
        <span>
          <span className="block text-sm text-fg">没有消息也没有文件</span>
          <span className="text-xs text-muted">也可以先手动记一笔</span>
        </span>
      </button>

      {usingSample ? (
        <button type="button" className="text-sm text-muted" onClick={() => void dismissSample()}>
          清空示例，只用我的账单
        </button>
      ) : null}
    </div>
  );
}

