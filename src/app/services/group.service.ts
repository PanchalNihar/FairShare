import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, updateDoc, deleteDoc, getDocs, doc, query, where } from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from './auth.service'; // Import the AuthService to get the current user's ID

interface Group {
  id: string;
  name: string;
  members: string[];
  createdBy: string; // Added property to store the user who created the group
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

  private async loadGroups() {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.groups = [];
      this.groupsSubject.next(this.groups);
      return;
    }

    const groupsRef = collection(this.firestore, 'groups');
    const groupsQuery = query(groupsRef, where('createdBy', '==', currentUser.uid));
    const querySnapshot = await getDocs(groupsQuery);
    this.groups = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Group));
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

    const groupData = {
      name: groupName,
      members,
      createdBy: currentUser.uid, // Associate the group with the current user's ID
    };

    const docRef = await addDoc(collection(this.firestore, 'groups'), groupData);
    const newGroup: Group = {
      id: docRef.id,
      ...groupData,
    };

    this.groups.push(newGroup);
    this.groupsSubject.next(this.groups);
  }

  async editGroup(selectedGroup: Group, updatedName: string, updatedMembers: string[]): Promise<void> {
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
        group.id === selectedGroup.id ? { ...group, members: updatedMembers } : group
      );
      this.groupsSubject.next(this.groups);
    }
  }

  async removeMember(selectedGroup: Group, member: string): Promise<void> {
    const updatedMembers = selectedGroup.members.filter((m) => m !== member);
    const groupRef = doc(this.firestore, 'groups', selectedGroup.id);
    await updateDoc(groupRef, { members: updatedMembers });

    this.groups = this.groups.map((group) =>
      group.id === selectedGroup.id ? { ...group, members: updatedMembers } : group
    );
    this.groupsSubject.next(this.groups);
  }
}
