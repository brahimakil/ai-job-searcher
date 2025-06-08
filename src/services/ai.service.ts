import { Injectable } from '@angular/core';
import { FirebaseService } from './firebase.service';
import { environment } from '../environments/environment';
import { Job } from '../interfaces/job.interface';

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private apiKey = environment.gemini.apiKey;
  private apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

  constructor(private firebaseService: FirebaseService) {}

  async askAboutJobs(question: string, userLocation?: string): Promise<string> {
    try {
      // Get current user
      const currentUser = this.firebaseService.getCurrentUser();
      const currentUserId = currentUser?.uid || '';

      if (!currentUserId) {
        return "Please log in to use the AI job search assistant and apply to jobs.";
      }

      // Get user data to check applications
      const userData = await this.firebaseService.getUserData(currentUserId);
      const userApplications = userData.success ? (userData.data['myApplications'] || []) : [];
      const appliedJobIds = userApplications.map((app: any) => app.jobId);

      // Get all jobs from database
      const jobsResult = await this.firebaseService.getAllJobs();
      
      if (!jobsResult.success) {
        return "Sorry, I couldn't access the job database at the moment. Please try again later.";
      }

      const jobs: Job[] = jobsResult.data || [];
      
      if (!jobs || jobs.length === 0) {
        return "I don't have any job listings in the database at the moment. You can ask me to add some sample jobs to get started, or contact support to add real job listings.";
      }

      // Separate user's own jobs from other jobs
      const userJobs = jobs.filter(job => job.postedBy === currentUserId);
      const otherJobs = jobs.filter(job => job.postedBy !== currentUserId);

      // Prepare context for AI with application status
      const jobsContext = otherJobs.map((job: Job) => {
        const hasApplied = appliedJobIds.includes(job.id);
        const isFilled = job.status === 'filled';
        return `Job ID: ${job.id} | ${job.title} at ${job.company} in ${job.location}. Requirements: ${job.requirements}. Salary: ${job.salary}. Description: ${job.description}. Job Type: ${job.jobType || 'Not specified'}. Status: ${isFilled ? 'FILLED' : 'Available'}. Applied: ${hasApplied ? 'YES' : 'NO'}`;
      }).join('\n');

      const userJobsContext = userJobs.map((job: Job) => 
        `YOUR JOB ID: ${job.id} | ${job.title} at ${job.company} in ${job.location}. Requirements: ${job.requirements}. Salary: ${job.salary}. Description: ${job.description}. Job Type: ${job.jobType || 'Not specified'}`
      ).join('\n');

      const prompt = `
        You are an intelligent job search assistant with the ability to apply to jobs for users. Based on the job database, answer the user's question naturally.
        
        Available Jobs (that the user can apply to):
        ${jobsContext}
        
        User's Own Posted Jobs (that the user CANNOT apply to):
        ${userJobsContext}
        
        User Location: ${userLocation || 'Not specified'}
        User ID: ${currentUserId}
        
        User Question: ${question}
        
        IMPORTANT CAPABILITIES:
        - You can apply to jobs for the user by responding with: APPLY_TO_JOB:[JOB_ID]
        - When user wants to apply/book a job, find the matching job ID and use the APPLY_TO_JOB command
        - Be conversational and natural - understand context like "book it", "apply to that one", "let's go"
        - If user mentions a job they already applied to (Applied: YES), remind them they already applied
        - If user asks about their own jobs (YOUR JOB), tell them they posted it and can't apply
        - If job status is FILLED, tell them it's no longer available
        - Always include job title and company name when discussing specific positions
        
        Instructions:
        - Be helpful, conversational, and professional
        - Understand natural language and context
        - When user wants to apply, use APPLY_TO_JOB:[JOB_ID] in your response
        - Provide job recommendations based on user location and preferences
        - Be encouraging and supportive
        
        Please provide your response:
      `;

      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const aiResponse = data.candidates[0].content.parts[0].text;
        
        // Check if AI wants to apply to a job
        if (aiResponse.includes('APPLY_TO_JOB:')) {
          return await this.processJobApplication(aiResponse, otherJobs, currentUserId);
        }
        
        return aiResponse;
      } else {
        return "Sorry, I couldn't generate a response at the moment. Please try rephrasing your question.";
      }
    } catch (error) {
      console.error('AI Service Error:', error);
      return "Sorry, there was an error processing your request. Please try again later.";
    }
  }

  private async processJobApplication(aiResponse: string, availableJobs: Job[], userId: string): Promise<string> {
    try {
      // Extract job ID from AI response
      const match = aiResponse.match(/APPLY_TO_JOB:([^\s\n]+)/);
      if (!match) {
        return aiResponse.replace(/APPLY_TO_JOB:[^\s\n]+/g, '');
      }

      const jobId = match[1];
      const jobToApply = availableJobs.find(job => job.id === jobId);

      if (!jobToApply) {
        return aiResponse.replace(/APPLY_TO_JOB:[^\s\n]+/g, '') + "\n\nSorry, I couldn't find that job to apply to.";
      }

      // Apply to the job
      const applicationResult = await this.applyToJobForUser(jobToApply, userId);
      
      if (applicationResult.success) {
        const successMessage = `🎉 Excellent! I've successfully submitted your application for the **${jobToApply.title}** position at **${jobToApply.company}**.\n\n**Application Details:**\n• Position: ${jobToApply.title}\n• Company: ${jobToApply.company}\n• Location: ${jobToApply.location}\n• Salary: ${jobToApply.salary || 'Not specified'}\n\nYour application has been sent to the employer and they will review it soon. You can track your application status in your profile. Good luck! 🍀`;
        
        // Remove the APPLY_TO_JOB command from response and add success message
        return aiResponse.replace(/APPLY_TO_JOB:[^\s\n]+/g, '') + '\n\n' + successMessage;
      } else {
        return aiResponse.replace(/APPLY_TO_JOB:[^\s\n]+/g, '') + `\n\nI encountered an issue while submitting your application: ${applicationResult.error || 'Please try again.'}`;
      }
    } catch (error) {
      console.error('Error processing job application:', error);
      return aiResponse.replace(/APPLY_TO_JOB:[^\s\n]+/g, '') + "\n\nSorry, I encountered an error while processing your job application.";
    }
  }

  private async applyToJobForUser(job: Job, userId: string): Promise<{success: boolean, error?: string}> {
    try {
      const user = this.firebaseService.getCurrentUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const userData = await this.firebaseService.getUserData(userId);
      if (!userData.success) {
        return { success: false, error: 'Could not retrieve user profile data' };
      }

      const applicationData = {
        userId: userId,
        name: userData.data['name'] || user.displayName || 'User',
        email: userData.data['email'] || user.email,
        location: userData.data['location'] || '',
        field: userData.data['field'] || '',
        skills: userData.data['skills'] || [],
        cvBase64: userData.data['cvBase64'] || '',
        cvFileName: userData.data['cvFileName'] || '',
        appliedDate: new Date(),
        status: 'pending'
      };

      const result = await this.firebaseService.applyToJob(job.id, applicationData);
      return result;
    } catch (error: any) {
      console.error('Error in applyToJobForUser:', error);
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  }

  // Method to add sample jobs through AI chat
  async addSampleJobs(): Promise<string> {
    try {
      const result = await this.firebaseService.addSampleJobs();
      if (result.success) {
        return "Great! I've added some sample job listings to the database. You can now ask me about available positions, salary ranges, locations, and more!";
      } else {
        return "Sorry, I couldn't add sample jobs at the moment. Please try again later.";
      }
    } catch (error) {
      console.error('Error adding sample jobs:', error);
      return "Sorry, there was an error adding sample jobs. Please try again later.";
    }
  }
} 