import { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);       // Firebase Auth user
  const [userData, setUserData] = useState(null); // Firestore user doc { name, email, role, uid }
  const [loading, setLoading] = useState(true);

  // Fetch Firestore user doc
  const fetchUserData = async (firebaseUser) => {
    try {
      const docRef = doc(db, 'users', firebaseUser.uid);
      const docSnap = await getDoc(docRef);
      
      const adminEmails = ['admin@civicreporter.com'];
      const forceAdmin = adminEmails.includes(firebaseUser.email.toLowerCase());

      if (docSnap.exists()) {
        const data = docSnap.data();
        if (forceAdmin && data.role !== 'admin') {
           data.role = 'admin';
           try { await setDoc(docRef, { role: 'admin' }, { merge: true }); } catch (e) {}
        } else if (!forceAdmin && data.role === 'admin') {
           data.role = 'citizen'; // Strip the admin role if they are no longer in the list
           try { await setDoc(docRef, { role: 'citizen' }, { merge: true }); } catch (e) {}
        }
        setUserData(data);
      } else {
        const fallbackData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || 'User',
          role: forceAdmin ? 'admin' : 'user',
        };
        try { await setDoc(docRef, fallbackData); } catch(e) {}
        setUserData(fallbackData);
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      const adminEmails = ['admin@civicreporter.com'];
      const forceAdmin = adminEmails.includes(firebaseUser.email.toLowerCase());
      setUserData({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName || 'User',
        role: forceAdmin ? 'admin' : 'user',
      });
    }
  };

  // Listen to auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await fetchUserData(firebaseUser);
      } else {
        setUserData(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Signup
  const signup = async (name, email, password) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    // Set displayName on Firebase Auth
    await updateProfile(cred.user, { displayName: name });
    
    const adminEmails = ['admin@civicreporter.com'];
    const assignedRole = adminEmails.includes(email.toLowerCase()) ? 'admin' : 'citizen';

    // Create Firestore user doc FORCING role to 'citizen' (default) unless specific email
    await setDoc(doc(db, 'users', cred.user.uid), {
      uid: cred.user.uid,
      name,
      email,
      role: assignedRole,
      createdAt: new Date().toISOString(),
    });
    
    // Update local state
    const data = { uid: cred.user.uid, name, email, role: assignedRole };
    setUserData(data);
    return data;
  };

  // Helper to get current Firebase ID token
  const getIdToken = async () => {
    if (auth.currentUser) {
      return await auth.currentUser.getIdToken(true); // true forces refresh to get latest claims
    }
    return null;
  };
  
  // Expose a method to refresh user data from Firestore (useful after role changes)
  const refreshUserData = async () => {
    if (auth.currentUser) {
      await fetchUserData(auth.currentUser);
    }
  };

  // Login
  const login = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    
    // Force admin role if specific email
    const adminEmails = ['admin@civicreporter.com'];
    if (adminEmails.includes(email.toLowerCase())) {
      try {
        await setDoc(doc(db, 'users', cred.user.uid), { role: 'admin' }, { merge: true });
      } catch (e) {
        console.warn('Could not force admin role on login:', e);
      }
    }

    await fetchUserData(cred.user);
    return cred.user;
  };

  // Logout
  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setUserData(null);
  };

  const value = {
    user,
    userData,
    loading,
    signup,
    login,
    logout,
    getIdToken,
    refreshUserData,
    isAdmin: userData?.role === 'admin',
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
