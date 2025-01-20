import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideDatabase, getDatabase } from '@angular/fire/database';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import {AngularFireDatabaseModule} from "@angular/fire/compat/database"

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)), // Initialize Firebase
    provideAuth(() => getAuth()), // Firebase Auth
    provideDatabase(() => getDatabase()), // Optional: Realtime Database
    provideFirestore(() => getFirestore()),
    AngularFireDatabaseModule
  ],
};
