-- 家庭账本随数据保存定期账单定义，打开账本时成员可见。

alter table public.ledgers
  add column if not exists recurring jsonb;
