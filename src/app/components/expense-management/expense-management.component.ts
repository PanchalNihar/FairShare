import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Expense, ExpenseService } from '../../services/expense.service';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { GroupService } from '../../services/group.service';
import { NavbarComponent } from '../navbar/navbar.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-expense-management',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NavbarComponent],
  templateUrl: './expense-management.component.html',
  styleUrl: './expense-management.component.css',
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
  
  private expensesSub?: Subscription;
  private groupsSub?: Subscription;

  constructor(
    private router: Router,
    private expenseService: ExpenseService,
    private groupService: GroupService
  ) {}

  ngOnInit(): void {
    this.loadAvailableGroup();
    this.expensesSub = this.expenseService.expenses$.subscribe(expenses => {
      if (this.selectedGroup) {
        this.expenseList = expenses.filter(expense => expense.groupName === this.selectedGroup);
        this.calculateTotalExpense();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.expensesSub) {
      this.expensesSub.unsubscribe();
    }
    if (this.groupsSub) {
      this.groupsSub.unsubscribe();
    }
  }

  loadAvailableGroup() {
    this.groupsSub = this.groupService.groups$.subscribe(() => {
      this.availableGroups = this.groupService.getGroupForTracking();
    });
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

  async addExpense() {
    if (
      this.expensePayer &&
      this.expenseAmount > 0 &&
      this.expenseDescription
    ) {
      await this.expenseService.addExpense(
        this.expensePayer,
        this.expenseAmount,
        this.expenseDescription,
        this.expenseDate || new Date().toISOString(),
        this.selectedGroup
      );
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

  async editExpense() {
    if (this.selectedExpense) {
      await this.expenseService.updateExpense(this.selectedExpense.id, {
        payer: this.expensePayer,
        amount: this.expenseAmount,
        description: this.expenseDescription,
        date: this.expenseDate,
      });
      this.clearForm();
    }
  }

  async deleteExpense(expense: Expense) {
    await this.expenseService.deleteExpense(expense.id);
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