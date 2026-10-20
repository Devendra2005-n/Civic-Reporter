import axios from 'axios';
import { auth } from '../config/firebase'; // needed to get the token directly in the interceptor

const API_BASE_URL = import.meta.env.VITE_API_URL || 
  ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:5000/api' : 'https://civic-reporter.onrender.com/api');

const api = axios.create({
  baseURL: API_BASE_URL, 
});

// Add interceptor to attach Firebase ID token to every request
api.interceptors.request.use(async (config) => {
  if (auth.currentUser) {
    const token = await auth.currentUser.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Upload image to Cloudinary
export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);
  return api.post('/upload', formData);
};

// Analyze image with AI — now accepts userName, locationAddress, and authorityInfo
export const analyzeImage = async (file, { userName = '', locationAddress = '', authorityInfo = null } = {}) => {
  // First, upload to cloudinary via our endpoint
  const uploadRes = await uploadImage(file);
  const imageUrl = uploadRes.data.imageUrl;
  
  // Second, hit NVIDIA AI with the generated imageUrl + user context + authority
  const aiRes = await api.post('/ai/analyze', { imageUrl, userName, locationAddress, authorityInfo });
  
  // Attach imageUrl to result so Submit page has it
  return { data: { ...aiRes.data, imageUrl } };
};

// AI-based duplicate detection — uses semantic similarity via embeddings
export const checkDuplicate = async (problemType, description, locationData = {}) => {
  return api.post('/duplicates/check', {
    problemType,
    description,
    state: locationData.state || '',
    district: locationData.district || '',
    city: locationData.city || '',
    area: locationData.area || '',
  });
};

// Complaints CRUD
export const createComplaint = async (complaintData) => {
  return await api.post('/complaints', complaintData);
};

export const updateComplaint = async (id, updateData) => {
  return await api.patch(`/complaints/${id}`, updateData);
};

export const getComplaints = async () => {
  return await api.get('/complaints');
};

export const getComplaintById = async (id) => {
  return await api.get(`/complaints/${id}`);
};

export const getComplaintsByUser = async (userId) => {
  return await api.get(`/complaints/user/${userId}`);
};

export const upvoteComplaint = async (id) => {
  return await api.patch(`/complaints/${id}/upvote`, {});
};

export const addComplaintIssue = async (id, newIssue, newImageUrl = "") => {
  return await api.patch(`/complaints/${id}/add-issue`, { newIssue, newImageUrl });
};

export const editComplaint = async (id, updateData) => {
  return await api.patch(`/complaints/${id}/edit-complaint`, updateData);
};

export const citizenResolveComplaint = async (id, resolutionData) => {
  return await api.post(`/complaints/${id}/citizen-resolve`, resolutionData);
};

// Send email notification manually (Admin only)
export const sendComplaintEmail = async (id, emailData) => {
  return await api.post(`/complaints/${id}/send-email`, emailData);
};

// Authority detection
export const detectAuthority = async (lat, lng) => {
  return await api.post('/authority/detect', { lat, lng });
};

// Translate complaint letter
export const translateLetter = async (text, targetLanguage) => {
  return await api.post('/ai/translate', { text, targetLanguage });
};

// User Management (Admin / RBAC)
export const getUsers = async () => {
  return await api.get('/users');
};

export const promoteUser = async (uid) => {
  return await api.put(`/users/promote/${uid}`);
};

export const demoteUser = async (uid) => {
  return await api.put(`/users/demote/${uid}`);
};

export const deleteUser = async (uid) => {
  return await api.delete(`/users/${uid}`);
};

export const requestAdminAccess = async () => {
  return await api.post('/users/request-admin');
};

export const getAdminRequests = async () => {
  return await api.get('/users/admin-requests');
};

export const approveAdminRequest = async (uid) => {
  return await api.put(`/users/admin-requests/${uid}/approve`);
};

export const rejectAdminRequest = async (uid) => {
  return await api.put(`/users/admin-requests/${uid}/reject`);
};

// --- Notifications ---

export const getNotifications = async () => {
  return await api.get('/notifications');
};

export const markNotificationAsRead = async (id) => {
  return await api.put(`/notifications/${id}/read`);
};

// Complaint specific admin action
export const deleteComplaint = async (id) => {
  return await api.delete(`/complaints/${id}`);
};

// --- AI Category Validation ---
export const validateCategory = async (imageUrl, selectedCategory) => {
  return await api.post('/ai/validate-category', { imageUrl, selectedCategory });
};

// --- Reputation System ---
export const getUserReputation = async (uid) => {
  return await api.get(`/users/reputation/${uid}`);
};

export const updateUserReputation = async (uid, action) => {
  return await api.put(`/users/reputation/${uid}`, { action });
};

export const checkCanSubmit = async (uid) => {
  return await api.get(`/users/can-submit/${uid}`);
};

// --- OTP Verification ---
export const sendOTP = async (email, name) => {
  return await api.post('/otp/send', { email, name });
};

export const verifyOTP = async (email, otp) => {
  return await api.post('/otp/verify', { email, otp });
};

export const checkEmailVerified = async (email) => {
  return await api.get(`/otp/check/${encodeURIComponent(email)}`);
};

// --- Location Extraction from Image EXIF ---
export const extractLocationFromImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);
  return api.post('/location/extract', formData);
};

export const reverseGeocodeLocation = async (lat, lng) => {
  return api.get(`/location/reverse?lat=${lat}&lng=${lng}`);
};

export default api;
