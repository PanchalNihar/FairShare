import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ExpenseTrackingService {

  private apiUrl = `${environment.apiUrl}/groups`;

  constructor(
    private http: HttpClient
  ) {}

  async getGroupBalance(groupId: string) {

    try {

      const response: any = await firstValueFrom(

        this.http.get(
          `${this.apiUrl}/${groupId}/balance`
        )

      );

      return response.data;

    } catch (error) {

      console.error(error);

      throw error;

    }

  }

}