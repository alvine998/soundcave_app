import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserProfile = {
  fullName: string;
  email: string;
  password: string;
  selectedGenres?: string[];
};

const STORAGE_KEY = '@soundcave:userProfile';

export const saveUserProfile = async (profile: UserProfile) => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
};

export const updateUserProfile = async (
  updater: Partial<UserProfile> | ((current: UserProfile | null) => UserProfile),
) => {
  const currentProfile = await getUserProfile();

  let nextProfile: UserProfile;
  if (typeof updater === 'function') {
    nextProfile = updater(currentProfile);
  } else if (currentProfile) {
    nextProfile = { ...currentProfile, ...updater };
  } else {
    throw new Error('Cannot update profile: no existing profile found');
  }

  await saveUserProfile(nextProfile);
  return nextProfile;
};

export const getUserProfile = async (): Promise<UserProfile | null> => {
  const storedProfile = await AsyncStorage.getItem(STORAGE_KEY);
  if (!storedProfile) {
    return null;
  }

  try {
    return JSON.parse(storedProfile) as UserProfile;
  } catch (error) {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

export const clearUserProfile = async () => {
  await AsyncStorage.removeItem(STORAGE_KEY);
};


