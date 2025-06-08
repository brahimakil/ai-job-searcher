import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, getDocs, query, where, deleteDoc, addDoc, Timestamp } from 'firebase/firestore';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../environments/environment';
import { Job } from '../interfaces/job.interface';
import { Interview, Application } from '../interfaces/interview.interface';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private app = initializeApp(environment.firebase);
  private auth = getAuth(this.app);
  private firestore = getFirestore(this.app);
  
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    onAuthStateChanged(this.auth, (user) => {
      this.currentUserSubject.next(user);
    });
  }

  async register(userData: any) {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        this.auth, 
        userData.email, 
        userData.password
      );
      
      // Save additional user data to Firestore
      await setDoc(doc(this.firestore, 'users', userCredential.user.uid), {
        name: userData.name,
        email: userData.email,
        field: userData.field,
        location: userData.location,
        cvBase64: userData.cvBase64,
        profilePhoto: '',
        skills: [],
        createdAt: new Date(),
        uid: userCredential.user.uid
      });

      return { success: true, user: userCredential.user };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async login(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async logout() {
    try {
      await signOut(this.auth);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getUserData(uid: string) {
    try {
      const docRef = doc(this.firestore, 'users', uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { success: true, data: docSnap.data() };
      } else {
        return { success: false, error: 'No user data found' };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async updateUserData(uid: string, data: any) {
    try {
      const docRef = doc(this.firestore, 'users', uid);
      await updateDoc(docRef, data);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Method to get all jobs for AI processing with proper typing
  async getAllJobs(): Promise<{ success: boolean; data?: Job[]; error?: string }> {
    try {
      const jobsCollection = collection(this.firestore, 'jobs');
      const jobsSnapshot = await getDocs(jobsCollection);
      const jobs: Job[] = jobsSnapshot.docs.map(doc => ({
        id: doc.id,
        title: doc.data()['title'] || '',
        company: doc.data()['company'] || '',
        location: doc.data()['location'] || '',
        requirements: doc.data()['requirements'] || '',
        salary: doc.data()['salary'] || '',
        description: doc.data()['description'] || '',
        jobType: doc.data()['jobType'] || '',
        postedDate: doc.data()['postedDate']?.toDate() || new Date(),
        applicationDeadline: doc.data()['applicationDeadline']?.toDate() || null,
        postedBy: doc.data()['postedBy'] || ''
      }));
      return { success: true, data: jobs };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Method to add sample jobs for testing
  async addSampleJobs() {
    try {
      const sampleJobs: Omit<Job, 'id'>[] = [
        {
          title: 'Senior Software Engineer',
          company: 'TechCorp Inc.',
          location: 'New York, NY',
          requirements: 'React, Node.js, TypeScript, 5+ years experience',
          salary: '$120,000 - $150,000',
          description: 'We are looking for a senior software engineer to join our growing team...',
          jobType: 'Full-time',
          postedBy: ''
        },
        {
          title: 'Frontend Developer',
          company: 'StartupXYZ',
          location: 'San Francisco, CA',
          requirements: 'Angular, JavaScript, CSS, 3+ years experience',
          salary: '$90,000 - $120,000',
          description: 'Join our innovative startup as a frontend developer...',
          jobType: 'Full-time',
          postedBy: ''
        },
        {
          title: 'Data Scientist',
          company: 'DataCorp',
          location: 'Remote',
          requirements: 'Python, Machine Learning, SQL, PhD preferred',
          salary: '$130,000 - $160,000',
          description: 'We need a data scientist to help us analyze large datasets...',
          jobType: 'Remote',
          postedBy: ''
        },
        {
          title: 'Product Manager',
          company: 'InnovateTech',
          location: 'Austin, TX',
          requirements: 'Product management, Agile, 4+ years experience',
          salary: '$110,000 - $140,000',
          description: 'Lead product development for our cutting-edge platform...',
          jobType: 'Full-time',
          postedBy: ''
        },
        {
          title: 'UX Designer',
          company: 'DesignStudio',
          location: 'Los Angeles, CA',
          requirements: 'Figma, Adobe Creative Suite, User Research, 3+ years experience',
          salary: '$85,000 - $110,000',
          description: 'Create amazing user experiences for our digital products...',
          jobType: 'Full-time',
          postedBy: ''
        }
      ];

      for (const job of sampleJobs) {
        const jobRef = doc(collection(this.firestore, 'jobs'));
        await setDoc(jobRef, {
          ...job,
          postedDate: new Date(),
          applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          postedBy: ''
        });
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  getCurrentUser() {
    return this.auth.currentUser;
  }

  async createJob(jobData: any) {
    try {
      const jobRef = doc(collection(this.firestore, 'jobs'));
      await setDoc(jobRef, {
        ...jobData,
        id: jobRef.id,
        createdAt: new Date(),
        postedBy: jobData.postedBy || ''
      });
      return { success: true, jobId: jobRef.id };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getJobsByUser(userId: string) {
    try {
      const jobsCollection = collection(this.firestore, 'jobs');
      const q = query(jobsCollection, where('postedBy', '==', userId));
      const jobsSnapshot = await getDocs(q);
      const jobs = jobsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return { success: true, data: jobs };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async applyToJob(jobId: string, applicantData: any) {
    try {
      const jobRef = doc(this.firestore, 'jobs', jobId);
      const jobDoc = await getDoc(jobRef);
      
      if (jobDoc.exists()) {
        const currentApplications = jobDoc.data()['applications'] || [];
        const newApplication = {
          ...applicantData,
          appliedDate: new Date(),
          status: 'pending'
        };
        
        await updateDoc(jobRef, {
          applications: [...currentApplications, newApplication]
        });

        // Also add to user's applications
        const userRef = doc(this.firestore, 'users', applicantData.userId);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userApplications = userDoc.data()['myApplications'] || [];
          userApplications.push({
            jobId: jobId,
            jobTitle: jobDoc.data()['title'],
            company: jobDoc.data()['company'],
            appliedDate: new Date(),
            status: 'pending'
          });
          
          await updateDoc(userRef, {
            myApplications: userApplications
          });
        }

        return { success: true };
      } else {
        return { success: false, error: 'Job not found' };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getJobApplications(jobId: string) {
    try {
      const jobRef = doc(this.firestore, 'jobs', jobId);
      const jobDoc = await getDoc(jobRef);
      
      if (jobDoc.exists()) {
        return { success: true, data: jobDoc.data()['applications'] || [] };
      } else {
        return { success: false, error: 'Job not found' };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async updateApplicationStatus(jobId: string, applicantId: string, status: 'accepted' | 'rejected') {
    try {
      const jobRef = doc(this.firestore, 'jobs', jobId);
      const jobDoc = await getDoc(jobRef);
      
      if (jobDoc.exists()) {
        const applications = jobDoc.data()['applications'] || [];
        const updatedApplications = applications.map((app: any) => 
          app.userId === applicantId ? { ...app, status } : app
        );
        
        await updateDoc(jobRef, {
          applications: updatedApplications
        });

        // Update user's application status
        const userRef = doc(this.firestore, 'users', applicantId);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userApplications = userDoc.data()['myApplications'] || [];
          const updatedUserApplications = userApplications.map((app: any) => 
            app.jobId === jobId ? { ...app, status } : app
          );
          
          await updateDoc(userRef, {
            myApplications: updatedUserApplications
          });
        }

        return { success: true };
      } else {
        return { success: false, error: 'Job not found' };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Accept job application and schedule interview
  async acceptApplicationAndScheduleInterview(
    jobId: string, 
    applicantId: string, 
    interviewDate: Date, 
    interviewTime: string
  ) {
    try {
      const jobRef = doc(this.firestore, 'jobs', jobId);
      const jobDoc = await getDoc(jobRef);
      
      if (!jobDoc.exists()) {
        return { success: false, error: 'Job not found' };
      }

      const jobData = jobDoc.data();
      const applications = jobData['applications'] || [];
      
      // Find the accepted application
      const acceptedApplication = applications.find((app: any) => app.userId === applicantId);
      if (!acceptedApplication) {
        return { success: false, error: 'Application not found' };
      }

      // Update application status to accepted
      const updatedApplications = applications.map((app: any) => 
        app.userId === applicantId 
          ? { ...app, status: 'interview_scheduled', interviewDate, interviewTime }
          : app
      );

      await updateDoc(jobRef, {
        applications: updatedApplications,
        status: 'filled' // Mark job as filled
      });

      // Create interview record
      const interviewData: Omit<Interview, 'id'> = {
        jobId,
        jobTitle: jobData['title'],
        company: jobData['company'],
        employerId: jobData['postedBy'],
        employerName: '', // Will be filled from user data
        candidateId: applicantId,
        candidateName: acceptedApplication.userName || acceptedApplication.name,
        scheduledDate: interviewDate,
        scheduledTime: interviewTime,
        status: 'scheduled',
        location: jobData['location'],
        createdAt: new Date()
      };

      // Get employer name
      const employerDoc = await getDoc(doc(this.firestore, 'users', jobData['postedBy']));
      if (employerDoc.exists()) {
        interviewData.employerName = employerDoc.data()['name'];
      }

      const interviewRef = await addDoc(collection(this.firestore, 'interviews'), interviewData);

      // Update user's application status
      const userRef = doc(this.firestore, 'users', applicantId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userApplications = userDoc.data()['myApplications'] || [];
        const updatedUserApplications = userApplications.map((app: any) => 
          app.jobId === jobId 
            ? { ...app, status: 'interview_scheduled', interviewDate, interviewTime }
            : app
        );
        
        await updateDoc(userRef, {
          myApplications: updatedUserApplications
        });
      }

      return { success: true, interviewId: interviewRef.id };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Get interviews for a user (both as employer and candidate)
  async getUserInterviews(userId: string) {
    try {
      const interviewsCollection = collection(this.firestore, 'interviews');
      
      // Get interviews where user is employer
      const employerQuery = query(interviewsCollection, where('employerId', '==', userId));
      const employerSnapshot = await getDocs(employerQuery);
      
      // Get interviews where user is candidate
      const candidateQuery = query(interviewsCollection, where('candidateId', '==', userId));
      const candidateSnapshot = await getDocs(candidateQuery);
      
      const employerInterviews = employerSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        role: 'employer'
      }));
      
      const candidateInterviews = candidateSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        role: 'candidate'
      }));
      
      return { 
        success: true, 
        data: {
          asEmployer: employerInterviews,
          asCandidate: candidateInterviews
        }
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Remove job from available jobs (when filled)
  async removeJobFromAvailable(jobId: string) {
    try {
      const jobRef = doc(this.firestore, 'jobs', jobId);
      await updateDoc(jobRef, {
        status: 'filled',
        isActive: false
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Get only active/available jobs - FIXED VERSION
  async getAvailableJobs(): Promise<{ success: boolean; data?: Job[]; error?: string }> {
    try {
      const jobsCollection = collection(this.firestore, 'jobs');
      const jobsSnapshot = await getDocs(jobsCollection);
      
      const jobs: Job[] = jobsSnapshot.docs
        .filter(docSnapshot => {
          const data = docSnapshot.data();
          return data['status'] !== 'filled' && data['isActive'] !== false;
        })
        .map(docSnapshot => ({
          id: docSnapshot.id,
          title: docSnapshot.data()['title'] || '',
          company: docSnapshot.data()['company'] || '',
          location: docSnapshot.data()['location'] || '',
          requirements: docSnapshot.data()['requirements'] || '',
          salary: docSnapshot.data()['salary'] || '',
          description: docSnapshot.data()['description'] || '',
          jobType: docSnapshot.data()['jobType'] || '',
          postedDate: docSnapshot.data()['postedDate']?.toDate() || new Date(),
          applicationDeadline: docSnapshot.data()['applicationDeadline']?.toDate() || null,
          postedBy: docSnapshot.data()['postedBy'] || ''
        }));
      
      return { success: true, data: jobs };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Update interview status
  async updateInterviewStatus(interviewId: string, status: 'scheduled' | 'completed' | 'cancelled') {
    try {
      const interviewRef = doc(this.firestore, 'interviews', interviewId);
      await updateDoc(interviewRef, { status });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Update job data
  async updateJobData(jobId: string, updateData: any) {
    try {
      const jobRef = doc(this.firestore, 'jobs', jobId);
      await updateDoc(jobRef, updateData);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Delete job
  async deleteJob(jobId: string) {
    try {
      const jobRef = doc(this.firestore, 'jobs', jobId);
      await deleteDoc(jobRef);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
} 