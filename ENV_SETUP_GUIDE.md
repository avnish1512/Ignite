# 📝 Environment Setup - What Goes Where

## Your Current .env File Location:
```
e:\rock AI\.env
```

## What to Fill In:

### You Already Have:
```
AWS_BEARER_TOKEN_BEDROCK="replace_with_your_actual_aws_token"
```

### You Need to Add:

**Step 1:** Get your Supabase credentials
- Go to https://app.supabase.com
- Click your project
- Click Settings → API

**Step 2:** Find these two things:
1. **Project URL** - looks like: `https://xxxxxx.supabase.co`
2. **anon public key** - looks like: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (long string)

**Step 3:** Update your .env file to look like:

```
AWS_BEARER_TOKEN_BEDROCK="replace_with_your_actual_aws_token"

# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project-name.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (paste your actual key here)
```

## Example (DO NOT USE - THIS WON'T WORK):
```
EXPO_PUBLIC_SUPABASE_URL=https://myigniteportal.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwY3Z3aXh3eWVqbWZ5a2RzdmhtIiwiZW50aXJlU3lzdGVtIjp0cnVlfQ.EXAMPLE_FAKE_KEY_ONLY
```

## ✅ How to Know It's Correct:

- [ ] EXPO_PUBLIC_SUPABASE_URL starts with `https://` and ends with `.supabase.co`
- [ ] EXPO_PUBLIC_SUPABASE_ANON_KEY is a very long string (usually 200+ characters)
- [ ] No extra spaces before or after the equals sign
- [ ] No extra quotes around the values

## ⚠️ Common Mistakes:

❌ **WRONG:** `EXPO_PUBLIC_SUPABASE_URL = https://myproject.supabase.co`
✅ **RIGHT:** `EXPO_PUBLIC_SUPABASE_URL=https://myproject.supabase.co`

❌ **WRONG:** `EXPO_PUBLIC_SUPABASE_ANON_KEY="eyJhbGc..."`  (extra quotes)
✅ **RIGHT:** `EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...` (no extra quotes)

❌ **WRONG:** `EXPO_PUBLIC_SUPABASE_URL=myproject.supabase.co`  (missing https://)
✅ **RIGHT:** `EXPO_PUBLIC_SUPABASE_URL=https://myproject.supabase.co`

## 🚀 After You Fill It In:

1. Save the `.env` file
2. Restart your app (Ctrl+C to stop, then `npm run start-web` to start)
3. The app should connect to Supabase automatically!

---

## 💡 Where to Find Your Credentials

### Picture Guide:

```
Supabase Dashboard
    ↓
Your Project
    ↓
Settings (⚙️ icon on left)
    ↓
API (in the menu)
    ↓
You'll see:
- Project URL ← Copy this!
- anon public ← Copy this key!
```

---

## ❓ Still Confused?

Watch this: https://www.youtube.com/watch?v=W6NZqYWczYM (Supabase quick start)

Or ask in Supabase docs: https://supabase.com/docs
