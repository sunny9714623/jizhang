import { monthStats, useLedger } from "./ledger-store";
import { isAccountTx, monthKey, shanghaiDate, shanghaiDayValue } from "./ledger";
import { txsInLedger, inLedger } from "./ledgers";
import { leafLabel, type CatLeaf } from "./categories";
import type { Tx } from "./ledger";
import type {
  AgentCategoryInfo,
  AgentCatStat,
  AgentContext,
  AgentDirection,
  AgentMonthInfo,
  AgentRecurringBrief,
  AgentTxBrief,
} from "./agent-types";

function previousMonth(key: string): string | null {
  const [y, m] = key.split("-").map(Number);
  if (!y || !m || m < 1 || m > 12) return null;
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function buildMonth(
  txs: Tx[],
  key: string,
  cats: CatLeaf[],
  topLimit = 8,
): AgentMonthInfo | null {
  const [y, m] = key.split("-").map(Number);
  if (!y || !m || m < 1 || m > 12) return null;
  const daysInMonth = new Date(y, m, 0).getDate();
  const today = shanghaiDate(Date.now());
  const isCurrent = today.year === String(y) && today.month === String(m);
  const daysElapsed = isCurrent ? Math.max(1, today.day) : daysInMonth;
  const stats = monthStats(txs, key, cats);
  let count = 0;
  for (const tx of txs) {
    if (monthKey(tx.time) === key && !isAccountTx(tx)) count += 1;
  }
  const top: AgentCatStat[] = [...stats.byCat.entries()]
    .map(([id, fen]) => ({
      id,
      name: leafLabel(cats, id),
      fen,
      count: stats.countByCat.get(id) ?? 0,
    }))
    .filter((r) => r.fen > 0)
    .sort((a, b) => b.fen - a.fen)
    .slice(0, topLimit);
  return {
    month: key,
    label: `${y}年${m}月`,
    daysElapsed,
    expenseFen: stats.expense,
    incomeFen: stats.income,
    balanceFen: stats.balance,
    count,
    dailyFen: daysElapsed > 0 ? Math.round(stats.expense / daysElapsed) : 0,
    top,
  };
}

function briefDirection(direction: Tx["direction"]): AgentDirection {
  return direction === "income" ? "income" : "expense";
}

type DeepFilter = { category?: string; month?: string };

export function agentContext(filter?: DeepFilter): AgentContext {
  const s = useLedger.getState();
  const ledgerId = s.ledgerId;
  const txs = txsInLedger(s.txs, ledgerId);
  const usable = txs.filter((tx) => !isAccountTx(tx));
  const month = s.month || monthKey(Date.now());
  const cats = s.cats;
  const prevKey = previousMonth(month);

  // 不限当月：给最近 40 笔（跨所有月份），避免 AI 只看到当前月数据
  const recent: AgentTxBrief[] = [...usable]
    .sort((a, b) => b.time - a.time)
    .slice(0, 20)
    .map((tx) => ({
      day: shanghaiDayValue(tx.time).slice(5),
      merchant: tx.merchant || tx.title || "未注明对方",
      category: leafLabel(cats, tx.category),
      direction: briefDirection(tx.direction),
      fen: tx.amountFen,
    }));

  // 账本里出现过的全部月份（升序），每月的支出/收入/笔数/占比 Top5
  const monthKeys = [
    ...new Set(usable.map((tx) => monthKey(tx.time))),
  ].sort();
  const months = monthKeys
    .map((key) => buildMonth(usable, key, cats, 5))
    .filter((m): m is NonNullable<typeof m> => m !== null);
  let expenseFen = 0;
  let incomeFen = 0;
  for (const m of months) {
    expenseFen += m.expenseFen;
    incomeFen += m.incomeFen;
  }
  const span =
    months.length > 0
      ? {
          firstMonth: months[0].month,
          lastMonth: months[months.length - 1].month,
          count: months.reduce((sum, m) => sum + m.count, 0),
          expenseFen,
          incomeFen,
        }
      : undefined;

  // 年度分析：以“整年汇总（各月 + 各分类 + 总额）为主”供模型分析，
  // 不逐条灌入几千笔原始流水（那样会让模型超时/无法解析），但数据是整年的、完整的。
  const year = month.slice(0, 4);
  const yearMonths = months.filter((m) => m && m.month.startsWith(`${year}-`));
  const yearTxs: AgentTxBrief[] = [];

  const upcoming: AgentRecurringBrief[] = inLedger(s.recurring, ledgerId)
    .filter((r) => r.active && !r.id.startsWith("sample"))
    .sort((a, b) => (a.nextDue < b.nextDue ? -1 : 1))
    .slice(0, 6)
    .map((r) => ({
      title: r.title,
      amountFen: r.amountFen,
      nextDue: r.nextDue,
      category: leafLabel(cats, r.category),
    }));

  const catsInfo: AgentCategoryInfo[] = cats.map((c) => ({
    id: c.id,
    name: c.name,
    direction: c.direction,
  }));

  // 深度下钻：只给“该范围内的逐笔流水 + 一句说明”，不再叠加整年汇总，避免请求过大导致网关超时/拒绝。
  if (filter?.category || filter?.month) {
    const scoped = (filter.category
      ? usable.filter((tx) => tx.category === filter.category)
      : usable.filter((tx) => monthKey(tx.time) === filter.month)
    )
      .sort((a, b) => b.time - a.time)
      .slice(0, 50)
      .map((tx) => ({
        day: shanghaiDayValue(tx.time).slice(5),
        merchant: tx.merchant || tx.title || "未注明对方",
        category: leafLabel(cats, tx.category),
        direction: briefDirection(tx.direction),
        fen: tx.amountFen,
      }));
    const focus = filter.category
      ? `分类「${leafLabel(cats, filter.category)}」`
      : `${filter.month} 月`;
    return {
      app: "月梨账单",
      ledger: s.ledgers.find((l) => l.id === ledgerId)?.name ?? "月梨账单",
      today: shanghaiDayValue(Date.now()),
      usingSample: s.usingSample,
      month: {
        month,
        label: month,
        daysElapsed: 1,
        expenseFen: 0,
        incomeFen: 0,
        balanceFen: 0,
        count: 0,
        dailyFen: 0,
        top: [],
      },
      prev: null,
      recent: [],
      cats: cats.map((c) => ({ id: c.id, name: c.name, direction: c.direction })),
      upcoming: [],
      focus,
      txs: scoped,
    };
  }

  return {
    app: "月梨账单",
    ledger: s.ledgers.find((l) => l.id === ledgerId)?.name ?? "月梨账单",
    today: shanghaiDayValue(Date.now()),
    usingSample: s.usingSample,
    month: buildMonth(txs, month, cats) ?? {
      month,
      label: month,
      daysElapsed: 1,
      expenseFen: 0,
      incomeFen: 0,
      balanceFen: 0,
      count: 0,
      dailyFen: 0,
      top: [],
    },
    prev: prevKey ? buildMonth(txs, prevKey, cats) : null,
    recent,
    months,
    span,
    year: { year, txs: yearTxs },
    cats: catsInfo,
    upcoming,
  };
}

/** 前端本地算好的紧凑分析摘要：只含数字汇总，不逐条给流水，模型据此写简短解读即可，响应可控不超时。 */
export function agentAnalysisContext(): AgentContext {
  const s = useLedger.getState();
  const ledgerId = s.ledgerId;
  const txs = txsInLedger(s.txs, ledgerId);
  const usable = txs.filter((tx) => !isAccountTx(tx));
  const month = s.month || monthKey(Date.now());
  const cats = s.cats;
  const prevKey = previousMonth(month);
  const cur = buildMonth(usable, month, cats, 8);
  const prev = prevKey ? buildMonth(usable, prevKey, cats, 8) : null;
  const monthKeys = [...new Set(usable.map((tx) => monthKey(tx.time)))].sort();
  const months = monthKeys
    .map((key) => buildMonth(usable, key, cats, 5))
    .filter((m): m is NonNullable<typeof m> => m !== null);
  const expense = months.reduce((n, m) => n + m.expenseFen, 0);
  const income = months.reduce((n, m) => n + m.incomeFen, 0);
  return {
    app: "月梨账单",
    ledger: s.ledgers.find((l) => l.id === ledgerId)?.name ?? "月梨账单",
    today: shanghaiDayValue(Date.now()),
    usingSample: s.usingSample,
    month: cur ?? {
      month,
      label: month,
      daysElapsed: 1,
      expenseFen: 0,
      incomeFen: 0,
      balanceFen: 0,
      count: 0,
      dailyFen: 0,
      top: [],
    },
    prev,
    recent: [],
    cats: cats.map((c) => ({ id: c.id, name: c.name, direction: c.direction })),
    upcoming: [],
    months,
    span: {
      firstMonth: months.length ? months[0].month : month,
      lastMonth: months.length ? months[months.length - 1].month : month,
      count: months.reduce((n, m) => n + m.count, 0),
      expenseFen: expense,
      incomeFen: income,
    },
  };
}
