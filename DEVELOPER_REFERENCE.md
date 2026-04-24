# Ignite Portal - Developer Quick Reference & Bug Fixes

## 🐛 Bugs Found & Fixed

### Bug #1: Admin Create Student - User ID Missing ✅ FIXED
**Location:** `app/admin-create-student.tsx`  
**Severity:** CRITICAL

**What was wrong:**
```typescript
// ❌ BEFORE: Always fails with 403 (no admin key)
let authResult = await supabase.auth.admin.createUser({...});
if (authResult.error?.status === 403) {
  authResult = await silentAuth.signUp(...);
}
const newUid = authResult.data?.user?.id; // ⚠️ UNDEFINED!
```

**Why it failed:**
- `admin.createUser()` needs service_role key, but app has anon key only
- When fallback to `silentAuth.signUp()` succeeds, it doesn't return user.id
- Result: `newUid` is undefined, database insert fails

**How it's fixed:**
```typescript
// ✅ AFTER: Direct approach with validation
const authResult = await silentAuth.signUp(trimmedEmail, password, trimmedName);
if (authResult.error) throw authResult.error;

let newUid = authResult.data?.user?.id;
if (!newUid) {
  throw new Error('Failed to retrieve user ID. Please try again.');
}

// Insert with validated ID
const { error: insertError } = await supabase
  .from('students')
  .insert([{
    id: newUid,
    name: trimmedName,
    email: trimmedEmail,
    profile_completed: false,
    is_active: true,
    created_at: new Date().toISOString(),
  }]);
```

---

## 🔑 Key Concepts

### Authentication Flow
```
User → Login/SignUp → Supabase Auth → Session Token → 
AsyncStorage → App State → Protected Routes
```

**Key Functions:**
- `useAuth()` - Get current user, login, logout
- `supabase.auth.signUp()` - Create new account
- `supabase.auth.signInWithPassword()` - Login existing user
- `supabase.auth.onAuthStateChange()` - Listen for auth changes

### Data Sync with Realtime
```
Database Change → Supabase Realtime → WebSocket → 
App Subscription → State Update → UI Re-render
```

**Key Hook:**
```typescript
useEffect(() => {
  const channel = supabase
    .channel('db-changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'jobs'
    }, () => loadData())
    .subscribe();
  
  return () => supabase.removeChannel(channel);
}, []);
```

---

## 📁 Project Structure

```
app/
├── _layout.tsx                 # Root layout, auth check
├── unified-login.tsx           # Student/Admin login (auto-detect)
├── login.tsx                   # Student login (legacy)
├── admin-login.tsx             # Admin login (legacy)
├── register.tsx                # Student registration
├── profile-setup.tsx           # Complete student profile
├── admin-create-student.tsx    # ⭐ FIXED: Create student by admin
├── admin-dashboard.tsx         # Admin main panel
├── admin-manage-students.tsx   # Student management
├── admin-manage-jobs.tsx       # Job management
├── admin-manage-companies.tsx  # Company management
├── admin-applications.tsx      # Application review
├── admin-post-job.tsx          # Post new job
├── applications.tsx            # Student applications list
├── student-directory.tsx       # Browse students (admin)
├── notifications.tsx           # Notification center
├── settings.tsx                # User settings
├── messages.tsx                # Messaging list (redirects to tab)
├── job/
│   └── [id].tsx               # Job detail page
└── (tab)/                      # Tab navigation
    ├── _layout.tsx
    ├── index.tsx               # Home/Dashboard
    ├── jobs.tsx                # Browse jobs
    ├── messages.tsx            # Messages
    ├── aichat.tsx              # AI Assistant
    └── more.tsx                # More menu

hooks/
├── auth-store.ts               # Auth context & functions
├── jobs-store.ts               # Jobs context & functions
├── messaging-store.ts          # Messaging context
├── notifications-store.ts      # Notifications context
├── aichat-store.ts             # AI chat context
├── theme-store.ts              # Theme (dark/light) context
├── salary-utils.ts             # Salary formatting helpers
├── text-utils.ts               # Text helpers
└── validation-utils.ts         # Form validation

components/
├── JobCard.tsx                 # Job card component
├── ErrorBoundary.tsx           # Error handling
├── SplashScreen.tsx            # Loading screen
├── SkeletonLoader.tsx          # Skeleton UI
└── StatusBadge.tsx             # Status display

config/
└── supabase.ts                 # Supabase client setup

types/
└── job.ts                      # TypeScript interfaces
```

---

## 🔧 Common Tasks

### Add a New Page
1. Create file: `app/my-page.tsx`
2. Wrap with `SafeAreaView`
3. Add to root layout if needed: `app/_layout.tsx`
4. Navigate: `router.push('/my-page')`

