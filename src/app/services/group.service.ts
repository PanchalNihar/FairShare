import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class GroupService {
  private groups: any[] = [];

  constructor() {
    this.loadGroups();
  }

  // Load groups from localStorage
  private loadGroups() {
    const storedGroup = localStorage.getItem('groups');
    this.groups = storedGroup ? JSON.parse(storedGroup) : [];
  }

  // Save groups to localStorage
  private saveGroups() {
    localStorage.setItem('groups', JSON.stringify(this.groups));
  }

  // Get all groups
  getGroups(): any[] {
    return this.groups;
  }
  getGroupMember(groupName: string):string[] {
    const group = this.groups.find((g) => g.name === groupName);
    return group? group.members : [] ;
  }
  // Add a new group
  addGroup(groupName: string, members: string[]): void {
    const newGroup = {
      name: groupName,
      members,
    };
    this.groups.push(newGroup);
    this.saveGroups();
  }

  // Edit an existing group
  editGroup(
    selectedGroup: any,
    updatedName: string,
    updatedMembers: string[]
  ): void {
    selectedGroup.name = updatedName;
    selectedGroup.members = updatedMembers;
    this.saveGroups();
  }

  // Remove a group
  removeGroup(group: any): void {
    this.groups = this.groups.filter((g) => g !== group);
    this.saveGroups();
  }

  // Add a new member to a group
  addMember(selectedGroup: any, newMember: string): void {
    if (newMember) {
      selectedGroup.members.push(newMember);
      this.saveGroups();
    }
  }

  // Remove a member from a group
  removeMember(selectedGroup: any, member: string): void {
    selectedGroup.members = selectedGroup.members.filter(
      (m: any) => m !== member
    );
    this.saveGroups();
  }
}
