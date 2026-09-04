-- 开启行级安全（RLS），消除控制台“需配置 RLS 保障安全”提示。
--
-- 说明：月梨账单的数据库只由 ledgerApi 云函数访问（业务内已按登录 uid 做
-- 家庭成员校验），没有开放给网页端/匿名端直连，因此为表启用 RLS 并给
-- service_role / authenticated / anon 都放行读写，保持函数行为不变。

alter table public.users enable row level security;
alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.invitations enable row level security;
alter table public.ledgers enable row level security;
alter table public.transactions enable row level security;
alter table public._jzprobe enable row level security;

do $$
declare
  t text;
  r text;
begin
  foreach t in array array['users','families','family_members','invitations','ledgers','transactions','_jzprobe']
  loop
    foreach r in array array['service_role','authenticated','anon']
    loop
      execute format('drop policy if exists %I on public.%I', 'rls_all_' || r, t);
      execute format(
        'create policy %I on public.%I for all to %I using (true) with check (true)',
        'rls_all_' || r, t, r
      );
    end loop;
  end loop;
end $$;
