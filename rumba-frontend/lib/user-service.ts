'use client';

const API_BASE_URL = 'http://localhost:3005'; // Backend API URL

export interface User {
  userId: string;
  nickname: string;
}

export class UserService {
  private static USER_KEY = 'rumba_user';
  
  static async getOrCreateUser(): Promise<User> {
    // Check localStorage first
    const storedUser = this.getStoredUser();
    
    if (storedUser) {
      // Sync existing user with backend
      try {
        await this.syncUserWithBackend(storedUser);
        return storedUser;
      } catch (error) {
        console.warn('Failed to sync user with backend:', error);
        return storedUser; // Return local user if sync fails
      }
    }
    
    // Generate new user from backend
    try {
      const newUser = await this.generateUserFromBackend();
      this.storeUser(newUser);
      return newUser;
    } catch (error) {
      console.error('Failed to generate user from backend:', error);
      
      // Fallback: create user locally
      const fallbackUser = this.generateFallbackUser();
      this.storeUser(fallbackUser);
      return fallbackUser;
    }
  }
  
  static getStoredUser(): User | null {
    try {
      const stored = localStorage.getItem(this.USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to parse stored user:', error);
      return null;
    }
  }
  
  static storeUser(user: User): void {
    try {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Failed to store user:', error);
    }
  }
  
  static clearUser(): void {
    try {
      localStorage.removeItem(this.USER_KEY);
    } catch (error) {
      console.error('Failed to clear user:', error);
    }
  }
  
  private static async generateUserFromBackend(): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to generate user');
    }
    
    return result.data;
  }
  
  private static async syncUserWithBackend(user: User): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/users/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(user),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to sync user');
    }
    
    // Update local storage with any changes from backend
    this.storeUser(result.data);
  }
  
  private static generateFallbackUser(): User {
    const adjectives = [
      'Swift', 'Clever', 'Bright', 'Quick', 'Smart', 'Sharp', 'Fast', 'Wise', 
      'Bold', 'Cool', 'Epic', 'Super', 'Mega', 'Ultra', 'Pro', 'Master'
    ];
    
    const nouns = [
      'Player', 'Solver', 'Gamer', 'Wizard', 'Hero', 'Champion', 'Genius', 
      'Expert', 'Ninja', 'Warrior', 'King', 'Queen', 'Fox', 'Wolf', 'Eagle', 'Tiger'
    ];

    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const number = Math.floor(Math.random() * 999) + 1;
    
    // Generate simple user ID for fallback
    const userId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const nickname = `${adjective}${noun}${number}`;
    
    return { userId, nickname };
  }
}