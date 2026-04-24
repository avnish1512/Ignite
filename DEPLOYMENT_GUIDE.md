# Terminal Commands & Deployment Guide

## Development Commands

```bash
# Install dependencies (if needed - likely not required as all deps present)
npm install

# Check for TypeScript errors
npm run lint

# Start development server (Web)
npm run start-web

# Start development server (Mobile)
npm run start

# Start with debugging
npm run start-web-dev
```

## Verification Commands

```bash
# Check that no files reference deleted ai-assistant tab
grep -r "ai-assistant" e:\rock\ AI\app --exclude-dir=node_modules

# Check for orphaned imports
grep -r "Sparkles" e:\rock\ AI\app --exclude-dir=node_modules

# Verify file structure
dir "e:\rock AI\app\(tab)"
```

## File Cleanup (Already Completed)

✅ **Already Done - No Action Needed**

The following file has been deleted:
```
e:\rock AI\app\(tab)\ai-assistant.tsx
```

No orphaned files remain from the AI Career feature removal.

## Database Migration (If Using Supabase)

```sql
-- Add new columns to students table (run in Supabase SQL Editor)
ALTER TABLE students ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS resume_url TEXT;

-- These columns are optional - existing data continues to work
-- The app maintains backward compatibility with the existing 'resume' column
```

## Testing the Implementation

### 1. Test Profile Image Feature
```bash
# In app, go to Profile > Edit
# Tap the upload/camera icons to test image picker
# Verify profile image updates display correctly
```

### 2. Test Skills Management
```bash
# In app, go to Profile > Edit > Professional Skills
# Add 3-4 skills
# Try to add a duplicate (should show alert)
# Remove a skill
# Save and verify persistence
```

### 3. Test Applications Grouping
```bash
# Create test data: Apply to 3 different jobs (2-3 applications per job)
# Go to My Applications
# Verify applications are grouped by job
# Test expand/collapse functionality
# Verify offers appear at the top
```

### 4. Verify Sign Out Button Removed
```bash
# Go to Profile screen
# Scroll to bottom
# Verify no Sign Out button exists
# Confirm button is NOT visible in edit or view mode
```

## Build and Deploy (Next Steps)

### iOS Build
```bash
# For EAS Build (Expo Application Services)
eas build --platform ios

# Or local build
npm run build:ios
```

### Android Build
```bash
# For EAS Build
eas build --platform android

# Or local build
npm run build:android
```

### Web Deployment
```bash
# Build for web
expo export --platform web

# Or with npm scripts if configured
npm run build:web
```

## Troubleshooting

### Issue: "ai-assistant" tab still shows
**Solution**: Clear cache and rebuild
```bash
# Clear cache
expo start --clear
```

### Issue: Profile image not saving
**Solution**: Check storage permissions
- iOS: Info.plist has photo library permissions
- Android: AndroidManifest.xml has permissions
```xml
<!-- Android permissions needed -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
```

### Issue: Skills not persisting
**Solution**: Verify updateStudent is being called
- Check auth-store.ts handleSave logic
- Verify Supabase connection
- Check database column exists: `skills` (TEXT array)

### Issue: Applications not grouping correctly
**Solution**: Check job data exists
- Verify jobs are loaded before grouping
- Check jobId matches in applications
- Verify getApplicationsForStudent returns correct data

## Performance Tips

1. **Lazy Load Profile Images**: Consider lazy loading in scrollable lists
2. **Optimize Skill Rendering**: Currently fine with <20 skills, may need virtualization for larger lists
3. **Memoize Expensive Computations**: Applications grouping uses useMemo/useCallback

## Security Notes

1. **Profile Images**: Consider uploading to Supabase Storage bucket
2. **Resume PDFs**: Store in secure Supabase Storage with RLS policies
3. **Skills Data**: No sensitive info, but validate on backend
4. **User Permissions**: Verify only users can edit their own profile

## Documentation Files Created

📄 **IMPLEMENTATION_SUMMARY.md** - Complete feature documentation
📄 **DEPLOYMENT_GUIDE.md** - This file

---

## Files Modified

1. ✅ `app/(tab)/_layout.tsx` - Removed AI tab
2. ✅ `app/profile.tsx` - Added image picker, skills, enhanced resume
3. ✅ `app/applications.tsx` - Restructured for job grouping
4. ✅ `types/job.ts` - Added new Student interface fields

## Files Deleted

1. ✅ `app/(tab)/ai-assistant.tsx` - Removed completely

---

Last Updated: April 22, 2026
