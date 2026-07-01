import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar.component';
import { ActivatedRoute, Router } from '@angular/router';
import { GroupService } from '../../services/group.service';

@Component({
  selector: 'app-joingroup',
  imports: [CommonModule, NavbarComponent],
  templateUrl: './joingroup.component.html',
  styleUrls: ['./joingroup.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class JoingroupComponent implements OnInit {
  isLoading = false;
  success = false;
  error = '';
  sharingCode: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private groupService: GroupService
  ) {}

  ngOnInit(): void {
    // Get query parameters
    this.route.queryParams.subscribe((params) => {
      this.sharingCode = params['code'] || null;
      console.log('Sharing Code:', this.sharingCode);

      // Automatically attempt to join if code exists
      if (this.sharingCode) {
        this.joinGroup();
      } else {
        this.error = 'Invalid or missing group code';
      }
    });
  }

  // Join group with sharing code
  async joinGroup(): Promise<void> {
    if (!this.sharingCode) {
      this.error = 'No group code provided';
      return;
    }

    this.isLoading = true;
    this.error = '';
    this.success = false;

    try {
      await this.groupService.joinGroup(this.sharingCode);
      this.success = true;
      this.isLoading = false;
    } catch (error) {
      this.isLoading = false;
      this.error =
        error instanceof Error
          ? error.message
          : 'Failed to join group. Please try again.';
      console.error('Join group error:', error);
    }
  }

  // Navigate to dashboard
  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
