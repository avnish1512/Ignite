import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Job, Application, Company } from '@/types/job';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/config/supabase';

const APPLICATIONS_STORAGE_KEY = 'placement_applications';

export const [JobsProvider, useJobs] = createContextHook(() => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      console.log('Loading jobs and applications from Supabase...');
      
      // Load jobs from Supabase
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .order('posted_date', { ascending: false });
      
      if (jobsError) throw jobsError;
      console.log('Loaded jobs from Supabase:', jobsData?.length || 0);
      
      // Convert snake_case to camelCase
      const convertedJobs = (jobsData || []).map((job: any) => ({
        id: job.id,
        title: job.title,
        company: job.company,
        companyLogo: job.company_logo,
        location: job.location,
        ctc: job.ctc,
        jobType: job.job_type,
        industry: job.industry,
        requirements: job.requirements,
        description: job.description,
        skills: job.skills,
        eligibilityStatus: job.eligibility_status,
        registrationDeadline: job.registration_deadline,
        postedDate: job.posted_date,
        isActive: job.is_active,
        driveDate: job.drive_date,
        eligibilityCriteria: job.eligibility_criteria,
        contactEmail: job.contact_email,
        contactPhone: job.contact_phone
      }));
      setJobs(convertedJobs);

      // Load applications from Supabase
      const { data: applicationsData, error: appError } = await supabase
        .from('applications')
        .select('*')
        .order('applied_date', { ascending: false });
      
      if (appError) throw appError;
      console.log('Loaded applications from Supabase:', applicationsData?.length || 0);
      
      // Convert snake_case to camelCase
      const convertedApplications = (applicationsData || []).map((app: any) => ({
        id: app.id,
        jobId: app.job_id,
        studentId: app.student_id,
        studentName: app.student_name,
        studentEmail: app.student_email,
        studentCGPA: app.student_cgpa,
        studentCourse: app.student_course,
        studentYear: app.student_year,
        studentResume: app.student_resume,
        status: app.status,
        appliedDate: app.applied_date,
        adminNotes: app.admin_notes,
        lastUpdated: app.last_updated
      }));
      setApplications(convertedApplications);
    } catch (error) {
      console.log('Error loading data from Supabase:', error);
      setJobs([]);
      setApplications([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    
    // Set up real-time listener for jobs and applications
    const channel = supabase
      .channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, () => loadData())
      .subscribe();
    
    // Cleanup listener
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  const applyToJob = useCallback(async (
    jobId: string, 
    studentId: string,
    studentData?: {
      name?: string;
      email?: string;
      cgpa?: number;
      course?: string;
      year?: string;
      resume?: string;
    }
  ) => {
    try {
      if (!jobId || !studentId) {
        console.error('Invalid input: jobId or studentId is missing', { jobId, studentId });
        return { success: false, error: 'Missing job ID or student ID' };
      }

      console.log('Attempting to apply to job:', { jobId, studentId });

      const newApplication: Application = {
        id: `${studentId}_${jobId}_${Date.now()}`,
        jobId,
        studentId,
        studentName: studentData?.name || '',
        studentEmail: studentData?.email || '',
        studentCGPA: studentData?.cgpa || null,
        studentCourse: studentData?.course || '',
        studentYear: studentData?.year || '',
        studentResume: studentData?.resume || '',
        status: 'Applied',
        appliedDate: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };

      // Save to Supabase - convert camelCase to snake_case
      const { error } = await supabase
        .from('applications')
        .insert([{
          id: newApplication.id,
          job_id: newApplication.jobId,
          student_id: newApplication.studentId,
          student_name: newApplication.studentName,
          student_email: newApplication.studentEmail,
          student_cgpa: newApplication.studentCGPA,
          student_course: newApplication.studentCourse,
          student_year: newApplication.studentYear,
          student_resume: newApplication.studentResume,
          status: newApplication.status,
          applied_date: newApplication.appliedDate,
          last_updated: newApplication.lastUpdated,
          created_at: new Date().toISOString()
        }]);
      
      if (error) throw error;
      console.log('Application saved to Supabase:', newApplication.id);

      return { success: true };
    } catch (error: any) {
      console.error('Error applying to job:', error.message);
      
      let errorMsg = 'Failed to apply to job';
      if (error.message?.includes('permission')) {
        errorMsg = 'Permission denied. Check your database permissions.';
      } else if (error.message?.includes('not found')) {
        errorMsg = 'Job not found in database.';
      } else if (error.message?.includes('network')) {
        errorMsg = 'Network error. Check your internet connection.';
      }
      
      return { success: false, error: errorMsg };
    }
  }, []);

  const getJobById = useCallback((id: string) => jobs.find(job => job.id === id), [jobs]);

  const getApplicationsForStudent = useCallback((studentId: string) => 
    applications.filter(app => app.studentId === studentId), [applications]);

  const updateApplicationStatus = useCallback(async (applicationId: string, newStatus: Application['status'], adminNotes?: string) => {
    try {
      console.log('Updating application status in Supabase:', applicationId, newStatus);
      
      const { error } = await supabase
        .from('applications')
        .update({
          status: newStatus,
          admin_notes: adminNotes || '',
          last_updated: new Date().toISOString()
        })
        .eq('id', applicationId);
      
      if (error) throw error;
      console.log('Application status updated successfully');
      
      return { success: true };
    } catch (error: any) {
      console.error('Error updating application status:', error.message);
      
      let errorMsg = 'Failed to update application status';
      if (error.message?.includes('permission')) {
        errorMsg = 'Permission denied. Check your database permissions.';
      } else if (error.message?.includes('not found')) {
        errorMsg = 'Application not found in database.';
      } else if (error.message?.includes('network')) {
        errorMsg = 'Network error. Check your internet connection.';
      }
      
      return { success: false, error: errorMsg };
    }
  }, []);

  const addJob = useCallback(async (jobData: Omit<Job, 'id'> & { id: string }) => {
    try {
      console.log('Adding new job:', jobData.title, 'at', jobData.company);
      
      const newJob: Job = {
        id: jobData.id,
        title: jobData.title,
        company: jobData.company,
        location: jobData.location,
        ctc: jobData.ctc,
        jobType: jobData.jobType,
        industry: jobData.industry,
        requirements: jobData.requirements,
        description: jobData.description,
        skills: jobData.skills,
        eligibilityStatus: jobData.eligibilityStatus,
        registrationDeadline: jobData.registrationDeadline,
        postedDate: jobData.postedDate,
        isActive: jobData.isActive,
        companyLogo: jobData.companyLogo,
        ...(jobData.driveDate && { driveDate: jobData.driveDate }),
        ...(jobData.eligibilityCriteria && { eligibilityCriteria: jobData.eligibilityCriteria }),
        ...(jobData.contactEmail && { contactEmail: jobData.contactEmail }),
        ...(jobData.contactPhone && { contactPhone: jobData.contactPhone })
      };
      
      console.log('Saving job to Supabase...');
      const { error } = await supabase
        .from('jobs')
        .insert([{
          id: newJob.id,
          title: newJob.title,
          company: newJob.company,
          company_logo: newJob.companyLogo,
          location: newJob.location,
          ctc: newJob.ctc,
          job_type: newJob.jobType,
          industry: newJob.industry,
          requirements: newJob.requirements,
          description: newJob.description,
          skills: newJob.skills,
          eligibility_status: newJob.eligibilityStatus,
          registration_deadline: newJob.registrationDeadline,
          posted_date: newJob.postedDate,
          is_active: newJob.isActive,
          drive_date: newJob.driveDate,
          eligibility_criteria: newJob.eligibilityCriteria,
          contact_email: newJob.contactEmail,
          contact_phone: newJob.contactPhone,
          created_at: new Date().toISOString()
        }]);
      
      if (error) throw error;
      console.log('✅ Job saved to Supabase successfully with ID:', jobData.id);
      
      return { success: true };
    } catch (error: any) {
      console.error('❌ Error adding job to Supabase:', error);
      
      let errorMsg = 'Failed to add job to database';
      if (error.message?.includes('permission')) {
        errorMsg = '❌ Permission denied. Check your database permissions.';
      } else if (error.message?.includes('network')) {
        errorMsg = 'Network error. Check your internet connection.';
      }
      
      return { success: false, error: errorMsg };
    }
  }, []);

  const updateJob = useCallback(async (jobId: string, updates: Partial<Job>) => {
    try {
      console.log('Updating job in Supabase:', jobId);
      
      // Convert camelCase to snake_case
      const snakeCaseUpdates: any = {};
      for (const [key, value] of Object.entries(updates)) {
        if (key === 'jobType') snakeCaseUpdates.job_type = value;
        else if (key === 'companyLogo') snakeCaseUpdates.company_logo = value;
        else if (key === 'eligibilityStatus') snakeCaseUpdates.eligibility_status = value;
        else if (key === 'registrationDeadline') snakeCaseUpdates.registration_deadline = value;
        else if (key === 'postedDate') snakeCaseUpdates.posted_date = value;
        else if (key === 'isActive') snakeCaseUpdates.is_active = value;
        else if (key === 'driveDate') snakeCaseUpdates.drive_date = value;
        else if (key === 'eligibilityCriteria') snakeCaseUpdates.eligibility_criteria = value;
        else if (key === 'contactEmail') snakeCaseUpdates.contact_email = value;
        else if (key === 'contactPhone') snakeCaseUpdates.contact_phone = value;
        else snakeCaseUpdates[key] = value;
      }
      snakeCaseUpdates.updated_at = new Date().toISOString();
      
      const { error } = await supabase
        .from('jobs')
        .update(snakeCaseUpdates)
        .eq('id', jobId);
      
      if (error) throw error;
      console.log('Job updated successfully in Supabase');
      
      return { success: true };
    } catch (error) {
      console.log('Error updating job in Supabase:', error);
      return { success: false, error: 'Failed to update job in database' };
    }
  }, []);

  const deleteJob = useCallback(async (jobId: string) => {
    try {
      console.log('Deleting job from Supabase:', jobId);
      
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId);
      
      if (error) throw error;
      console.log('Job deleted successfully from Supabase');
      
      // Immediately remove from local state so UI updates without waiting for snapshot
      setJobs(prev => prev.filter(j => j.id !== jobId));
      
      return { success: true };
    } catch (error: any) {
      console.log('Error deleting job from Supabase:', error);
      let msg = 'Failed to delete job from database';
      if (error.message?.includes('permission')) {
        msg = 'Permission denied. Make sure your database permissions allow admin to delete jobs.';
      }
      return { success: false, error: msg };
    }
  }, []);

  // Company Management Functions
  const loadCompanies = useCallback(async () => {
    try {
      console.log('Loading companies from Supabase...');
      
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('added_date', { ascending: false });
      
      if (error) throw error;
      console.log('Loaded companies from Supabase:', data?.length || 0);
      
      // Convert snake_case to camelCase
      const convertedCompanies = (data || []).map((company: any) => ({
        id: company.id,
        name: company.name,
        description: company.description,
        website: company.website,
        logo: company.logo,
        industry: company.industry,
        addedDate: company.added_date,
        addedBy: company.added_by
      }));
      
      setCompanies(convertedCompanies);
      
      return { success: true };
    } catch (error) {
      console.log('Error loading companies from Supabase:', error);
      return { success: false, error: 'Failed to load companies' };
    }
  }, []);

  const addCompany = useCallback(async (companyData: Omit<Company, 'id' | 'addedDate' | 'isActive'>) => {
    try {
      console.log('Adding new company:', companyData.name);
      
      const newCompany: Company = {
        id: `company_${Date.now()}`,
        ...companyData,
        addedDate: new Date().toISOString(),
        isActive: true
      };
      
      console.log('Saving company to Supabase...');
      const { error } = await supabase
        .from('companies')
        .insert([{
          id: newCompany.id,
          name: newCompany.name,
          description: newCompany.description,
          website: newCompany.website,
          logo: newCompany.logo,
          industry: newCompany.industry,
          added_date: newCompany.addedDate,
          added_by: newCompany.addedBy,
          is_active: newCompany.isActive,
          created_at: new Date().toISOString()
        }]);
      
      if (error) throw error;
      console.log('Company saved to Supabase successfully:', newCompany.id);
      
      return { success: true, data: newCompany };
    } catch (error: any) {
      console.error('Error adding company to Supabase:', error);
      let errorMsg = 'Failed to add company to database';
      if (error.message?.includes('permission')) {
        errorMsg = '❌ Permission denied. Check your database permissions.';
      } else if (error.message?.includes('network')) {
        errorMsg = 'Network error. Check your internet connection.';
      }
      return { success: false, error: errorMsg };
    }
  }, []);

  const updateCompany = useCallback(async (companyId: string, updates: Partial<Company>) => {
    try {
      console.log('Updating company in Supabase:', companyId);
      
      // Convert camelCase to snake_case
      const snakeCaseUpdates: any = {};
      for (const [key, value] of Object.entries(updates)) {
        if (key === 'addedDate') snakeCaseUpdates.added_date = value;
        else if (key === 'addedBy') snakeCaseUpdates.added_by = value;
        else if (key === 'isActive') snakeCaseUpdates.is_active = value;
        else snakeCaseUpdates[key] = value;
      }
      snakeCaseUpdates.updated_at = new Date().toISOString();
      
      const { error } = await supabase
        .from('companies')
        .update(snakeCaseUpdates)
        .eq('id', companyId);
      
      if (error) throw error;
      console.log('Company updated successfully in Supabase');
      
      return { success: true };
    } catch (error) {
      console.log('Error updating company in Supabase:', error);
      return { success: false, error: 'Failed to update company in database' };
    }
  }, []);

  const deleteCompany = useCallback(async (companyId: string) => {
    try {
      console.log('Deleting company from Supabase:', companyId);
      
      // Also delete all jobs associated with this company
      const { data: associatedJobs, error: fetchError } = await supabase
        .from('jobs')
        .select('id')
        .eq('company', companyId);
      
      if (fetchError) throw fetchError;
      
      if (associatedJobs && associatedJobs.length > 0) {
        const jobIds = associatedJobs.map(j => j.id);
        const { error: deleteError } = await supabase
          .from('jobs')
          .delete()
          .in('id', jobIds);
        
        if (deleteError) throw deleteError;
      }
      
      // Delete the company document itself
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', companyId);
      
      if (error) throw error;
      console.log('Company deleted successfully from Supabase');
      
      return { success: true };
    } catch (error) {
      console.log('Error deleting company from Supabase:', error);
      return { success: false, error: 'Failed to delete company from database' };
    }
  }, []);

  const clearAllData = useCallback(async () => {
    try {
      console.log('Clearing all data from Supabase...');
      
      // Clear applications
      const { error: appError } = await supabase
        .from('applications')
        .delete()
        .neq('id', '');
      
      if (appError) throw appError;
      
      // Clear jobs
      const { error: jobError } = await supabase
        .from('jobs')
        .delete()
        .neq('id', '');
      
      if (jobError) throw jobError;
      
      setJobs([]);
      setApplications([]);
      console.log('All data cleared from Supabase');
      return { success: true };
    } catch (error) {
      console.log('Error clearing data:', error);
      return { success: false, error: 'Failed to clear data' };
    }
  }, []);

  const getActiveJobs = useCallback(() => jobs.filter(job => job.isActive), [jobs]);
  
  const getJobsByCompany = useCallback((companyName: string) => 
    jobs.filter(job => job.company.toLowerCase().includes(companyName.toLowerCase())), [jobs]);

  return useMemo(() => ({
    jobs,
    applications,
    companies,
    isLoading,
    applyToJob,
    getJobById,
    getApplicationsForStudent,
    updateApplicationStatus,
    addJob,
    updateJob,
    deleteJob,
    clearAllData,
    getActiveJobs,
    getJobsByCompany,
    loadData,
    loadCompanies,
    addCompany,
    updateCompany,
    deleteCompany
  }), [
    jobs,
    applications,
    companies,
    isLoading,
    applyToJob,
    getJobById,
    getApplicationsForStudent,
    updateApplicationStatus,
    addJob,
    updateJob,
    deleteJob,
    clearAllData,
    getActiveJobs,
    getJobsByCompany,
    loadData,
    loadCompanies,
    addCompany,
    updateCompany,
    deleteCompany
  ]);
});