import { Component, OnInit } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar.component';
import { ExpenseTrackingService } from '../../services/expense-tracking.service';
import { GroupService } from '../../services/group.service';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-expense-tracking',
  imports: [NavbarComponent, CommonModule, FormsModule,DatePipe],
  templateUrl: './expense-tracking.component.html',
  styleUrls: ['./expense-tracking.component.css'],
})
export class ExpenseTrackingComponent implements OnInit {
  availableGroups: string[] = [];
  selectedGroup: string = '';
  groupExpenses: any[] = [];
  memberSpendings: any = {};
  balances: any[] = [];

  constructor(
    private expenseTracking: ExpenseTrackingService,
    private groupService: GroupService,
    private router:Router
  ) {}

  ngOnInit(): void {
    // Fetch group names for dropdown
    this.availableGroups = this.groupService.getGroupForTracking();
    console.log('Available Groups:', this.availableGroups);
  }

  onGroupSelect() {
    if (this.selectedGroup) {
      // Fetch expenses and balances for the selected group
      this.groupExpenses = this.expenseTracking.getExpenseByGroup(
        this.selectedGroup
      );
      this.memberSpendings = this.expenseTracking.calculateMemberSpending(
        this.selectedGroup
      );
      this.balances = this.expenseTracking.calculateBalances(
        this.selectedGroup
      );

      console.log('Selected Group:', this.selectedGroup);
      console.log('Group Expenses:', this.groupExpenses);
      console.log('Member Spendings:', this.memberSpendings);
      console.log('Balances:', this.balances);
    }
  }
  backtoDashboard(){
    this.router.navigate(['dashboard'])
  }
}
