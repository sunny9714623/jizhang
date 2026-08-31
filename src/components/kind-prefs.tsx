import { useState } from "react";
import { EMOJI_PICK } from "@/lib/categories";
import { newId } from "@/lib/ledger";
import { type KindDef, type KindSide } from "@/lib/models";
import { useLedger } from "@/lib/ledger-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function KindTags() {
  const kinds = useLedger((s) => s.kinds);
  const upsert = useLedger((s) => s.upsertKind);
  const remove = useLedger((s) => s.removeKind);
  const [adding, setAdding] = useState(false);
  const [side, setSide] = useState<KindSide>("asset");
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("💵");
  const [editId, setEditId] = useState<string | null>(null);

  const startEdit = (k: KindDef) => {
    setEditId(k.id);
    setName(k.name);
    setEmoji(k.emoji);
    setSide(k.side);
    setAdding(true);
  };

  return (
    <div className="mb-3">
      <div className="grid grid-cols-4 gap-3">
        {kinds.map((k) => (
          <div key={k.id} className="flex flex-col items-center gap-1">
            <span className="flex size-12 items-center justify-center rounded-full bg-surface text-2xl shadow-[var(--shadow-border)]">
              {k.emoji}
            </span>
            <span className="max-w-full truncate text-center text-xs text-muted">{k.name}</span>
            <div className="flex gap-2">
              <button type="button" className="text-[10px] text-subtle" onClick={() => startEdit(k)}>
                改
              </button>
              <button type="button" className="text-[10px] text-subtle" onClick={() => void remove(k.id)}>
                删
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="flex flex-col items-center gap-1"
          onClick={() => {
            setEditId(null);
            setName("");
            setEmoji("💵");
            setAdding(true);
          }}
        >
          <span className="flex size-12 items-center justify-center rounded-full bg-surface text-lg text-muted shadow-[var(--shadow-border)]">
            +
          </span>
          <span className="text-xs text-muted">添加</span>
        </button>
      </div>
      {adding ? (
        <form
          className="mt-3 border-t border-border pt-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            void upsert({
              id: editId ?? newId(),
              name: name.trim(),
              emoji,
              side,
            });
            setName("");
            setEditId(null);
            setAdding(false);
          }}
        >
          <div className="flex gap-2">
            {(["asset", "liability"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSide(s)}
                className={cn(
                  "h-9 flex-1 rounded-full text-xs",
                  side === s ? "bg-primary text-primary-fg" : "bg-surface text-fg shadow-[var(--shadow-border)]",
                )}
              >
                {s === "asset" ? "资产" : "负债"}
              </button>
            ))}
          </div>
          <input
            className="mt-2 h-11 w-full rounded-md bg-surface px-3 text-sm shadow-[var(--shadow-border)]"
            placeholder="名称，如 花呗"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {EMOJI_PICK.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                className={cn("flex size-8 items-center justify-center rounded-md text-base", emoji === e && "bg-primary/20")}
              >
                {e}
              </button>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setAdding(false)}>
              取消
            </Button>
            <Button type="submit" className="flex-1">
              {editId ? "保存" : "加上"}
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
