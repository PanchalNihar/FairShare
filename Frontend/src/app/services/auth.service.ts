import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar?: string;
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

  async signUp(email: string, password: string, username: string) {
    const response: any = await firstValueFrom(
      this.http.post(
        `${this.apiUrl}/signup`,
        {
          username,
          email,
          password,
        },
        {
          withCredentials: true,
        },
      ),
    );

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

    this.currentUserSubject.next(response.data.user);

    return response.data.user;
  }

  async signOut() {
    await firstValueFrom(
      this.http.post(
        `${this.apiUrl}/logout`,
        {},
        {
          withCredentials: true,
        },
      ),
    );

    this.currentUserSubject.next(null);
  }
  async loadCurrentUser() {
    try {
      const response: any = await firstValueFrom(
        this.http.get(`${this.apiUrl}/me`, {
          withCredentials: true,
        }),
      );

      this.currentUserSubject.next(response.data);
    } catch {
      this.currentUserSubject.next(null);
    } finally {
      this.authLoadedSubject.next(true);
    }
  }

  getCurrentUser(): UserProfile | null {
    const currentUser = localStorage.getItem('currentUser');
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
    };

    this.currentUserSubject.next(mappedUser);
    return mappedUser;
  }
}
