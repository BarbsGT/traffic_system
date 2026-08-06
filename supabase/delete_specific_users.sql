-- Delete specific test users
-- Run in Supabase SQL Editor

BEGIN;

-- First, delete related data to avoid FK violations
DELETE FROM profile_accounts WHERE profile_id IN (
  SELECT id FROM profiles WHERE email IN ('test1785952099587@lobueno.co', 'jose.rodriguez@buentipo.com')
);
DELETE FROM profile_teams WHERE profile_id IN (
  SELECT id FROM profiles WHERE email IN ('test1785952099587@lobueno.co', 'jose.rodriguez@buentipo.com')
);
DELETE FROM tasks WHERE assignee_id IN (
  SELECT id FROM profiles WHERE email IN ('test1785952099587@lobueno.co', 'jose.rodriguez@buentipo.com')
);
DELETE FROM tasks WHERE created_by IN (
  SELECT id FROM profiles WHERE email IN ('test1785952099587@lobueno.co', 'jose.rodriguez@buentipo.com')
);
DELETE FROM projects WHERE owner_id IN (
  SELECT id FROM profiles WHERE email IN ('test1785952099587@lobueno.co', 'jose.rodriguez@buentipo.com')
);
DELETE FROM teams WHERE director_id IN (
  SELECT id FROM profiles WHERE email IN ('test1785952099587@lobueno.co', 'jose.rodriguez@buentipo.com')
);
DELETE FROM comments WHERE author_id IN (
  SELECT id FROM profiles WHERE email IN ('test1785952099587@lobueno.co', 'jose.rodriguez@buentipo.com')
);
DELETE FROM project_messages WHERE author_id IN (
  SELECT id FROM profiles WHERE email IN ('test1785952099587@lobueno.co', 'jose.rodriguez@buentipo.com')
);
DELETE FROM chat_messages WHERE profile_id IN (
  SELECT id FROM profiles WHERE email IN ('test1785952099587@lobueno.co', 'jose.rodriguez@buentipo.com')
);
DELETE FROM profiles WHERE email IN ('test1785952099587@lobueno.co', 'jose.rodriguez@buentipo.com');
DELETE FROM auth.users WHERE email IN ('test1785952099587@lobueno.co', 'jose.rodriguez@buentipo.com');

COMMIT;