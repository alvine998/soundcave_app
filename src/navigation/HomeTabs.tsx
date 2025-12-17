import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// @ts-expect-error: FontAwesome6 lacks bundled types.
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';

import { COLORS } from '../config/color';
import HomeScreen from '../screens/Home';
import PlaylistScreen from '../screens/Playlist';
import SearchScreen from '../screens/Search';
import { UserProfile } from '../storage/userStorage';
import normalize from 'react-native-normalize';
import NewsScreen from '../screens/News';
import CavelistScreen from '../screens/Cavelist';

type HomeTabsProps = {
  profile: UserProfile;
  onLogout: () => void;
  onProfileUpdate?: (updatedProfile: UserProfile) => void;
};

export type HomeTabParamList = {
  News: undefined;
  Cavelist: undefined;
  Home: undefined;
  Playlist: undefined;
  Search: undefined;
};

const Tab = createBottomTabNavigator<HomeTabParamList>();

const ICON_SIZE = 20; // Changed icon size here

const HomeTabs: React.FC<HomeTabsProps> = ({
  profile,
  onLogout,
  onProfileUpdate,
}) => {
  const insets = useSafeAreaInsets();
  const tabBarHeight = 60 + insets.bottom;

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.5)',
        tabBarLabelStyle: {
          fontWeight: '600',
          fontSize: 8,
          marginTop: route.name === 'Home' ? normalize(5) : 0,
          opacity: route.name === 'Home' ? 0 : 1,
        },
        tabBarBackground: () => <View style={styles.tabBackground} />,
        tabBarStyle: {
          borderTopColor: 'transparent',
          height: tabBarHeight,
          position: 'absolute',
          elevation: 0,
          backgroundColor: 'transparent',
          paddingBottom: insets.bottom,
          marginTop: normalize(10),
        },
        tabBarIcon: ({ color, focused }) => {
          const iconName = getIconName(route.name);
          const isHome = route.name === 'Home';

          if (isHome) {
            return (
              <View
                style={[
                  styles.homeIconContainer
                ]}
              >
                {/* <FontAwesome6
                  name={iconName}
                  size={18}
                  color={COLORS.light}
                  style={{marginTop: normalize(-10)}}
                /> */}
                <Image
                  source={require('../assets/images/41885.png')}
                  style={{width: normalize(25), height: normalize(45)}}
                />
              </View>
            );
          }

          return (
            <FontAwesome6 name={iconName} size={ICON_SIZE} color={color} />
          );
        },
      })}
    >
      <Tab.Screen name="News" component={NewsScreen} />
      <Tab.Screen name="Cavelist" component={CavelistScreen} />
      <Tab.Screen name="Home">
        {props => (
          <HomeScreen {...props} profile={profile} onLogout={onLogout} />
        )}
      </Tab.Screen>
      <Tab.Screen name="Playlist" component={PlaylistScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
    </Tab.Navigator>
  );
};

const getIconName = (route: string) => {
  switch (route) {
    case 'Home':
      return 'house';
    case 'News':
      return 'bullhorn';
    case 'Cavelist':
      return 'play';
    case 'Search':
      return 'magnifying-glass';
    case 'Playlist':
      return 'list';
    default:
      return 'circle';
  }
};

const styles = StyleSheet.create({
  tabBackground: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  homeIconContainer: {
    borderRadius: normalize(999),
    backgroundColor: COLORS.primary,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    marginTop: normalize(20),
    width: normalize(50),
    height: normalize(50),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default HomeTabs;
