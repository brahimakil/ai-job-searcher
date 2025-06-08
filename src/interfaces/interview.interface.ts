export interface Interview {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  employerId: string;
  employerName: string;
  candidateId: string;
  candidateName: string;
  scheduledDate: Date;
  scheduledTime: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  location?: string;
  notes?: string;
  createdAt: Date;
}

export interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  userId: string;
  userName: string;
  userEmail: string;
  appliedDate: Date;
  status: 'pending' | 'accepted' | 'rejected' | 'interview_scheduled';
  cvBase64?: string;
  coverLetter?: string;
  interviewDate?: Date;
  interviewTime?: string;
}