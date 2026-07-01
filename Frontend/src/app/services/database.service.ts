import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, doc, updateDoc, 
         deleteDoc, collectionData, docData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class  DatabaseService{
  constructor(private firestore: Firestore) {}

  // Get collection data
  getCollection<T>(collectionName: string): Observable<T[]> {
    const collectionRef = collection(this.firestore, collectionName);
    return collectionData(collectionRef) as Observable<T[]>;
  }

  // Get single document
  getDocument<T>(collectionName: string, docId: string): Observable<T> {
    const documentRef = doc(this.firestore, `${collectionName}/${docId}`);
    return docData(documentRef) as Observable<T>;
  }

  // Add new document
  async addDocument<T>(collectionName: string, data: T) {
    try {
      const collectionRef = collection(this.firestore, collectionName);
      return await addDoc(collectionRef,<any> data);
    } catch (error) {
      throw error;
    }
  }

  // Update document
  async updateDocument(collectionName: string, docId: string, data: any) {
    try {
      const documentRef = doc(this.firestore, `${collectionName}/${docId}`);
      return await updateDoc(documentRef, data);
    } catch (error) {
      throw error;
    }
  }

  // Delete document
  async deleteDocument(collectionName: string, docId: string) {
    try {
      const documentRef = doc(this.firestore, `${collectionName}/${docId}`);
      return await deleteDoc(documentRef);
    } catch (error) {
      throw error;
    }
  }
}