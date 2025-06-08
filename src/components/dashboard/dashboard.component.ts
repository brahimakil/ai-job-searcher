import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FirebaseService } from '../../services/firebase.service';
import { MainLayoutComponent } from '../../layouts/main-layout/main-layout.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MainLayoutComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  userName = 'User';
  userPhoto = '';
  stats = {
    totalJobs: 0,
    interviews: 0,
    profileCompletion: 0
  };

  constructor(private firebaseService: FirebaseService) {}

  async ngOnInit() {
    const user = this.firebaseService.getCurrentUser();
    if (user) {
      const userData = await this.firebaseService.getUserData(user.uid);
      if (userData.success && userData.data) {
        this.userName = userData.data['name'] || userData.data['displayName'] || user.displayName || 'User';
        this.userPhoto = userData.data['profilePhoto'] || user.photoURL || '';
        
        this.stats.interviews = userData.data['interviewCount'] || 0;
        this.stats.profileCompletion = this.calculateProfileCompletion(userData.data);
      } else {
        // Fallback to Firebase Auth user data
        this.userName = user.displayName || user.email?.split('@')[0] || 'User';
        this.userPhoto = user.photoURL || '';
      }
    }
    
    // Load total jobs count
    const jobsResult = await this.firebaseService.getAllJobs();
    if (jobsResult.success && jobsResult.data) {
      this.stats.totalJobs = jobsResult.data.length;
    }
  }

  calculateProfileCompletion(userData: any): number {
    if (!userData) return 0;
    
    let completedFields = 0;
    const totalFields = 8; // Total number of profile fields we check
    
    // Check each profile field
    if (userData['name']) completedFields++;
    if (userData['email']) completedFields++;
    if (userData['location']) completedFields++;
    if (userData['field']) completedFields++;
    if (userData['skills'] && userData['skills'].length > 0) completedFields++;
    if (userData['experience']) completedFields++;
    if (userData['cvBase64']) completedFields++; // Resume uploaded
    if (userData['profilePhoto']) completedFields++;
    
    return Math.round((completedFields / totalFields) * 100);
  }
} 