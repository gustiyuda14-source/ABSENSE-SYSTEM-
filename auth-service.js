// auth-service.js — Authentication logic

class AuthService {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.currentUser = this.loadUserFromStorage();
  }

  loadUserFromStorage() {
    const stored = localStorage.getItem('currentUser');
    return stored ? JSON.parse(stored) : null;
  }

  saveUserToStorage(user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUser = user;
  }

  clearUserFromStorage() {
    localStorage.removeItem('currentUser');
    this.currentUser = null;
  }

  async register(username, email, password, firstName, lastName, department) {
    try {
      const response = await this.apiClient.post('/api/auth/register', {
        username,
        email,
        password,
        firstName,
        lastName,
        department,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async login(username, password) {
    try {
      const response = await this.apiClient.post('/api/auth/login', {
        username,
        password,
      });

      if (response.success && response.data.tokens) {
        // Store tokens
        this.apiClient.setTokens(
          response.data.tokens.accessToken,
          response.data.tokens.refreshToken
        );

        // Store user data
        this.saveUserToStorage(response.data.user);

        return {
          success: true,
          user: response.data.user,
        };
      }

      throw new Error('Invalid response from server');
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async logout() {
    try {
      await this.apiClient.post('/api/auth/logout', {
        refreshToken: this.apiClient.refreshToken,
      });
    } catch (error) {
      console.warn('Logout error (continuing anyway):', error);
    }

    // Clear tokens and user regardless of response
    this.apiClient.clearTokens();
    this.clearUserFromStorage();

    return { success: true };
  }

  async getCurrentUser() {
    try {
      // Return cached user if available
      if (this.currentUser) {
        return { success: true, user: this.currentUser };
      }

      // Otherwise fetch from API
      const response = await this.apiClient.get('/api/auth/me');

      if (response.success) {
        this.saveUserToStorage(response.data);
        return { success: true, user: response.data };
      }

      throw new Error('Failed to fetch user');
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async refreshToken() {
    try {
      const response = await this.apiClient.refreshAccessToken();
      return { success: response };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  isAuthenticated() {
    return !!this.apiClient.getAccessToken() && !!this.currentUser;
  }

  getCurrentUserSync() {
    return this.currentUser;
  }

  getToken() {
    return this.apiClient.getAccessToken();
  }
}

// Create singleton instance
const authService = new AuthService(window.apiClient);

// Export for use
if (typeof window !== 'undefined') {
  window.authService = authService;
}
