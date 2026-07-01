import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FairshareComponent } from './fairshare.component';

describe('FairshareComponent', () => {
  let component: FairshareComponent;
  let fixture: ComponentFixture<FairshareComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FairshareComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FairshareComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
