/**
 * delete-test-auth.mjs
 * Deletes any remaining student Auth accounts (including test accounts).
 */
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, deleteUser, signOut } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAC0TYsSETT0RN36ItoyRdujhpZm_HikDA",
  authDomain: "ignite-4d73e.firebaseapp.com",
  projectId: "ignite-4d73e",
  storageBucket: "ignite-4d73e.firebasestorage.app",
  messagingSenderId: "61424015105",
  appId: "1:61424015105:web:f132b36df294522d3b6d00",
};

const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);

// All known student accounts (add any manually created ones here)
const ACCOUNTS = [
  { email: 'priya.sharma@student.com',  password: 'Priya@123'  },
  { email: 'rahul.kumar@student.com',   password: 'Rahul@123'  },
  { email: 'aisha.patel@student.com',   password: 'Aisha@123'  },
  { email: 'vikram.singh@student.com',  password: 'Vikram@123' },
  { email: 'neha.gupta@student.com',    password: 'Neha@123'   },
  { email: 'test.student@ignite.com',   password: 'Test@2024'  },
];

async function tryDelete(email, password) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    await deleteUser(cred.user);
    console.log(`  ✅ Deleted Auth: ${email}`);
  } catch (e) {
    if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential') {
      console.log(`  ⏭️  Not found: ${email}`);
    } else {
      console.log(`  ❌ ${email}: ${e.message}`);
    }
  }
  await signOut(auth).catch(() => {});
}

async function main() {
  console.log('\n🗑️  Deleting all student Firebase Auth accounts...\n');
  for (const acc of ACCOUNTS) {
    await tryDelete(acc.email, acc.password);
  }
  console.log('\n✅ Auth cleanup done.\n');
  process.exit(0);
}
main().catch(e => { console.error(e.message); process.exit(1); });
