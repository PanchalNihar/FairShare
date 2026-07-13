import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Expense {
  _id: string;

  group: string;

  paidBy: {
    _id: string;
    username: string;
    email: string;
  };

  amount: number;

  description: string;

  category: string;

  expenseDate: string;

  createdAt?: string;

  updatedAt?: string;

  paidTo?: {
    _id: string;
    username: string;
    email: string;
  };

  isSettlement?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ExpenseService {
  private apiUrl = `${environment.apiUrl}/expenses`;

  private expenseSubject = new BehaviorSubject<Expense[]>([]);

  expenses$ = this.expenseSubject.asObservable();

  constructor(private http: HttpClient) {}

  getExpense(): Expense[] {
    return this.expenseSubject.value;
  }

  async loadExpenses(groupId: string): Promise<void> {
    try {
      const response: any = await firstValueFrom(
        this.http.get(`${this.apiUrl}/${groupId}`)
      );

      this.expenseSubject.next(response.data);
    } catch (error) {
      console.error(error);
    }
  }

  async addExpense(
    groupId: string,
    amount: number,
    description: string,
    category: string = 'Other',
    paidBy?: string,
    expenseDate?: string
  ): Promise<void> {

    await firstValueFrom(
      this.http.post(this.apiUrl, {
        groupId,
        amount,
        description,
        category,
        paidBy,
        expenseDate,
      })
    );

    await this.loadExpenses(groupId);
  }

  async addSettlement(
    groupId: string,
    amount: number,
    description: string,
    paidBy: string,
    paidTo: string,
    expenseDate?: string
  ): Promise<void> {

    await firstValueFrom(
      this.http.post(this.apiUrl, {
        groupId,
        amount,
        description,
        category: 'Settlement',
        paidBy,
        paidTo,
        isSettlement: true,
        expenseDate,
      })
    );

    await this.loadExpenses(groupId);
  }

  getExpenseById(id: string): Expense | undefined {
    return this.expenseSubject.value.find(
      expense => expense._id === id
    );
  }

  async updateExpense(
    expenseId: string,
    groupId: string,
    amount: number,
    description: string,
    category: string,
    paidBy: string,
    expenseDate?: string
  ): Promise<void> {
    await firstValueFrom(
      this.http.put(`${this.apiUrl}/${expenseId}`, {
        amount,
        description,
        category,
        paidBy,
        expenseDate,
      })
    );

    await this.loadExpenses(groupId);
  }

  async deleteExpense(expenseId: string, groupId: string): Promise<void> {
    await firstValueFrom(
      this.http.delete(`${this.apiUrl}/${expenseId}`)
    );

    await this.loadExpenses(groupId);
  }

  async scanReceipt(base64Image: string, mimeType: string): Promise<any> {
    const response: any = await firstValueFrom(
      this.http.post(`${this.apiUrl}/scan-receipt`, {
        image: base64Image,
        mimeType: mimeType
      })
    );
    return response.data;
  }

  async quickAddText(text: string, members: string[]): Promise<any> {
    const response: any = await firstValueFrom(
      this.http.post(`${this.apiUrl}/quick-add`, {
        text,
        members
      })
    );
    return response.data;
  }
}