import { Injectable } from '@angular/core';
import { Expense, ExpenseService } from './expense.service';
import { GroupService } from './group.service';

@Injectable({
  providedIn: 'root',
})
export class ExpenseTrackingService {
  constructor(
    private expenseService: ExpenseService,
    private groupService: GroupService
  ) {}
  getGroups(): any[] {
    return this.groupService.getGroups();
  }
  getGroupMembers(groupId: string): string[] {
    return this.groupService.getGroupMember(groupId);
  }
  getExpenseForGroup(groupId: string): Expense[] {
    return this.expenseService.getExpense().filter((expense) => {
      return expense.id === groupId;
    });
  }
}
