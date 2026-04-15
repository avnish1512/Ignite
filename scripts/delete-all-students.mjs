/**
 * delete-all-students.mjs
 * Deletes ALL student accounts from Firebase Auth + Firestore.
 * Admin account (admin@sgu.edu.in) is preserved.
 *
 * Run with: node scripts/delete-all-students.mjs
 *
 * WARNING: This is irreversible. Run seed-students.mjs afterwards to repopulate.
 */

import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, deleteUser, signOut } from 'firebase/auth';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

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
const db = getFirestore(app);

// Students to delete (from LOGIN_CREDENTIALS.md)
const STUDENTS = [
  { email: 'priya.sharma@student.com',  password: 'Priya@123'  },
  { email: 'rahul.kumar@student.com',   password: 'Rahul@123'  },
  { email: 'aisha.patel@student.com',   password: 'Aisha@123'  },
  { email: 'vikram.singh@student.com',  password: 'Vikram@123' },
  { email: 'neha.gupta@student.com',    password: 'Neha@123'   },
];

async function deleteStudentAuth(email, password) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;
    await deleteUser(cred.user);
    console.log(`  ✅ Auth deleted: ${email} (uid: ${uid})`);
    return uid;
  } catch (error) {
    if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
      console.log(`  ℹ️  Not found in Auth: ${email} (already deleted?)`);
    } else {
      console.error(`  ❌ Could not delete Auth for ${email}: ${error.message}`);
    }
    return null;
  }
}

async function deleteAllStudentFirestoreDocs() {
  console.log('\n🗂️  Deleting all Firestore student documents...');
  const snapshot = await getDocs(collection(db, 'students'));
  let count = 0;
  for (const d of snapshot.docs) {
    const data = d.data();
    // Preserve admin document if any
    if (data.role === 'admin') {
      console.log(`  ⏭️  Skipping admin doc: ${data.email}`);
      continue;
    }
    await deleteDoc(doc(db, 'students', d.id));
    console.log(`  🗑️  Firestore doc deleted: ${data.email || d.id}`);
    count++;
  }
  console.log(`  ✅ ${count} Firestore student docs deleted\n`);
}

async function main() {
  console.log('\n⚠️  DELETE ALL STUDENTS\n');
  console.log('This will remove ALL student accounts from Firebase Auth + Firestore.');
  console.log('The admin account will be preserved.\n');

  // Step 1: Delete Firebase Auth accounts (must login as each student to delete)
  console.log('🔐 Step 1: Deleting Firebase Auth accounts...\n');
  for (const student of STUDENTS) {
    console.log(`→ ${student.email}`);
    await deleteStudentAuth(student.email, student.password);
    await signOut(auth).catch(() => {});
  }

  // Step 2: Delete ALL Firestore student documents
  await deleteAllStudentFirestoreDocs();

  console.log('✅ Done! All student accounts deleted.\n');
  console.log('Run "node scripts/seed-students.mjs" to add default students back.\n');
  process.exit(0);
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
