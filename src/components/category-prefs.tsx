import { useRef, useState } from "react";
import { EMOJI_PICK, groupsFor, leavesIn, type CatLeaf, type GroupId } from "@/lib/categories";
import { newId } from "@/lib/ledger";
import { useLedger } from "@/lib/ledger-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CategoryPrefs() {
  const [side, setSide] = useState<"expense" | "income">("expense");
  const groups = groupsFor(side);
  const [open, setOpen] = useState<string>("");

  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between px-1">
        <h2 className="font-display text-xl text-fg">分类</h2>
        <div className="flex rounded-full bg-elevated p-0.5 shadow-[var(--shadow-border)]">
          {(["expense", "income"] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => {
                setSide(d);
                setOpen("");
              }}
              className={cn(
                "h-8 rounded-full px-3 text-xs",
                side === d ? "bg-primary text-primary-fg" : "text-muted",
              )}
            >
              {d === "expense" ? "支出" : "收入"}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {groups.map((g) => (
          <GroupCard key={g.id} groupId={g.id} open={open === g.id} onToggle={() => setOpen(open === g.id ? "" : g.id)} />
        ))}
      </div>
    </section>
  );
}

function GroupCard({
  groupId,
  open,
  onToggle,
}: {
  groupId: GroupId;
  open: boolean;
  onToggle: () => void;
}) {
  const cats = useLedger((s) => s.cats);
  const upsert = useLedger((s) => s.upsertCat);
  const remove = useLedger((s) => s.removeCat);
  const group = groupsFor("expense").concat(groupsFor("income")).find((g) => g.id === groupId);
  const leaves = leavesIn(cats, groupId);
  const [adding, setAdding] = useState(false);
  if (!group) return null;

  return (
    <div className="rounded-xl bg-elevated px-4 py-3 shadow-[var(--shadow-border)]">
      <button type="button" className="flex w-full items-center gap-3 text-left" onClick={onToggle}>
        <span className="text-xl">{group.emoji}</span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-lg text-fg">{group.name}</span>
          <span className="text-xs text-muted">{group.hint}</span>
        </span>
        <span className="text-xs text-subtle">{open ? "收起" : `${leaves.length} 项`}</span>
      </button>
      {open ? (
        <div className="mt-3 grid grid-cols-4 gap-3">
          {leaves.map((c) => (
            <div key={c.id} className="flex flex-col items-center gap-1">
              <LeafFace cat={c} />
              <span className="max-w-full truncate text-center text-xs text-muted">{c.name}</span>
              <button type="button" className="text-[10px] text-subtle" onClick={() => void remove(c.id)}>
                删
              </button>
            </div>
          ))}
          <button
            type="button"
            className="flex flex-col items-center gap-1"
            onClick={() => setAdding(true)}
          >
            <span className="flex size-12 items-center justify-center rounded-full bg-surface text-lg text-muted shadow-[var(--shadow-border)]">
              +
            </span>
            <span className="text-xs text-muted">添加</span>
          </button>
        </div>
      ) : null}
      {open && adding ? (
        <AddLeaf
          groupId={groupId}
          direction={group.direction}
          onClose={() => setAdding(false)}
          onSave={(row) => {
            void upsert(row);
            setAdding(false);
          }}
        />
      ) : null}
    </div>
  );
}

function LeafFace({ cat }: { cat: CatLeaf }) {
  if (cat.image) {
    return <img src={cat.image} alt="" className="size-12 rounded-full object-cover" />;
  }
  return (
    <span className="flex size-12 items-center justify-center rounded-full bg-surface text-2xl shadow-[var(--shadow-border)]">
      {cat.emoji}
    </span>
  );
}

function AddLeaf({
  groupId,
  direction,
  onClose,
  onSave,
}: {
  groupId: GroupId;
  direction: "expense" | "income";
  onClose: () => void;
  onSave: (row: CatLeaf) => void;
}) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("✨");
  const [image, setImage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <form
      className="mt-3 border-t border-border pt-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSave({
          id: newId(),
          groupId,
          name: name.trim(),
          emoji,
          image,
          direction,
        });
      }}
    >
      <p className="text-xs text-muted">新小类</p>
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="名称，如 奶茶"
        className="mt-2 h-11 w-full rounded-md bg-surface px-3 text-sm shadow-[var(--shadow-border)]"
      />
      <div className="mt-2 flex flex-wrap gap-1.5">
        {EMOJI_PICK.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => {
              setEmoji(e);
              setImage(null);
            }}
            className={cn(
              "flex size-9 items-center justify-center rounded-full text-lg",
              !image && emoji === e ? "bg-primary/20" : "bg-surface",
            )}
          >
            {e}
          </button>
        ))}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          void fileToIcon(file).then(setImage);
        }}
      />
      <div className="mt-2 flex gap-2">
        <Button type="button" variant="secondary" className="flex-1" onClick={() => fileRef.current?.click()}>
          用照片
        </Button>
        <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
          取消
        </Button>
        <Button type="submit" className="flex-1">
          添加
        </Button>
      </div>
    </form>
  );
}

async function fileToIcon(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const size = 96;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("无法读取图片");
  }
  const scale = Math.max(size / bitmap.width, size / bitmap.height);
  const w = bitmap.width * scale;
  const h = bitmap.height * scale;
  ctx.drawImage(bitmap, (size - w) / 2, (size - h) / 2, w, h);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.8);
}
