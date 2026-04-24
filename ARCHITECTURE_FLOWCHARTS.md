# Ignite Portal - System Architecture & Flowcharts

## System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                       IGNITE PLACEMENT PORTAL                    │
└──────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND LAYER (Expo)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           User Interface (React Native)                  │  │
│  │  ├─ Student Portal                                       │  │
│  │  │  ├─ Home Screen                                       │  │
│  │  │  ├─ Jobs Browse                                       │  │
│  │  │  ├─ Applications                                      │  │
│  │  │  ├─ Messages                                          │  │
│  │  │  ├─ AI Chat                                           │  │
│  │  │  └─ Profile                                           │  │
│  │  │                                                        │  │
│  │  └─ Admin Portal                                         │  │
│  │     ├─ Dashboard                                         │  │
│  │     ├─ Manage Students                                   │  │
│  │     ├─ Manage Jobs                                       │  │
│  │     ├─ Manage Companies                                  │  │
│  │     └─ View Applications                                 │  │
│  │                                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ▲                                   │
│                              │                                   │
│  ┌───────────────────────────┼────────────────────────────┐    │
│  │     State Management Layer (React Context)            │    │
│  │     ├─ AuthProvider (auth-store)                       │    │
│  │     ├─ JobsProvider (jobs-store)                       │    │
│  │     ├─ MessagingProvider (messaging-store)             │    │
│  │     ├─ NotificationsProvider (notifications-store)     │    │
│  │     ├─ AIProvider (aichat-store)                       │    │
│  │     └─ ThemeProvider (theme-store)                     │    │
│  └────────────────┬────────────────────────────────────────┘   │
│                   │                                              │
└───────────────────┼──────────────────────────────────────────────┘
                    │
        ┌───────────┴──────────┐
        │                      │
        ▼                      ▼
┌────────────────────┐  ┌──────────────────┐
│  Supabase Client   │  │  External APIs   │
│  (supabase-js)     │  │  ├─ OpenAI       │
│  ├─ Auth           │  │  ├─ Anthropic    │
│  ├─ Database       │  │  ├─ Gemini       │
│  ├─ Realtime       │  │  └─ Bedrock      │
│  └─ Storage        │  └──────────────────┘
└────────────────────┘


┌──────────────────────────────────────────────────────────────────┐
│                       BACKEND LAYER (Supabase)                   │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              PostgreSQL Database                        │   │
│  │  ├─ auth.users (Supabase Auth)                          │   │
│  │  ├─ public.students                                     │   │
│  │  ├─ public.jobs                                         │   │
│  │  ├─ public.applications                                 │   │
│  │  ├─ public.companies                                    │   │
│  │  ├─ public.messages                                     │   │
│  │  ├─ public.conversations                                │   │
│  │  └─ public.notifications                                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │         Supabase Realtime (WebSocket)                  │   │
│  │  ├─ Listen to jobs table changes                        │   │
│  │  ├─ Listen to applications changes                      │   │
│  │  ├─ Listen to messages (conversations)                  │   │
│  │  └─ Instant notification broadcasts                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │         Row Level Security (RLS)                        │   │
│  │  ├─ Students can only access their data                 │   │
│  │  ├─ Admins can access all student data                  │   │
│  │  ├─ Messages filtered by conversation                   │   │
│  │  └─ Applications accessible by both parties             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Complete Application Flow

### 1. Authentication Sequence Diagram

```
┌─────────┐                    ┌──────────────┐              ┌──────────────┐
│  User   │                    │   Frontend   │              │  Supabase    │
│(Browser)│                    │(Expo/React)  │              │   Auth/DB    │
└────┬────┘                    └──────┬───────┘              └──────┬───────┘
     │                                │                             │
     │──── Enter Email/Password ───→ │                             │
     │                                │                             │
     │                                │──── Auth.signIn ────────→  │
     │                                │                             │
     │                                │  [Check credentials in      │
     │                                │   auth.users table]         │
     │                                │                             │
     │                                │ ←─ Return User Object ──────│
     │                                │                             │
     │                                │──── Query students table ──→│
     │                                │                             │
     │  ← Display Profile Setup ────- │ ← Return student data ──────│
     │                                │                             │
     │                                │ [Set local session in       │
     │                                │  AsyncStorage]              │
     │                                │                             │
     │ ──── Submit Profile Data ────→│                             │
     │                                │                             │
     │                                │──── Update students ───────→│
     │                                │                             │
     │ ← Dashboard/Home Screen ────── │ ← Success confirmation ─────│
     │                                │                             │
```

---

### 2. Job Application Flow (Critical Path)

