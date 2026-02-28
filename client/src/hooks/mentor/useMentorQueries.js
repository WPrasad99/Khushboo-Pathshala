import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mentorService } from '../../services/mentor.service';

// Batches Hook
export const useMentorBatches = () => {
    return useQuery({
        queryKey: ['mentor', 'batches'],
        queryFn: () => mentorService.getBatches(),
        staleTime: 5 * 60 * 1000, // Cache for 5 mins
    });
};

// Students Hook
export const useMentorStudents = (params) => {
    return useQuery({
        queryKey: ['mentor', 'students', params],
        queryFn: () => mentorService.getStudents(params),
        staleTime: 2 * 60 * 1000,
    });
};

// Meetings Hooks
export const useMentorMeetings = (params) => {
    return useQuery({
        queryKey: ['mentor', 'meetings', params],
        queryFn: () => mentorService.getMeetings(params),
        staleTime: 1 * 60 * 1000,
    });
};

export const useScheduleMeeting = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data) => mentorService.scheduleMeeting(data),
        onSuccess: () => {
            // Invalidate meeting queries
            queryClient.invalidateQueries({ queryKey: ['mentor', 'meetings'] });
        }
    });
};

// Uploads (Sessions / Resources)
export const useMentorUploads = (type) => {
    return useQuery({
        queryKey: ['mentor', 'uploads', type],
        queryFn: () => mentorService.getUploads(type),
    });
};

export const useUploadSession = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: mentorService.uploadSession,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mentor', 'uploads'] });
        }
    });
};

export const useUploadResource = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: mentorService.uploadResource,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mentor', 'uploads'] });
        }
    });
};

export const useDeleteUpload = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: mentorService.deleteUpload,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mentor', 'uploads'] });
        }
    });
};

export const useMentorAssignments = (batchId) => {
    return useQuery({
        queryKey: ['mentor', 'assignments', batchId],
        queryFn: () => mentorService.getAssignments(batchId),
        enabled: !!batchId,
    });
};

export const useCreateAssignment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: mentorService.createAssignment,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['mentor', 'assignments', variables.batchId] });
            queryClient.invalidateQueries({ queryKey: ['mentor', 'batches'] });
        }
    });
};

export const useMentorQuizzes = (batchId) => {
    return useQuery({
        queryKey: ['mentor', 'quizzes', batchId],
        queryFn: () => mentorService.getQuizzes(batchId),
        enabled: !!batchId,
    });
};

export const useCreateQuiz = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: mentorService.createQuiz,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['mentor', 'quizzes', variables.batchId] });
        }
    });
};
