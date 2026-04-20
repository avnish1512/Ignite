# ⚡ QUICK REFERENCE CARD

**Print this out or bookmark it!** Keep handy during setup.

---

## 🚀 THE 10-MINUTE SETUP

```
1. Get Supabase Keys (2 min)
   → Go to: app.supabase.com
   → Settings → API → Copy URL & Key

2. Update .env (1 min)
   → Edit: e:\rock AI\.env
   → Add URL and Key

3. Create Tables (2 min)
   → SQL Editor → New Query
   → Paste: SUPABASE_DATABASE_SETUP.sql
   → Click: RUN

4. Create Buckets (2 min)
   → Storage → + New Bucket
   → Create: profile-photos (PUBLIC)
   → Create: resumes (PUBLIC)

5. Setup Security (2 min)
   → SQL Editor → New Query
   → Paste: SUPABASE_RLS_POLICIES.sql
   → Click: RUN

6. Test App (1 min)
   → Open: http://localhost:8082
   → Click: Register
   → Fill in & click: Sign Up
   → ✅ Should work!
```

---

## 🔑 YOUR .ENV FILE

```
Location: e:\rock AI\.env

Add these two lines:
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_long_key_here
```

**Where to get:**
1. Supabase → Your Project
2. Settings (⚙️) → API
3. Copy the two values

---

## 📦 DATABASE TABLES (8 TOTAL)

```
students       → Student info
jobs           → Job posts
applications   → Applications
companies      → Company info
conversations  → Chat history
messages       → Chat messages
notifications  → Notifications
settings       → User preferences
```

---

## 🔒 SECURITY RULES QUICK VERSION

```
Students      → Can only see own profile
Jobs          → Everyone can see, only admin can post
Applications  → Students see own, admin sees all
Companies     → Everyone can see
Messages      → Users see their own
Notifications → Users see their own
Settings      → Users edit their own
```

---

## 🪣 STORAGE BUCKETS

```
1. profile-photos
   → For student pictures
   → Set to: PUBLIC

2. resumes
   → For resume files
   → Set to: PUBLIC
```

---

## ✅ TEST CHECKLIST

```
[ ] Registration works
[ ] Admin login works
[ ] Post a job
[ ] View jobs as student
[ ] Apply for job
[ ] Upload profile photo
[ ] Upload resume
[ ] Send message
[ ] Settings save
```

---

## 🆘 EMERGENCY FIXES

```
If stuck:
1. Restart app: Ctrl+C, then npm run start-web
2. Clear cache: npm run start-web -- --clear
3. Check .env file
4. Check error message (F12 in browser)
5. Read TROUBLESHOOTING_GUIDE.md
```

---

## 📞 COMMON ERRORS

```
"Cannot connect"
→ Check .env file, restart app

"Permission denied"
→ Run RLS policies SQL

"Not found"
→ Create tables/buckets

"File upload fails"
→ Check buckets are PUBLIC

"Real-time not working"
→ Enable Realtime in Supabase settings
```

---

## 🎯 ADMIN ACCOUNT

```
Email: admin@sgu.edu.in
Password: (create in Supabase)

Create in:
Supabase → Authentication → Users → + Add User
```

---

## 📁 FILE LOCATIONS

```
.env file              → e:\rock AI\.env
App files              → e:\rock AI\app\
Supabase config        → e:\rock AI\config\supabase.ts
SQL scripts            → Root of project
Guide files            → Root of project
```

---

## 🔗 IMPORTANT LINKS

```
Supabase:    https://app.supabase.com
Docs:        https://supabase.com/docs
Discord:     https://discord.supabase.com
App:         http://localhost:8082
```

---

## 📊 SETUP TIMELINE

```
Time    What to Do
────────────────────────────
0:00    Get Supabase keys
0:02    Update .env
0:03    Create tables
0:05    Create buckets
0:07    Setup security
0:09    Create admin user
0:10    Test! 🎉
```

---

## 🎓 WHICH FILE TO READ

```
Don't know where to start?
→ README_SUPABASE_SETUP.md

Ready to setup?
→ QUICK_SETUP_CHECKLIST.md

Need to add keys?
→ ENV_SETUP_GUIDE.md

Something broken?
→ TROUBLESHOOTING_GUIDE.md

Want to learn more?
→ SUPABASE_SETUP_GUIDE.md

Prefer videos?
→ VIDEO_VISUAL_GUIDES.md

All files available?
→ PACKAGE_SUMMARY.md
```

---

## ✨ PRO TIPS

```
✅ Copy/paste SQL (don't type)
✅ Make storage PUBLIC
✅ Create admin first
✅ Test immediately after each step
✅ Use F12 to see errors
✅ Keep Supabase tab open
✅ Restart app after .env changes
✅ Check table names are exact
```

---

## ⚠️ DON'T FORGET

```
[ ] Set storage to PUBLIC
[ ] Run RLS policies (security)
[ ] Create admin user
[ ] Update .env (both values!)
[ ] Restart app after .env
[ ] Check exact admin email
[ ] Test registration first
```

---

## 🎉 SUCCESS SIGNS

```
✅ Registration page works
✅ Can create account
✅ Admin can login
✅ Can post jobs
✅ Can upload files
✅ Messages appear instantly
```

---

## 📞 HELP COMMAND

When stuck:

1. **Read the error** (red text in F12 console)
2. **Search TROUBLESHOOTING_GUIDE.md**
3. **Restart app** (Ctrl+C + npm run start-web)
4. **Check .env** (most common issue)
5. **Ask Supabase Discord**

---

## 🌟 YOU'VE GOT THIS!

Setup is actually simple once you know the steps. 

**Just follow the checklist and you'll be fine!** 💪

---

**Print & Keep Handy!** 🖨️