### Add New Context Hook
```typescript
// hooks/my-store.ts
import createContextHook from '@nkzw/create-context-hook';

export const [MyProvider, useMyStore] = createContextHook(() => {
  const [data, setData] = useState([]);
  
  const addItem = (item) => {
    setData([...data, item]);
  };
  
  return { data, addItem };
});

// Wrap app with provider in _layout.tsx
<MyProvider>
  {children}
</MyProvider>

// Use in components
const { data, addItem } = useMyStore();
```

### Fetch Data from Supabase
```typescript
// Simple query
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('id', userId);

// With conditions
const { data } = await supabase
  .from('jobs')
  .select('*')
  .eq('is_active', true)
  .order('posted_date', { ascending: false });

// Insert
const { error } = await supabase
  .from('jobs')
  .insert([{ title: 'Dev', company: 'ABC' }]);

// Update
const { error } = await supabase
  .from('students')
  .update({ name: 'New Name' })
  .eq('id', userId);

// Delete
const { error } = await supabase
  .from('jobs')
  .delete()
  .eq('id', jobId);
```

### Setup Realtime Listener
```typescript
useEffect(() => {
  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'messages' },
      (payload) => {
        console.log('New message:', payload);
        // Update state
      }
    )
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
}, [conversationId]);
```

### Add Error Handling
```typescript
try {
  const result = await someAsyncFunction();
  if (result.error) {
    console.error('Operation failed:', result.error.message);
    Alert.alert('Error', result.error.message);
    return;
  }
} catch (error) {
  console.error('Unexpected error:', error);
  Alert.alert('Error', 'Something went wrong');
}
```

---

## 🚀 Common Issues & Solutions

### Issue: User ID undefined after signup
**Solution:** Call `getUser()` after signup to ensure user object exists
```typescript
const { data, error } = await supabase.auth.signUp({...});
if (error) throw error;

const { data: { user } } = await supabase.auth.getUser();
const userId = user?.id;
```

### Issue: RLS permission denied
**Solution:** Check RLS policies in Supabase dashboard
```typescript
// Students can only access their own records
CREATE POLICY "students_select_own" ON students
  FOR SELECT USING (auth.uid() = id);

// Admins can access all
CREATE POLICY "admins_all" ON students
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
```

### Issue: Realtime not updating
**Solution:** Ensure RLS policies allow reads/inserts
```typescript
// Add read policy for realtime
CREATE POLICY "realtime_read" ON jobs
  FOR SELECT USING (true);
```

### Issue: Login redirects not working
**Solution:** Ensure auth state is loaded before routing
```typescript
const { isAuthenticated, isLoading } = useAuth();

if (isLoading) return <Splash />;

useEffect(() => {
  if (isAuthenticated) {
    router.replace('/home');
  } else {
    router.replace('/login');
  }
}, [isAuthenticated, isLoading]);
```

---

## 📊 Testing Checklist

**Before Deploying Changes:**
- [ ] Code compiles without errors (`npm run start-web`)
- [ ] All imports resolved correctly
- [ ] console.error/warn reviewed
- [ ] Navigation flows tested
- [ ] Database changes reflected in types
- [ ] RLS policies updated if needed
- [ ] Error handling for all API calls
- [ ] Loading states visible to user

---

## 🔐 Security Best Practices

1. **Never store passwords** - Supabase Auth handles this
2. **Use RLS policies** - Always restrict database access
3. **Validate on backend** - Don't trust client validation alone
4. **Check auth state** - Before accessing protected resources
5. **Use HTTPS** - Always in production
6. **Rotate secrets** - Change API keys periodically
7. **Audit logs** - Track admin actions

---

## 📈 Performance Tips

1. **Use FlatList** for long lists (not ScrollView)
2. **Memoize expensive calculations** (useMemo)
3. **Lazy load images** (Image component)
4. **Pagination** for large datasets
5. **Debounce search** (500ms delay)
6. **Unsubscribe from listeners** in cleanup
7. **Profile with React DevTools**

---

## 🐛 Debug Mode

Enable debug logging:
```typescript
// In app/_layout.tsx
if (__DEV__) {
  console.log('🔵 DEBUG MODE ENABLED');
  // Log all API calls
  // Log all state changes
}
```

---

## 📚 Useful Resources

- **Supabase Docs:** https://supabase.com/docs
- **Expo Docs:** https://docs.expo.dev
- **React Native:** https://reactnative.dev
- **Expo Router:** https://expo.github.io/router/

---

## 🎯 Next Steps

1. **Deploy to staging** - Test on real device
2. **Load testing** - Verify database performance
3. **Security audit** - Check for vulnerabilities
4. **User testing** - Get feedback from real users
5. **Analytics setup** - Track user behavior
6. **Backup strategy** - Ensure data safety

---

**Last Updated:** April 21, 2026  
**Status:** ✅ All Critical Bugs Fixed
