import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GroupService } from '../../services/group.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from "../navbar/navbar.component";

@Component({
  selector: 'app-groups',
  templateUrl: './groups.component.html',
  styleUrls: ['./groups.component.css'],
  imports: [CommonModule, FormsModule, NavbarComponent],
})
export class GroupsComponent implements OnInit {
  groups: any[] = [];
  selectedGroup: any = null;
  groupName: string = '';
  newMember: string = '';
  members: string[] = [];

  constructor(private router: Router, private groupService: GroupService) {}

  ngOnInit(): void {
    this.groups = this.groupService.getGroups();
    console.log('Loaded groups:', this.groups);
  }

  addGroup() {
    if (this.groupName && this.members.length > 0) {
      console.log('Adding group:', this.groupName, this.members);
      this.groupService.addGroup(this.groupName, this.members);
      this.groups = this.groupService.getGroups();
      this.clearGroupForm();
    } else {
      console.error('Group name or members missing.');
    }
  }

  selectGroup(group: any) {
    this.selectedGroup = group;
    this.groupName = group.name;
    this.members = [...group.members]; // Use spread operator to avoid reference issues
  }

  editGroup() {
    if (this.selectedGroup) {
      this.groupService.editGroup(this.selectedGroup, this.groupName, this.members);
      this.groups = this.groupService.getGroups();
      this.clearGroupForm();
    }
  }

  removeGroup(group: any) {
    this.groupService.removeGroup(group);
    this.groups = this.groupService.getGroups();
    this.clearGroupForm();
  }

  addMember() {
    if (this.newMember.trim()) {
      this.members.push(this.newMember.trim());
      this.newMember = ''; // Clear the input field
    } else {
      console.error('Member name is empty.');
    }
  }

  deleteMember(member: string) {
    this.members = this.members.filter((m) => m !== member);
  }

  clearGroupForm() {
    this.groupName = '';
    this.members = [];
    this.selectedGroup = null;
  }

  backtoDashboard() {
    this.router.navigate(['/dashboard']);
  }
}
