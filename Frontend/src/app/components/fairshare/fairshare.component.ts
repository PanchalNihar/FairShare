import { Component, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-fairshare',
  imports: [NavbarComponent, CommonModule],
  templateUrl: './fairshare.component.html',
  styleUrl: './fairshare.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class FairshareComponent {
  constructor(private router: Router) {}

  backToDashBoard(): void {
    this.router.navigate(['/dashboard']);
  }
}
