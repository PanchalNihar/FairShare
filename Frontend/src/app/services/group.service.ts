import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import QRCode from 'qrcode';
import { environment } from '../../environments/environment';

export interface GroupMember {
  user: {
    _id: string;
    username: string;
    email: string;
    avatar?: string;
  };

  role: 'owner' | 'member';

  joinedAt: string;
}
export interface UserSearch {
  _id?: string;
  username: string;
  email: string;
  avatar?: string;
  isNew?: boolean;
}
export interface Group {
  _id: string;
  name: string;
  description: string;
  inviteCode: string;
  members: GroupMember[];
}

@Injectable({
  providedIn: 'root',
})
export class GroupService {
  private apiUrl = `${environment.apiUrl}/groups`;

  private groupsSubject = new BehaviorSubject<Group[]>([]);

  groups$ = this.groupsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadGroups();
  }

  async loadGroups(): Promise<void> {
    try {
      const response: any = await firstValueFrom(
        this.http.get(this.apiUrl, {
          withCredentials: true,
        }),
      );

      this.groupsSubject.next(response.data);
    } catch (error) {
      console.error('Failed to load groups:', error);
    }
  }

  getGroups(): Group[] {
    return this.groupsSubject.value;
  }

  getGroupForTracking(): string[] {
    return this.groupsSubject.value.map((group) => group.name);
  }

  getGroupMembers(groupId: string): any[] {
    const group = this.groupsSubject.value.find((g) => g._id === groupId);

    return group ? group.members : [];
  }

  async addGroup(
    name: string,
    description: string,
    members: (string | { username: string; email: string; isNew?: boolean })[],
  ): Promise<void> {
    await firstValueFrom(
      this.http.post(
        this.apiUrl,
        {
          name,
          description,
          members,
        },
        {
          withCredentials: true,
        },
      ),
    );

    await this.loadGroups();
  }
  async addMember(
    groupId: string,
    user: string | { username: string; email: string; isNew?: boolean }
  ): Promise<void> {
    const body = typeof user === 'string' ? { userId: user } : { username: user.username, email: user.email };
    await firstValueFrom(
      this.http.post(
        `${this.apiUrl}/${groupId}/add-member`,
        body,
        {
          withCredentials: true,
        },
      ),
    );

    await this.loadGroups();
  }
  async joinGroup(inviteCode: string): Promise<void> {
    await firstValueFrom(
      this.http.post(
        `${this.apiUrl}/join`,
        {
          inviteCode,
        },
        {
          withCredentials: true,
        },
      ),
    );

    await this.loadGroups();
  }

  async getGroupQRCode(groupId: string): Promise<string> {
    const group = this.groupsSubject.value.find((g) => g._id === groupId);

    if (!group) {
      throw new Error('Group not found');
    }

    return QRCode.toDataURL(
      `${window.location.origin}/joingroup?code=${group.inviteCode}`,
    );
  }

  async searchUsers(search: string): Promise<UserSearch[]> {
    const response: any = await firstValueFrom(
      this.http.get(`${environment.apiUrl}/auth/search?search=${search}`, {
        withCredentials: true,
      }),
    );

    return response.data;
  }
  async removeMember(groupId: string, userId: string): Promise<void> {

  await firstValueFrom(
    this.http.delete(
      `${this.apiUrl}/${groupId}/remove-member/${userId}`,
      {
        withCredentials: true,
      }
    )
  );

  await this.loadGroups();
}
  async deleteGroup(groupId: string): Promise<void> {
    await firstValueFrom(
      this.http.delete(`${this.apiUrl}/${groupId}`, {
        withCredentials: true,
      })
    );

    await this.loadGroups();
  }
  getGroupById(groupId: string): Group | undefined {
    return this.groupsSubject.value.find((g) => g._id === groupId);
  }
}
