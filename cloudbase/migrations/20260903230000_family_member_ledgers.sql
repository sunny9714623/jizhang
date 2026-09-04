-- 家庭账本改为“每个家庭成员各一本、互不合并”：
-- ledgers 增加 owner_uid 标明账本归属者；
-- 老数据那本无主的“家庭账本”回填给家庭创建人。

alter table public.ledgers
  add column if not exists owner_uid text not null default '';

update public.ledgers l
  set owner_uid = f.owner_uid
  from public.families f
  where f.id = l.family_id
    and (l.owner_uid is null or l.owner_uid = '');

create index if not exists idx_ledgers_owner
  on public.ledgers (family_id, owner_uid);

create index if not exists idx_tx_ledger
  on public.transactions (ledger_id, updated_at desc);
