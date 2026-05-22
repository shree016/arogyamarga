-- =============================================
-- ArogyaMaarga: Add missing auth.identities
-- =============================================
-- Supabase's signInWithPassword requires a row in auth.identities for
-- every user. Raw SQL inserts into auth.users don't create this
-- automatically — only admin.createUser() does.
--
-- Run this ONCE in the Supabase SQL Editor after setup.sql:
-- https://supabase.com/dashboard/project/_/sql
-- =============================================

INSERT INTO auth.identities (
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
VALUES
  -- Admin  (ADM001)
  (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '{"sub":"00000000-0000-0000-0000-000000000001","email":"adm001@arogyamaarga.in","email_verified":true,"phone_verified":false}',
    'email', NOW(), NOW(), NOW()
  ),
  -- Doctor 1  (DT101)
  (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    '{"sub":"00000000-0000-0000-0000-000000000002","email":"dt101@arogyamaarga.in","email_verified":true,"phone_verified":false}',
    'email', NOW(), NOW(), NOW()
  ),
  -- Doctor 2  (DT102)
  (
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000003',
    '{"sub":"00000000-0000-0000-0000-000000000003","email":"dt102@arogyamaarga.in","email_verified":true,"phone_verified":false}',
    'email', NOW(), NOW(), NOW()
  ),
  -- Doctor 3  (DT103)
  (
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000004',
    '{"sub":"00000000-0000-0000-0000-000000000004","email":"dt103@arogyamaarga.in","email_verified":true,"phone_verified":false}',
    'email', NOW(), NOW(), NOW()
  ),
  -- Doctor 4  (DT104)
  (
    '00000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000005',
    '{"sub":"00000000-0000-0000-0000-000000000005","email":"dt104@arogyamaarga.in","email_verified":true,"phone_verified":false}',
    'email', NOW(), NOW(), NOW()
  ),
  -- Doctor 5  (DT105)
  (
    '00000000-0000-0000-0000-000000000006',
    '00000000-0000-0000-0000-000000000006',
    '{"sub":"00000000-0000-0000-0000-000000000006","email":"dt105@arogyamaarga.in","email_verified":true,"phone_verified":false}',
    'email', NOW(), NOW(), NOW()
  ),
  -- Staff 1  (ST101)
  (
    '00000000-0000-0000-0000-000000000007',
    '00000000-0000-0000-0000-000000000007',
    '{"sub":"00000000-0000-0000-0000-000000000007","email":"st101@arogyamaarga.in","email_verified":true,"phone_verified":false}',
    'email', NOW(), NOW(), NOW()
  ),
  -- Staff 2  (ST102)
  (
    '00000000-0000-0000-0000-000000000008',
    '00000000-0000-0000-0000-000000000008',
    '{"sub":"00000000-0000-0000-0000-000000000008","email":"st102@arogyamaarga.in","email_verified":true,"phone_verified":false}',
    'email', NOW(), NOW(), NOW()
  ),
  -- Patient 1  (PT-0001 · Anaya Kulkarni)
  (
    '00000000-0000-0000-0000-000000000009',
    '00000000-0000-0000-0000-000000000009',
    '{"sub":"00000000-0000-0000-0000-000000000009","email":"pt0001@guest.arogyamaarga.in","email_verified":true,"phone_verified":false}',
    'email', NOW(), NOW(), NOW()
  ),
  -- Patient 2  (PT-0002 · Arjun Sharma)
  (
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000010',
    '{"sub":"00000000-0000-0000-0000-000000000010","email":"pt0002@guest.arogyamaarga.in","email_verified":true,"phone_verified":false}',
    'email', NOW(), NOW(), NOW()
  ),
  -- Patient 3  (PT-0003 · Zoya Siddiqui)
  (
    '00000000-0000-0000-0000-000000000011',
    '00000000-0000-0000-0000-000000000011',
    '{"sub":"00000000-0000-0000-0000-000000000011","email":"pt0003@guest.arogyamaarga.in","email_verified":true,"phone_verified":false}',
    'email', NOW(), NOW(), NOW()
  ),
  -- Patient 4  (PT-0004 · Rahul Nair)
  (
    '00000000-0000-0000-0000-000000000012',
    '00000000-0000-0000-0000-000000000012',
    '{"sub":"00000000-0000-0000-0000-000000000012","email":"pt0004@guest.arogyamaarga.in","email_verified":true,"phone_verified":false}',
    'email', NOW(), NOW(), NOW()
  ),
  -- Patient 5  (PT-0005 · Priya Venkatesh)
  (
    '00000000-0000-0000-0000-000000000013',
    '00000000-0000-0000-0000-000000000013',
    '{"sub":"00000000-0000-0000-0000-000000000013","email":"pt0005@guest.arogyamaarga.in","email_verified":true,"phone_verified":false}',
    'email', NOW(), NOW(), NOW()
  )
ON CONFLICT (provider_id, provider) DO NOTHING;

-- Verify
SELECT
  u.email,
  CASE WHEN i.user_id IS NOT NULL THEN '✓ identity exists' ELSE '✗ MISSING' END AS identity_status
FROM auth.users u
LEFT JOIN auth.identities i ON i.user_id = u.id AND i.provider = 'email'
WHERE u.email LIKE '%arogyamaarga.in'
ORDER BY u.email;
