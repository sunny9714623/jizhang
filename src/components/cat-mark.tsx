import { useLedger } from "@/lib/ledger-store";
import { DEFAULT_LEAVES, findGroup, findLeaf } from "@/lib/categories";
import { cn } from "@/lib/utils";

export function CatMark({
  id,
  group,
  className,
}: {
  id?: string;
  group?: string;
  className?: string;
}) {
  const cats = useLedger((s) => s.cats);
  const leaf = id ? findLeaf(cats, id) ?? findLeaf(DEFAULT_LEAVES, id) : undefined;
  const g = group ? findGroup(group) : leaf ? findGroup(leaf.groupId) : undefined;
  const image = leaf?.image;
  const fallback = (leaf?.name || g?.name || "类").slice(0, 1);
  const emoji = leaf?.emoji || g?.emoji || fallback || "•";
  if (image) {
    return (
      <img
        src={image}
        alt=""
        className={cn("size-9 rounded-full object-cover", className)}
      />
    );
  }
  return (
    <span
      className={cn(
        "flex size-9 items-center justify-center rounded-full bg-elevated text-lg leading-none shadow-[var(--shadow-border)]",
        className,
      )}
    >
      {emoji}
    </span>
  );
}
