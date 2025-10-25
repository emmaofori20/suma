import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  User 
} from 'firebase/auth';
import { SyncProvider } from './sync-provider.interface';
import { Entry, Settings } from '../models/entry.model';

@Injectable({
  providedIn: 'root'
})
export class FirebaseAdapterService implements SyncProvider {
  private db: any;
  private auth: any;
  private currentUser: User | null = null;

  constructor() {
    // Initialize Firebase (you'll need to add your config)
    const firebaseConfig = {
      // Add your Firebase config here
      apiKey: "AIzaSyBjNUu2YMp5NDYASTD5Fgu3dIe6IQls6p0",
      authDomain: "suma-a3803.firebaseapp.com",
      projectId: "suma-a3803",
      storageBucket: "suma-a3803.firebasestorage.app",
      messagingSenderId: "718099556521",
      appId: "1:718099556521:web:a887c89d5ea4c8fd4261b8"
    };

    const app = initializeApp(firebaseConfig);
    this.db = getFirestore(app);
    this.auth = getAuth(app);
  }

  async signInAnon(): Promise<{ uid: string }> {
    try {
      const userCredential = await signInAnonymously(this.auth);
      this.currentUser = userCredential.user;
      return { uid: userCredential.user.uid };
    } catch (error) {
      console.error('Firebase sign-in error:', error);
      throw error;
    }
  }

  async upsertEntries(entries: Entry[]): Promise<void> {
    if (!this.currentUser) {
      throw new Error('User not authenticated');
    }

    const batch = [];
    for (const entry of entries) {
      const entryRef = doc(this.db, 'users', this.currentUser.uid, 'entries', entry.id);
      batch.push(setDoc(entryRef, {
        ...entry,
        updatedAt: serverTimestamp()
      }));
    }

    await Promise.all(batch);
  }

  async pullEntries(since?: number): Promise<Entry[]> {
    if (!this.currentUser) {
      throw new Error('User not authenticated');
    }

    const entriesRef = collection(this.db, 'users', this.currentUser.uid, 'entries');
    let q = query(entriesRef, orderBy('updatedAt', 'asc'));

    if (since) {
      q = query(entriesRef, 
        where('updatedAt', '>', new Date(since)),
        orderBy('updatedAt', 'asc')
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        updatedAt: (data as any).updatedAt?.toMillis() || Date.now()
      } as Entry;
    });
  }

  async upsertSettings(settings: Settings): Promise<void> {
    if (!this.currentUser) {
      throw new Error('User not authenticated');
    }

    const settingsRef = doc(this.db, 'users', this.currentUser.uid, 'settings', 'main');
    await setDoc(settingsRef, {
      ...settings,
      updatedAt: serverTimestamp()
    });
  }

  async pullSettings(): Promise<Settings | null> {
    if (!this.currentUser) {
      throw new Error('User not authenticated');
    }

    const settingsRef = doc(this.db, 'users', this.currentUser.uid, 'settings', 'main');
    const snapshot = await getDoc(settingsRef);
    
    if (snapshot.exists()) {
      const data = snapshot.data();
      return {
        ...data,
        updatedAt: (data as any).updatedAt?.toMillis() || Date.now()
      } as Settings;
    }
    
    return null;
  }

  async lastServerTs(): Promise<number> {
    if (!this.currentUser) {
      throw new Error('User not authenticated');
    }

    const entriesRef = collection(this.db, 'users', this.currentUser.uid, 'entries');
    const q = query(entriesRef, orderBy('updatedAt', 'desc'), limit(1));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const data = snapshot.docs[0].data();
      return (data as any).updatedAt?.toMillis() || Date.now();
    }
    
    return 0;
  }
}
