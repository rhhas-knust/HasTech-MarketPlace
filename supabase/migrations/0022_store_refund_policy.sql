-- Electronic Transactions Act, 2008 (Act 772) requires online sellers to show
-- their refund and returns policy. Sellers write their own; when empty, the
-- storefront shows the platform's default seller policy (/refunds).
alter table public.stores
  add column if not exists refund_policy text
  constraint stores_refund_policy_length check (char_length(refund_policy) <= 4000);
