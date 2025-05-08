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
    const queryParams = this.route.snapshot.queryParams;
    console.log("Query Params:",queryParams)
    this.sharingCode = queryParams['code'] || null;  // Default to null if code is not provided
    if (!this.sharingCode) {
      this.error = 'Invalid Group Code';
    }
    console.log("Sharing Code:", this.sharingCode);
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
