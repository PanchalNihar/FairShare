import { TestBed } from '@angular/core/testing';

import { ExpenseTrackingService } from './expense-tracking.service';

describe('ExpenseTrackingService', () => {
  let service: ExpenseTrackingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExpenseTrackingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
