import { Injectable } from '@angular/core';

export interface Expense {
  id: string;
  payer: string;
  amount: number;
  description: string;
  date: string;
  groupName:string
}
@Injectable({
  providedIn: 'root',
})
export class ExpenseService {
  private expenseList: Expense[] = [];
  constructor() {
    this.loadExpense();
  }
  private loadExpense() {
    const storedExpense = localStorage.getItem('expense');
    if (storedExpense) {
      this.expenseList = JSON.parse(storedExpense);
    }
  }
  private saveExpense() {
    localStorage.setItem('expense', JSON.stringify(this.expenseList));
  }
  getExpense(): Expense[] {
    return this.expenseList;
  }
  addExpense(payer: string, amount: number, description: string, date: string, groupName: string) {
    const newExpense: Expense = {
      id: Math.random().toString(),
      payer: payer,
      amount: Number(amount), // Amount should always be a number
      description: description,
      date: date,
      groupName: groupName, // Ensure groupName is added
    };
    this.expenseList.push(newExpense);
    this.saveExpense();
  }
  
  getExpenseById(id: string): Expense | undefined {
    return this.expenseList.find((expense) => expense.id === id);
  }
  updateExpense(id: string, updatedExpense: Partial<Expense>) {
    this.expenseList = this.expenseList.map((expense) =>
      expense.id === id ? { ...expense, ...updatedExpense } : expense
    );
    this.saveExpense();
  }
  deleteExpense(id: string) {
    this.expenseList = this.expenseList.filter((expense) => expense.id !== id);
    this.saveExpense();
  }
}
