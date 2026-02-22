import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { Expense, ExpenseService } from '../../services/expense.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { GroupService } from '../../services/group.service';
import { NavbarComponent } from '../navbar/navbar.component';
import { Subscription } from 'rxjs';
import { CustomModalComponent } from '../../shared/custom-modal/custom-modal.component';

@Component({
  selector: 'app-expense-management',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NavbarComponent,
    CustomModalComponent
  ],
  templateUrl: './expense-management.component.html',
  styleUrl: './expense-management.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class ExpenseManagementComponent implements OnInit, OnDestroy {
  expenseList: Expense[] = [];
  availableGroups: string[] = [];
  expensePayer: string = '';
  expenseAmount: number = 0;
  expenseDate: string = '';
  expenseDescription: string = '';
  groupMembers: string[] = [];
  selectedExpense: Expense | null = null;
  selectedGroup: string = '';
  totalExpense: number = 0;

  isModalOpen = false;
  modalTitle = '';
  modalMessage = '';
  modalType: 'success' | 'error' | 'warning' | 'info' = 'info';

  private expensesSub?: Subscription;
  private groupsSub?: Subscription;

  constructor(
    private router: Router,
    private expenseService: ExpenseService,
    private groupService: GroupService,
  ) {}

  openModal(title: string, message: string, type: any = 'info') {
    this.modalTitle = title;
    this.modalMessage = message;
    this.modalType = type;
    this.isModalOpen = true;
  }

  ngOnInit(): void {
    this.loadAvailableGroup();

    // Subscribe to expense changes
    this.expensesSub = this.expenseService.expenses$.subscribe((expenses) => {
      if (this.selectedGroup) {
        this.expenseList = expenses.filter(
          (expense) => expense.groupName === this.selectedGroup,
        );
        this.calculateTotalExpense();
      }
    });

    // Set default date to today
    this.expenseDate = new Date().toISOString().split('T')[0];
  }

  ngOnDestroy(): void {
    if (this.expensesSub) {
      this.expensesSub.unsubscribe();
    }
    if (this.groupsSub) {
      this.groupsSub.unsubscribe();
    }
  }

  // Load available groups
  loadAvailableGroup(): void {
    this.groupsSub = this.groupService.groups$.subscribe(() => {
      this.availableGroups = this.groupService.getGroupForTracking();
    });
  }

  // Handle group change
  onGroupChange(): void {
    if (this.selectedGroup) {
      this.groupMembers = this.groupService.getGroupMember(this.selectedGroup);
      this.expenseList = this.expenseService
        .getExpense()
        .filter((expense) => expense.groupName === this.selectedGroup);
      this.calculateTotalExpense();
      this.clearForm(); // Clear form when switching groups
    } else {
      this.groupMembers = [];
      this.expenseList = [];
      this.totalExpense = 0;
    }
  }

  // Add new expense
  async addExpense(): Promise<void> {
    // Validation
    if (!this.expensePayer.trim()) {
      this.openModal('Error', 'Please select who paid for this expense.', 'error');
      return;
    }

    if (!this.expenseAmount || this.expenseAmount <= 0) {
      this.openModal('Error', 'Please enter a valid amount greater than 0.', 'error');
      return;
    }

    if (!this.expenseDescription.trim()) {
      this.openModal('Error', 'Please enter a description for this expense.', 'error');
      return;
    }

    if (!this.expenseDate) {
      this.openModal('Error', 'Please select a date for this expense.', 'error');
      return;
    }

    try {
      await this.expenseService.addExpense(
        this.expensePayer,
        this.expenseAmount,
        this.expenseDescription,
        this.expenseDate,
        this.selectedGroup,
      );
      this.clearForm();
      this.openModal('Success', 'Expense added successfully!', 'success');
    } catch (error) {
      console.error('Error adding expense:', error);
      this.openModal(
        'Error',
        'Failed to add expense. Please try again.',
        'error',
      );
    }
  }

  // Calculate total expense
  calculateTotalExpense(): void {
    this.totalExpense = this.expenseList.reduce(
      (total, expense) => total + Number(expense.amount),
      0,
    );
  }

  // Select expense for editing
  selectExpense(expense: Expense): void {
    this.selectedExpense = expense;
    this.expensePayer = expense.payer;
    this.expenseAmount = expense.amount;
    this.expenseDescription = expense.description;
    this.expenseDate = expense.date.split('T')[0]; // Format date for input
  }

  // Edit existing expense
  async editExpense(): Promise<void> {
    if (!this.selectedExpense) {
      console.error('No expense selected for editing');
      return;
    }

    // Validation
    if (!this.expensePayer.trim()) {
      this.openModal('Error', 'Please select who paid for this expense.', 'error');
      return;
    }

    if (!this.expenseAmount || this.expenseAmount <= 0) {
      this.openModal('Error', 'Please enter a valid amount greater than 0.', 'error');
      return;
    }

    if (!this.expenseDescription.trim()) {
      this.openModal('Error', 'Please enter a description for this expense.', 'error');
      return;
    }

    if (!this.expenseDate) {
      this.openModal('Error', 'Please select a date for this expense.', 'error');
      return;
    }

    try {
      await this.expenseService.updateExpense(this.selectedExpense.id, {
        payer: this.expensePayer,
        amount: this.expenseAmount,
        description: this.expenseDescription,
        date: this.expenseDate,
      });
      this.clearForm();
      this.openModal('Success', 'Expense updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating expense:', error);
      this.openModal(
        'Error',
        'Failed to update expense. Please try again.',
        'error',
      );
    }
  }

  // Delete expense with confirmation
  async deleteExpense(expense: Expense): Promise<void> {
    const confirmed = confirm(
      `Are you sure you want to delete this expense: "${expense.description}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await this.expenseService.deleteExpense(expense.id);

      // Clear form if the deleted expense was selected
      if (this.selectedExpense && this.selectedExpense.id === expense.id) {
        this.clearForm();
      }

      this.openModal('Success', 'Expense deleted successfully!', 'success');
    } catch (error) {
      console.error('Error deleting expense:', error);
      this.openModal(
        'Error',
        'Failed to delete expense. Please try again.',
        'error',
      );
    }
  }

  // Clear form and reset state
  clearForm(): void {
    this.expensePayer = '';
    this.expenseAmount = 0;
    this.expenseDate = new Date().toISOString().split('T')[0];
    this.expenseDescription = '';
    this.selectedExpense = null;
  }
  closeModal() {
    this.isModalOpen = false;
  }
  // Navigate back to dashboard
  backtoDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
