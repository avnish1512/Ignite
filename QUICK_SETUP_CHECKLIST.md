# 🎯 QUICK SETUP CHECKLIST

Follow this step-by-step! Takes about 15-20 minutes.

## ✅ BEFORE YOU START
- [ ] Have Supabase account (https://app.supabase.com)
- [ ] Created a new project called "Ignite Portal"
- [ ] Have your Supabase URL & Anon Key copied

---

## ✅ STEP 1: Update .env File (2 minutes)

**File location:** `e:\rock AI\.env`

Replace these lines:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project-name.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (your actual key)
```

**Where to get these:**
1. In Supabase → Click your project
2. Click Settings (⚙️ icon)
3. Click "API" 
4. Copy "Project URL" and "anon public" key

---

## ✅ STEP 2: Create Database Tables (5 minutes)

**In Supabase:**

1. Click "SQL Editor" on left menu
2. Click "+ New Query"
3. Copy **entire** content from: `SUPABASE_DATABASE_SETUP.sql`
4. Paste it into the query box
5. Click "RUN" button (top right)
6. You should see: ✅ "Success" message with all tables created

**Tables created:**
- students
- jobs
- applications
- companies
- conversations
- messages
- notifications
- settings

---

## ✅ STEP 3: Create Storage Buckets (3 minutes)

**In Supabase:**

1. Click "Storage" on left menu
2. Click "+ New Bucket"
3. Name: `profile-photos`
   - Make it **PUBLIC**
   - Click "Create"
4. Click "+ New Bucket" again
5. Name: `resumes`
   - Make it **PUBLIC**
   - Click "Create"

**Result:** You should see 2 buckets now!

---

## ✅ STEP 4: Setup Security Policies (5 minutes)

**In Supabase:**

1. Click "SQL Editor" 
2. Click "+ New Query"
3. Copy **entire** content from: `SUPABASE_RLS_POLICIES.sql`
4. Paste it in
5. Click "RUN"
6. You should see: ✅ "Success"

**What this does:** Sets rules for who can see/edit what data!

---

## ✅ STEP 5: Setup Storage Policies (Optional, 3 minutes)

**In Supabase:**

1. Click "SQL Editor"
2. Click "+ New Query"
3. Copy **entire** content from: `SUPABASE_STORAGE_SETUP.sql`
4. Paste it in
5. Click "RUN"

**Note:** Storage can work without this, but it's safer with policies!

---

## ✅ STEP 6: Create Admin User (2 minutes)

**In Supabase:**

1. Click "Authentication" on left menu
2. Click "Users" tab
3. Click "+ Add User" (top right)
4. Email: `admin@sgu.edu.in`
5. Password: (create a strong password, remember it!)
6. Confirm password
7. Click "Save"

**Result:** Admin user created! ✅

---

## ✅ STEP 7: Create Test Student User (Optional, 2 minutes)

**In Supabase:**

1. Click "Add User" again
2. Email: `student@example.com`
3. Password: (create a password)
4. Click "Save"

**Result:** Test student account created! ✅

---

## 🎉 SETUP COMPLETE! NOW TEST THE APP

---

# 🧪 TESTING CHECKLIST

## Test 1: Student Registration ✅

1. **Open the app** (http://localhost:8082)
2. **Click "Register"**
3. **Fill in:**
   - Email: `newstudent@test.com`
   - Password: `Test123456!`
   - Name: `John Doe`
4. **Click "Sign Up"**

**Expected:** 
- ✅ Goes to profile setup form
- ✅ No error messages
- ✅ Can enter name, phone, college, major

---

## Test 2: Admin Login ✅

1. **Click "Login"**
2. **Fill in:**
   - Email: `admin@sgu.edu.in`
   - Password: (your admin password)
3. **Click "Login"**

**Expected:**
- ✅ Goes to admin dashboard
- ✅ Shows "Admin Dashboard" title
- ✅ Can see statistics

---

## Test 3: Job Posting ✅

**As Admin:**

1. **Click "Post Job"**
2. **Fill in:**
   - Company: Select a company (or create new)
   - Job Title: "Software Engineer"
   - Description: "Build amazing things"
   - Salary: "$50,000-$70,000"
   - Location: "New York, NY"
   - Deadline: Pick a date in future
3. **Click "Post Job"**

**Expected:**
- ✅ Job appears in the list
- ✅ No error messages
- ✅ Can see job on student view

---

## Test 4: Student View & Apply ✅

**As Student:**

1. **Click on "Jobs"** (or home page)
2. **Should see the job you just posted**
3. **Click on job**
4. **Click "Apply"**

**Expected:**
- ✅ Application saved
- ✅ Shows "You have applied to this job"
- ✅ Application appears in admin dashboard

---

## Test 5: File Upload - Profile Photo ✅

**As Student:**

1. **Click "Profile"**
2. **Click "Upload Photo"** (or similar button)
3. **Select a photo from your computer**
4. **Wait for upload...**

**Expected:**
- ✅ Photo appears on profile
- ✅ No error messages
- ✅ Photo persists when you reload

---

## Test 6: File Upload - Resume ✅

**As Student:**

1. **On Profile page**
2. **Click "Upload Resume"**
3. **Select a PDF or document**
4. **Wait for upload...**

**Expected:**
- ✅ Resume shows in profile
- ✅ Can download it
- ✅ Shows in job applications

---

## Test 7: Real-time Chat (Bonus!) ✅

**As Admin:**

1. **Go to Messaging**
2. **Open a student's conversation**
3. **Type a message**
4. **Send it**

**As Student (another window):**

5. **Go to Messages**
6. **Open the conversation**
7. **Should see admin's message instantly!** ⚡

**Expected:**
- ✅ Message appears instantly
- ✅ Works both ways
- ✅ No refresh needed

---

## Test 8: Settings ✅

**As Any User:**

1. **Click "Settings"**
2. **Toggle "Dark Mode"**
3. **Toggle "Push Notifications"**
4. **Click to apply**

**Expected:**
- ✅ Settings save
- ✅ Dark mode works
- ✅ Settings persist when you reload

---

# 🐛 TROUBLESHOOTING

## Problem: "Connection refused" or "Cannot connect to database"

**Solution:**
1. Check `.env` file has correct URL and Key
2. Make sure Supabase project is running
3. Check internet connection

---

## Problem: "Permission denied" errors

**Solution:**
1. Make sure you ran the RLS policies SQL
2. Check you're logged in with right user
3. Admin email should be exactly: `admin@sgu.edu.in`

---

## Problem: File upload fails

**Solution:**
1. Check storage buckets exist (profile-photos, resumes)
2. Make sure buckets are PUBLIC
3. Check file size isn't too big (max 10MB recommended)

---

## Problem: Real-time messages not working

**Solution:**
1. Check Realtime is enabled in Supabase settings
2. Make sure you have latest version of `@supabase/supabase-js`
3. Check your internet connection

---

## Problem: App won't start

**Solution:**
1. Check all syntax in `.env` (no extra spaces)
2. Run: `npm install` (reinstall dependencies)
3. Clear Metro cache: `npm run start-web -- --clear`

---

# 🎓 SUMMARY

You now have:
- ✅ **Database:** 8 tables with all your data
- ✅ **Storage:** 2 buckets for photos and resumes
- ✅ **Security:** RLS policies protecting user data
- ✅ **Authentication:** Admin + Student users
- ✅ **Real-time:** Messages sync instantly
- ✅ **File uploads:** Photos and resumes work

**The app is ready for production!** 🚀

---

# 📚 HELPFUL LINKS

- **Supabase Dashboard:** https://app.supabase.com
- **Supabase Docs:** https://supabase.com/docs
- **Database Docs:** https://supabase.com/docs/guides/database
- **Storage Docs:** https://supabase.com/docs/guides/storage
- **Real-time Docs:** https://supabase.com/docs/guides/realtime

---

Need help? Check the error messages first - they usually tell you what's wrong! 💡
