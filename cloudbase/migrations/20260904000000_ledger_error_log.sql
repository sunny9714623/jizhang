-- 给自检表补一个 data 字段，用来记录云函数运行期错误，便于排查线上问题。
alter table public._jzprobe
  add column if not exists data jsonb not null default '{}'::jsonb;
