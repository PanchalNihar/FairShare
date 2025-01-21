import { Injectable } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from '@angular/fire/auth';
import { BehaviorSubject } from 'rxjs';

interface UserProfile {
  uid: string;
  email: string;
  username: string;
  profileImage?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private auth: Auth) {
    // Initialize with any existing auth state
    const currentUser = localStorage.getItem('currentUser');
    console.log("Current User:",currentUser)
    if (currentUser) {
      const userProfile = JSON.parse(currentUser);
      this.currentUserSubject.next(userProfile as unknown as User);
    }

    onAuthStateChanged(this.auth, (user) => {
      this.currentUserSubject.next(user);
      if (user) {
        // Ensure user data is properly stored in localStorage
        const storedUser = localStorage.getItem(`user_${user.uid}`);
        if (!storedUser) {
          const userProfile: UserProfile = {
            uid: user.uid,
            email: user.email || '',
            username: user.email?.split('@')[0] || 'User'
          };
          localStorage.setItem(`user_${user.uid}`, JSON.stringify(userProfile));
          localStorage.setItem('currentUser', JSON.stringify(userProfile));
        }
      } else {
        // Clear localStorage when user signs out
        localStorage.clear();
      }
    });
  }

  async signUp(email: string, password: string, username: string) {
    try {
      // Clear any existing data
      localStorage.clear();
      
      const result = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password
      );
      
      if (!result.user.uid) {
        throw new Error('User creation failed - no user ID');
      }

      const userProfile: UserProfile = {
        uid: result.user.uid,
        email: email,
        username: username,
      };

      // Store user profile
      localStorage.setItem(`user_${result.user.uid}`, JSON.stringify(userProfile));
      localStorage.setItem('currentUser', JSON.stringify(userProfile));
      
      return userProfile;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  async signIn(email: string, password: string) {
    try {
      // Clear any existing data
      localStorage.clear();
      
      const result = await signInWithEmailAndPassword(this.auth, email, password);
      
      if (!result.user.uid) {
        throw new Error('Sign in failed - no user ID');
      }

      // Create or get user profile
      let userProfile = JSON.parse(
        localStorage.getItem(`user_${result.user.uid}`) || 'null'
      );

      if (!userProfile) {
        userProfile = {
          uid: result.user.uid,
          email: result.user.email || email,
          username: email.split('@')[0]
        };
      }
      
      // Store user profile
      localStorage.setItem(`user_${result.user.uid}`, JSON.stringify(userProfile));
      localStorage.setItem('currentUser', JSON.stringify(userProfile));
      
      return userProfile;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  async signOut() {
    try {
      await signOut(this.auth);
      localStorage.clear();
      this.currentUserSubject.next(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  getCurrentUser(): UserProfile | null {
    const currentUser = localStorage.getItem('currentUser');
    return currentUser ? JSON.parse(currentUser) : null;
  }

  isAuthenticated(): boolean {
    return !!this.getCurrentUser();
  }

  updateUserProfile(profile: Partial<UserProfile>) {
    const currentUser = this.getCurrentUser();
    if (currentUser?.uid) {
      const updatedProfile = { ...currentUser, ...profile };
      localStorage.setItem(`user_${currentUser.uid}`, JSON.stringify(updatedProfile));
      localStorage.setItem('currentUser', JSON.stringify(updatedProfile));
      return updatedProfile;
    }
    throw new Error('No user logged in');
  }
}