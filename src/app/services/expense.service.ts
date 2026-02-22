import { Injectable, OnDestroy } from '@angular/core';
import {
  Firestore,
  collection,
  CollectionReference,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  collectionData,
} from '@angular/fire/firestore';
import { BehaviorSubject, Observable, Subscription, of, switchMap } from 'rxjs';
import { Auth, authState, User } from '@angular/fire/auth';

export interface Expense {
  id: string;
  payer: string;
  amount: number;
  description: string;
  date: string;
  groupName: string;
  createdBy: string;
}

@Injectable({
  providedIn: 'root',
})
export class ExpenseService implements OnDestroy {
  private expenseList: Expense[] = [];
  private expenseSubject = new BehaviorSubject<Expense[]>([]);
  expenses$ = this.expenseSubject.asObservable();

  private currentUser: User | null = null;
  private authSubscription: Subscription;

  constructor(
    private firestore: Firestore,
    private auth: Auth,
  ) {
    // Same pattern as GroupService: wait for auth to restore, then open
    // a real-time Firestore listener scoped to the current user.
    // switchMap cancels the previous listener whenever auth state changes.
    this.authSubscription = authState(this.auth)
      .pipe(
        switchMap((user: User | null): Observable<Expense[]> => {
          this.currentUser = user;
          if (!user) {
            this.expenseList = [];
            this.expenseSubject.next([]);
            return of<Expense[]>([]);
          }

          const expensesRef = collection(
            this.firestore,
            'expenses',
          ) as CollectionReference<Expense>;

          const expensesQuery = query(
            expensesRef,
            where('createdBy', '==', user.uid),
          );

          return collectionData<Expense>(expensesQuery, { idField: 'id' });
        }),
      )
      .subscribe((expenses: Expense[]) => {
        this.expenseList = expenses;
        this.expenseSubject.next(this.expenseList);
      });
  }

  ngOnDestroy(): void {
    this.authSubscription.unsubscribe();
  }

  // Synchronous getter — used by ExpenseTrackingService
  getExpense(): Expense[] {
    return this.expenseList;
  }

  async addExpense(
    payer: string,
    amount: number,
    description: string,
    date: string,
    groupName: string,
  ): Promise<void> {
    if (!this.currentUser) {
      throw new Error('No user is logged in');
    }

    const expenseData = {
      payer,
      amount: Number(amount),
      description,
      date,
      groupName,
      createdBy: this.currentUser.uid, // scope to user, matches the query above
    };

    await addDoc(collection(this.firestore, 'expenses'), expenseData);
    // Real-time listener automatically updates expenseList and expenses$
  }

  getExpenseById(id: string): Expense | undefined {
    return this.expenseList.find((expense) => expense.id === id);
  }

  async updateExpense(
    id: string,
    updatedExpense: Partial<Expense>,
  ): Promise<void> {
    const expenseRef = doc(this.firestore, 'expenses', id);
    await updateDoc(expenseRef, updatedExpense as any);
    // Real-time listener handles local state update
  }

  async deleteExpense(id: string): Promise<void> {
    const expenseRef = doc(this.firestore, 'expenses', id);
    await deleteDoc(expenseRef);
    // Real-time listener handles local state update
  }
}
