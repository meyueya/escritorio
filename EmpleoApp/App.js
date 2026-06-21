import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar, useColorScheme, View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import AutopilotScreen from './src/screens/AutopilotScreen';
import PipelineScreen from './src/screens/PipelineScreen';
import JobDetailScreen from './src/screens/JobDetailScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import SimulatorScreen from './src/screens/SimulatorScreen';
import { colors } from './src/utils/colors';
import { requestNotificationPermissions } from './src/utils/notifications';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Dark navigation theme matching the cyberpunk palette
const AppTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.bgApp,
    card: colors.bgSurface,
    text: colors.textMain,
    border: colors.borderGlass,
    notification: colors.danger,
  },
};

// Pipeline Stack: PipelineScreen → JobDetailScreen (push navigation)
function PipelineStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bgApp },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="PipelineBoard" component={PipelineScreen} />
      <Stack.Screen name="JobDetail" component={JobDetailScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgApp} />
      <NavigationContainer theme={AppTheme}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarStyle: {
              backgroundColor: colors.bgSurface,
              borderTopColor: colors.borderGlass,
              borderTopWidth: 1,
              paddingBottom: 4,
              paddingTop: 6,
              height: 80,
            },
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.textMuted,
            tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginBottom: 4 },
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;
              switch (route.name) {
                case 'Autopilot': iconName = focused ? 'rocket' : 'rocket-outline'; break;
                case 'Pipeline': iconName = focused ? 'briefcase' : 'briefcase-outline'; break;
                case 'Perfil': iconName = focused ? 'person' : 'person-outline'; break;
                case 'Simulador': iconName = focused ? 'flash' : 'flash-outline'; break;
                case 'Ajustes': iconName = focused ? 'settings' : 'settings-outline'; break;
                default: iconName = 'ellipse';
              }
              return <Ionicons name={iconName} size={size} color={color} />;
            },
          })}
        >
          <Tab.Screen name="Autopilot" component={AutopilotScreen} />
          <Tab.Screen name="Pipeline" component={PipelineStack} />
          <Tab.Screen name="Perfil" component={ProfileScreen} />
          <Tab.Screen name="Simulador" component={SimulatorScreen} />
          <Tab.Screen name="Ajustes" component={SettingsScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
