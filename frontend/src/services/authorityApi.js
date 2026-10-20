import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 
  ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:5000/api' : 'https://civic-reporter.onrender.com/api');

const authorityApi = axios.create({
  baseURL: API_BASE_URL,
});

authorityApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('authorityToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const authorityLogin = async (email, password) => {
  return await authorityApi.post('/authority/login', { email, password });
};

export const getAuthorityComplaints = async (status = '', authorityType = '') => {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (authorityType) params.append('authorityType', authorityType);
  const queryString = params.toString();
  const url = queryString ? `/authority/complaints?${queryString}` : '/authority/complaints';
  return await authorityApi.get(url);
};

export const getAuthorityStats = async () => {
  return await authorityApi.get('/authority/dashboard/stats');
};

export const updateComplaintStatus = async (id, status) => {
  return await authorityApi.patch(`/authority/complaints/${id}/status`, { status });
};

export const registerAuthority = async (data) => {
  return await authorityApi.post('/authority/register', data);
};

export default authorityApi;
