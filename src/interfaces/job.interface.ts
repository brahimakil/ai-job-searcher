export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  requirements: string;
  salary: string;
  description: string;
  jobType: string;
  postedDate?: Date;
  applicationDeadline?: Date | null;
  postedBy: string;
  status?: 'active' | 'filled';
} 