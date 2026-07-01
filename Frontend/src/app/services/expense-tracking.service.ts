import { Injectable } from '@angular/core';
import { ExpenseService } from './expense.service';
import { GroupService } from './group.service';

@Injectable({
  providedIn: 'root',
})
export class ExpenseTrackingService {
  constructor(
    private expenseService: ExpenseService,
    private groupServcie: GroupService
  ) {}
  getExpenseByGroup(groupName: string) {
    const allExpenses = this.expenseService.getExpense();
    console.log('All Expenses:', allExpenses);
    return allExpenses.filter((expense) => expense.groupName == groupName);
  }
  calculateMemberSpending(groupName: string) {
    const expenses = this.getExpenseByGroup(groupName);
    const groupMember = this.groupServcie.getGroupMember(groupName);
    const spending: { [member: string]: number } = {};
    groupMember.forEach((member) => {
      spending[member] = expenses
        .filter((expenses) => expenses.payer === member)
        .reduce((total, expense) => total + expense.amount, 0);
    });
    return spending;
  }
  calculateBalances(groupName: string) {
    const groupMember = this.groupServcie.getGroupMember(groupName);
    const spendings = this.calculateMemberSpending(groupName);
    const totalExpense = Object.values(spendings).reduce((a, b) => a + b, 0);
    const perPersonShare = totalExpense / groupMember.length;

    const balances = groupMember.map((member) => ({
      member,
      balance: spendings[member] - perPersonShare,
    }));

    const owes: { from: string; to: string; amount: number }[] = [];
    balances.sort((a, b) => {
      return a.balance - b.balance;
    });

    let i = 0;
    let j = balances.length - 1;
    while (i < j) {
      const owesAmount = Math.min(-balances[i].balance, balances[j].balance);
      owes.push({
        from: balances[i].member,
        to: balances[j].member,
        amount: owesAmount,
      });
      balances[i].balance += owesAmount;
      balances[j].balance -= owesAmount;
      if (balances[i].balance === 0) {
        i++;
      }
      if (balances[j].balance === 0) {
        j--;
      }
    }
    return owes;
  }
}
