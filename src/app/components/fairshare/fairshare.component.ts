import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NavbarComponent } from "../navbar/navbar.component";

@Component({
  selector: 'app-fairshare',
  imports: [],
  templateUrl: './fairshare.component.html',
  styleUrl: './fairshare.component.css'
})
export class FairshareComponent {
  constructor(private router:Router){}
  backToDashBoard(){
    this.router.navigate(['/dashboard']);
  }
  isDarkMode: boolean = false;

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    document.body.classList.toggle('dark-theme', this.isDarkMode);
  }
}
