import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, updateDoc, deleteDoc, getDocs, doc, query, where } from '@angular/fire/firestore';
import { Observable, BehaviorSubject, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface Expense {
  id: string;
  payer: string;
  amount: number;
  description: string;
  date: string;
  groupName: string;
}

@Injectable({
  providedIn: 'root',
})
export class ExpenseService {
  private expenseList: Expense[] = [];
  private expenseSubject = new BehaviorSubject<Expense[]>([]);
  expenses$ = this.expenseSubject.asObservable();
  
  constructor(private firestore: Firestore,private authService:AuthService) {
    this.loadExpenses();
  }

  private async loadExpenses() {
    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        console.log('No authenticated user when loading expenses');
        return;
      }
      
      console.log('Loading expenses with user:', currentUser.uid);
      const expensesRef = collection(this.firestore, 'expenses');
      const querySnapshot = await getDocs(expensesRef);
      this.expenseList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Expense));
      this.expenseSubject.next(this.expenseList);
    } catch (error) {
      console.error('Error loading expenses:', error);
    }
  }

  getExpense(): Expense[] {
    return this.expenseList;
  }

  async addExpense(payer: string, amount: number, description: string, date: string, groupName: string) {
    const expenseData = {
      payer,
      amount: Number(amount),
      description,
      date,
      groupName,
    };

    const docRef = await addDoc(collection(this.firestore, 'expenses'), expenseData);
    const newExpense: Expense = {
      id: docRef.id,
      ...expenseData
    };
    
    this.expenseList.push(newExpense);
    this.expenseSubject.next(this.expenseList);
  }

  getExpenseById(id: string): Expense | undefined {
    return this.expenseList.find((expense) => expense.id === id);
  }

  async updateExpense(id: string, updatedExpense: Partial<Expense>) {
    const expenseRef = doc(this.firestore, 'expenses', id);
    await updateDoc(expenseRef, updatedExpense);
    
    this.expenseList = this.expenseList.map((expense) =>
      expense.id === id ? { ...expense, ...updatedExpense } : expense
    );
    this.expenseSubject.next(this.expenseList);
  }

  async deleteExpense(id: string) {
    const expenseRef = doc(this.firestore, 'expenses', id);
    await deleteDoc(expenseRef);
    
    this.expenseList = this.expenseList.filter((expense) => expense.id !== id);
    this.expenseSubject.next(this.expenseList);
  }
}