import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  doc,
  query,
  where,
} from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from './auth.service'; // Import the AuthService to get the current user's ID
import QRCode from 'qrcode';

interface Group {
  id: string;
  name: string;
  members: string[];
  createdBy: string; // Added property to store the user who created the group
  sharingCode: string;
}

@Injectable({
  providedIn: 'root',
})
export class GroupService {
  private groups: Group[] = [];
  private groupsSubject = new BehaviorSubject<Group[]>([]);
  groups$ = this.groupsSubject.asObservable();

  constructor(private firestore: Firestore, private authService: AuthService) {
    this.loadGroups();
  }

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
      console.error('Error Generating QR', error);
      throw error;
    }
  }

  private async loadGroups() {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.groups = [];
      this.groupsSubject.next(this.groups);
      return;
    }

    const groupsRef = collection(this.firestore, 'groups');
    const groupsQuery = query(
      groupsRef,
      where('createdBy', '==', currentUser.uid)
    );
    const querySnapshot = await getDocs(groupsQuery);
    this.groups = querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as Group)
    );
    this.groupsSubject.next(this.groups);
  }

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

  async addGroup(groupName: string, members: string[]): Promise<void> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('No user is logged in');
    }
    const sharingCode = this.generateSharingCode();
    const groupData = {
      name: groupName,
      members,
      createdBy: currentUser.uid, // Associate the group with the current user's ID
      sharingCode,
    };

    const docRef = await addDoc(
      collection(this.firestore, 'groups'),
      groupData
    );
    const newGroup: Group = {
      id: docRef.id,
      ...groupData,
    };

    this.groups.push(newGroup);
    this.groupsSubject.next(this.groups);
  }

  async editGroup(
    selectedGroup: Group,
    updatedName: string,
    updatedMembers: string[]
  ): Promise<void> {
    const groupRef = doc(this.firestore, 'groups', selectedGroup.id);
    const updateData = {
      name: updatedName,
      members: updatedMembers,
    };

    await updateDoc(groupRef, updateData);

    this.groups = this.groups.map((group) =>
      group.id === selectedGroup.id ? { ...group, ...updateData } : group
    );
    this.groupsSubject.next(this.groups);
  }

  async removeGroup(group: Group): Promise<void> {
    const groupRef = doc(this.firestore, 'groups', group.id);
    await deleteDoc(groupRef);

    this.groups = this.groups.filter((g) => g.id !== group.id);
    this.groupsSubject.next(this.groups);
  }

  async addMember(selectedGroup: Group, newMember: string): Promise<void> {
    if (newMember && selectedGroup.id) {
      const updatedMembers = [...selectedGroup.members, newMember];
      const groupRef = doc(this.firestore, 'groups', selectedGroup.id);
      await updateDoc(groupRef, { members: updatedMembers });

      this.groups = this.groups.map((group) =>
        group.id === selectedGroup.id
          ? { ...group, members: updatedMembers }
          : group
      );
      this.groupsSubject.next(this.groups);
    }
  }

  async removeMember(selectedGroup: Group, member: string): Promise<void> {
    const updatedMembers = selectedGroup.members.filter((m) => m !== member);
    const groupRef = doc(this.firestore, 'groups', selectedGroup.id);
    await updateDoc(groupRef, { members: updatedMembers });

    this.groups = this.groups.map((group) =>
      group.id === selectedGroup.id
        ? { ...group, members: updatedMembers }
        : group
    );
    this.groupsSubject.next(this.groups);
  }

  // Updated method to join a group using the sharingCode query parameter
  async joinGroup(sharingCode: string): Promise<void> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('No user is logged in');
    }

    // Search for the group with the matching sharing code in Firestore
    const groupRef = collection(this.firestore, 'groups');
    const groupQuery = query(groupRef, where('sharingCode', '==', sharingCode));
    const querySnapshot = await getDocs(groupQuery);

    if (querySnapshot.empty) {
      throw new Error('Invalid sharing code. Group not found.');
    }

    const groupDoc = querySnapshot.docs[0];
    const group = { id: groupDoc.id, ...groupDoc.data() } as Group;

    if (group.members.includes(currentUser.uid)) {
      throw new Error('You are already a member of this group.');
    }

    // Add the current user to the group's members
    const updatedMembers = [...group.members, currentUser.uid];

    // Update Firestore
    await updateDoc(doc(this.firestore, 'groups', group.id), {
      members: updatedMembers,
    });

    // Update local state
    const updatedGroup = { ...group, members: updatedMembers };
    this.groups.push(updatedGroup); // Add the group to the local groups array
    this.groupsSubject.next(this.groups);

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
