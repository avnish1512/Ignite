# Quick Diagnostic Steps for Edge Function Error

## Since your setup seems correct, check this:

### 1. **Check Supabase Function Logs** 🔍
This will show you the actual error from the function:

```powershell
# In terminal at your project root
supabase functions logs chat-with-ignite-ai --limit=20

# Or view in dashboard:
# https://supabase.com/dashboard → Functions → chat-with-ignite-ai → Logs
```

Look for error messages like:
- `"GEMINI_API_KEY secret is not set"` → Key not configured
- `"Gemini API error: 401"` → Invalid/expired key
- `"Gemini API error: 429"` → Rate limited
- `"Gemini API error: 403"` → Forbidden/quota exceeded

---

### 2. **Verify Gemini API Key is Valid**

Check if your Gemini API key:
- Is not expired
- Has Generative Language API enabled
- Has quota remaining
- Is in correct format (AIza... for Google API)

**How to check:**
```
1. Go to: https://console.cloud.google.com
2. Select your project
3. Go to Credentials
4. Find your API key
5. Check restrictions and usage quotas
```

---

### 3. **Test with Simple Request**

Copy this and test in your terminal:

```powershell
# Set your variables first
$PROJECT_ID = "your-supabase-project-id"  # from supabase URL
$ANON_KEY = "your-anon-key"  # from .env file

# Make request
$body = @{
    message = "What is placement?"
    selectedModel = "gemini"
} | ConvertTo-Json

Invoke-WebRequest -Uri "https://$PROJECT_ID.supabase.co/functions/v1/chat-with-ignite-ai" `
  -Method Post `
  -Headers @{
      "Authorization" = "Bearer $ANON_KEY"
      "Content-Type" = "application/json"
  } `
  -Body $body
```

**Expected Response:**
```json
{
  "text": "Placement is the process where..."
}
```

**If you get an error**, it will show exactly what went wrong.

---

### 4. **Common Issue: CORS Headers**

The function should have CORS headers. Check that the response includes:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type
```

If missing, add to function before deploy.

---

### 5. **Redeploy Function with Force**

Sometimes deployment doesn't update correctly:

```powershell
# Full redeploy
supabase functions delete chat-with-ignite-ai
supabase functions deploy chat-with-ignite-ai --no-verify-jwt

# Or with project reference
supabase functions deploy chat-with-ignite-ai --project-ref=your-project-ref
```

---

## What to Check:

✅ **In Supabase Dashboard:**
- Settings → Secrets → Verify GEMINI_API_KEY exists
- Functions → chat-with-ignite-ai → View the latest logs

✅ **In Function Logs:**
- Look for "[Gemini] API error" messages
- Check error codes: 401, 403, 429, 500

✅ **API Key Validity:**
- GEMINI_API_KEY should start with `AIza...`
- Should have Generative Language API enabled
- Should not be restricted to specific IPs/domains

---

## If Still Broken:

**Try these AI models in order (as fallback):**
1. ChatGPT - Test with different API key
2. Claude - Test with different API key
3. Gemini - Debug this one separately

```typescript
// Temporary: Comment out Gemini, try others
// Location: app/(tab)/aichat.tsx - Line ~130
const AI_MODELS = [
  // { id: 'gemini', ... },  // TEMPORARILY DISABLED
  { id: 'chatgpt', ... },
  { id: 'claude', ... },
];
```

---

## Next Steps:

1. Run: `supabase functions logs chat-with-ignite-ai --limit=20`
2. Share what errors you see
3. We can fix the specific issue

**Or if you need immediate fix:**
- Use a different AI model temporarily (ChatGPT or Claude)
- Then debug Gemini API key separately
