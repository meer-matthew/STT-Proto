import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ImageBackground, View, StyleSheet } from 'react-native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { ConversationProvider } from './src/context/ConversationContext.tsx';
import { ThemeProvider } from './src/context/ThemeContext';

const styles = StyleSheet.create({
    backgroundImage: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
});

function App() {
    return (
        <ImageBackground
            // source={require('./assets/images/268_Organic_White_Background.jpg')}
            style={styles.backgroundImage}
            imageStyle={{ opacity: 0.15 }}
        >
            <SafeAreaProvider style={styles.container}>
                <ThemeProvider>
                    <NavigationContainer>
                        <ConversationProvider>
                            <AppNavigator />
                        </ConversationProvider>
                    </NavigationContainer>
                </ThemeProvider>
            </SafeAreaProvider>
        </ImageBackground>
    );
}

export default App;