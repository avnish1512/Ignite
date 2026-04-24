-- ============================================================================
-- IGNITE PORTAL - ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- These rules control who can see and edit what data
-- Think of it like: "Who is allowed to touch which toys?"
-- ============================================================================

-- ============================================================================
-- ENABLE RLS ON ALL TABLES (Required First Step!)
-- ============================================================================

alter table if exists students enable row level security;
alter table if exists jobs enable row level security;
alter table if exists applications enable row level security;
alter table if exists companies enable row level security;
alter table if exists conversations enable row level security;
alter table if exists messages enable row level security;
alter table if exists notifications enable row level security;
alter table if exists settings enable row level security;

-- ============================================================================
-- STUDENTS TABLE POLICIES
-- ============================================================================
-- Rule 1: Students can only see their own profile
drop policy if exists "Students can read own profile" on students;
create policy "Students can read own profile" on students for select
  using (auth.uid() = id);

-- Rule 1b: All authenticated students can see other students (for directory)
drop policy if exists "Students can view directory" on students;
create policy "Students can view directory" on students for select
  using (auth.role() = 'authenticated');

-- Rule 2: Students can update their own profile
drop policy if exists "Students can update own profile" on students;
create policy "Students can update own profile" on students for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Rule 3: Anyone can insert their own student record (for registration)
drop policy if exists "Students can register themselves" on students;
create policy "Students can register themselves" on students for insert
  with check (auth.uid() = id);

-- Rule 4: Admin can see all students (via email check or admin role claim)
drop policy if exists "Admin can read all students" on students;
create policy "Admin can read all students" on students for select
  using (
    auth.jwt()->>'email' = 'admin@sgu.edu.in'
    OR auth.jwt()->'app_metadata'->>'role' = 'admin'
    OR auth.jwt()->'user_metadata'->>'role' = 'admin'
  );

-- ============================================================================
-- JOBS TABLE POLICIES
-- ============================================================================
-- Rule 1: Everyone (authenticated) can read all jobs
drop policy if exists "Everyone can read jobs" on jobs;
create policy "Everyone can read jobs" on jobs for select
  using (auth.role() = 'authenticated');

-- Rule 2: Only admin can create jobs
drop policy if exists "Admin can create jobs" on jobs;
create policy "Admin can create jobs" on jobs for insert
  with check (
    auth.jwt()->>'email' = 'admin@sgu.edu.in'
    OR auth.jwt()->'app_metadata'->>'role' = 'admin'
    OR auth.jwt()->'user_metadata'->>'role' = 'admin'
  );

-- Rule 3: Only admin can update/delete jobs
drop policy if exists "Admin can update jobs" on jobs;
create policy "Admin can update jobs" on jobs for update
  with check (
    auth.jwt()->>'email' = 'admin@sgu.edu.in'
    OR auth.jwt()->'app_metadata'->>'role' = 'admin'
    OR auth.jwt()->'user_metadata'->>'role' = 'admin'
  );

drop policy if exists "Admin can delete jobs" on jobs;
create policy "Admin can delete jobs" on jobs for delete
  using (
    auth.jwt()->>'email' = 'admin@sgu.edu.in'
    OR auth.jwt()->'app_metadata'->>'role' = 'admin'
    OR auth.jwt()->'user_metadata'->>'role' = 'admin'
  );

-- ============================================================================
-- APPLICATIONS TABLE POLICIES
-- ============================================================================
-- Rule 1: Students can read their own applications
drop policy if exists "Students can read own applications" on applications;
create policy "Students can read own applications" on applications for select
  using (auth.uid()::text = student_id);

-- Rule 2: Students can create applications (apply for jobs)
drop policy if exists "Students can apply for jobs" on applications;
create policy "Students can apply for jobs" on applications for insert
  with check (auth.uid()::text = student_id);

-- Rule 3: Admin can read all applications
drop policy if exists "Admin can read all applications" on applications;
create policy "Admin can read all applications" on applications for select
  using (
    auth.jwt()->>'email' = 'admin@sgu.edu.in'
    OR auth.jwt()->'app_metadata'->>'role' = 'admin'
    OR auth.jwt()->'user_metadata'->>'role' = 'admin'
  );

-- Rule 4: Admin can update application status (accept/reject)
drop policy if exists "Admin can update application status" on applications;
create policy "Admin can update application status" on applications for update
  using (
    auth.jwt()->>'email' = 'admin@sgu.edu.in'
    OR auth.jwt()->'app_metadata'->>'role' = 'admin'
    OR auth.jwt()->'user_metadata'->>'role' = 'admin'
  )
  with check (
    auth.jwt()->>'email' = 'admin@sgu.edu.in'
    OR auth.jwt()->'app_metadata'->>'role' = 'admin'
    OR auth.jwt()->'user_metadata'->>'role' = 'admin'
  );

-- ============================================================================
-- COMPANIES TABLE POLICIES
-- ============================================================================
-- Rule 1: Everyone can read companies
drop policy if exists "Everyone can read companies" on companies;
create policy "Everyone can read companies" on companies for select
  using (true);

