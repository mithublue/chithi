const API_URL = 'http://localhost:3001'; // In a real app, this would be in an environment variable

const getAuthHeaders = () => {
  try {
    const savedTokens = localStorage.getItem('tokens');
    if (savedTokens) {
      const { accessToken } = JSON.parse(savedTokens);
      if (accessToken) {
        return {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        };
      }
    }
  } catch (error) {
    console.error("Could not parse tokens from localStorage", error);
  }
  return { 'Content-Type': 'application/json' };
};

const handleResponse = async (response) => {
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};
    if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    return data;
}

export const api = {
  async register(email, password) {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(response);
  },

  async login(email, password) {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(response);
  },
  
  async getMe() {
    const response = await fetch(`${API_URL}/users/me`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async getThreads() {
    const response = await fetch(`${API_URL}/threads`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
  
  async getMessagesForThread(threadId) {
    const response = await fetch(`${API_URL}/threads/${threadId}/messages`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
  
  async sendMessage(receiverTag, content) {
    const response = await fetch(`${API_URL}/messages`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ receiverTag, content }),
    });
    return handleResponse(response);
  },

  async markMessageAsRead(messageId) {
    const response = await fetch(`${API_URL}/messages/${messageId}/read`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({}),
    });
    return handleResponse(response);
  },

  async blockUser(blockedUserTag) {
    const response = await fetch(`${API_URL}/block`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ blockedUserTag }),
    });
    return handleResponse(response);
  },

  async reportUser(reportedUserTag, reason) {
    const response = await fetch(`${API_URL}/report`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ reportedUserTag, reason }),
    });
    return handleResponse(response);
  },

  async updateProfile(data) {
    const response = await fetch(`${API_URL}/users/me`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    return handleResponse(response);
  }
};