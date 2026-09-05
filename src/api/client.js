import { API_BASE_URL } from './config';

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (networkError) {
    throw new Error('اتصال به سرور برقرار نشد. آدرس بک‌اند را بررسی کنید.');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'خطایی در ارتباط با سرور رخ داد.');
  }
  return data;
}

export const api = {
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  me: (token) => request('/auth/me', { token }),

  getBranches: () => request('/branches'),

  getCourses: (branchId) => request(branchId ? `/courses?branch_id=${branchId}` : '/courses'),
  getCourse: (id) => request(`/courses/${id}`),
  getEnrollment: (id, token) => request(`/courses/${id}/enrollment`, { token }),
  checkout: (payload, token) => request('/payments/checkout', { method: 'POST', body: payload, token }),
  getPaymentStatus: (paymentId, token) => request(`/payments/status/${paymentId}`, { token }),

  getVideo: (id, token) => request(`/videos/${id}`, { token }),
  saveProgress: (id, payload, token) =>
    request(`/videos/${id}/progress`, { method: 'POST', body: payload, token }),

  getTest: (id, token) => request(`/tests/${id}`, { token }),
  submitTest: (id, payload, token) => request(`/tests/${id}/submit`, { method: 'POST', body: payload, token }),

  getDashboard: (token) => request('/dashboard', { token }),
  getLeaderboard: (branchId, token) =>
    request(branchId ? `/leaderboard?branch_id=${branchId}` : '/leaderboard', { token }),

  getThreads: (courseId, token) => request(`/forum/course/${courseId}`, { token }),
  createThread: (courseId, payload, token) =>
    request(`/forum/course/${courseId}`, { method: 'POST', body: payload, token }),
  getThread: (id, token) => request(`/forum/thread/${id}`, { token }),
  replyThread: (id, payload, token) =>
    request(`/forum/thread/${id}/reply`, { method: 'POST', body: payload, token }),

  getPendingPayments: (token) => request('/payments/pending', { token }),
  approvePayment: (paymentId, token) => request(`/payments/${paymentId}/approve`, { method: 'POST', token }),
  rejectPayment: (paymentId, token) => request(`/payments/${paymentId}/reject`, { method: 'POST', token }),

  getTeachers: (token) => request('/teachers', { token }),
  createTeacher: (payload, token) => request('/teachers', { method: 'POST', body: payload, token }),

  createBranch: (payload, token) => request('/branches', { method: 'POST', body: payload, token }),
  createCourse: (payload, token) => request('/courses', { method: 'POST', body: payload, token }),
  createTest: (payload, token) => request('/tests', { method: 'POST', body: payload, token }),

  getAdminStats: (token) => request('/admin-stats', { token }),
};
