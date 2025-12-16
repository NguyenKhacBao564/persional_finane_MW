import { axiosClient } from './axiosClient';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

export interface UserPreferences {
  currency: 'VND' | 'USD';
  theme: 'light' | 'dark' | 'system';
}

export const getUserProfile = async (): Promise<UserProfile> => {
  const response = await axiosClient.get<{ success: boolean; data: { user: UserProfile } }>('/users/me');
  return response.data.data.user;
};

export const updateUserProfile = async (data: { name: string }): Promise<UserProfile> => {
  const response = await axiosClient.patch<{ success: boolean; data: { user: UserProfile } }>('/users/me', data);
  return response.data.data.user;
};

export const changePassword = async (data: { currentPassword: string; newPassword: string }): Promise<void> => {
  await axiosClient.post('/auth/change-password', data);
};

// Keeping preferences in localStorage for now as requested in previous context, 
// but ideally this should also be on backend if we added a preferences column.
// The prompt didn't ask to move preferences to backend, only profile and password.
export const getUserPreferences = async (): Promise<UserPreferences> => {
  return new Promise((resolve) => {
      const prefs = JSON.parse(localStorage.getItem('user_preferences') || '{"currency": "VND", "theme": "system"}');
      resolve(prefs);
  });
}

export const updateUserPreferences = async (data: Partial<UserPreferences>): Promise<UserPreferences> => {
  return new Promise((resolve) => {
      const currentPrefs = JSON.parse(localStorage.getItem('user_preferences') || '{"currency": "VND", "theme": "system"}');
      const newPrefs = { ...currentPrefs, ...data };
      localStorage.setItem('user_preferences', JSON.stringify(newPrefs));
      resolve(newPrefs);
  });
};