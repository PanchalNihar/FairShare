import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-groups',
  imports: [CommonModule, FormsModule],
  templateUrl: './groups.component.html',
  styleUrls: ['./groups.component.css'],
})
export class GroupsComponent implements OnInit {
  groups: any[] = [];
  selectedGroup: any = null;
  groupName: string = '';
  newMember: string = ''; // New member name to be added
  members: any[] = [];

  constructor() {}

  ngOnInit(): void {
    this.loadGroups();
  }

  loadGroups() {
    const storedGroup = localStorage.getItem('group');
    if (storedGroup) {
      this.groups = JSON.parse(storedGroup);
    }
  }

  addGroup() {
    if (this.groups && this.members.length > 0 && this.groupName) {
      const newGroup = {
        name: this.groupName,
        members: this.members,
      };
      this.groups.push(newGroup);
      localStorage.setItem('group', JSON.stringify(this.groups));
      this.clearGroupForm();
    }
  }

  selectGroup(group: any) {
    this.selectedGroup = group;
    this.groupName = group.name;
    this.members = group.members;
  }

  editGroup() {
    if (this.selectedGroup) {
      this.selectedGroup.name = this.groupName;
      this.selectedGroup.members = this.members;
      localStorage.setItem('group', JSON.stringify(this.groups));
      this.clearGroupForm();
    }
  }

  clearGroupForm() {
    this.groupName = '';
    this.members = [];
    this.selectedGroup = null;
  }

  removeGroup(group: any): void {
    this.groups = this.groups.filter((g) => g !== group);
    localStorage.setItem('group', JSON.stringify(this.groups));
    this.clearGroupForm();
  }

  addMember() {
    if (this.newMember) {
      this.members.push(this.newMember);
      this.newMember = ''; // Clear the input field after adding the member
    }
  }
  deleteMember(member: string) {
    if (this.selectedGroup) {
      this.selectedGroup.members = this.selectedGroup.members.filter(
        (m: string) => m !== member
      );
      localStorage.setItem('group', JSON.stringify(this.groups));
    }
  }
}
