# 🔧 Troubleshooting Guide

## When Something Goes Wrong... 🚨

This guide helps you fix common problems!

---

## Error: "Cannot GET /"

**What it means:** The app isn't loading at all

**How to fix:**
1. Make sure the web server is running
2. Try opening: `http://localhost:8082`
3. If still broken, restart:
   - Press Ctrl+C in terminal
   - Run: `npm run start-web`

---

## Error: "Supabase is not defined"

**What it means:** The Supabase config file is missing or broken

**How to fix:**
1. Check file exists: `e:\rock AI\config\supabase.ts`
2. Check it has valid content (not empty)
3. Check `.env` file has correct URL and Key
4. Restart app: `npm run start-web`

---

## Error: "Invalid login credentials"

**What it means:** Email or password is wrong

**How to fix:**
1. Check email is spelled correctly (case doesn't matter usually)
2. Check password is correct
3. For admin, make sure it's: `admin@sgu.edu.in` (exact spelling!)
4. Try resetting password in Supabase

---

## Error: "Permission denied" or "row level security"

**What it means:** You don't have permission to see that data

**How to fix:**
1. Check RLS policies were applied: `SUPABASE_RLS_POLICIES.sql`
2. Make sure you ran the entire SQL file in Supabase
3. Check you're logged in as the right user
4. Wait 30 seconds and refresh (sometimes takes time)

---

## Error: "Cannot read property 'uid' of undefined"

**What it means:** Supabase can't find the current user

**How to fix:**
1. Make sure you're logged in
2. Check Supabase Auth is working
3. Try logging out and in again
4. Check `.env` has correct keys

---

## Error: "File upload failed"

**What it means:** Can't save photos or resumes

**How to fix:**
1. Check storage buckets exist:
   - Go to Supabase → Storage
   - Should see: `profile-photos` and `resumes`
2. Check buckets are PUBLIC
3. Check file isn't too big (max 10MB)
4. Check internet connection
5. Check storage policies were applied

---

## Error: "Cannot create student record"

**What it means:** Can't save student to database

**How to fix:**
1. Check `students` table exists in Supabase
2. Check email isn't already used
3. Check RLS policies allow create
4. Check authentication worked first

---

## Error: "Real-time messages not updating"

**What it means:** Messages appear but don't sync instantly

**How to fix:**
1. Check Realtime is enabled:
   - Supabase → Settings → Real-time
   - Make sure "Realtime" is toggled ON
2. Check `messages` table exists
3. Check `conversations` table exists
4. Try refreshing the page
5. Check internet connection

---

## Error: "Metro bundler error"

**What it means:** The app won't compile

**How to fix:**
1. Check for syntax errors:
   - Look at the error message
   - It usually shows which file has a problem
2. Try clearing cache:
   ```
   npm run start-web -- --clear
   ```
3. Reinstall dependencies:
   ```
   npm install
   ```

---

## Error: "Port 8082 already in use"

**What it means:** Something else is using that port

**How to fix:**
1. Kill the existing process:
   - Press Ctrl+C in the terminal
   - Wait 5 seconds
   - Run: `npm run start-web` again
2. Or use a different port:
   - Run: `npm run start-web -- --port 8083`

---

## Error: "Cannot find admin user"

**What it means:** The admin account doesn't exist

**How to fix:**
1. Create admin in Supabase:
   - Go to Authentication → Users
   - Click "+ Add User"
   - Email: `admin@sgu.edu.in`
   - Password: (create new)
   - Click Save
2. Try login again

---

## Error: "Tables don't exist"

**What it means:** Database setup wasn't completed

**How to fix:**
1. Run the SQL setup script:
   - Supabase → SQL Editor
   - Copy from: `SUPABASE_DATABASE_SETUP.sql`
   - Paste and click RUN
2. Check for ✅ Success message
3. Try again

---

## Error: "Storage bucket not found"

**What it means:** Photo/resume upload buckets missing

**How to fix:**
1. Create buckets in Supabase:
   - Click Storage
   - Click "+ New Bucket"
   - Name: `profile-photos` → Make PUBLIC → Create
   - Name: `resumes` → Make PUBLIC → Create
2. Try upload again

---

## Error: "App stops after login"

**What it means:** Something breaks after you log in

**How to fix:**
1. Check browser console for errors:
   - Press F12 in browser
   - Look for red errors
   - Copy the error message
2. Check student record was created:
   - Supabase → students table
   - Look for your email
3. Check `profileCompleted` field exists in students

---

## Error: "Blank screen / nothing loads"

**What it means:** App is stuck or has a critical error

**How to fix:**
1. Open browser console (F12)
2. Look for red errors
3. Try hard refresh: Ctrl+Shift+R
4. Clear browser cache:
   - Chrome: Ctrl+Shift+Delete
5. Restart app: Ctrl+C then `npm run start-web`

---

## Error: "Settings don't save"

**What it means:** User preferences are lost on reload

**How to fix:**
1. Check `settings` table exists in Supabase
2. Check RLS policies allow users to save settings
3. Check `userId` field in settings matches auth user id
4. Try creating settings manually in Supabase

---

# 🆘 Still Broken?

### Try these things in order:

1. **Refresh the page** (F5)
2. **Clear browser cache** (Ctrl+Shift+Delete)
3. **Restart the app** (Ctrl+C, then `npm run start-web`)
4. **Restart your computer** (yes, really!)
5. **Check internet connection** (WiFi on?)
6. **Reinstall dependencies** (`npm install`)

### If STILL broken:

1. Open browser console (F12)
2. Copy the exact error message
3. Search Google for the error
4. Check Supabase status: https://status.supabase.com
5. Ask in Supabase Discord: https://discord.supabase.com

---

## 📸 Common Errors & Solutions

### Screenshot 1: "response is not defined"
- **Cause:** Import missing
- **Fix:** Check imports at top of file

### Screenshot 2: "Cannot read property 'data' of undefined"
- **Cause:** Supabase returned nothing
- **Fix:** Check table exists, check RLS, check data

### Screenshot 3: "Invalid enum value"
- **Cause:** Wrong value for a field
- **Fix:** Check field values match database schema

---

## 💡 Pro Tips

✅ **Always check:**
1. Is the app running? (`http://localhost:8082`)
2. Are you logged in?
3. Is internet connected?
4. Did you wait for loading to finish?

✅ **When adding new features:**
1. Create table in Supabase
2. Add RLS policy
3. Test from browser console first
4. Then test in app

✅ **When something breaks:**
1. Check logs (F12 in browser)
2. Check Supabase dashboard
3. Check .env file
4. Restart everything

---

## 🚀 Quick Restart Sequence

If app is broken, do this:

```bash
# 1. Stop the app
Ctrl+C

# 2. Clear everything
npm run start-web -- --clear

# 3. Wait for it to load
# 4. Hard refresh in browser
Ctrl+Shift+R

# 5. Try again
```

---

## 📞 When to Get Help

- Check error message in console (F12)
- Search error on Google
- Check Supabase docs: https://supabase.com/docs
- Ask in Discord: https://discord.supabase.com
- Create GitHub issue

---

Remember: Most errors are just typos or missing configuration! 🎯

You got this! 💪
