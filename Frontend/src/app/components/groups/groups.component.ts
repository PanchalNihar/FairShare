import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { GroupService } from '../../services/group.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../navbar/navbar.component';
import { CustomModalComponent } from '../../shared/custom-modal/custom-modal.component';
import { Subscription } from 'rxjs';
import { UserSearch } from '../../services/group.service';
import { AuthService } from '../../services/auth.service';
@Component({
  selector: 'app-groups',
  templateUrl: './groups.component.html',
  styleUrls: ['./groups.component.css'],
  imports: [FormsModule, CommonModule, NavbarComponent, CustomModalComponent],
  encapsulation: ViewEncapsulation.None,
})
export class GroupsComponent implements OnInit, OnDestroy {
  groups: any[] = [];
  groupName = '';
  groupDescription = '';
  qrCodeurl: string | null = null;
  isModalOpen = false;
  modalTitle = '';
  modalMessage = '';
  modalType: 'success' | 'error' | 'warning' | 'info' = 'info';

  newMember = '';
  searchResults: UserSearch[] = [];
  selectedMembers: UserSearch[] = [];
  selectedGroupForManage: any = null;
  currentUser: any = null;

  private groupsSubscription?: Subscription;
  private authSubscription?: Subscription;

  constructor(
    private router: Router,
    private groupService: GroupService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.groupsSubscription = this.groupService.groups$.subscribe({
      next: (groups) => {
        this.groups = groups;
        if (this.selectedGroupForManage) {
          const updated = groups.find((g) => g._id === this.selectedGroupForManage._id);
          if (updated) {
            this.selectedGroupForManage = updated;
          }
        }
      },
      error: (err) => {
        console.error(err);

        this.openModal('Error', 'Unable to load groups.', 'error');
      },
    });

    this.authSubscription = this.authService.currentUser$.subscribe({
      next: (user) => {
        this.currentUser = user;
      },
    });
  }

  ngOnDestroy(): void {
    this.groupsSubscription?.unsubscribe();
    this.authSubscription?.unsubscribe();
  }

  openModal(
    title: string,
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'info',
  ) {
    this.modalTitle = title;
    this.modalMessage = message;
    this.modalType = type;
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  async addGroup() {
    if (!this.groupName.trim()) {
      return;
    }

    try {
      const membersPayload = this.selectedMembers.map((m) => {
        if (m._id) {
          return m._id;
        }
        return {
          username: m.username,
          email: m.email,
          isNew: true
        };
      });

      await this.groupService.addGroup(
        this.groupName,
        this.groupDescription,
        membersPayload,
      );

      this.groupName = '';
      this.groupDescription = '';
      this.newMember = '';
      this.selectedMembers = [];
      this.searchResults = [];

      this.openModal('Success', 'Group created successfully.', 'success');
    } catch {
      this.openModal('Error', 'Unable to create group.', 'error');
    }
  }

  async showQrCode(group: any) {
    try {
      this.qrCodeurl = await this.groupService.getGroupQRCode(group._id);
    } catch (error) {
      console.error(error);

      this.openModal('Error', 'Unable to generate QR Code.', 'error');
    }
  }

  closeQrCode() {
    this.qrCodeurl = null;
  }

  async copyInviteCode(inviteCode: string) {
    try {
      await navigator.clipboard.writeText(inviteCode);

      this.openModal('Copied', 'Invite code copied to clipboard.', 'success');
    } catch {
      this.openModal('Error', 'Unable to copy invite code.', 'error');
    }
  }

  async searchUser() {
    if (!this.newMember.trim()) {
      this.searchResults = [];
      return;
    }

    const results = await this.groupService.searchUsers(this.newMember);
    const input = this.newMember.trim();
    let customUser: UserSearch;

    if (input.includes('@')) {
      const parts = input.split('@');
      customUser = {
        username: parts[0],
        email: input,
        isNew: true
      };
    } else {
      const emailPrefix = input.toLowerCase().replace(/[^a-z0-9]/g, '');
      customUser = {
        username: input,
        email: `${emailPrefix}_temp@fairshare.fake`,
        isNew: true
      };
    }

    // Filter out duplicates from API results that might match email/username
    const filteredResults = results.filter(
      (r) => r.email.toLowerCase() !== customUser.email.toLowerCase()
    );

    this.searchResults = [customUser, ...filteredResults];
  }

  selectUser(user: UserSearch) {
    if (
      this.selectedMembers.find((m) => {
        if (user._id && m._id) {
          return m._id === user._id;
        }
        return m.email.toLowerCase() === user.email.toLowerCase();
      })
    ) {
      return;
    }

    this.selectedMembers.push(user);

    this.newMember = '';

    this.searchResults = [];
  }

  removeSelectedUser(user: UserSearch) {
    this.selectedMembers = this.selectedMembers.filter((m) => {
      if (user._id && m._id) {
        return m._id !== user._id;
      }
      return m.email.toLowerCase() !== user.email.toLowerCase();
    });
  }

  manageGroup(group: any) {
    this.selectedGroupForManage = group;
  }

  async addMemberToGroup(user: UserSearch) {
    const memberParam = user._id ? user._id : { username: user.username, email: user.email, isNew: true };
    await this.groupService.addMember(
      this.selectedGroupForManage._id,
      memberParam,
    );

    this.newMember = '';

    this.searchResults = [];
  }

  async removeMember(group: any, member: any) {
    await this.groupService.removeMember(group._id, member.user._id);
  }

  async removeGroup(group: any) {
    if (!confirm(`Are you sure you want to delete "${group.name}"? This will also delete all associated expenses.`)) {
      return;
    }

    try {
      await this.groupService.deleteGroup(group._id);
      this.openModal('Success', 'Group deleted successfully.', 'success');
    } catch {
      this.openModal('Error', 'Unable to delete group.', 'error');
    }
  }

  isOwner(group: any): boolean {
    if (!this.currentUser || !group.members) {
      return false;
    }
    const member = group.members.find((m: any) => {
      const memberId = m.user?._id || m.user?.id || m.user;
      const currentId = this.currentUser._id || this.currentUser.id;
      return memberId && currentId && memberId.toString() === currentId.toString();
    });
    return member?.role === 'owner';
  }

  backtoDashboard() {
    this.router.navigate(['/dashboard']);
  }
}
