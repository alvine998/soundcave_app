import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';

import { PlayerProvider } from './src/components/Player';
import { PlaylistProvider } from './src/components/PlaylistContext';
import { ToastProvider } from './src/components/Toast';
import { COLORS } from './src/config/color';
import GenresScreen from './src/screens/Genres';
import LoginScreen from './src/screens/Login';
import RegisterScreen from './src/screens/Register';
import WelcomeScreen from './src/screens/Welcome';
import SplashScreen from './src/screens/Splash';
import FullPlayerScreen from './src/screens/FullPlayer';
import MusicVideoDetailScreen from './src/screens/MusicVideoDetail';
import PodcastDetailScreen from './src/screens/PodcastDetail';
import AboutScreen from './src/screens/About';
import HelpScreen from './src/screens/Help';
import EditProfileScreen from './src/screens/EditProfile';
import NewsScreen from './src/screens/News';
import NewsDetailScreen from './src/screens/NewsDetail';
import MusicGenreScreen from './src/screens/MusicGenre';
import PlaylistSongsScreen from './src/screens/PlaylistSongs';
import AlbumSongsScreen from './src/screens/AlbumSongs';
import ProfileScreen from './src/screens/Profile';
import HomeTabs from './src/navigation/HomeTabs';
import {
  clearUserProfile,
  getUserProfile,
  UserProfile,
} from './src/storage/userStorage';
import { clearToken } from './src/storage/tokenStorage';
import { resetApiInstance } from './src/utils/api';
import { navigationRef } from './src/utils/navigationService';
import { configureGoogleSignIn, signOutGoogle } from './src/utils/googleAuth';
import ArtistDetailScreen from './src/screens/ArtistDetail';
import LiveStreamDetailScreen from './src/screens/LiveStreamDetail';
import GoLiveScreen from './src/screens/GoLive';



type RootStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  Genres: undefined;
  Home: undefined;
  FullPlayer: undefined;
  MusicVideoDetail: {
    id: string;
    title: string;
    artist: string;
    cover: string;
    videoUrl?: string;
  };
  PodcastDetail: {
    id: string;
    title: string;
    duration: string;
    cover: string;
    audioUrl?: string;
  };
  About: undefined;
  Help: undefined;
  EditProfile: {
    profile: UserProfile;
    onSave: (updatedProfile: UserProfile) => void;
  };
  News: undefined;
  NewsDetail: {
    id: string;
  };
  MusicGenre: {
    genre: string;
  };
  PlaylistSongs: {
    playlistId: number;
    playlistName?: string;
    playlistCover?: string;
  };
  AlbumSongs: {
    albumId: number;
    albumTitle: string;
    albumImage: string | null;
  };
  ArtistDetail: {
    id: number;
    name: string;
    image: string | null;
  };
  Profile: undefined;
  LiveStreamDetail: {
    id: string;
    title: string;
    streamer: string;
    viewerCount: number;
    cover: string;
    thumbnail: string;
    avatar: string;
    playbackUrl?: string;
  };
  GoLive: undefined;
};



enableScreens(true);

const Stack = createNativeStackNavigator<RootStackParamList>();

