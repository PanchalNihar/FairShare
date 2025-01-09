import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GroupService } from '../../services/group.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-groups',
  templateUrl: './groups.component.html',
  styleUrls: ['./groups.component.css'],
  imports:[CommonModule,FormsModule]
})
export class GroupsComponent implements OnInit {
  groups: any[] = [];
  selectedGroup: any = null;
  groupName: string = '';
  newMember: string = '';
  members: string[] = [];

  constructor(private router: Router,private groupService:GroupService) {}

  ngOnInit(): void {
    this.groups = this.groupService.getGroups();
  }

  addGroup() {
    if (this.groupName && this.members.length > 0) {
      this.groupService.addGroup(this.groupName, this.members);
      this.groups = this.groupService.getGroups();
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
      this.groupService.editGroup(this.selectedGroup, this.groupName, this.members);
      this.clearGroupForm();
    }
  }

  removeGroup(group: any) {
    this.groupService.removeGroup(group);
    this.groups = this.groupService.getGroups();
    this.clearGroupForm();
  }

  addMember() {
    if (this.selectedGroup && this.newMember) {
      this.groupService.addMember(this.selectedGroup, this.newMember);
      this.newMember = ''; // Clear the input field
    }
  }

  deleteMember(member: string) {
    if (this.selectedGroup) {
      this.groupService.removeMember(this.selectedGroup, member);
    }
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
