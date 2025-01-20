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
    onAuthStateChanged(this.auth, (user) => {
      this.currentUserSubject.next(user);
    });
  }

  async signUp(email: string, password: string, username: string) {
    try {
      const result = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password
      );
      
      // Create user profile
      const userProfile: UserProfile = {
        uid: result.user.uid,
        email: email,
        username: username,
      };

      // Store in localStorage
      localStorage.setItem(`user_${result.user.uid}`, JSON.stringify(userProfile));
      localStorage.setItem('currentUser', JSON.stringify(userProfile));
      
      return userProfile;
    } catch (error) {
      throw error;
    }
  }

  async signIn(email: string, password: string) {
    try {
      const result = await signInWithEmailAndPassword(this.auth, email, password);
      
      // Retrieve user profile from localStorage
      const userProfile = JSON.parse(
        localStorage.getItem(`user_${result.user.uid}`) || '{}'
      );
      
      localStorage.setItem('currentUser', JSON.stringify(userProfile));
      return userProfile;
    } catch (error) {
      throw error;
    }
  }

  async signOut() {
    try {
      await signOut(this.auth);
      localStorage.removeItem('currentUser');
    } catch (error) {
      throw error;
    }
  }

  updateUserProfile(profile: Partial<UserProfile>) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (currentUser.uid) {
      const updatedProfile = { ...currentUser, ...profile };
      localStorage.setItem(`user_${currentUser.uid}`, JSON.stringify(updatedProfile));
      localStorage.setItem('currentUser', JSON.stringify(updatedProfile));
      return updatedProfile;
    }
    throw new Error('No user logged in');
  }

  isAuthenticated() {
   const currentUser=localStorage.getItem("currentUser")
   return currentUser!==null
  }
}