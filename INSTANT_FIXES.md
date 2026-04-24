# Instant Fixes to Try Right Now

## 🚀 Quick Fixes (Try in Order)

### Fix #1: Re-deploy the Function (5 min)
```powershell
# Make sure you're in project root
cd "e:\rock AI"

# Re-deploy
supabase functions deploy chat-with-ignite-ai --no-verify-jwt

# If that doesn't work, delete and redeploy
supabase functions delete chat-with-ignite-ai
supabase functions deploy chat-with-ignite-ai
```

**Why:** Sometimes deployment gets stuck or code changes don't upload correctly.

---

### Fix #2: Verify API Keys are Actually Set (2 min)
```powershell
# List all secrets
supabase secrets list

# Each should show in output:
# ANTHROPIC_API_KEY=sk-ant-...
# OPENAI_API_KEY=sk-...
# GEMINI_API_KEY=AIza...

# If missing, add them:
supabase secrets set ANTHROPIC_API_KEY="your-key-here"
supabase secrets set OPENAI_API_KEY="your-key-here"  
supabase secrets set GEMINI_API_KEY="your-key-here"

# Re-deploy after setting secrets
supabase functions deploy chat-with-ignite-ai
```

**Why:** Even if secrets exist, they might not be set correctly.

---

### Fix #3: Test Function Directly (3 min)
```powershell
# Get your project ID and key
# Project ID: In Supabase dashboard URL (project-id.supabase.co)
# Anon Key: supabase/config.ts or .env file

$PROJECT_ID = "your-project-id"
$ANON_KEY = "eyJhbGciOiJIUzI1NiIs..." # from .env EXPO_PUBLIC_SUPABASE_ANON_KEY

$body = @{
    message = "Hello"
    selectedModel = "gemini"  # Start with Gemini
} | ConvertTo-Json

Invoke-WebRequest -Uri "https://$PROJECT_ID.supabase.co/functions/v1/chat-with-ignite-ai" `
    -Method Post `
    -Headers @{
        "Authorization" = "Bearer $ANON_KEY"
        "Content-Type" = "application/json"
    } `
    -Body $body `
    -Verbose

# Should see: Status Code 200 and response with { "text": "..." }
```

**Why:** Tests the function independently from your app to isolate the issue.

---

### Fix #4: Check Gemini API Specifically (5 min)
If using Gemini model, verify the API key and access:

```
1. Go to: https://console.cloud.google.com
2. Find your project
3. Go to: APIs & Services → Credentials
4. Find your API key (should be "Browser key" or "API key")
5. Check:
   - Not expired
   - Generative Language API is enabled
   - Has usage quota remaining
```

If quota is 0, you need to:
- Switch to paid Google Cloud account, OR
- Use a different model (ChatGPT or Claude)

---

### Fix #5: Use Different Model While Debugging (Immediate)
If Gemini isn't working, try ChatGPT or Claude:

1. Open the app
2. Click the model selector (top dropdown in chat)
3. Try: **"Versatile (ChatGPT)"** 
4. Send a message
5. If it works, your issue is Gemini-specific
6. If it fails, the Edge Function itself has an issue

---

## 🔧 If None of the Above Works

### Check Supabase Dashboard
```
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Go to: Edge Functions → chat-with-ignite-ai
4. Click: "Logs" tab
5. Look for error messages
6. Screenshot the error and share
```

### Check Project Status
```
1. Go to: https://supabase.com/dashboard → Project Status
2. Verify project isn't down/paused
3. Check recent deployments for errors
```

### Test from Terminal
```bash
# Test with curl (works on any OS)
curl -X POST \
  https://your-project-id.supabase.co/functions/v1/chat-with-ignite-ai \
  -H "Authorization: Bearer your-anon-key" \
  -H "Content-Type: application/json" \
  -d '{"message":"hello","selectedModel":"gemini"}' \
  -v

# -v flag shows all headers and response details
```

---

## 📊 Decision Tree

```
Is function deployed?
├─ NO → Run: supabase functions deploy chat-with-ignite-ai
└─ YES
   │
   Are API keys set?
   ├─ NO → Run: supabase secrets set GEMINI_API_KEY=...
   └─ YES
      │
      Do logs show errors?
      ├─ YES (401/403/429) → API key issue
      │  └─ Verify key in Google/OpenAI/Anthropic console
      │
      ├─ NO → Try different model
      │  ├─ ChatGPT works? → Gemini is the issue
      │  ├─ Claude works? → Gemini is the issue  
      │  └─ None work? → Function code issue
      │
      └─ Still broken? → Check Supabase status
         └─ Contact Supabase support
```

---

## ✅ Success Indicators

When the fix works, you'll see:
- ✅ Chat messages appear in both user and assistant roles
- ✅ No error messages in chat
- ✅ Function logs show successful requests
- ✅ Response comes back in <5 seconds

---

## 📞 If Stuck

**Provide these details:**
1. Output of: `supabase secrets list`
2. Output of: `supabase functions list`
3. Recent error from: `supabase functions logs chat-with-ignite-ai --limit=5`
4. Which model were you trying: Gemini / ChatGPT / Claude
5. Exact error message from app

---

**Last Updated:** April 21, 2026
