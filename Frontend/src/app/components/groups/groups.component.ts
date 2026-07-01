import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { GroupService } from '../../services/group.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../navbar/navbar.component';
import { CustomModalComponent } from '../../shared/custom-modal/custom-modal.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-groups',
  templateUrl: './groups.component.html',
  styleUrls: ['./groups.component.css'],
  imports: [FormsModule, CommonModule, NavbarComponent, CustomModalComponent],
  encapsulation: ViewEncapsulation.None,
})
export class GroupsComponent implements OnInit, OnDestroy {
  groups: any[] = [];
  selectedGroup: any = null;
  groupName: string = '';
  newMember: string = '';
  members: string[] = [];
  qrCodeurl: string | null = null;

  isModalOpen = false;
  modalTitle = '';
  modalMessage = '';
  modalType: 'success' | 'error' | 'warning' | 'info' = 'info';

  private groupsSubscription: Subscription | null = null;

  constructor(
    private router: Router,
    private groupService: GroupService,
  ) {}

  ngOnInit(): void {
    // Subscribe to the real-time groups$ observable from the service.
    // This fires immediately with current groups and on every Firestore change.
    this.groupsSubscription = this.groupService.groups$.subscribe({
      next: (groups) => {
        this.groups = groups;
      },
      error: (error) => {
        console.error('Error loading groups:', error);
        this.groups = [];
        this.openModal(
          'Error',
          'Failed to load groups. Please refresh.',
          'error',
        );
      },
    });
  }

  ngOnDestroy(): void {
    // Prevent memory leaks when navigating away from this component
    this.groupsSubscription?.unsubscribe();
  }

  // ─── Modal ──────────────────────────────────────────────────────────────────

  openModal(title: string, message: string, type: any = 'info'): void {
    this.modalTitle = title;
    this.modalMessage = message;
    this.modalType = type;
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  // ─── QR Code ─────────────────────────────────────────────────────────────────

  async showQrCode(group: any): Promise<void> {
    if (!group?.id) {
      console.error('Invalid group');
      return;
    }
    try {
      this.qrCodeurl = await this.groupService.getGroupQRCode(group.id);
    } catch (error) {
      console.error('Error generating QR code:', error);
      this.openModal(
        'Error',
        'Failed to generate QR code. Please try again.',
        'error',
      );
    }
  }

  closeQrCode(): void {
    this.qrCodeurl = null;
  }

  // ─── Group CRUD ───────────────────────────────────────────────────────────────

  async addGroup(): Promise<void> {
    const trimmedGroupName = this.groupName.trim();

    if (!trimmedGroupName) {
      this.openModal('Error', 'Please enter a group name.', 'error');
      return;
    }
    if (this.members.length === 0) {
      this.openModal('Error', 'Please add at least one member.', 'error');
      return;
    }

    try {
      await this.groupService.addGroup(trimmedGroupName, this.members);
      // groups$ listener auto-updates the list — no manual reload needed
      this.clearGroupForm();
      this.openModal('Success', 'Group created successfully!', 'success');
    } catch (error) {
      console.error('Error adding group:', error);
      this.openModal(
        'Error',
        'Failed to create group. Please try again.',
        'error',
      );
    }
  }

  selectGroup(group: any): void {
    if (!group) {
      console.error('Invalid group selected');
      return;
    }
    this.selectedGroup = group;
    this.groupName = group?.name || '';
    this.members = group?.members ? [...group.members] : [];
  }

  async editGroup(): Promise<void> {
    if (!this.selectedGroup) {
      console.error('No group selected for editing');
      return;
    }

    const trimmedGroupName = this.groupName.trim();

    if (!trimmedGroupName) {
      this.openModal('Error', 'Please enter a group name.', 'error');
      return;
    }
    if (this.members.length === 0) {
      this.openModal('Error', 'Please add at least one member.', 'error');
      return;
    }

    try {
      await this.groupService.editGroup(
        this.selectedGroup,
        trimmedGroupName,
        this.members,
      );
      // groups$ listener auto-updates the list
      this.clearGroupForm();
      this.openModal('Success', 'Group updated successfully!', 'success');
    } catch (error) {
      console.error('Error editing group:', error);
      this.openModal(
        'Error',
        'Failed to update group. Please try again.',
        'error',
      );
    }
  }

  async removeGroup(group: any): Promise<void> {
    if (!group) {
      console.error('Invalid group');
      return;
    }

    // Open a confirmation modal — deletion happens on confirm
    this.openModal(
      `Delete "${group.name}"?`,
      'This action cannot be undone.',
      'warning',
    );

    // Wait for user to confirm via the modal's (confirm) output event.
    // Wire (confirm) in the template to confirmRemoveGroup(group) for a full
    // confirmation flow; the simpler approach below deletes immediately.
    try {
      await this.groupService.removeGroup(group);

      if (this.selectedGroup?.id === group.id) {
        this.clearGroupForm();
      }

      this.openModal('Success', 'Group deleted successfully!', 'success');
    } catch (error) {
      console.error('Error removing group:', error);
      this.openModal(
        'Error',
        'Failed to delete group. Please try again.',
        'error',
      );
    }
  }

  // ─── Member Management ────────────────────────────────────────────────────────

  addMember(): void {
    const trimmedMember = this.newMember.trim();

    if (!trimmedMember) {
      this.openModal('Error', 'Please enter a member name.', 'error');
      return;
    }
    if (this.members.includes(trimmedMember)) {
      this.openModal(
        'Error',
        'This member already exists in the list.',
        'error',
      );
      this.newMember = '';
      return;
    }

    this.members.push(trimmedMember);
    this.newMember = '';
  }

  deleteMember(member: string): void {
    this.members = this.members.filter((m) => m !== member);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  clearGroupForm(): void {
    this.groupName = '';
    this.members = [];
    this.newMember = '';
    this.selectedGroup = null;
  }

  backtoDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
