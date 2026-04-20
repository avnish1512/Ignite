# 🚀 Supabase Setup Guide for Ignite Portal

Think of Supabase like a magic toy box in the cloud that stores all your data and pictures!

## Step 1️⃣: Get Your Magic Keys 🔑

**What are these keys?** They're like passwords that let your app talk to Supabase.

### How to get them:
1. Go to **https://app.supabase.com**
2. Sign in or create an account
3. Create a new project called "Ignite Portal" (or click existing one)
4. Click **Settings** (⚙️ icon on left side)
5. Click **API** in the menu
6. You'll see two important things:
   - **Project URL** - Copy this
   - **anon public** - Copy this key

### Update your `.env` file:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_long_key_here
```

---

## Step 2️⃣: Create Database Tables 📦

Think of tables like drawers in your toy box. Each drawer holds different toys (data).

### We need these drawers:

**1. Students Table** - Stores student info
```sql
create table students (
  id uuid primary key default auth.uid(),
  email text not null unique,
  name text,
  phone text,
  college text,
  major text,
  gpa real,
  resume text,
  resumePath text,
  resumeFileName text,
  resumeUploadedDate timestamp,
  profilePhoto text,
  profilePhotoPath text,
  profileCompleted boolean default false,
  createdAt timestamp default now(),
  updatedAt timestamp default now()
);
```

**2. Jobs Table** - Stores job postings
```sql
create table jobs (
  id uuid primary key default gen_random_uuid(),
  companyId uuid references companies(id),
  title text not null,
  description text,
  salary text,
  location text,
  postedDate timestamp default now(),
  deadline timestamp,
  applicationCount integer default 0,
  createdAt timestamp default now()
);
```

**3. Applications Table** - Stores who applied to which jobs
```sql
create table applications (
  id uuid primary key default gen_random_uuid(),
  jobId uuid references jobs(id) on delete cascade,
  studentId uuid references students(id) on delete cascade,
  status text default 'pending',
  appliedAt timestamp default now(),
  resumeUsed text
);
```

**4. Companies Table** - Stores company info
```sql
create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  email text,
  phone text,
  website text,
  logo text,
  createdAt timestamp default now()
);
```

**5. Conversations Table** - Stores chat conversations
```sql
create table conversations (
  id uuid primary key default gen_random_uuid(),
  studentId uuid references students(id) on delete cascade,
  adminEmail text not null,
  lastMessage text,
  lastMessageTime timestamp,
  createdAt timestamp default now()
);
```

**6. Messages Table** - Stores chat messages
```sql
create table messages (
  id uuid primary key default gen_random_uuid(),
  conversationId uuid references conversations(id) on delete cascade,
  senderId text not null,
  message text not null,
  timestamp timestamp default now()
);
```

**7. Notifications Table** - Stores notifications
```sql
create table notifications (
  id uuid primary key default gen_random_uuid(),
  userId uuid references students(id) on delete cascade,
  title text not null,
  message text,
  type text,
  read boolean default false,
  createdAt timestamp default now()
);
```

**8. Settings Table** - Stores user preferences
```sql
create table settings (
  id uuid primary key default gen_random_uuid(),
  userId text not null unique,
  pushNotifications boolean default true,
  emailNotifications boolean default true,
  jobAlerts boolean default true,
  darkMode boolean default false,
  language text default 'en',
  biometricAuth boolean default false,
  appVersion text default '1.0.0',
  createdAt timestamp default now(),
  updatedAt timestamp default now()
);
```

### How to add these tables:
1. In Supabase, go to **SQL Editor**
2. Click **+ New Query**
3. Copy and paste each table creation code above
4. Click **Run** for each one
5. You should see a checkmark ✅ when successful

---

## Step 3️⃣: Create Storage Buckets 🪣

Storage buckets are like photo albums in the cloud!

### We need 2 albums:

**1. profile-photos** - For student pictures
**2. resumes** - For resume files

### How to create them:
1. In Supabase, go to **Storage** on the left menu
2. Click **+ New Bucket**
3. Name it `profile-photos` → Click **Create**
4. Do the same for `resumes`

---

## Step 4️⃣: Setup Security Rules 🔒

Think of security rules like "who is allowed to touch which toys"!

### Row Level Security (RLS) - Simple Version:

Go to **Authentication** → **Policies** and add these rules:

**For Students Table:**
- Students can only see their own profile
- Only authenticated users can insert their own data

**For Jobs Table:**
- Everyone can read jobs
- Only admins can create/edit jobs

**For Applications Table:**
- Students can only see their own applications
- Students can create applications

**For Messages Table:**
- Users can only see their own messages
- Students can send messages

---

## Summary: What We Created 📊

| Name | Purpose |
|------|---------|
| **students** | Student profiles & info |
| **jobs** | Job postings |
| **applications** | Job applications |
| **companies** | Company info |
| **conversations** | Chat conversations |
| **messages** | Chat messages |
| **notifications** | User notifications |
| **settings** | User preferences |

| Bucket | Purpose |
|--------|---------|
| **profile-photos** | Student pictures |
| **resumes** | Resume files |

---

## Testing Checklist ✅

After setup, test these:

### 1. Student Registration
- [ ] Go to app
- [ ] Click "Register"
- [ ] Enter email, password, name
- [ ] Click "Sign Up"
- [ ] Should see profile setup form

### 2. Admin Login
- [ ] Email: `admin@sgu.edu.in`
- [ ] Password: (your Supabase password)
- [ ] Click "Login"
- [ ] Should see admin dashboard

### 3. Job Posting
- [ ] Go to admin dashboard
- [ ] Click "Post Job"
- [ ] Fill in job details
- [ ] Click "Post"
- [ ] Should see job in student view

### 4. File Uploads
- [ ] As student, go to profile
- [ ] Upload profile photo
- [ ] Upload resume
- [ ] Both should save successfully

### 5. Real-time Features
- [ ] Open chat with admin
- [ ] Send a message
- [ ] Should appear instantly
- [ ] Open on another device/window
- [ ] Message should appear there too!

---

## Troubleshooting 🐛

**Q: "Connection refused" error?**
A: Check your `.env` file - make sure URL and Key are correct!

**Q: "Permission denied" error?**
A: You need to set up Row Level Security (RLS) policies. Ask about this!

**Q: File upload not working?**
A: Make sure storage buckets are public and policies are set correctly.

**Q: Real-time messages not updating?**
A: Check if Realtime is enabled in Supabase settings!

---

## Need Help?
- Supabase Docs: https://supabase.com/docs
- SQL Help: https://supabase.com/docs/guides/database
- Storage Help: https://supabase.com/docs/guides/storage
