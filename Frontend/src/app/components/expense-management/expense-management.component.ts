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

        return;

    }

    const group = this.availableGroups.find((g) => g._id === this.selectedGroupId);
    if (group) {
      this.selectedGroupMembers = group.members || [];
      this.defaultPayeeToCurrentUser();
    }

    await this.expenseService.loadExpenses(
        this.selectedGroupId
    );

}

  getMemberCount(): number {
    return this.selectedGroupMembers.length || 1;
  }

  getSplitShare(amount: number): number {
    const count = this.getMemberCount();
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
    const share = this.getSplitShare(total);
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

    try {

        if (this.isEditing) {
            await this.expenseService.updateExpense(
                this.editingExpenseId,
                this.selectedGroupId,
                this.expenseAmount,
                this.expenseDescription,
                this.expenseCategory,
                this.selectedPayeeId
            );

            this.openModal(
                'Success',
                'Expense Updated.',
                'success'
            );
        } else {
            await this.expenseService.addExpense(

                this.selectedGroupId,

                this.expenseAmount,

                this.expenseDescription,

                this.expenseCategory,

                this.selectedPayeeId || undefined

            );

            this.openModal(
                'Success',
                'Expense Added.',
                'success'
            );
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
    this.expenseAmount = expense.amount;
    this.expenseDescription = expense.description;
    this.expenseCategory = expense.category;
    this.selectedPayeeId = expense.paidBy._id || (expense.paidBy as any);
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

    this.defaultPayeeToCurrentUser();

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
  // Navigate back to dashboard
  backtoDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
