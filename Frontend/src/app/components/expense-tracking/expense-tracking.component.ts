import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar.component';
import { ExpenseTrackingService } from '../../services/expense-tracking.service';
import { ExpenseService } from '../../services/expense.service';
import { GroupService } from '../../services/group.service';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription, combineLatest } from 'rxjs';

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

  private dataSub?: Subscription;

  constructor(
    private expenseTracking: ExpenseTrackingService,
    private expenseService: ExpenseService,
    private groupService: GroupService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    // combineLatest fires whenever EITHER groups OR expenses stream emits.
    // This means the tracking view auto-refreshes after page refresh once
    // both auth-gated listeners have loaded their data from Firestore.
    this.dataSub = combineLatest([
      this.groupService.groups$,
      this.expenseService.expenses$,
    ]).subscribe(() => {
      // Rebuild available groups list from latest stream value
      this.availableGroups = this.groupService.getGroupForTracking();

      // Re-compute tracking data if a group is already selected
      if (this.selectedGroup) {
        this.refreshTrackingData();
      }
    });
  }

  ngOnDestroy(): void {
    this.dataSub?.unsubscribe();
  }

  // Handle group selection from dropdown
  onGroupSelect(): void {
    if (this.selectedGroup) {
      this.refreshTrackingData();
    } else {
      this.clearData();
    }
  }

  // Re-compute all derived tracking data for the selected group
  private refreshTrackingData(): void {
    try {
      this.groupExpenses =
        this.expenseTracking.getExpenseByGroup(this.selectedGroup) || [];
      this.memberSpendings =
        this.expenseTracking.calculateMemberSpending(this.selectedGroup) || {};
      this.balances =
        this.expenseTracking.calculateBalances(this.selectedGroup) || [];
    } catch (error) {
      console.error('Error loading expense tracking data:', error);
      this.clearData();
    }
  }

  clearData(): void {
    this.groupExpenses = [];
    this.memberSpendings = {};
    this.balances = [];
  }

  getObjectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }

  getTotalExpenses(): number {
    return this.groupExpenses.reduce((total, expense) => {
      return total + (Number(expense.amount) || 0);
    }, 0);
  }

  backtoDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
