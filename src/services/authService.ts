import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api.config';

const API_URL = API_CONFIG.AUTH_URL;
const TOKEN_KEY = '@wakaku_auth_token';
const USER_KEY = '@wakaku_user';

export interface User {
    id: number;
    username: string;
    email?: string;
    user_type: 'user' | 'caretaker';
    gender?: 'male' | 'female' | 'other';
    created_at: string;
    updated_at: string;
    is_active: boolean;
    last_login?: string;
}

export interface LoginResponse {
    token: string;
    user: User;
    expires_in: number;
}

export interface RegisterData {
    username: string;
    email: string;
    password: string;
    user_type: 'user' | 'caretaker';
}

class AuthService {
    /**
     * Register a new user
     */
    async register(registerData: RegisterData): Promise<LoginResponse> {
        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(registerData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Registration failed');
            }

            // Store token and user data
            await this.storeToken(data.token);
            await this.storeUser(data.user);

            return data;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }

    /**
     * Login with username and password
     */
    async login(username: string, password: string): Promise<LoginResponse> {
        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            // Store token and user data
            await this.storeToken(data.token);
            await this.storeUser(data.user);

            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    /**
     * Logout and clear stored credentials
     */
    async logout(): Promise<void> {
        try {
            const token = await this.getToken();

            if (token) {
                // Call backend logout endpoint
                await fetch(`${API_URL}/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clear local storage regardless of backend response
            await this.clearAuth();
        }
    }

    /**
     * Verify if the current token is valid
     */
    async verifyToken(): Promise<{ valid: boolean; user?: User }> {
        try {
            const token = await this.getToken();

            if (!token) {
                return { valid: false };
            }

            const response = await fetch(`${API_URL}/verify`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (response.ok) {
                // Update stored user data
                await this.storeUser(data.user);
                return { valid: true, user: data.user };
            }

            // Token is invalid, clear storage
            await this.clearAuth();
            return { valid: false };
        } catch (error) {
            console.error('Token verification error:', error);
            await this.clearAuth();
            return { valid: false };
        }
    }

    /**
     * Get current authenticated user
     */
    async getCurrentUser(): Promise<User | null> {
        try {
            const token = await this.getToken();

            if (!token) {
                return null;
            }

            const response = await fetch(`${API_URL}/me`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (response.ok) {
                await this.storeUser(data.user);
                return data.user;
            }

            return null;
        } catch (error) {
            console.error('Get current user error:', error);
            return null;
        }
    }

    /**
     * Store authentication token
     */
    async storeToken(token: string): Promise<void> {
        try {
            await AsyncStorage.setItem(TOKEN_KEY, token);
        } catch (error) {
            console.error('Error storing token:', error);
        }
    }

    /**
     * Get stored authentication token
     */
    async getToken(): Promise<string | null> {
        try {
            return await AsyncStorage.getItem(TOKEN_KEY);
        } catch (error) {
            console.error('Error getting token:', error);
            return null;
        }
    }

    /**
     * Store user data
     */
    async storeUser(user: User): Promise<void> {
        try {
            await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
        } catch (error) {
            console.error('Error storing user:', error);
        }
    }

    /**
     * Get stored user data
     */
    async getUser(): Promise<User | null> {
        try {
            const userJson = await AsyncStorage.getItem(USER_KEY);
            return userJson ? JSON.parse(userJson) : null;
        } catch (error) {
            console.error('Error getting user:', error);
            return null;
        }
    }

    /**
     * Clear all authentication data
     */
    async clearAuth(): Promise<void> {
        try {
            await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
        } catch (error) {
            console.error('Error clearing auth:', error);
        }
    }

    /**
     * Check if user is authenticated
     */
    async isAuthenticated(): Promise<boolean> {
        const token = await this.getToken();
        return token !== null;
    }

    /**
     * Get list of users
     */
    async getUsers(userType?: 'user' | 'caretaker', includeSelf: boolean = true): Promise<User[]> {
        try {
            const token = await this.getToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const params = new URLSearchParams();
            if (userType) {
                params.append('user_type', userType);
            }
            params.append('include_self', String(includeSelf));

            const url = `${API_URL}/users?${params.toString()}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch users');
            }

            return data.users;
        } catch (error) {
            console.error('Get users error:', error);
            throw error;
        }
    }

    /**
     * Make authenticated API request
     */
    async makeAuthenticatedRequest(
        url: string,
        options: RequestInit = {}
    ): Promise<Response> {
        const token = await this.getToken();

        if (!token) {
            throw new Error('No authentication token found');
        }

        const headers = {
            ...options.headers,
            'Authorization': `Bearer ${token}`,
        };

        const response = await fetch(url, {
            ...options,
            headers,
        });

        // If token is expired, clear auth and throw error
        if (response.status === 401) {
            await this.clearAuth();
            throw new Error('Authentication expired');
        }

        return response;
    }
}

// Export singleton instance
export const authService = new AuthService();
