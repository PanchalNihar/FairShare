import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { NavbarComponent } from '../navbar/navbar.component';
import { GroupService } from '../../services/group.service';
import { ExpenseTrackingService } from '../../services/expense-tracking.service';
import { ExpenseService } from '../../services/expense.service';
import { CustomModalComponent } from '../../shared/custom-modal/custom-modal.component';

@Component({
  selector: 'app-expense-tracking',
  standalone: true,
  imports: [
    NavbarComponent,
    CommonModule,
    FormsModule,
    DecimalPipe,
    CustomModalComponent
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

  // Modal State
  isModalOpen = false;
  modalTitle = '';
  modalMessage = '';
  modalType: 'success' | 'error' | 'warning' | 'info' = 'info';
  isConfirmMode = false;
  selectedSettlement: any = null;

  // Analytics tab properties
  activeTab: 'balances' | 'analytics' = 'balances';
  expensesList: any[] = [];
  categoryData: any[] = [];
  monthlyData: any[] = [];
  categoryTotal = 0;
  recentTopExpenses: any[] = [];

  constructor(
    private groupService: GroupService,
    private expenseTracking: ExpenseTrackingService,
    private expenseService: ExpenseService,
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

      // Load expenses for spend analytics
      await this.expenseService.loadExpenses(this.selectedGroupId);
      this.expensesList = this.expenseService.getExpense() || [];
      this.calculateAnalytics();

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

    this.expensesList = [];
    this.categoryData = [];
    this.monthlyData = [];
    this.categoryTotal = 0;
    this.recentTopExpenses = [];

  }

  calculateAnalytics() {
    const nonSettlements = this.expensesList.filter(e => !e.isSettlement);
    
    // 1. Category breakdown
    const catGroups: { [key: string]: number } = {};
    let catSum = 0;
    nonSettlements.forEach(e => {
      const cat = e.category || 'Other';
      catGroups[cat] = (catGroups[cat] || 0) + Number(e.amount);
      catSum += Number(e.amount);
    });
    this.categoryTotal = catSum;

    let cumulativePct = 0;
    const colors = ['#FF6B6B', '#4A90E2', '#2ECC71', '#F1C40F', '#9B59B6', '#1ABC9C'];
    this.categoryData = Object.keys(catGroups).map((cat, idx) => {
      const amt = catGroups[cat];
      const pct = catSum > 0 ? (amt / catSum) * 100 : 0;
      const segment = {
        name: cat,
        amount: amt,
        percentage: pct,
        color: colors[idx % colors.length],
        dashOffset: 188.5 - (188.5 * pct) / 100,
        rotateAngle: cumulativePct * 3.6 - 90
      };
      cumulativePct += pct;
      return segment;
    });

    // 2. Monthly Trend (last 6 months)
    const monthGroups: { [key: string]: number } = {};
    nonSettlements.forEach(e => {
      const date = new Date(e.expenseDate || e.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthGroups[key] = (monthGroups[key] || 0) + Number(e.amount);
    });

    // Ensure we have at least the current month if empty
    const currentMonthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    if (!monthGroups[currentMonthKey]) {
      monthGroups[currentMonthKey] = 0;
    }

    this.monthlyData = Object.keys(monthGroups)
      .map(key => ({
        monthStr: key,
        amount: monthGroups[key]
      }))
      .sort((a, b) => a.monthStr.localeCompare(b.monthStr))
      .slice(-6);

    const maxAmt = Math.max(...this.monthlyData.map(m => m.amount), 0) || 1;
    this.monthlyData = this.monthlyData.map((m, idx) => {
      const parts = m.monthStr.split('-');
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
      const label = d.toLocaleDateString('en-US', { month: 'short' });
      return {
        ...m,
        label,
        height: (m.amount / maxAmt) * 80, // scale to max height 80
        x: 30 + idx * 42
      };
    });

    // 3. Top recent expenses
    this.recentTopExpenses = [...nonSettlements]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }

  backtoDashboard(): void {

    this.router.navigate(['/dashboard']);

  }

  openModal(title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', confirmMode = false) {
    this.modalTitle = title;
    this.modalMessage = message;
    this.modalType = type;
    this.isConfirmMode = confirmMode;
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.selectedSettlement = null;
  }

  confirmSettleUp(settlement: any) {
    this.selectedSettlement = settlement;
    this.openModal(
      'Confirm Settlement',
      `Are you sure you want to clarify and record a payment of ₹${settlement.amount.toFixed(2)} from "${settlement.from}" to "${settlement.to}" as settled?`,
      'info',
      true
    );
  }

  async executeSettlement() {
    if (!this.selectedSettlement || !this.selectedGroupId) return;

    const settlement = this.selectedSettlement;
    this.closeModal();
    this.loading = true;

    try {
      const description = `Settlement: ${settlement.from} to ${settlement.to}`;
      await this.expenseService.addSettlement(
        this.selectedGroupId,
        settlement.amount,
        description,
        settlement.fromId,
        settlement.toId
      );

      this.openModal('Success', 'Settlement recorded successfully!', 'success');

      // Reload balances and settlements
      await this.onGroupSelect();
    } catch (error: any) {
      console.error(error);
      this.openModal('Error', error.error?.message || error.message || 'Failed to record settlement.', 'error');
    } finally {
      this.loading = false;
    }
  }

}