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