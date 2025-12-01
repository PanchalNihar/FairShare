import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { GroupService } from '../../services/group.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-groups',
  templateUrl: './groups.component.html',
  styleUrls: ['./groups.component.css'],
  imports: [FormsModule, CommonModule, NavbarComponent],
  encapsulation: ViewEncapsulation.None,
})
export class GroupsComponent implements OnInit {
  groups: any[] = [];
  selectedGroup: any = null;
  groupName: string = '';
  newMember: string = '';
  members: string[] = [];
  qrCodeurl: string | null = null;

  constructor(private router: Router, private groupService: GroupService) {}

  ngOnInit(): void {
    this.loadGroups();
  }

  // Load groups with proper error handling
  loadGroups(): void {
    try {
      this.groups = this.groupService.getGroups() || [];
      console.log('Loaded groups:', this.groups);
    } catch (error) {
      console.error('Error loading groups:', error);
      this.groups = [];
    }
  }

  // Show QR code for group
  async showQrCode(group: any): Promise<void> {
    if (!group || !group.id) {
      console.error('Invalid group');
      return;
    }

    try {
      this.qrCodeurl = await this.groupService.getGroupQRCode(group.id);
    } catch (error) {
      console.error('Error generating QR code:', error);
      alert('Failed to generate QR code. Please try again.');
    }
  }

  // Close QR modal
  closeQrCode(): void {
    this.qrCodeurl = null;
  }

  // Add new group with validation
  addGroup(): void {
    // Trim and validate group name
    const trimmedGroupName = this.groupName.trim();

    if (!trimmedGroupName) {
      alert('Please enter a group name.');
      return;
    }

    if (this.members.length === 0) {
      alert('Please add at least one member.');
      return;
    }

    try {
      console.log('Adding group:', trimmedGroupName, this.members);
      this.groupService.addGroup(trimmedGroupName, this.members);
      this.loadGroups();
      this.clearGroupForm();
      alert('Group created successfully!');
    } catch (error) {
      console.error('Error adding group:', error);
      alert('Failed to create group. Please try again.');
    }
  }

  // Select group for editing
  selectGroup(group: any): void {
    if (!group) {
      console.error('Invalid group selected');
      return;
    }

    this.selectedGroup = group;
    this.groupName = group?.name || '';
    // Create a new array to avoid reference issues
    this.members = group?.members ? [...group.members] : [];
  }

  // Edit existing group with validation
  editGroup(): void {
    if (!this.selectedGroup) {
      console.error('No group selected for editing');
      return;
    }

    const trimmedGroupName = this.groupName.trim();

    if (!trimmedGroupName) {
      alert('Please enter a group name.');
      return;
    }

    if (this.members.length === 0) {
      alert('Please add at least one member.');
      return;
    }

    try {
      this.groupService.editGroup(
        this.selectedGroup,
        trimmedGroupName,
        this.members
      );
      this.loadGroups();
      this.clearGroupForm();
      alert('Group updated successfully!');
    } catch (error) {
      console.error('Error editing group:', error);
      alert('Failed to update group. Please try again.');
    }
  }

  // Remove group with confirmation
  removeGroup(group: any): void {
    if (!group) {
      console.error('Invalid group');
      return;
    }

    const confirmed = confirm(
      `Are you sure you want to delete "${group.name}"?`
    );
    if (!confirmed) {
      return;
    }

    try {
      this.groupService.removeGroup(group);
      this.loadGroups();

      // Clear form if the deleted group was selected
      if (this.selectedGroup && this.selectedGroup.id === group.id) {
        this.clearGroupForm();
      }

      alert('Group deleted successfully!');
    } catch (error) {
      console.error('Error removing group:', error);
      alert('Failed to delete group. Please try again.');
    }
  }

  // Add member with validation
  addMember(): void {
    const trimmedMember = this.newMember.trim();

    if (!trimmedMember) {
      alert('Please enter a member name.');
      return;
    }

    // Check for duplicate members
    if (this.members.includes(trimmedMember)) {
      alert('This member already exists in the list.');
      this.newMember = '';
      return;
    }

    this.members.push(trimmedMember);
    this.newMember = '';
  }

  // Delete member from list
  deleteMember(member: string): void {
    this.members = this.members.filter((m) => m !== member);
  }

  // Clear form and reset state
  clearGroupForm(): void {
    this.groupName = '';
    this.members = [];
    this.newMember = '';
    this.selectedGroup = null;
  }

  // Navigate back to dashboard
  backtoDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
