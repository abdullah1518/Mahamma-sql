export const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/$/, "");

export const getStoredUserInfo = () => {
  const userInfo = JSON.parse(localStorage.getItem("userInfo") || "null");

  if (!userInfo?.token) {
    localStorage.removeItem("userInfo");
    return null;
  }

  return userInfo;
};

export const getAuthHeaders = () => {
  const userInfo = getStoredUserInfo();
  return {
    "Content-Type": "application/json",
    ...(userInfo?.token ? { Authorization: `Bearer ${userInfo.token}` } : {}),
  };
};

const handleResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : null;
  if (!response.ok) throw new Error(data?.message || "Request failed");
  return data;
};

// ─── AUTH ────────────────────────────────────────────────────────────────────

export const login = async (Email, Password) => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ Email, Password }),
  });
  return handleResponse(res);
};

export const register = async (userData) => {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  return handleResponse(res);
};

export const getProfile = async () => {
  const res = await fetch(`${API_URL}/auth/profile`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

// ─── GIGS ───────────────────────────────────────────────────────────────────

export const getTasks = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_URL}/gigs${query ? `?${query}` : ""}`);
  return handleResponse(res);
};

export const getTaskById = async (id) => {
  const res = await fetch(`${API_URL}/gigs/${id}`);
  return handleResponse(res);
};

export const createTask = async (taskData) => {
  const res = await fetch(`${API_URL}/gigs`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(taskData),
  });
  return handleResponse(res);
};

export const updateTask = async (id, taskData) => {
  const res = await fetch(`${API_URL}/gigs/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(taskData),
  });
  return handleResponse(res);
};

export const deleteTask = async (id) => {
  const res = await fetch(`${API_URL}/gigs/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

// ─── SERVICES (STUBBED) ────────────────────────────────────────────────────────
export const getServices = async () => [];
export const getServiceById = async () => null;
export const createService = async () => ({});
export const updateService = async () => ({});
export const deleteService = async () => ({});
export const getServiceReviews = async () => [];
export const getProviderReviews = async () => [];
export const createServiceOrder = async () => ({});
export const getServiceOrders = async () => [];
export const updateServiceOrderStatus = async () => ({});
export const getServiceOrderReviews = async () => [];
export const createServiceOrderReview = async () => ({});

// ─── PROPOSALS ───────────────────────────────────────────────────────────────

export const getProposalsByTask = async (taskId) => {
  const res = await fetch(`${API_URL}/gigs/${taskId}/proposals`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

export const getProposalById = async (id) => {
  const res = await fetch(`${API_URL}/proposals/${id}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

export const createProposal = async (taskId, proposalData) => {
  const res = await fetch(`${API_URL}/gigs/${taskId}/proposals`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(proposalData),
  });
  return handleResponse(res);
};

export const updateProposalStatus = async (id, Status) => {
  const res = await fetch(`${API_URL}/proposals/${id}/status`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ Status }),
  });
  return handleResponse(res);
};

export const deleteProposal = async (id) => {
  const res = await fetch(`${API_URL}/proposals/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

// ─── CONTRACTS ───────────────────────────────────────────────────────────────

export const getMyContracts = async () => {
  const res = await fetch(`${API_URL}/contracts`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

export const getContractById = async (id) => {
  const res = await fetch(`${API_URL}/contracts/${id}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

export const createContract = async (contractData) => {
  const res = await fetch(`${API_URL}/contracts`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(contractData),
  });
  return handleResponse(res);
};

export const updateContractStatus = async (id, Status) => {
  const res = await fetch(`${API_URL}/contracts/${id}/status`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ Status }),
  });
  return handleResponse(res);
};

// ─── REVIEWS ─────────────────────────────────────────────────────────────────

export const getContractReviews = async (contractId) => {
  const res = await fetch(`${API_URL}/contracts/${contractId}/reviews`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

export const createReview = async (contractId, reviewData) => {
  const res = await fetch(`${API_URL}/contracts/${contractId}/reviews`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(reviewData),
  });
  return handleResponse(res);
};

export const getReviewById = async (id) => {
  const res = await fetch(`${API_URL}/reviews/${id}`);
  return handleResponse(res);
};

// ─── ADMIN ───────────────────────────────────────────────────────────────────

export const getAdminUsers = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_URL}/admin/users${query ? `?${query}` : ""}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

export const updateUserVerification = async (userId, Verified) => {
  const res = await fetch(`${API_URL}/admin/users/${userId}/verify`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ Verified }),
  });
  return handleResponse(res);
};

export const getAdminReports = async () => {
  const res = await fetch(`${API_URL}/admin/reports`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

export const createReport = async (reportData) => {
  const res = await fetch(`${API_URL}/admin/reports`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(reportData),
  });
  return handleResponse(res);
};

export const updateReportStatus = async (reportId, Status, Resolution) => {
  const res = await fetch(`${API_URL}/admin/reports/${reportId}/status`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ Status, Resolution }),
  });
  return handleResponse(res);
};

export const deleteReview = async (id) => {
  const res = await fetch(`${API_URL}/reviews/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

// ─── MESSAGES (STUBBED) ──────────────────────────────────────────────────────
export const getConversations = async () => [];
export const createConversation = async () => ({});
export const getConversationMessages = async () => [];
export const sendConversationMessage = async () => ({});

// ─── NOTIFICATIONS (STUBBED) ─────────────────────────────────────────────────
export const getNotifications = async () => [];
export const markNotificationRead = async () => ({});
export const markAllNotificationsRead = async () => ({});
export const clearNotifications = async () => ({});

