// App.js
import 'react-native-gesture-handler';

import React, { createContext, useEffect, useState } from 'react';
import { StyleSheet, StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

/* Screens */
import Loader from './Components/Loader';
import OnboardingScreen from './Components/OnboardingScreen';
import RegistrationScreen from './Components/RegistrationScreen';

import HomeScreen from './Components/HomeScreen';
import HistoryScreen from './Components/HistoryScreen';
import HistoryDetailsScreen from './Components/HistoryDetailsScreen';
import ExchangerScreen from './Components/ExchangerScreen';
import ProfileScreen from './Components/ProfileScreen';

import InfoScreen from './Components/InfoScreen';
import TaskScreen from './Components/TaskScreen';
import CustomTabBar from './Components/CustomTabBar';

const COLORS = {
  bg: '#0A0A0A',
  card: '#2A1B07',
  border: '#5A3A0E',
  gold: '#F5C542',
  text: '#FFFFFF',
  dim: '#BDAA7B',
};

const AppTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: COLORS.bg,
    card: COLORS.card,
    border: COLORS.border,
    text: COLORS.text,
    primary: COLORS.gold,
  },
};

// Context for artifacts
export const AppCtx = createContext(null);

const STORAGE_ARTIFACTS = '@qcw_artifacts';

function AppProvider({ children }) {
  const [artifacts, setArtifacts] = useState({ scarab: 0, pyramid: 0, flower: 0 });

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_ARTIFACTS);
        if (stored) {
          const parsed = JSON.parse(stored);
          setArtifacts({
            scarab: parsed?.scarab ?? 0,
            pyramid: parsed?.pyramid ?? 0,
            flower: parsed?.flower ?? 0,
          });
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_ARTIFACTS, JSON.stringify(artifacts)).catch(() => {});
  }, [artifacts]);

  const canSpend = (cost) => {
    if (!cost) return false;
    return (
      (cost.scarab ?? 0) <= artifacts.scarab &&
      (cost.pyramid ?? 0) <= artifacts.pyramid &&
      (cost.flower ?? 0) <= artifacts.flower
    );
  };

  const spend = (cost) => {
    if (!canSpend(cost)) return false;
    setArtifacts((prev) => ({
      scarab: prev.scarab - (cost.scarab ?? 0),
      pyramid: prev.pyramid - (cost.pyramid ?? 0),
      flower: prev.flower - (cost.flower ?? 0),
    }));
    return true;
  };

  const addArtifacts = (added) => {
    setArtifacts((prev) => ({
      scarab: prev.scarab + (added.scarab ?? 0),
      pyramid: prev.pyramid + (added.pyramid ?? 0),
      flower: prev.flower + (added.flower ?? 0),
    }));
  };

  return (
    <AppCtx.Provider value={{ artifacts, spend, canSpend, addArtifacts }}>
      {children}
    </AppCtx.Provider>
  );
}

const Root = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const HistoryStack = createNativeStackNavigator();

/** ✅ Info внутри HomeStack => TabBar виден */
function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen name="Info" component={InfoScreen} options={{ animation: 'fade' }} />
    </HomeStack.Navigator>
  );
}

/** ✅ HistoryDetails внутри HistoryStack => TabBar виден */
function HistoryStackScreen() {
  return (
    <HistoryStack.Navigator screenOptions={{ headerShown: false }}>
      <HistoryStack.Screen name="History" component={HistoryScreen} />
      <HistoryStack.Screen
        name="HistoryDetails"
        component={HistoryDetailsScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </HistoryStack.Navigator>
  );
}

function Tabs() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{ headerShown: false }}
      tabBar={(props) => (
        <CustomTabBar
          {...props}
          colors={{
            bg: COLORS.bg,
            card: COLORS.card,
            border: COLORS.border,
            primary: COLORS.gold,
            text: COLORS.text,
            dim: COLORS.dim,
          }}
        />
      )}
    >
      {/* ✅ Home теперь Stack */}
      <Tab.Screen name="Home" component={HomeStackScreen} />
      <Tab.Screen name="History" component={HistoryStackScreen} />
      <Tab.Screen name="Exchanger" component={ExchangerScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [bootDone, setBootDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setBootDone(true), 6000);
    return () => clearTimeout(t);
  }, []);

  if (!bootDone) return <Loader />;

  return (
    <GestureHandlerRootView style={styles.flex}>
      <AppProvider>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
        <NavigationContainer theme={AppTheme}>
          <Root.Navigator screenOptions={{ headerShown: false }}>
            <Root.Screen name="Onboarding" component={OnboardingScreen} />
            <Root.Screen name="Registration" component={RegistrationScreen} />
            <Root.Screen name="Main" component={Tabs} />

            {/* ✅ Task оставляем в Root (если хочешь без таббара) */}
            <Root.Screen
              name="Task"
              component={TaskScreen}
              options={{ animation: 'slide_from_bottom' }}
            />
          </Root.Navigator>
        </NavigationContainer>
      </AppProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
