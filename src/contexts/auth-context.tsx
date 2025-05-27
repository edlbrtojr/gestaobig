"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

// Define the types for User and role
export interface User {
  username: string;
  displayName: string;
  description: string;
  roles: string[];
}

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  switchUser: (user: User) => void;
  availableTestUsers: User[];
}

const defaultTestUsers: User[] = [
  {
    username: 'admin_user',
    displayName: 'Administrator',
    description: 'Full admin privileges with read/write access to all data',
    roles: ['admin']
  },
  {
    username: 'editor_user',
    displayName: 'Editor',
    description: 'Can create and modify data but cannot manage users',
    roles: ['editor']
  },
  {
    username: 'analyst_user',
    displayName: 'Analyst',
    description: 'Can read all data and publish specific reports',
    roles: ['reader', 'publisher']
  },
  {
    username: 'reader_user',
    displayName: 'Reader',
    description: 'Read-only access to all data',
    roles: ['reader']
  },
  {
    username: 'limited_user',
    displayName: 'Limited Access',
    description: 'Very limited access to specific data only',
    roles: ['limited']
  }
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableTestUsers, setAvailableTestUsers] = useState<User[]>(defaultTestUsers);

  // Check for saved user on initial load
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setCurrentUser(parsedUser);
      } catch (e) {
        console.error('Failed to parse saved user:', e);
        localStorage.removeItem('currentUser');
      }
    } else {
      // Default to admin user if no saved user
      setCurrentUser(defaultTestUsers[0]);
      localStorage.setItem('currentUser', JSON.stringify(defaultTestUsers[0]));
    }

    // Load test users if available
    fetchTestUsers().catch(console.error);
  }, []);

  // Fetch available test users from the database
  async function fetchTestUsers() {
    try {
      const response = await fetch('/api/test-users');
      if (response.ok) {
        const data = await response.json();
        if (data.users && Array.isArray(data.users)) {
          setAvailableTestUsers(data.users);
        }
      }
    } catch (error) {
      console.error('Failed to fetch test users:', error);
      // Fall back to default test users
    }
  }

  // Login functionality
  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real app, you would validate with the server
      // Here we're just simulating by checking against test users
      const user = availableTestUsers.find(u => u.username === username);
      
      if (!user) {
        setError('User not found');
        return false;
      }
      
      // Simulate successful login
      setCurrentUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
      return true;
    } catch (error) {
      setError('Login failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout functionality
  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  // Switch user for testing
  const switchUser = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
  };

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      isLoading, 
      error, 
      login, 
      logout, 
      switchUser,
      availableTestUsers
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 