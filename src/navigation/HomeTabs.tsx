import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// @ts-expect-error: FontAwesome6 lacks bundled types.
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';

import { COLORS } from '../config/color';
import HomeScreen from '../screens/Home';
import PlaylistScreen from '../screens/Playlist';
import SearchScreen from '../screens/Search';
import ProfileScreen from '../screens/Profile';
import { UserProfile } from '../storage/userStorage';

type HomeTabsProps = {
  profile: UserProfile;
  onLogout: () => void;
};

export type HomeTabParamList = {
  Home: undefined;
  Search: undefined;
  Playlist: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<HomeTabParamList>();

const ICON_SIZE = 20; // Changed icon size here

const HomeTabs: React.FC<HomeTabsProps> = ({ profile, onLogout }) => {
  const insets = useSafeAreaInsets();
  const tabBarHeight = 70 + insets.bottom;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.5)',
        tabBarLabelStyle: {
          fontWeight: '600',
          fontSize: 8,
        },
        tabBarBackground: () => <View style={styles.tabBackground} />,
        tabBarStyle: {
          borderTopColor: 'transparent',
          height: tabBarHeight,
          position: 'absolute',
          elevation: 0,
          backgroundColor: 'transparent',
          paddingBottom: insets.bottom,
        },
        tabBarIcon: ({ color }) => {
          const iconName = getIconName(route.name);
          return <FontAwesome6 name={iconName} size={ICON_SIZE} color={color} />;
        },
      })}>
      <Tab.Screen name="Home">
        {props => <HomeScreen {...props} profile={profile} onLogout={onLogout} />}
      </Tab.Screen>
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Playlist" component={PlaylistScreen} />
      <Tab.Screen name="Profile">
        {props => <ProfileScreen {...props} profile={profile} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

const getIconName = (route: string) => {
  switch (route) {
    case 'Home':
      return 'house';
    case 'Search':
      return 'magnifying-glass';
    case 'Playlist':
      return 'list';
    case 'Profile':
      return 'user';
    default:
      return 'circle';
  }
};

const styles = StyleSheet.create({
  tabBackground: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
});

export default HomeTabs;


