import api from './axios';

export const forumAPI = {
    getPosts: () => api.get('/forum/posts'),
    createPost: (data) => api.post('/forum/posts', data),
    createAnswer: (postId, content) => api.post(`/forum/posts/${postId}/answers`, { content }),
    upvoteAnswer: (answerId) => api.post(`/forum/answers/${answerId}/upvote`),
};

export default forumAPI;
