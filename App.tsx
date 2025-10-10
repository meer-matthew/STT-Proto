import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { ConversationProvider } from './src/context/ConversationContext.tsx';

function App() {
    return (
        <SafeAreaProvider>
            <NavigationContainer>
                <ConversationProvider>
                    <AppNavigator />
                </ConversationProvider>
            </NavigationContainer>
        </SafeAreaProvider>
    );
}

export default App;