```
STUDENT SIDE                          ADMIN SIDE                    DATABASE
─────────────────────                 ────────────                  ────────────

User Views Home
      │
      ▼
Loads Jobs from DB ──────────────────────────────────────→ SELECT * FROM jobs
      │                                                      WHERE is_active = true
      │ (Realtime subscription set up)                       
      │
      ▼
Display Job Cards
      │
      └─ Student clicks Job

              ▼
         View Job Details
              │
              ▼
         Click "Apply"
              │
              ▼
    ┌─────────────────────┐
    │ Create Application  │
    │ Record:             │
    │ - job_id            │
    │ - student_id        │
    │ - applied_date      │
    │ - status: "Applied" │
    └────────┬────────────┘
             │
             ▼ (INSERT)
    Applications Table
             │
             ├─ Realtime broadcast
             │
             ├─────────────────────────→ Admin receives
             │                            notification
             │
             └─ Success message to
                student


Admin Reviews Application:
                                      Reviews app in dashboard
                                           │
                                           ▼
                                   ┌──────────────────┐
                                   │ Change Status to │
                                   │ "Shortlisted"    │
                                   │ Add Notes        │
                                   └────────┬─────────┘
                                            │
                                            ▼ (UPDATE)
                                   Applications Table
                                            │
                                            ├─ Realtime broadcast
                                            │
    Student receives notification ←────────┤
         │
         ▼
    Views updated status
    in "Applications" tab
```

---

### 3. Admin Create Student Flow (WITH GLITCH FIX)

```
ADMIN ACTION                 SYSTEM PROCESSING                DATABASE CHANGES
─────────────────            ──────────────────────            ─────────────────

1. Fill Form:
   - Name
   - Email
   - Password (6+ chars)
         │
         ▼
2. Click "Create Account"
         │
         ▼
   Validate Input ✓
         │
         ▼
3. Call silentAuth.signUp()
         │
         └──────────────────→ [PREVIOUS BUG]
                              admin.createUser()  ✗ FAILED
                              (No admin key)
                              
                         [FIXED NOW]
                         ✓ Use signUp() directly
         │
         ▼
4. Supabase Auth
   creates user in
   auth.users table
         │
         ├─ Generate User ID
         │
         └─ Return User Object ──→ Extract user.id ✓
                                   
                    [VALIDATION ADDED]
                    if (!newUid) {
                      throw error;
                    }
         │
         ▼
5. INSERT student record
         │
         ├─ id (from auth.user.id)
         ├─ name
         ├─ email
         ├─ profile_completed: false
         ├─ is_active: true
         └─ created_at
         │
         ▼
   INSERT INTO students ────→ Database
         │
         ├─ SUCCESS ✓
         │
         ▼
6. Display Credentials
   to Admin:
   - Student Name
   - Email/ID
   - Password
         │
         ▼
7. Admin provides
   credentials to
   student

Student First Login:
   - Email/Password
   - Gets redirected to
     Profile Setup
   - Completes profile
   - Accesses dashboard
```

---

### 4. Real-time Messaging Flow

```
┌──────────────────────────────────────────────────────────┐
│         MESSAGING SYSTEM - REAL-TIME UPDATES             │
└──────────────────────────────────────────────────────────┘

STUDENT                          SYSTEM                      ADMIN
────────                          ──────                      ─────

1. Open Messages
   │
   ▼
2. Select conversation ─────→ Load messages from
   or start new               conversations table
                              │
                              ├─ conversation_id:
                              │  sorted(studentId + adminId)
                              │
                              ├─ Setup realtime
                              │  subscription
                              │
                              └─ Listen for changes
                                 on this conversation
   │
   ▼
3. Type message
   │
   ├─ "Hey, can you help?"
   │
   ▼
4. Click Send
   │
   └─ INSERT message ────────→ Messages Table
                               ├─ conversation_id
                               ├─ sender_id (student)
                               ├─ sender_role: "student"
                               ├─ text
                               ├─ timestamp
                               └─ read: false
                                  │
                                  ├─ Realtime trigger
                                  │
                                  └─────────────────→ Admin receives
                                                     in real-time
                                                     │
                                                     ├─ Notification
                                                     │
                                                     ▼
                                                  5. Admin sees message
                                                     │
                                                     ├─ Typing response
                                                     │
                                                     ▼
                                                  6. Admin sends reply
                                                     │
                                                     └─ INSERT message
                                                        (sender_role: "admin")
                                                           │
                                                           └─ Realtime broadcast
                                                              │
                                                              ▼
5. Student receives          ← UPDATE message set read=true
   reply (real-time)

   Notification shows
   new message
```

---

## Database Schema

