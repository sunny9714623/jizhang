-- 家庭账本随数据保存自定义分类定义：分类(cats)与家当种类(kinds)，打开账本时能恢复显示。

alter table public.ledgers
  add column if not exists cats jsonb,
  add column if not exists kinds jsonb;
