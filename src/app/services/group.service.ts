import { Injectable, OnDestroy } from '@angular/core';
import {
  Firestore,
  collection,
  CollectionReference,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  collectionData,
} from '@angular/fire/firestore';
import { BehaviorSubject, Observable, Subscription, of, switchMap } from 'rxjs';
import { Auth, authState, User } from '@angular/fire/auth';
import QRCode from 'qrcode';

interface Group {
  id: string;
  name: string;
  members: string[];
  createdBy: string;
  sharingCode: string;
}

@Injectable({
  providedIn: 'root',
})
export class GroupService implements OnDestroy {
  private groups: Group[] = [];
  private groupsSubject = new BehaviorSubject<Group[]>([]);
  groups$ = this.groupsSubject.asObservable();

  private currentUser: User | null = null;
  private authSubscription: Subscription;

  constructor(
    private firestore: Firestore,
    private auth: Auth,
  ) {
    // Wait for auth to restore before querying Firestore.
    // authState() emits null while restoring, then the user (or null if signed out).
    // switchMap cancels previous Firestore subscription when auth state changes,
    // preventing stale listeners and memory leaks.
    this.authSubscription = authState(this.auth)
      .pipe(
        switchMap((user: User | null): Observable<Group[]> => {
          this.currentUser = user;
          if (!user) {
            // Not logged in — clear local state and emit empty array
            this.groups = [];
            this.groupsSubject.next([]);
            return of<Group[]>([]);
          }

          // User is authenticated — set up a real-time listener on their groups.
          // collectionData with idField automatically maps the doc.id into each object.
          const groupsRef = collection(
            this.firestore,
            'groups',
          ) as CollectionReference<Group>;
          const groupsQuery = query(
            groupsRef,
            where('createdBy', '==', user.uid),
          );
          return collectionData<Group>(groupsQuery, { idField: 'id' });
        }),
      )
      .subscribe((groups: Group[]) => {
        this.groups = groups;
        this.groupsSubject.next(this.groups);
      });
  }

  ngOnDestroy(): void {
    this.authSubscription.unsubscribe();
  }

  // ─── Private Helpers ────────────────────────────────────────────────────────

  private generateSharingCode(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  private async generateQrCode(sharingCode: string): Promise<string> {
    try {
      const url = `${window.location.origin}/joingroup?code=${sharingCode}`;
      return await QRCode.toDataURL(url);
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw error;
    }
  }

  // ─── Public Getters ──────────────────────────────────────────────────────────

  getGroups(): Group[] {
    return this.groups;
  }

  getGroupForTracking(): string[] {
    return this.groups.map((group) => group.name);
  }

  getGroupMember(groupName: string): string[] {
    const group = this.groups.find((g) => g.name === groupName);
    return group ? group.members : [];
  }

  // ─── CRUD Operations ─────────────────────────────────────────────────────────

  async addGroup(groupName: string, members: string[]): Promise<void> {
    if (!this.currentUser) {
      throw new Error('No user is logged in');
    }

    const sharingCode = this.generateSharingCode();
    const groupData = {
      name: groupName,
      members,
      createdBy: this.currentUser.uid, // consistent field name used in the query above
      sharingCode,
    };

    await addDoc(collection(this.firestore, 'groups'), groupData);
    // No need to manually push — the real-time collectionData listener updates groups$ automatically
  }

  async editGroup(
    selectedGroup: Group,
    updatedName: string,
    updatedMembers: string[],
  ): Promise<void> {
    const groupRef = doc(this.firestore, 'groups', selectedGroup.id);
    await updateDoc(groupRef, {
      name: updatedName,
      members: updatedMembers,
    });
    // Real-time listener handles local state update automatically
  }

  async removeGroup(group: Group): Promise<void> {
    const groupRef = doc(this.firestore, 'groups', group.id);
    await deleteDoc(groupRef);
    // Real-time listener handles local state update automatically
  }

  async addMember(selectedGroup: Group, newMember: string): Promise<void> {
    if (newMember && selectedGroup.id) {
      const updatedMembers = [...selectedGroup.members, newMember];
      const groupRef = doc(this.firestore, 'groups', selectedGroup.id);
      await updateDoc(groupRef, { members: updatedMembers });
    }
  }

  async removeMember(selectedGroup: Group, member: string): Promise<void> {
    const updatedMembers = selectedGroup.members.filter((m) => m !== member);
    const groupRef = doc(this.firestore, 'groups', selectedGroup.id);
    await updateDoc(groupRef, { members: updatedMembers });
  }

  async joinGroup(sharingCode: string): Promise<void> {
    if (!this.currentUser) {
      throw new Error('No user is logged in');
    }

    // Find group by sharingCode using a one-time read
    const { getDocs } = await import('@angular/fire/firestore');
    const groupRef = collection(this.firestore, 'groups');
    const groupQuery = query(groupRef, where('sharingCode', '==', sharingCode));
    const querySnapshot = await getDocs(groupQuery);

    if (querySnapshot.empty) {
      throw new Error('Invalid sharing code. Group not found.');
    }

    const groupDoc = querySnapshot.docs[0];
    const group = { id: groupDoc.id, ...groupDoc.data() } as Group;

    if (group.members.includes(this.currentUser.uid)) {
      throw new Error('You are already a member of this group.');
    }

    const updatedMembers = [...group.members, this.currentUser.uid];
    await updateDoc(doc(this.firestore, 'groups', group.id), {
      members: updatedMembers,
    });

    console.log(`Successfully joined the group: ${group.name}`);
  }

  async getGroupQRCode(groupId: string): Promise<string> {
    const group = this.groups.find((g) => g.id === groupId);
    if (!group) {
      throw new Error('Group not found');
    }
    return this.generateQrCode(group.sharingCode);
  }
}