### Students Table
```sql
CREATE TABLE students (
  id UUID PRIMARY KEY (from auth.users.id),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  course TEXT,
  year TEXT,
  cgpa NUMERIC(3,2),
  skills TEXT[],
  resume_url TEXT,
  prn_number TEXT,
  enrollment_no TEXT,
  address TEXT,
  profile_completed BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Jobs Table
```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  company_logo TEXT,
  location TEXT,
  ctc_min BIGINT,
  ctc_max BIGINT,
  job_type TEXT,
  industry TEXT,
  requirements TEXT[],
  description TEXT,
  skills TEXT[],
  eligibility_status TEXT,
  registration_deadline DATE,
  posted_date TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  drive_date DATE,
  contact_email TEXT,
  contact_phone TEXT,
  created_by UUID REFERENCES students(id),
  created_at TIMESTAMP
);
```

### Applications Table
```sql
CREATE TABLE applications (
  id TEXT PRIMARY KEY,
  job_id UUID REFERENCES jobs(id),
  student_id UUID REFERENCES students(id),
  student_name TEXT,
  student_email TEXT,
  student_cgpa NUMERIC,
  student_course TEXT,
  student_year TEXT,
  student_resume TEXT,
  status TEXT, -- Applied, Under Review, Shortlisted, Rejected, Selected
  applied_date TIMESTAMP,
  admin_notes TEXT,
  last_updated TIMESTAMP
);
```

### Conversations Table
```sql
CREATE TABLE conversations (
  id TEXT PRIMARY KEY,
  student_id UUID REFERENCES students(id),
  student_name TEXT,
  admin_id UUID,
  admin_name TEXT,
  participants UUID[],
  last_message TEXT,
  last_message_time TIMESTAMP,
  created_at TIMESTAMP
);
```

### Messages Table
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id TEXT REFERENCES conversations(id),
  sender_id UUID,
  sender_name TEXT,
  sender_role TEXT, -- 'student' or 'admin'
  recipient_id UUID,
  text TEXT,
  timestamp TIMESTAMP,
  read BOOLEAN DEFAULT false
);
```

---

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────┐
│              ERROR HANDLING ARCHITECTURE                │
└─────────────────────────────────────────────────────────┘

ERROR OCCURS
    │
    ├─ Network Error?
    │  └─ Show "Connection Lost"
    │     └─ Retry logic with exponential backoff
    │
    ├─ Auth Error?
    │  ├─ "Invalid Credentials" → Login retry
    │  ├─ "User not found" → Registration
    │  └─ "Session expired" → Re-authenticate
    │
    ├─ Database Error?
    │  ├─ "Permission Denied" → RLS check
    │  ├─ "Duplicate key" → Already exists
    │  └─ "Foreign key" → Invalid reference
    │
    ├─ Validation Error?
    │  ├─ Empty fields
    │  ├─ Invalid email format
    │  └─ Password too short
    │
    └─ Unknown Error?
       └─ Log to console
          └─ Show generic error message
          └─ Alert user to try again


GLITCH FIX - Student Creation Error Flow:
────────────────────────────────────────

handleCreate()
    │
    ├─ Validate input ✓
    │
    ├─ Call silentAuth.signUp()
    │  │
    │  ├─ [Before Fix] Assuming admin.createUser()
    │  │   ✗ Always fails (403 Forbidden)
    │  │
    │  ├─ [After Fix] Using signUp() directly
    │  │   ✓ Creates user in auth.users
    │  │
    │  └─ Extract user.id from response
    │
    ├─ [NEW] Validate newUid exists
    │  ├─ If undefined → Throw error
    │  ├─ Show: "Failed to retrieve user ID"
    │  └─ No silent failure
    │
    ├─ INSERT student record
    │  ├─ Check for duplicate
    │  ├─ Provide helpful error message
    │  └─ Log for debugging
    │
    └─ Display success/error to admin
```

---

## Performance Optimization Paths

```
LAZY LOADING:
   Jobs list → Load 6 items initially → Load more on scroll

CACHING:
   getItemLayout() → FlatList optimization
   windowSize={5} → Render only visible items

MEMOIZATION:
   useMemo() → Prevent unnecessary recalculations
   useCallback() → Prevent function recreation

PAGINATION:
   Realtime subscriptions → Only subscribe to relevant data
   Database queries → Use .select() to limit fields
```

---

## Key Integration Points

```
CLIENT ←→ SUPABASE FLOW:

1. Authentication
   supabase.auth.signUp()
   supabase.auth.signInWithPassword()
   supabase.auth.getUser()

2. Database Queries
   supabase.from('table_name').select()
   supabase.from('table_name').insert()
   supabase.from('table_name').update()

3. Real-time Subscriptions
   supabase.channel('channel-name')
   .on('postgres_changes', {...}, callback)
   .subscribe()

4. Storage
   supabase.storage.from('bucket').upload()
   supabase.storage.from('bucket').download()

5. External AI APIs
   POST request to OpenAI/Anthropic/Gemini/Bedrock
   Streaming response handling
```

---

## Deployment Checklist

- [ ] Supabase project created & configured
- [ ] Environment variables set (.env)
- [ ] Database tables created with RLS policies
- [ ] Authentication configured (Email/Password)
- [ ] Realtime subscriptions enabled
- [ ] Error monitoring setup (Optional: Sentry)
- [ ] Build tested on web/Android/iOS
- [ ] Performance profiled
- [ ] Security audit completed
- [ ] Backup strategy documented

---

**Document Generated:** April 21, 2026  
**System Status:** ✅ Operational