-- Rule 2: Only admin can manage companies
drop policy if exists "Admin can manage companies" on companies;
create policy "Admin can manage companies" on companies for insert
  with check (
    auth.jwt()->>'email' = 'admin@sgu.edu.in'
    OR auth.jwt()->'app_metadata'->>'role' = 'admin'
    OR auth.jwt()->'user_metadata'->>'role' = 'admin'
  );

drop policy if exists "Admin can update companies" on companies;
create policy "Admin can update companies" on companies for update
  using (
    auth.jwt()->>'email' = 'admin@sgu.edu.in'
    OR auth.jwt()->'app_metadata'->>'role' = 'admin'
    OR auth.jwt()->'user_metadata'->>'role' = 'admin'
  )
  with check (
    auth.jwt()->>'email' = 'admin@sgu.edu.in'
    OR auth.jwt()->'app_metadata'->>'role' = 'admin'
    OR auth.jwt()->'user_metadata'->>'role' = 'admin'
  );

-- ============================================================================
-- CONVERSATIONS TABLE POLICIES
-- ============================================================================
-- Rule 1: Students can read their own conversations
drop policy if exists "Students can read own conversations" on conversations;
create policy "Students can read own conversations" on conversations for select
  using (auth.uid()::text = student_id);

-- Rule 2: Students can create conversations
drop policy if exists "Students can create conversations" on conversations;
create policy "Students can create conversations" on conversations for insert
  with check (auth.uid()::text = student_id);

-- Rule 3: Admin can read all conversations
drop policy if exists "Admin can read all conversations" on conversations;
create policy "Admin can read all conversations" on conversations for select
  using (
    auth.jwt()->>'email' = 'admin@sgu.edu.in'
    OR auth.jwt()->'app_metadata'->>'role' = 'admin'
    OR auth.jwt()->'user_metadata'->>'role' = 'admin'
  );

-- ============================================================================
-- ============================================================================
-- MESSAGES TABLE POLICIES
-- ============================================================================
-- Rule 1: Users can only read messages they are part of (via conversation)
drop policy if exists "Users can read messages" on messages;
create policy "Users can read messages" on messages for select
  using (
    -- Student can read their own messages
    auth.uid()::text IN (
      SELECT unnest(participants) FROM conversations WHERE id = conversation_id
    )
    -- Admin can read all messages
    OR auth.jwt()->>'email' = 'admin@sgu.edu.in'
    OR auth.jwt()->'app_metadata'->>'role' = 'admin'
    OR auth.jwt()->'user_metadata'->>'role' = 'admin'
  );

-- Rule 2: Users can only send messages to conversations they're part of
drop policy if exists "Users can send messages" on messages;
create policy "Users can send messages" on messages for insert
  with check (
    -- Student can send to their conversations
    auth.uid()::text IN (
      SELECT unnest(participants) FROM conversations WHERE id = conversation_id
    )
    -- Admin can send to any conversation
    OR auth.jwt()->>'email' = 'admin@sgu.edu.in'
    OR auth.jwt()->'app_metadata'->>'role' = 'admin'
    OR auth.jwt()->'user_metadata'->>'role' = 'admin'
  );

-- ============================================================================
-- NOTIFICATIONS TABLE POLICIES
-- ============================================================================
-- Rule 1: Users can read their own notifications
drop policy if exists "Users can read own notifications" on notifications;
create policy "Users can read own notifications" on notifications for select
  using (auth.uid()::text = user_id);

-- Rule 2: System/admin can create notifications
drop policy if exists "Admin can create notifications" on notifications;
create policy "Admin can create notifications" on notifications for insert
  with check (
    auth.jwt()->>'email' = 'admin@sgu.edu.in'
    OR auth.jwt()->'app_metadata'->>'role' = 'admin'
    OR auth.jwt()->'user_metadata'->>'role' = 'admin'
  );

-- Rule 3: Users can update their own notifications (mark as read)
drop policy if exists "Users can update own notifications" on notifications;
create policy "Users can update own notifications" on notifications for update
  using (auth.uid()::text = user_id)
  with check (auth.uid()::text = user_id);

-- ============================================================================
-- SETTINGS TABLE POLICIES
-- ============================================================================
-- Rule 1: Users can read their own settings
drop policy if exists "Users can read own settings" on settings;
create policy "Users can read own settings" on settings for select
  using (auth.uid()::text = user_id);

-- Rule 2: Users can create/update their own settings
drop policy if exists "Users can manage own settings" on settings;
create policy "Users can manage own settings" on settings for insert
  with check (auth.uid()::text = user_id);

drop policy if exists "Users can update own settings" on settings;
create policy "Users can update own settings" on settings for update
  using (auth.uid()::text = user_id)
  with check (auth.uid()::text = user_id);

-- ============================================================================
-- SUCCESS! RLS Policies created.
-- ============================================================================
-- What these rules do:
-- 1. STUDENTS: Each student can only see/edit their own profile
-- 2. JOBS: Everyone can see jobs, only admin can create/edit
-- 3. APPLICATIONS: Students see their own apps, admin sees all
-- 4. COMPANIES: Everyone sees them, only admin manages
-- 5. CONVERSATIONS: Students see their chats, admin sees all
-- 6. MESSAGES: Authenticated users can send/read messages
-- 7. NOTIFICATIONS: Each user sees their own notifications
-- 8. SETTINGS: Users manage their own preferences
-- ============================================================================
