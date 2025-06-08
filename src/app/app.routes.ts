import { Routes } from '@angular/router';
import { LoginComponent } from '../components/auth/login/login.component';
import { RegisterComponent } from '../components/auth/register/register.component';
import { DashboardComponent } from '../components/dashboard/dashboard.component';
import { JobSearchComponent } from '../components/job-search/job-search.component';
import { InterviewsComponent } from '../components/interviews/interviews.component';
import { ProfileComponent } from '../components/profile/profile.component';
import { ResumeComponent } from '../components/resume/resume.component';
import { JobPostingComponent } from '../components/job-posting/job-posting.component';
import { MyJobsComponent } from '../components/my-jobs/my-jobs.component';
import { AuthGuard } from '../services/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { 
    path: 'dashboard', 
    component: DashboardComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'job-search', 
    component: JobSearchComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'interviews', 
    component: InterviewsComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'profile', 
    component: ProfileComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'resume', 
    component: ResumeComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'post-job', 
    component: JobPostingComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'my-jobs', 
    component: MyJobsComponent,
    canActivate: [AuthGuard]
  },
  { path: '**', redirectTo: '/login' }
]; 