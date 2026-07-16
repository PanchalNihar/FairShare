import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { Expense, ExpenseService } from '../../services/expense.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { GroupService } from '../../services/group.service';
import { NavbarComponent } from '../navbar/navbar.component';
import { combineLatest, Subscription } from 'rxjs';
import { CustomModalComponent } from '../../shared/custom-modal/custom-modal.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-expense-management',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NavbarComponent,
    CustomModalComponent,
  ],
  templateUrl: './expense-management.component.html',
  styleUrl: './expense-management.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class ExpenseManagementComponent implements OnInit, OnDestroy {
  expenseList: Expense[] = [];
  availableGroups: any[] = [];
  expenseAmount = 0;
  expenseDescription = '';
  // groupMembers: string[] = [];
  // selectedExpense: Expense | null = null;
  selectedGroup: string = '';
  totalExpense: number = 0;
  selectedGroupId = '';
  expenseCategory = 'Other';
  isRecurring: boolean = false;
  recurringFrequency: string = 'monthly';
  recurringList: any[] = [];
  activeListTab: 'expenses' | 'recurring' = 'expenses';
  isModalOpen = false;
  modalTitle = '';
  modalMessage = '';
  modalType: 'success' | 'error' | 'warning' | 'info' = 'info';

  isConfirmMode = false;
  expenseToDelete: Expense | null = null;

  selectedGroupMembers: any[] = [];
  selectedPayeeId: string = '';
  currentUser: any = null;
  isEditing: boolean = false;
  editingExpenseId: string = '';
  isScanning: boolean = false;
  quickAddInputText = '';
  isQuickAdding = false;
  expenseDate: string = new Date().toISOString().split('T')[0];
  splitType: string = 'equal';
  splitValues: { [memberId: string]: number } = {};
  splitChecked: { [memberId: string]: boolean } = {};
  expenseCurrency: string = 'INR';



  private expensesSub?: Subscription;
  private groupsSub?: Subscription;
  private authSub?: Subscription;

  constructor(
    private router: Router,
    private expenseService: ExpenseService,
    private groupService: GroupService,
    private authService: AuthService,
  ) {}

  openModal(title: string, message: string, type: any = 'info') {
    this.modalTitle = title;
    this.modalMessage = message;
    this.modalType = type;
    this.isConfirmMode = false;
    this.isModalOpen = true;
  }

  ngOnInit(): void {

  // Load groups from backend
  this.groupsSub = this.groupService.groups$.subscribe({

    next: (groups) => {

      this.availableGroups = groups;

      // If a group is already selected after refresh,
      // reload its expenses.
      if (this.selectedGroupId) {
        this.onGroupChange();
      }

    },

    error: (error) => {

      console.error(error);

      this.openModal(
        'Error',
        'Failed to load groups.',
        'error'
      );

    }

  });

  // Listen for expense updates
  this.expensesSub = this.expenseService.expenses$.subscribe({

    next: (expenses) => {

      this.expenseList = expenses;

      this.calculateTotalExpense();

    },

    error: (error) => {

      console.error(error);

      this.openModal(
        'Error',
        'Failed to load expenses.',
        'error'
      );

    }

  });

  this.authSub = this.authService.currentUser$.subscribe({
    next: (user) => {
      this.currentUser = user;
      this.defaultPayeeToCurrentUser();
    },
  });

}

  ngOnDestroy(): void {
    if (this.expensesSub) {
      this.expensesSub.unsubscribe();
    }
    if (this.groupsSub) {
      this.groupsSub.unsubscribe();
    }
    if (this.authSub) {
      this.authSub.unsubscribe();
    }
  }

  // Load available groups
  loadAvailableGroup(): void {
    this.groupsSub = this.groupService.groups$.subscribe(() => {
      this.availableGroups = this.groupService.getGroupForTracking();
    });
  }

  // Handle group change
 async onGroupChange() {

    if (!this.selectedGroupId) {

        this.expenseList = [];
        this.selectedGroupMembers = [];
        this.selectedPayeeId = '';
        this.recurringList = [];

        return;

    }

    const group = this.availableGroups.find((g) => g._id === this.selectedGroupId);
    if (group) {
      this.selectedGroupMembers = group.members || [];
      this.defaultPayeeToCurrentUser();
      this.initializeSplits();
      this.expenseCurrency = group.currency || 'INR';
    }

    await this.expenseService.loadExpenses(
        this.selectedGroupId
    );

    await this.loadRecurringRules();

}

  getMemberId(member: any): string {
    if (!member) return '';
    return member.user?._id || member.user?.id || member.user || member._id || '';
  }

  getMemberName(member: any): string {
    if (!member) return '';
    return member.user?.username || member.username || 'Unknown';
  }

  initializeSplits() {
    this.splitValues = {};
    this.splitChecked = {};
    const equalShare = this.expenseAmount > 0 && this.selectedGroupMembers.length > 0
      ? Number((this.expenseAmount / this.selectedGroupMembers.length).toFixed(2))
      : 0;
    
    this.selectedGroupMembers.forEach((member) => {
      const mId = this.getMemberId(member);
      this.splitChecked[mId] = true;
      if (this.splitType === 'shares') {
        this.splitValues[mId] = 1;
      } else if (this.splitType === 'percentage') {
        this.splitValues[mId] = this.selectedGroupMembers.length > 0 
          ? Number((100 / this.selectedGroupMembers.length).toFixed(2)) 
          : 0;
      } else if (this.splitType === 'exact') {
        this.splitValues[mId] = equalShare;
      } else {
        this.splitValues[mId] = 0;
      }
    });
  }

  onSplitTypeChange() {
    this.initializeSplits();
  }

  onAmountChange() {
    if (this.splitType === 'exact') {
      const equalShare = this.expenseAmount > 0 && this.selectedGroupMembers.length > 0
        ? Number((this.expenseAmount / this.selectedGroupMembers.length).toFixed(2))
        : 0;
      this.selectedGroupMembers.forEach((member) => {
        const mId = this.getMemberId(member);
        this.splitValues[mId] = equalShare;
      });
    }
  }

  getSplitsTotal(): number {
    let total = 0;
    this.selectedGroupMembers.forEach((member) => {
      const mId = this.getMemberId(member);
      if (this.splitChecked[mId]) {
        total += Number(this.splitValues[mId] || 0);
      }
    });
    return Number(total.toFixed(2));
  }

  getCheckedCount(): number {
    let count = 0;
    this.selectedGroupMembers.forEach((member) => {
      const mId = this.getMemberId(member);
      if (this.splitChecked[mId]) {
        count++;
      }
    });
    return count;
  }

  isSplitValid(): boolean {
    if (this.splitType === 'equal') {
      return this.getCheckedCount() > 0;
    }
    if (this.splitType === 'exact') {
      const totalSplits = this.getSplitsTotal();
      return Math.abs(totalSplits - this.expenseAmount) <= 0.05;
    }
    if (this.splitType === 'percentage') {
      const totalPct = this.getSplitsTotal();
      return Math.abs(totalPct - 100) <= 0.05;
    }
    if (this.splitType === 'shares') {
      const totalShares = this.getSplitsTotal();
      return totalShares > 0;
    }
    return true;
  }

  getSplitValidationMessage(): string {
    if (this.splitType === 'equal') {
      const count = this.getCheckedCount();
      if (count === 0) {
        return 'Please select at least one member to split the expense.';
      }
      const share = count > 0 ? (this.expenseAmount / count).toFixed(2) : 0;
      return `Splitting equally among ${count} members (₹${share} each).`;
    }
    if (this.splitType === 'exact') {
      const totalSplits = this.getSplitsTotal();
      const diff = this.expenseAmount - totalSplits;
      if (Math.abs(diff) <= 0.05) {
        return 'Exact amounts match total expense amount!';
      }
      return diff > 0 
        ? `Remaining to assign: ₹${diff.toFixed(2)}` 
        : `Over-assigned by: ₹${Math.abs(diff).toFixed(2)}`;
    }
    if (this.splitType === 'percentage') {
      const totalPct = this.getSplitsTotal();
      const diff = 100 - totalPct;
      if (Math.abs(diff) <= 0.05) {
        return 'Percentages match 100%!';
      }
      return diff > 0 
        ? `Remaining percentage: ${diff.toFixed(1)}%` 
        : `Over-assigned percentage: ${Math.abs(diff).toFixed(1)}%`;
    }
    if (this.splitType === 'shares') {
      const totalShares = this.getSplitsTotal();
      if (totalShares <= 0) {
        return 'Total shares must be greater than zero.';
      }
      return `Total shares: ${totalShares}. Proportional split will be calculated automatically.`;
    }
    return '';
  }

  getMemberCount(): number {
    return this.selectedGroupMembers.length || 1;
  }

  getActiveMembersCountAt(expenseDateStr: string | Date): number {
    if (!this.selectedGroupMembers.length) return 1;
    const expenseDate = new Date(expenseDateStr);
    let count = 0;
    this.selectedGroupMembers.forEach((member) => {
      const joinedDate = new Date(member.joinedAt || member.user?.createdAt || Date.now());
      if (joinedDate <= expenseDate) {
        count++;
      }
    });
    return count || this.selectedGroupMembers.length || 1;
  }

  getSplitShare(amount: number, expenseDateStr: string | Date): number {
    const count = this.getActiveMembersCountAt(expenseDateStr);
    return Number((amount / count).toFixed(2));
  }

  isUserPayer(expense: Expense): boolean {
    if (!this.currentUser || !expense.paidBy) return false;
    const currentUserId = (this.currentUser._id || this.currentUser.id || '').toString();
    const payerId = (expense.paidBy._id || expense.paidBy || '').toString();
    return currentUserId && payerId && currentUserId === payerId;
  }

  getUserLentAmount(expense: Expense): number {
    const total = expense.amount;
    const share = this.getSplitShare(total, expense.expenseDate);
    return Number((total - share).toFixed(2));
  }

  defaultPayeeToCurrentUser() {
    if (!this.currentUser || !this.selectedGroupMembers.length) {
      this.selectedPayeeId = '';
      return;
    }
    const currentUserId = this.currentUser._id || this.currentUser.id;
    const found = this.selectedGroupMembers.find((m) => {
      const memberId = m.user?._id || m.user?.id || m.user;
      return memberId && currentUserId && memberId.toString() === currentUserId.toString();
    });
    if (found) {
      this.selectedPayeeId = (found.user?._id || found.user?.id || found.user).toString();
    } else if (this.selectedGroupMembers.length > 0) {
      const firstMember = this.selectedGroupMembers[0];
      this.selectedPayeeId = (firstMember.user?._id || firstMember.user?.id || firstMember.user).toString();
    }
  }

  // Handle Natural Language Quick Add
  async onQuickAdd(): Promise<void> {
    if (!this.quickAddInputText.trim()) {
      this.openModal('Error', 'Please enter some text description first.', 'error');
      return;
    }

    this.isQuickAdding = true;

    try {
      const memberNames = this.selectedGroupMembers.map(m => m.user?.username).filter(Boolean);
      
      const response = await this.expenseService.quickAddText(this.quickAddInputText, memberNames);

      if (response) {
        if (response.amount) {
          this.expenseAmount = response.amount;
        }
        if (response.description) {
          this.expenseDescription = response.description;
        }
        
        const allowedCategories = ['Food', 'Travel', 'Shopping', 'Entertainment', 'Other'];
        let matchedCategory = 'Other';
        if (response.category) {
          const capitalized = response.category.charAt(0).toUpperCase() + response.category.slice(1).toLowerCase();
          if (allowedCategories.includes(capitalized)) {
            matchedCategory = capitalized;
          }
        }
        this.expenseCategory = matchedCategory;

        if (response.payerName) {
          const matchedMember = this.selectedGroupMembers.find(m => 
            m.user?.username?.toLowerCase() === response.payerName.toLowerCase()
          );
          if (matchedMember) {
            this.selectedPayeeId = (matchedMember.user?._id || matchedMember.user?.id || matchedMember.user).toString();
          } else {
            this.defaultPayeeToCurrentUser();
          }
        } else {
          this.defaultPayeeToCurrentUser();
        }

        this.openModal('Success', 'Description parsed successfully! Form pre-filled.', 'success');
        this.quickAddInputText = '';
      }
    } catch (error: any) {
      console.error(error);
      this.openModal(
        'Quick Add Failed',
        error.error?.message || error.message || 'Could not parse the description. Please enter details manually.',
        'error'
      );
    } finally {
      this.isQuickAdding = false;
    }
  }

  // Handle receipt scan selection
  async onReceiptSelected(event: any): Promise<void> {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      this.openModal('Error', 'File size exceeds the 5MB limit.', 'error');
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.openModal('Error', 'Please upload an image file.', 'error');
      return;
    }

    this.isScanning = true;

    try {
      const base64Image = await this.fileToBase64(file);
      const mimeType = file.type;

      const response = await this.expenseService.scanReceipt(base64Image, mimeType);

      if (response) {
        if (response.amount) {
          this.expenseAmount = response.amount;
        }
        if (response.merchant) {
          this.expenseDescription = response.merchant;
        }

        const allowedCategories = ['Food', 'Travel', 'Shopping', 'Entertainment', 'Other'];
        let matchedCategory = 'Other';
        if (response.category) {
          const capitalized = response.category.charAt(0).toUpperCase() + response.category.slice(1).toLowerCase();
          if (allowedCategories.includes(capitalized)) {
            matchedCategory = capitalized;
          }
        }
        this.expenseCategory = matchedCategory;

        this.openModal('Success', 'Receipt scanned successfully! Form pre-filled.', 'success');
      }
    } catch (error: any) {
      console.error(error);
      this.openModal(
        'Scan Failed',
        error.error?.message || error.message || 'Could not parse the receipt. Please try another photo or enter details manually.',
        'error'
      );
    } finally {
      this.isScanning = false;
      event.target.value = '';
    }
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  }

  // Add new expense
  async addExpense() {

    if (!this.selectedGroupId) {

        this.openModal(
            'Error',
            'Please select a group.',
            'error'
        );

        return;
    }

    if (this.expenseAmount <= 0) {

        this.openModal(
            'Error',
            'Enter a valid amount.',
            'error'
        );

        return;
    }

    if (!this.expenseDescription.trim()) {

        this.openModal(
            'Error',
            'Enter description.',
            'error'
        );

        return;
    }

    if (!this.isSplitValid()) {
        this.openModal(
            'Error',
            'Invalid splits: ' + this.getSplitValidationMessage(),
            'error'
        );
        return;
    }

    try {
        const splitsPayload: any[] = [];
        this.selectedGroupMembers.forEach((member) => {
          const mId = this.getMemberId(member);
          if (this.splitType === 'equal') {
            if (this.splitChecked[mId]) {
              splitsPayload.push({ memberId: mId, value: 1 });
            }
          } else {
            if (this.splitChecked[mId]) {
              splitsPayload.push({ memberId: mId, value: Number(this.splitValues[mId] || 0) });
            }
          }
        });

        if (this.isEditing) {
            await this.expenseService.updateExpense(
                this.editingExpenseId,
                this.selectedGroupId,
                this.expenseAmount,
                this.expenseDescription,
                this.expenseCategory,
                this.selectedPayeeId,
                this.expenseDate,
                this.splitType,
                splitsPayload,
                this.expenseCurrency
            );

            this.openModal(
                'Success',
                'Expense Updated.',
                'success'
            );
        } else {
            if (this.isRecurring) {
                await this.expenseService.addRecurringExpense(
                    this.selectedGroupId,
                    this.expenseAmount,
                    this.expenseDescription,
                    this.expenseCategory,
                    this.selectedPayeeId,
                    this.expenseDate,
                    this.recurringFrequency,
                    this.splitType,
                    splitsPayload,
                    this.expenseCurrency
                );

                this.openModal(
                    'Success',
                    'Recurring expense rule created successfully.',
                    'success'
                );
                await this.loadRecurringRules();
            } else {
                await this.expenseService.addExpense(
                    this.selectedGroupId,
                    this.expenseAmount,
                    this.expenseDescription,
                    this.expenseCategory,
                    this.selectedPayeeId || undefined,
                    this.expenseDate,
                    this.splitType,
                    splitsPayload,
                    this.expenseCurrency
                );

                this.openModal(
                    'Success',
                    'Expense Added.',
                    'success'
                );
            }
        }

        await this.expenseService.loadExpenses(
            this.selectedGroupId
        );

        this.clearForm();
        this.isEditing = false;
        this.editingExpenseId = '';

    }
    catch(error){

        console.error(error);

    }

}

  editExpense(expense: Expense) {
    this.isEditing = true;
    this.editingExpenseId = expense._id;
    this.expenseCurrency = expense.currency || 'INR';
    this.expenseAmount = expense.originalAmount || expense.amount;
    this.expenseDescription = expense.description;
    this.expenseCategory = expense.category;
    this.selectedPayeeId = expense.paidBy._id || (expense.paidBy as any);
    this.expenseDate = new Date(expense.expenseDate || expense.createdAt || new Date().toISOString()).toISOString().split('T')[0];
    
    // Load custom splits if they exist
    this.splitType = expense.splitType || 'equal';
    this.initializeSplits();
    
    if (expense.splits && expense.splits.length > 0) {
      // First uncheck everyone, then populate from loaded splits
      this.selectedGroupMembers.forEach((member) => {
        this.splitChecked[this.getMemberId(member)] = false;
      });
      expense.splits.forEach((split) => {
        const mId = split.memberId;
        this.splitChecked[mId] = true;
        this.splitValues[mId] = split.originalValue || split.value;
      });
    }
  }

  cancelEdit() {
    this.clearForm();
    this.isEditing = false;
    this.editingExpenseId = '';
  }

  deleteExpense(expense: Expense) {
    this.expenseToDelete = expense;
    this.modalTitle = 'Confirm Delete';
    this.modalMessage = `Are you sure you want to delete the expense "${expense.description}"?`;
    this.modalType = 'warning';
    this.isConfirmMode = true;
    this.isModalOpen = true;
  }

  async executeDeleteExpense(expense: Expense) {
    try {
      await this.expenseService.deleteExpense(expense._id, this.selectedGroupId);
      this.openModal('Success', 'Expense deleted successfully.', 'success');
    } catch (error) {
      console.error(error);
      this.openModal('Error', 'Unable to delete expense.', 'error');
    } finally {
      this.expenseToDelete = null;
    }
  }
  // Calculate total expense
  calculateTotalExpense(): void {
    this.totalExpense = this.expenseList.reduce(
      (total, expense) => total + Number(expense.amount),
      0,
    );
  }


  clearForm(){

    this.expenseAmount = 0;

    this.expenseDescription = '';

    this.expenseCategory = 'Other';

    this.expenseDate = new Date().toISOString().split('T')[0];

    this.defaultPayeeToCurrentUser();

    this.splitType = 'equal';
    this.initializeSplits();

    const group = this.availableGroups.find((g) => g._id === this.selectedGroupId);
    this.expenseCurrency = group ? (group.currency || 'INR') : 'INR';
    this.isRecurring = false;
    this.recurringFrequency = 'monthly';

}
  closeModal() {
    this.isModalOpen = false;
    this.isConfirmMode = false;
    this.expenseToDelete = null;
  }
  onModalConfirm() {
    this.closeModal();
    if (this.isConfirmMode && this.expenseToDelete) {
      this.executeDeleteExpense(this.expenseToDelete);
    }
  }
  getGroupCurrency(): string {
    const group = this.availableGroups.find((g) => g._id === this.selectedGroupId);
    return group ? (group.currency || 'INR') : 'INR';
  }

  // Recurring scheduler client actions
  async loadRecurringRules() {
    if (!this.selectedGroupId) return;
    try {
      this.recurringList = await this.expenseService.loadRecurringExpenses(this.selectedGroupId);
    } catch (error) {
      console.error('Failed to load recurring rules:', error);
    }
  }

  async toggleRecurringStatus(rule: any) {
    try {
      const nextActive = !rule.isActive;
      await this.expenseService.toggleRecurringExpenseStatus(rule._id, nextActive);
      this.openModal(
        'Success',
        `Recurring rule ${nextActive ? 'activated' : 'paused'} successfully.`,
        'success'
      );
      await this.loadRecurringRules();
    } catch (error) {
      console.error(error);
      this.openModal('Error', 'Unable to toggle recurring rule status.', 'error');
    }
  }

  async deleteRecurringRule(rule: any) {
    if (confirm(`Are you sure you want to delete the recurring rule "${rule.description}"?`)) {
      try {
        await this.expenseService.deleteRecurringExpense(rule._id);
        this.openModal('Success', 'Recurring rule deleted successfully.', 'success');
        await this.loadRecurringRules();
      } catch (error) {
        console.error(error);
        this.openModal('Error', 'Unable to delete recurring rule.', 'error');
      }
    }
  }

  // Navigate back to dashboard
  backtoDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
