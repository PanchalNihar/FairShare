import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar.component';
import { ExpenseTrackingService } from '../../services/expense-tracking.service';
import { GroupService } from '../../services/group.service';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-expense-tracking',
  imports: [NavbarComponent, CommonModule, FormsModule, DecimalPipe],
  templateUrl: './expense-tracking.component.html',
  styleUrls: ['./expense-tracking.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class ExpenseTrackingComponent implements OnInit, OnDestroy {
  availableGroups: string[] = [];
  selectedGroup: string = '';
  groupExpenses: any[] = [];
  memberSpendings: any = {};
  balances: any[] = [];

  private groupsSub?: Subscription;

  constructor(
    private expenseTracking: ExpenseTrackingService,
    private groupService: GroupService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to group changes
    this.groupsSub = this.groupService.groups$.subscribe(() => {
      this.availableGroups = this.groupService.getGroupForTracking();

      // Refresh data if a group is already selected
      if (this.selectedGroup) {
        this.onGroupSelect();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.groupsSub) {
      this.groupsSub.unsubscribe();
    }
  }

  // Handle group selection
  onGroupSelect(): void {
    if (this.selectedGroup) {
      try {
        this.groupExpenses =
          this.expenseTracking.getExpenseByGroup(this.selectedGroup) || [];
        this.memberSpendings =
          this.expenseTracking.calculateMemberSpending(this.selectedGroup) ||
          {};
        this.balances =
          this.expenseTracking.calculateBalances(this.selectedGroup) || [];
      } catch (error) {
        console.error('Error loading expense tracking data:', error);
        this.groupExpenses = [];
        this.memberSpendings = {};
        this.balances = [];
      }
    } else {
      this.clearData();
    }
  }

  // Clear all data
  clearData(): void {
    this.groupExpenses = [];
    this.memberSpendings = {};
    this.balances = [];
  }

  // Get object keys for iteration
  getObjectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }

  // Calculate total expenses
  getTotalExpenses(): number {
    return this.groupExpenses.reduce((total, expense) => {
      return total + (Number(expense.amount) || 0);
    }, 0);
  }

  // Navigate back to dashboard
  backtoDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
