"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';
import { app } from './firebase';
import { getUserProfile } from './users';
import type { UserProfile } from './types';

const auth = getAuth(app);

export interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdministrator: boolean;
}

export const AuthContext = createContext<AuthContextType>({ user: null, userProfile: null, loading: true, isAdministrator: false });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdministrator, setIsAdministrator] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
            const profile = await getUserProfile(user.uid);
            setUserProfile(profile);
            setIsAdministrator(profile?.isAdministrator ?? false);
        } catch (error) {
            console.error("Failed to fetch user profile:", error);
            setUserProfile(null);
            setIsAdministrator(false);
        }
      } else {
        setUserProfile(null);
        setIsAdministrator(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, isAdministrator }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

export const signInWithEmail = (email: string, pass: string) => {
  return signInWithEmailAndPassword(auth, email, pass);
};

export const signUpWithEmail = (email: string, pass: string) => {
    return createUserWithEmailAndPassword(auth, email, pass);
};

export const signOutUser = () => {
  return signOut(auth);
};
