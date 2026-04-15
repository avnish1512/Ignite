/**
 * delete-students-firestore.mjs
 * Deletes Firestore student docs by logging in as admin first.
 * Run after: node scripts/delete-all-students.mjs
 */

import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
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

async function main() {
  console.log('\n🧹 Clearing Firestore student documents...\n');

  // Login as admin so Firestore rules allow reads/deletes
  try {
    await signInWithEmailAndPassword(auth, 'admin@sgu.edu.in', 'admin123');
    console.log('✅ Signed in as admin\n');
  } catch (e) {
    console.error('❌ Could not sign in as admin:', e.message);
    process.exit(1);
  }

  const snapshot = await getDocs(collection(db, 'students'));
  let deleted = 0;
  for (const d of snapshot.docs) {
    const data = d.data();
    if (data.role === 'admin') { console.log(`  ⏭️  Skipping admin: ${data.email}`); continue; }
    await deleteDoc(doc(db, 'students', d.id));
    console.log(`  🗑️  Deleted: ${data.email || d.id}`);
    deleted++;
  }

  await signOut(auth).catch(() => {});
  console.log(`\n✅ Done! ${deleted} student Firestore docs deleted.\n`);
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Fatal:', err.message);
  process.exit(1);
});
