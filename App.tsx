import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { ConversationProvider } from './src/context/ConversationContext.tsx';
import { ThemeProvider } from './src/context/ThemeContext';

function App() {
    return (
        <SafeAreaProvider>
            <ThemeProvider>
                <NavigationContainer>
                    <ConversationProvider>
                        <AppNavigator />
                    </ConversationProvider>
                </NavigationContainer>
            </ThemeProvider>
        </SafeAreaProvider>
    );
}

export default App;