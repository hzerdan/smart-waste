-- Migracion 23: Normalizar tokens de auth.users a cadena vacia para compatibilidad con GoTrue

UPDATE auth.users
SET 
  confirmation_token = coalesce(confirmation_token, ''),
  recovery_token = coalesce(recovery_token, ''),
  email_change_token_new = coalesce(email_change_token_new, ''),
  email_change = coalesce(email_change, ''),
  phone_change_token = coalesce(phone_change_token, ''),
  email_change_token_current = coalesce(email_change_token_current, ''),
  reauthentication_token = coalesce(reauthentication_token, '')
WHERE email LIKE '%@smartwaste.com';