function App() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [navReady, setNavReady] = useState(false);
  const navigationStateChangeRef = useRef<((routeName: string | null) => void) | null>(null);

  useEffect(() => {
    const bootstrapProfile = async () => {
      // Initialize Google Sign-In
      configureGoogleSignIn();

      const storedProfile = await getUserProfile();
      if (storedProfile) {
        setProfile(storedProfile);
      }
    };

    bootstrapProfile();
  }, []);

  useEffect(() => {
    if (!navReady) {
      return;
    }

    // Only auto-navigate if not on Splash screen
    const state = navigationRef.current?.getRootState();
    const currentRoute = state?.routes[state?.index || 0]?.name;

    if (currentRoute === 'Splash') {
      // Don't navigate away from Splash - let it handle navigation itself
      return;
    }

    const targetRoute: keyof RootStackParamList = profile
      ? profile.selectedGenres && profile.selectedGenres.length
        ? 'Home'
        : 'Genres'
      : 'Welcome';

    navigationRef.current?.reset({
      index: 0,
      routes: [{ name: targetRoute }],
    });
  }, [navReady, profile]);

  const handleLogout = async () => {
    try {
      await signOutGoogle();
    } catch {}
    await clearUserProfile();
    await clearToken();
    resetApiInstance();
    setProfile(null);
  };

  const handleProfileUpdate = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
    // TODO: Save to AsyncStorage if needed
  };

  const initialRoute = useMemo(() => {
    return 'Splash' as keyof RootStackParamList;
  }, []);

  return (
    <ToastProvider>
      <SafeAreaProvider>
        <PlaylistProvider>
          <PlayerProvider
            navigationRef={navigationRef}
            onNavigationStateChange={(callback) => {
              navigationStateChangeRef.current = callback;
            }}>
            <NavigationContainer
              ref={navigationRef}
              onReady={() => setNavReady(true)}
              onStateChange={() => {
                // Get current route name
                const state = navigationRef.current?.getRootState();
                if (state && navigationStateChangeRef.current) {
                  const findCurrentRoute = (navState: any): string | null => {
                    if (!navState) {
                      return null;
                    }
                    if (navState.index !== undefined && navState.routes) {
                      const route = navState.routes[navState.index];
                      if (route.state) {
                        return findCurrentRoute(route.state);
                      }
                      return route.name;
                    }
                    return null;
                  };
                  const currentRoute = findCurrentRoute(state);
                  navigationStateChangeRef.current(currentRoute);
                }
              }}>
              <StatusBar
                barStyle="light-content"
                backgroundColor={COLORS.primary}
              />
              <Stack.Navigator
                initialRouteName={initialRoute}
                screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Splash">
                  {props => (
                    <SplashScreen
                      profile={profile}
                      onFinish={(routeName: string) => {
                        props.navigation.replace(routeName as keyof RootStackParamList);
                      }}
                    />
                  )}
                </Stack.Screen>
                <Stack.Screen name="Welcome">
                  {props => (
                    <WelcomeScreen
                      {...props}
                      onGetStarted={() => props.navigation.navigate('Register')}
                      onSignIn={() => props.navigation.navigate('Login')}
                    />
                  )}
                </Stack.Screen>
                <Stack.Screen name="Login">
                  {props => (
                    <LoginScreen
                      {...props}
                      onBack={() => props.navigation.goBack()}
                      onRegister={() => props.navigation.navigate('Register')}
                      onSuccess={(userProfile, preferredRoute) => {
                        setProfile(userProfile);
                        props.navigation.reset({
                          index: 0,
                          routes: [
                            {
                              name: preferredRoute ||
                                (userProfile.selectedGenres &&
                                userProfile.selectedGenres.length
                                  ? 'Home'
                                  : 'Genres'),
                            },
                          ],
                        });
                      }}
                    />
                  )}
                </Stack.Screen>
                <Stack.Screen name="Register">
                  {props => (
                    <RegisterScreen
                      {...props}
                      onBack={() => props.navigation.goBack()}
                      onLogin={() => props.navigation.navigate('Login')}
                    />
                  )}
                </Stack.Screen>
                <Stack.Screen name="Genres">
                  {props =>
                    profile ? (
                      <GenresScreen
                        {...props}
                        profile={profile}
                        onComplete={updatedProfile => {
                          setProfile(updatedProfile);
                          props.navigation.reset({
                            index: 0,
                            routes: [{ name: 'Home' }],
                          });
                        }}
                      />
                    ) : (
                      <WelcomeScreen
                        {...props}
                        onGetStarted={() => props.navigation.navigate('Register')}
                        onSignIn={() => props.navigation.navigate('Login')}
                      />
                    )
                  }
                </Stack.Screen>
                <Stack.Screen
                  name="Home"
                  options={{
                    navigationBarColor: 'transparent',
                    navigationBarTranslucent: true,
                  }}>
                  {props =>
                    profile ? (
                      <HomeTabs
                        {...props}
                        profile={profile}
                        onLogout={() => {
                          handleLogout();
                          props.navigation.reset({
                            index: 0,
                            routes: [{ name: 'Welcome' }],
                          });
                        }}
                        onProfileUpdate={handleProfileUpdate}
                      />
                    ) : (
                      <WelcomeScreen
                        {...props}
                        onGetStarted={() => props.navigation.navigate('Register')}
                        onSignIn={() => props.navigation.navigate('Login')}
                      />
                    )
                  }
                </Stack.Screen>
                <Stack.Screen
                  name="FullPlayer"
                  component={FullPlayerScreen}
                  options={{
                    presentation: 'fullScreenModal',
                    animation: 'slide_from_bottom',
                  }}
                />
                <Stack.Screen
                  name="MusicVideoDetail"
                  component={MusicVideoDetailScreen}
                  options={{
                    headerShown: false,
                    animation: 'slide_from_right',
                  }}
                />
                <Stack.Screen
                  name="PodcastDetail"
                  component={PodcastDetailScreen}
                  options={{
                    headerShown: false,
                    animation: 'slide_from_right',
                  }}
                />
                <Stack.Screen
                  name="About"
                  component={AboutScreen}
                  options={{
                    headerShown: false,
                    animation: 'slide_from_right',
                  }}
                />
                <Stack.Screen
                  name="Help"
                  component={HelpScreen}
                  options={{
                    headerShown: false,
                    animation: 'slide_from_right',
                  }}
                />
                <Stack.Screen
                  name="EditProfile"
                  component={EditProfileScreen}
                  options={{
                    headerShown: false,
                    animation: 'slide_from_right',
                  }}
                />
                <Stack.Screen
                  name="News"
                  component={NewsScreen}
                  options={{
                    headerShown: false,
                    animation: 'slide_from_right',
                  }}
                />
                <Stack.Screen
                  name="NewsDetail"
                  component={NewsDetailScreen}
                  options={{
                    headerShown: false,
                    animation: 'slide_from_right',
                  }}
                />
                <Stack.Screen
                  name="MusicGenre"
                  component={MusicGenreScreen}
                  options={{
                    headerShown: false,
                    animation: 'slide_from_right',
                  }}
                />
                <Stack.Screen
                  name="PlaylistSongs"
                  component={PlaylistSongsScreen}
                  options={{
                    headerShown: false,
                    animation: 'slide_from_right',
                  }}
                />
                <Stack.Screen
                  name="AlbumSongs"
                  component={AlbumSongsScreen}
                  options={{
                    headerShown: false,
                    animation: 'slide_from_right',
                  }}
                />
                <Stack.Screen
                  name="ArtistDetail"
                  component={ArtistDetailScreen}
                  options={{
                    headerShown: false,
                    animation: 'slide_from_right',
                  }}
                />
                <Stack.Screen name="Profile">
                  {props =>
                    profile ? (
                      <ProfileScreen
                        {...props}
                        profile={profile}
                        onLogout={() => {
                          handleLogout();
                          props.navigation.reset({
                            index: 0,
                            routes: [{ name: 'Welcome' }],
                          });
                        }}
                        onProfileUpdate={handleProfileUpdate}
                      />
                    ) : null
                  }
                </Stack.Screen>
                <Stack.Screen
                  name="LiveStreamDetail"
                  component={LiveStreamDetailScreen}
                  options={{
                    headerShown: false,
                    animation: 'fade_from_bottom',
                  }}
                />
                <Stack.Screen
                  name="GoLive"
                  component={GoLiveScreen}
                  options={{
                    headerShown: false,
                    animation: 'fade_from_bottom',
                  }}
                />
              </Stack.Navigator>


            </NavigationContainer>
          </PlayerProvider>
        </PlaylistProvider>
      </SafeAreaProvider>
    </ToastProvider>
  );
}

export default App;
