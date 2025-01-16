import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Expense, ExpenseService } from '../../services/expense.service';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { GroupService } from '../../services/group.service';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-expense-management',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NavbarComponent],
  templateUrl: './expense-management.component.html',
  styleUrl: './expense-management.component.css',
})
export class ExpenseManagementComponent implements OnInit {
  expenseList: any[] = [];
  availableGroups: any[] = [];
  expensePayer: any = '';
  expenseAmount: number = 0;
  expenseDate: any = '';
  expenseDescription: any = '';
  groupMembers: string[] = [];
  selectedExpense: Expense | null = null;
  selectedGroup: string = '';
  totalExpense: number = 0;
  constructor(
    private router: Router,
    private expenseService: ExpenseService,
    private groupService: GroupService
  ) {}
  ngOnInit(): void {
    this.loadAvailableGroup();
    this.expenseList = this.expenseService.getExpense();
    console.log('Groups', this.availableGroups);
  }
  loadAvailableGroup() {
    this.availableGroups = this.groupService.getGroupForTracking();
  }
  onGroupChange() {
    if (this.selectedGroup) {
      this.groupMembers = this.groupService.getGroupMember(this.selectedGroup);
      this.expenseList = this.expenseService
        .getExpense()
        .filter((expense) => expense.groupName === this.selectedGroup);
      this.calculateTotalExpense();
    } else {
      this.groupMembers = [];
      this.expenseList = [];
      this.totalExpense = 0;
    }
  }

  addExpense() {
    if (
      this.expensePayer &&
      this.expenseAmount > 0 &&
      this.expenseDescription
    ) {
      this.expenseService.addExpense(
        this.expensePayer,
        this.expenseAmount,
        this.expenseDescription,
        this.expenseDate || new Date().toISOString(),
        this.selectedGroup
      );

      this.expenseList = this.expenseService
        .getExpense()
        .filter((expense) => expense.groupName === this.selectedGroup);
      this.calculateTotalExpense();
      this.clearForm();
    }
  }

  calculateTotalExpense() {
    this.totalExpense = this.expenseList.reduce(
      (total, expense) => total + Number(expense.amount),
      0
    );
  }

  selectExpense(expense: Expense) {
    this.selectedExpense = expense;
    this.expensePayer = expense.payer;
    this.expenseAmount = expense.amount;
    this.expenseDescription = expense.description;
    this.expenseDate = expense.date;
  }
  editExpense() {
    if (this.selectedExpense) {
      this.expenseService.updateExpense(this.selectedExpense.id, {
        payer: this.expensePayer,
        amount: this.expenseAmount,
        description: this.expenseDescription,
        date: this.expenseDate,
      });

      // Update filtered list and total expense
      this.expenseList = this.expenseService
        .getExpense()
        .filter((expense) => expense.groupName === this.selectedGroup);
      this.calculateTotalExpense();
      this.clearForm();
    }
  }

  deleteExpense(expense: Expense) {
    this.expenseService.deleteExpense(expense.id);

    // Update filtered list and total expense
    this.expenseList = this.expenseService
      .getExpense()
      .filter((expense) => expense.groupName === this.selectedGroup);
    this.calculateTotalExpense();
    this.clearForm();
  }

  clearForm() {
    this.expensePayer = '';
    this.expenseAmount = 0;
    this.expenseDate = '';
    this.expenseDescription = '';
    this.selectedExpense = null;
  }
  backtoDashboard() {
    this.router.navigate(['/dashboard']);
  }
}
