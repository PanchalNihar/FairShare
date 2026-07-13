import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  mobileNumber?: string;
}
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;

  private currentUserSubject = new BehaviorSubject<UserProfile | null>(null);
  private authLoadedSubject = new BehaviorSubject<boolean>(false);

  currentUser$ = this.currentUserSubject.asObservable();
  authLoaded$ = this.authLoadedSubject.asObservable();

  private getLocalStorageItem(key: string): string | null {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
    return null;
  }

  private setLocalStorageItem(key: string, value: string): void {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
  }

  private removeLocalStorageItem(key: string): void {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    }
  }

  constructor(private http: HttpClient) {
    this.loadCurrentUser();
  }

  // onAuthStateChanged(this.auth, (user) => {
  //   this.currentUserSubject.next(user);
  //   if (user) {
  //     // Ensure user data is properly stored in localStorage
  //     const storedUser = localStorage.getItem(`user_${user.uid}`);
  //     if (!storedUser) {
  //       const userProfile: UserProfile = {
  //         uid: user.uid,
  //         email: user.email || '',
  //         username: user.email?.split('@')[0] || 'User',
  //       };
  //       localStorage.setItem(`user_${user.uid}`, JSON.stringify(userProfile));
  //       localStorage.setItem('currentUser', JSON.stringify(userProfile));
  //     }
  //   } else {
  //     // Clear localStorage when user signs out
  //     localStorage.clear();
  //   }
  // });

  async signUp(email: string, password: string, username: string, mobileNumber: string) {
    const response: any = await firstValueFrom(
      this.http.post(
        `${this.apiUrl}/signup`,
        {
          username,
          email,
          password,
          mobileNumber,
        },
        {
          withCredentials: true,
        },
      ),
    );

    if (response.data.token) {
      this.setLocalStorageItem('token', response.data.token);
    }
    if (response.data.user) {
      this.setLocalStorageItem('currentUser', JSON.stringify(response.data.user));
    }

    this.currentUserSubject.next(response.data.user);

    return response.data.user;
  }

  async signInWithGoogle(idToken: string) {
    const response: any = await firstValueFrom(
      this.http.post(
        `${this.apiUrl}/google`,
        {
          idToken,
        },
        {
          withCredentials: true,
        },
      ),
    );

    if (response.data.token) {
      this.setLocalStorageItem('token', response.data.token);
    }
    if (response.data.user) {
      this.setLocalStorageItem('currentUser', JSON.stringify(response.data.user));
    }

    this.currentUserSubject.next(response.data.user);

    return response.data.user;
  }

  async signIn(email: string, password: string) {
    const response: any = await firstValueFrom(
      this.http.post(
        `${this.apiUrl}/login`,
        {
          email,
          password,
        },
        {
          withCredentials: true,
        },
      ),
    );

    if (response.data.token) {
      this.setLocalStorageItem('token', response.data.token);
    }
    if (response.data.user) {
      this.setLocalStorageItem('currentUser', JSON.stringify(response.data.user));
    }

    this.currentUserSubject.next(response.data.user);

    return response.data.user;
  }

  async signOut() {
    try {
      await firstValueFrom(
        this.http.post(
          `${this.apiUrl}/logout`,
          {},
          {
            withCredentials: true,
          },
        ),
      );
    } catch (e) {
      console.error('Logout request failed', e);
    }

    this.removeLocalStorageItem('token');
    this.removeLocalStorageItem('currentUser');
    this.currentUserSubject.next(null);
  }

  async loadCurrentUser() {
    try {
      const response: any = await firstValueFrom(
        this.http.get(`${this.apiUrl}/me`, {
          withCredentials: true,
        }),
      );

      if (response.data) {
        this.currentUserSubject.next(response.data);
        this.setLocalStorageItem('currentUser', JSON.stringify(response.data));
      }
    } catch {
      // Fallback to localstorage user if token exists
      const localUser = this.getCurrentUser();
      const token = this.getLocalStorageItem('token');
      if (localUser && token) {
        this.currentUserSubject.next(localUser);
      } else {
        this.currentUserSubject.next(null);
      }
    } finally {
      this.authLoadedSubject.next(true);
    }
  }

  getCurrentUser(): UserProfile | null {
    const currentUser = this.getLocalStorageItem('currentUser');
    return currentUser ? JSON.parse(currentUser) : null;
  }

  isAuthenticated() {
    return this.currentUserSubject.value != null;
  }

  async updateUserProfile(updatedData: any) {
    const currentUser = this.currentUserSubject.value;

    if (!currentUser) {
      return null;
    }

    const payload: any = {};
    if (updatedData.username) payload.username = updatedData.username;
    if (updatedData.email) payload.email = updatedData.email;
    if (updatedData.mobileNumber !== undefined) {
      payload.mobileNumber = updatedData.mobileNumber;
    }
    if (updatedData.profileImage !== undefined) {
      payload.avatar = updatedData.profileImage;
    } else if (updatedData.avatar !== undefined) {
      payload.avatar = updatedData.avatar;
    }

    const response: any = await firstValueFrom(
      this.http.put(
        `${this.apiUrl}/profile`,
        payload,
        {
          withCredentials: true,
        }
      )
    );

    const updatedUser = response.data;
    const mappedUser = {
      id: updatedUser.id || updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      avatar: updatedUser.avatar,
      mobileNumber: updatedUser.mobileNumber,
    };

    this.currentUserSubject.next(mappedUser);
    return mappedUser;
  }
}
