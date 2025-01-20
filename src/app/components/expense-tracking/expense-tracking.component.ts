import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar.component';
import { ExpenseTrackingService } from '../../services/expense-tracking.service';
import { GroupService } from '../../services/group.service';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-expense-tracking',
  imports: [NavbarComponent, CommonModule, FormsModule, DatePipe, DecimalPipe],
  templateUrl: './expense-tracking.component.html',
  styleUrls: ['./expense-tracking.component.css'],
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
    this.groupsSub = this.groupService.groups$.subscribe(() => {
      this.availableGroups = this.groupService.getGroupForTracking();
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

  onGroupSelect() {
    if (this.selectedGroup) {
      this.groupExpenses = this.expenseTracking.getExpenseByGroup(this.selectedGroup);
      this.memberSpendings = this.expenseTracking.calculateMemberSpending(this.selectedGroup);
      this.balances = this.expenseTracking.calculateBalances(this.selectedGroup) || [];
    } else {
      this.groupExpenses = [];
      this.memberSpendings = {};
      this.balances = [];
    }
  }

  backtoDashboard() {
    this.router.navigate(['dashboard']);
  }
}