-- ============================================================================
-- IGNITE PORTAL - SUPABASE DATABASE SETUP SCRIPT
-- ============================================================================
-- Copy and paste this entire script into Supabase SQL Editor
-- Click RUN to create all tables at once
-- ============================================================================

-- 1. STUDENTS TABLE
create table if not exists students (
  id uuid primary key default auth.uid(),
  email text not null unique,
  name text,
  phone text,
  course text,
  year text,
  cgpa real default 0,
  skills text[] default '{}',
  resume text,
  resume_path text,
  resume_file_name text,
  resume_uploaded_date timestamp with time zone,
  address text,
  profile_photo text,
  profile_photo_path text,
  profile_completed boolean default false,
  prn_number text,
  enrollment_no text,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  created_by text,
  updated_at timestamp with time zone default now()
);

-- 2. COMPANIES TABLE
create table if not exists companies (
  id text primary key,
  name text not null,
  description text,
  website text,
  logo text,
  industry text,
  location text,
  contact_email text,
  contact_phone text,
  added_date text,
  added_by text,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 3. JOBS TABLE
create table if not exists jobs (
  id text primary key,
  title text not null,
  company text,
  company_logo text,
  location text,
  ctc jsonb,
  job_type text,
  industry text,
  requirements text[] default '{}',
  description text,
  skills text[] default '{}',
  eligibility_status text default 'Eligible',
  registration_deadline text,
  posted_date text,
  is_active boolean default true,
  drive_date text,
  eligibility_criteria text,
  contact_email text,
  contact_phone text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 4. APPLICATIONS TABLE
create table if not exists applications (
  id text primary key,
  job_id text,
  student_id text,
  student_name text,
  student_email text,
  student_cgpa real,
  student_course text,
  student_year text,
  student_resume text,
  status text default 'Applied',
  applied_date text,
  admin_notes text,
  last_updated text,
  created_at timestamp with time zone default now()
);

-- 5. CONVERSATIONS TABLE
create table if not exists conversations (
  id text primary key,
  student_id text,
  student_name text,
  admin_id text,
  admin_name text,
  participants text[] default '{}',
  last_message text,
  last_message_time text,
  type text default 'admin',
  created_at timestamp with time zone default now()
);

-- 6. MESSAGES TABLE
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id text not null,
  sender_id text not null,
  sender_name text,
  sender_role text,
  recipient_id text,
  text text not null,
  timestamp text,
  read boolean default false,
  created_at timestamp with time zone default now()
);

-- 7. NOTIFICATIONS TABLE
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  type text,
  title text not null,
  message text,
  read boolean default false,
  data jsonb default '{}',
  created_at timestamp with time zone default now()
);

-- 8. SETTINGS TABLE
create table if not exists settings (
  id uuid primary key default gen_random_uuid(),
  "userId" text not null unique,
  "pushNotifications" boolean default true,
  "emailNotifications" boolean default true,
  "jobAlerts" boolean default true,
  "darkMode" boolean default false,
  language text default 'en',
  "biometricAuth" boolean default false,
  "appVersion" text default '1.0.0',
  "updatedAt" text,
  created_at timestamp with time zone default now()
);

-- ============================================================================
-- Create Indexes for Better Performance
-- ============================================================================

create index if not exists idx_students_email on students(email);
create index if not exists idx_applications_student_id on applications(student_id);
create index if not exists idx_applications_job_id on applications(job_id);
create index if not exists idx_conversations_student_id on conversations(student_id);
create index if not exists idx_conversations_admin_id on conversations(admin_id);
create index if not exists idx_messages_conversation_id on messages(conversation_id);
create index if not exists idx_notifications_user_id on notifications(user_id);

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all tables
alter table students enable row level security;
alter table companies enable row level security;
alter table jobs enable row level security;
alter table applications enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table notifications enable row level security;
alter table settings enable row level security;

-- Allow all authenticated users to read/write (for MVP deployment)
-- In production, tighten these policies per role

create policy "Allow all access for authenticated users" on students
  for all using (true) with check (true);

create policy "Allow all access for authenticated users" on companies
  for all using (true) with check (true);

create policy "Allow all access for authenticated users" on jobs
  for all using (true) with check (true);

create policy "Allow all access for authenticated users" on applications
  for all using (true) with check (true);

create policy "Allow all access for authenticated users" on conversations
  for all using (true) with check (true);

create policy "Allow all access for authenticated users" on messages
  for all using (true) with check (true);

create policy "Allow all access for authenticated users" on notifications
  for all using (true) with check (true);

create policy "Allow all access for authenticated users" on settings
  for all using (true) with check (true);

-- ============================================================================
-- Enable Realtime for relevant tables
-- ============================================================================

alter publication supabase_realtime add table jobs;
alter publication supabase_realtime add table applications;
alter publication supabase_realtime add table conversations;
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table notifications;

-- ============================================================================
-- SUCCESS! All tables created.
-- ============================================================================
-- Next steps:
-- 1. Go to Storage and create two buckets: "profile-photos" and "resumes"
-- 2. Make both buckets public (or add appropriate policies)
-- 3. Update your .env file with Supabase URL and Anon Key
-- 4. Create admin user: admin@sgu.edu.in via Supabase Auth
-- 5. Run the app and test!
-- ============================================================================
