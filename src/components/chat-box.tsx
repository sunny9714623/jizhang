import { useState } from "react";
import { leafLabel, type CatLeaf } from "@/lib/categories";
import { parseChatBooks, type ChatDraft } from "@/lib/parse-chat";
import { useLedger } from "@/lib/ledger-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Msg =
  | { id: string; role: "bot"; text: string }
  | { id: string; role: "user"; text: string }
  | { id: string; role: "drafts"; drafts: ChatDraft[] };

function nid() {
  return `m-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;
}

export function ChatBox() {
  const recordMany = useLedger((s) => s.recordMany);
  const cats = useLedger((s) => s.cats);
  const [text, setText] = useState("");
  const [edits, setEdits] = useState<Record<string, ChatDraft>>({});
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      id: "hello",
      role: "bot",
      text: "直接说就行。一笔：吃饭2000。多笔：去饭店吃饭200，购物100。",
    },
  ]);

  const send = (raw: string) => {
    const line = raw.trim();
    if (!line) return;
    const user: Msg = { id: nid(), role: "user", text: line };
    const drafts = parseChatBooks(line);
    if (drafts.length === 0) {
      setMsgs((prev) => [
        ...prev,
        user,
        { id: nid(), role: "bot", text: "没读到金额。试试「吃饭2000」或「去饭店吃饭200，购物100」。" },
      ]);
      setText("");
      return;
    }
    setMsgs((prev) => [...prev, user, { id: nid(), role: "drafts", drafts }]);
    setText("");
  };

  const confirm = async (drafts: ChatDraft[], id: string) => {
    const n = await recordMany(drafts);
    setMsgs((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              id: nid(),
              role: "bot",
              text: n > 0 ? `已记 ${n} 笔` : "这些已经入过了",
            }
          : m,
      ),
    );
  };

  return (
    <section className="rounded-xl bg-elevated px-5 py-4 shadow-[var(--shadow-border)]">
      <p className="font-display text-2xl text-fg">对话记账</p>
      <div className="mt-3 flex max-h-72 flex-col gap-2 overflow-y-auto">
        {msgs.map((m) =>
          m.role === "drafts" ? (
            <div key={m.id} className="rounded-lg bg-surface px-3 py-3 shadow-[var(--shadow-border)]">
              <ul className="flex flex-col gap-3">
                {m.drafts.map((d, i) => {
                  const key = `${m.id}-${i}`;
                  return (
                    <li key={key}>
                      <DraftCard
                        draft={edits[key] ?? d}
                        cats={cats}
                        onChange={(next) => setEdits((prev) => ({ ...prev, [key]: next }))}
                      />
                    </li>
                  );
                })}
              </ul>
              <Button
                type="button"
                className="mt-3 w-full"
                onClick={() =>
                  void confirm(
                    m.drafts.map((d, i) => edits[`${m.id}-${i}`] ?? d),
                    m.id,
                  )
                }
              >
                记下{m.drafts.length > 1 ? ` ${m.drafts.length} 笔` : ""}
              </Button>
            </div>
          ) : (
            <p
              key={m.id}
              className={cn(
                "max-w-[90%] rounded-lg px-3 py-2 text-sm",
                m.role === "user" ? "ml-auto bg-primary text-primary-fg" : "bg-surface text-fg shadow-[var(--shadow-border)]",
              )}
            >
              {m.text}
            </p>
          ),
        )}
      </div>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          send(text);
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="吃饭2000，购物100"
          className="h-11 min-w-0 flex-1 rounded-md bg-surface px-3 text-sm shadow-[var(--shadow-border)] placeholder:text-subtle"
        />
        <Button type="submit">发送</Button>
      </form>
    </section>
  );
}

function DraftCard({
  draft,
  cats,
  onChange,
}: {
  draft: ChatDraft;
  cats: CatLeaf[];
  onChange: (next: ChatDraft) => void;
}) {
  const [amount, setAmount] = useState((draft.amountFen / 100).toFixed(2));
  const [merchant, setMerchant] = useState(draft.merchant);
  const [note, setNote] = useState(draft.note);
  const sync = (amountV: string, merchantV: string, noteV: string) => {
    const fen = Math.round(Number.parseFloat(amountV) * 100);
    onChange({
      ...draft,
      amountFen: Number.isFinite(fen) && fen > 0 ? fen : draft.amountFen,
      merchant: merchantV.trim() || draft.merchant,
      note: noteV,
    });
  };
  return (
    <div className="rounded-lg bg-elevated px-3 py-3 shadow-[var(--shadow-border)]">
      <p className="text-sm text-fg">
        {leafLabel(cats, draft.category)}
        {draft.direction === "income" ? "收入" : "支出"}
      </p>
      <label className="mt-2 block">
        <span className="text-xs text-muted">金额（元）</span>
        <input
          inputMode="decimal"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            sync(e.target.value, merchant, note);
          }}
          className="mt-1 h-10 w-full rounded-md bg-surface px-3 text-sm text-fg shadow-[var(--shadow-border)]"
        />
      </label>
      <label className="mt-2 block">
        <span className="text-xs text-muted">商家</span>
        <input
          value={merchant}
          onChange={(e) => {
            setMerchant(e.target.value);
            sync(amount, e.target.value, note);
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
            sync(amount, merchant, e.target.value);
          }}
          className="mt-1 h-10 w-full rounded-md bg-surface px-3 text-sm text-fg shadow-[var(--shadow-border)]"
        />
      </label>
    </div>
  );
}
