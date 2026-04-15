/**
 * nuclear-clean.mjs
 * Uses Firebase REST API to delete all Firestore documents.
 * Signs in as admin first, then deletes all docs in all collections.
 * 
 * Run: node scripts/nuclear-clean.mjs
 */

import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth, signInWithEmailAndPassword, signOut
} from 'firebase/auth';
import {
  getFirestore,
  collection, getDocs, deleteDoc, doc,
  writeBatch
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAC0TYsSETT0RN36ItoyRdujhpZm_HikDA",
  authDomain: "ignite-4d73e.firebaseapp.com",
  projectId: "ignite-4d73e",
  storageBucket: "ignite-4d73e.firebasestorage.app",
  messagingSenderId: "61424015105",
  appId: "1:61424015105:web:f132b36df294522d3b6d00",
};

const COLLECTIONS_TO_WIPE = [
  'students',
  'jobs',
  'applications',
  'messages',
  'companies',
  'notifications',
  'conversations',
  'chats',
  'queries',
];

const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function deleteCollection(colName) {
  try {
    const snap = await getDocs(collection(db, colName));
    if (snap.empty) {
      console.log(`  ⏭️  ${colName}: empty (skipped)`);
      return 0;
    }

    // Delete in batches of 500
    let deleted = 0;
    const docs = snap.docs;
    for (let i = 0; i < docs.length; i += 500) {
      const batch = writeBatch(db);
      docs.slice(i, i + 500).forEach(d => batch.delete(d.ref));
      await batch.commit();
      deleted += Math.min(500, docs.length - i);
    }
    console.log(`  ✅ ${colName}: ${deleted} document(s) deleted`);
    return deleted;
  } catch (e) {
    console.log(`  ❌ ${colName}: ${e.message}`);
    return 0;
  }
}

async function main() {
  console.log('\n💣 NUCLEAR CLEAN — Wiping all Firestore data\n');

  // Sign in as admin so rules allow access
  try {
    await signInWithEmailAndPassword(auth, 'admin@sgu.edu.in', 'admin123');
    console.log('✅ Signed in as admin\n');
  } catch (e) {
    console.error('❌ Admin sign-in failed:', e.message);
    process.exit(1);
  }

  let total = 0;
  for (const col of COLLECTIONS_TO_WIPE) {
    process.stdout.write(`→ Wiping ${col}... `);
    const n = await deleteCollection(col);
    total += n;
  }

  await signOut(auth).catch(() => {});

  console.log(`\n✅ Done! ${total} total documents deleted.`);
  console.log('Firebase is now clean — only admin login remains.\n');
  process.exit(0);
}

main().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
