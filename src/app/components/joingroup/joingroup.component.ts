import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar.component';
import { ActivatedRoute, Router } from '@angular/router';
import { GroupService } from '../../services/group.service';

@Component({
  selector: 'app-joingroup',
  imports: [CommonModule, NavbarComponent],
  templateUrl: './joingroup.component.html',
  styleUrls: ['./joingroup.component.css'],
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
    // Get the sharing code from query parameters
    this.route.queryParams.subscribe((params) => {
      this.sharingCode = params['code'] || null;  // Default to null if code is not provided
      if (!this.sharingCode) {
        this.error = 'Invalid Group Code';
      }
    });
  }

  async joinGroup() {
    if (!this.sharingCode) {
      return;
    }
    this.isLoading = true;
    this.error = '';
    try {
      await this.groupService.joinGroup(this.sharingCode);
      this.success = true;
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Failed to Join group';
    } finally {
      this.isLoading = false;
    }
  }

  navigateToDashboard() {
    this.router.navigate(['/dashboard']);
  }
}
