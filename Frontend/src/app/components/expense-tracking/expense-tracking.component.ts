import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { NavbarComponent } from '../navbar/navbar.component';
import { GroupService } from '../../services/group.service';
import { ExpenseTrackingService } from '../../services/expense-tracking.service';

@Component({
  selector: 'app-expense-tracking',
  standalone: true,
  imports: [
    NavbarComponent,
    CommonModule,
    FormsModule,
    DecimalPipe
  ],
  templateUrl: './expense-tracking.component.html',
  styleUrls: ['./expense-tracking.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class ExpenseTrackingComponent implements OnInit {

  availableGroups: any[] = [];

  selectedGroupId = '';

  totalExpense = 0;

  perPerson = 0;

  balances: any[] = [];

  settlements: any[] = [];

  loading = false;

  constructor(
    private groupService: GroupService,
    private expenseTracking: ExpenseTrackingService,
    private router: Router
  ) {}

  ngOnInit(): void {

    this.groupService.groups$.subscribe({

      next: (groups) => {

        this.availableGroups = groups;

      },

      error: (error) => {

        console.error(error);

      }

    });

  }

  async onGroupSelect(): Promise<void> {

    if (!this.selectedGroupId) {

      this.clearData();

      return;

    }

    this.loading = true;

    try {

      const result =
        await this.expenseTracking.getGroupBalance(
          this.selectedGroupId
        );

      this.totalExpense = result.totalExpense;

      this.perPerson = result.perPerson;

      this.balances = result.balances;

      this.settlements = result.settlements;

    } catch (error) {

      console.error(error);

      this.clearData();

    }

    this.loading = false;

  }

  clearData(): void {

    this.totalExpense = 0;

    this.perPerson = 0;

    this.balances = [];

    this.settlements = [];

  }

  backtoDashboard(): void {

    this.router.navigate(['/dashboard']);

  }

}