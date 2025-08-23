const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

// Store authentication token
let authToken: string | null = null;

export const setAuthToken = (token: string) => {
  authToken = token;
  localStorage.setItem('hospital_auth_token', token);
};

export const getAuthToken = () => {
  if (typeof window !== 'undefined' && !authToken) {
    authToken = localStorage.getItem('hospital_auth_token');
  }
  return authToken;
};

export const clearAuthToken = () => {
  authToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('hospital_auth_token');
  }
};

// Generic API request function
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  try {
    const token = getAuthToken();
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  } catch (error) {
    console.error(`API Request failed for ${endpoint}:`, error);
    throw error;
  }
};

// Authentication API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: email, password }),
    });
    
    if (response.success && response.data.token) {
      setAuthToken(response.data.token);
    }
    
    return response;
  },

  register: async (userData: {
    name: string;
    email: string;
    password: string;
    role: string;
  }) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  getProfile: async () => {
    return apiRequest('/auth/profile');
  },

  logout: () => {
    clearAuthToken();
  },
};

// Patients API
export const patientsAPI = {
  getAll: async (page = 1, limit = 10) => {
    return apiRequest(`/patients?page=${page}&limit=${limit}`);
  },

  getById: async (id: string) => {
    return apiRequest(`/patients/${id}`);
  },

  create: async (patientData: {
    name: string;
    age: number;
    contactNumber: string;
    medicalHistory?: string;
    allergies?: string[];
    emergencyContact: {
      name: string;
      phone: string;
      relationship: string;
    };
  }) => {
    return apiRequest('/patients', {
      method: 'POST',
      body: JSON.stringify(patientData),
    });
  },

  update: async (id: string, patientData: any) => {
    return apiRequest(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(patientData),
    });
  },

  discharge: async (id: string) => {
    return apiRequest(`/patients/${id}/discharge`, {
      method: 'POST',
    });
  },

  assignRoom: async (patientId: string, roomId: string) => {
    return apiRequest(`/patients/${patientId}/assign-room`, {
      method: 'POST',
      body: JSON.stringify({ roomId }),
    });
  },

  getStats: async () => {
    return apiRequest('/patients/stats');
  },
};

// Rooms API
export const roomsAPI = {
  getAll: async (page = 1, limit = 10) => {
    return apiRequest(`/rooms?page=${page}&limit=${limit}`);
  },

  getById: async (id: string) => {
    return apiRequest(`/rooms/${id}`);
  },

  create: async (roomData: {
    roomNumber: string;
    type: string;
    floor: number;
    capacity: number;
    dailyRate: number;
    amenities?: string[];
  }) => {
    return apiRequest('/rooms', {
      method: 'POST',
      body: JSON.stringify(roomData),
    });
  },

  update: async (id: string, roomData: any) => {
    return apiRequest(`/rooms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(roomData),
    });
  },

  delete: async (id: string) => {
    return apiRequest(`/rooms/${id}`, {
      method: 'DELETE',
    });
  },

  getAvailable: async () => {
    return apiRequest('/rooms/available');
  },
};

// General stats API
export const statsAPI = {
  getOverall: async () => {
    return apiRequest('/stats');
  },
};
