-- Optional initial data. Run after 001_initial.sql. Existing Admin edits are preserved.
begin;
insert into public.mall_documents(id,data) values ('config/contact','{"viber": "", "messenger": "", "phone": ""}'::jsonb) on conflict (id) do nothing;
insert into public.mall_documents(id,data) values ('catalog/products','{}'::jsonb) on conflict (id) do nothing;
insert into public.mall_documents(id,data) values ('repairStatus/P1-2026-0123','{"device": "vivo Y29", "status": "repairing", "shop": "Shop 1", "note": "Screen replaced, testing now"}'::jsonb) on conflict (id) do nothing;
commit;
