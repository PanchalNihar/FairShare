import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)), // Initialize Firebase
    provideAuth(() => getAuth()), // Firebase Auth
    provideFirestore(() => getFirestore()),
    AngularFirestoreModule
  ],
};
