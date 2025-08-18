import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { enableScreens } from 'react-native-screens';

import EnhancedPermissionScreen from './src/screens/EnhancedPermissionScreen';
import VideoListScreen from './src/screens/VideoListScreen';
import VideoPlayerScreen from './src/screens/VideoPlayerScreen';

const Stack = createStackNavigator();
enableScreens(true);

const App = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Permission"
          screenOptions={{
            headerShown: false, // Hide header for all screens
          }}
        >
          <Stack.Screen 
            name="Permission" 
            component={EnhancedPermissionScreen} 
          />
          <Stack.Screen 
            name="VideoList" 
            component={VideoListScreen}
            options={{
              headerShown: true,
              title: 'Video Library'
            }}
          />
          <Stack.Screen 
            name="VideoPlayer" 
            component={VideoPlayerScreen}
            options={{
              headerShown: false,
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
};

export default App;