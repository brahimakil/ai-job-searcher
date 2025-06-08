import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FirebaseService } from '../../services/firebase.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  isCollapsed = false;
  userName = '';
  userPhoto = '';

  constructor(
    private firebaseService: FirebaseService,
    private router: Router
  ) {}

  async ngOnInit() {
    this.firebaseService.currentUser$.subscribe(async (user) => {
      if (user) {
        const userData = await this.firebaseService.getUserData(user.uid);
        if (userData.success && userData.data) {
          this.userName = userData.data['name'] || 'User';
          this.userPhoto = userData.data['profilePhoto'] || '';
        }
      }
    });
  }

  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
  }

  async logout() {
    await this.firebaseService.logout();
    this.router.navigate(['/login']);
  }
} 