import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    useColorScheme,
    Alert,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import Icon from 'react-native-vector-icons/FontAwesome';

type Props = NativeStackScreenProps<RootStackParamList, 'ConversationOptions'>;

export function ConversationOptions({ navigation, route }: Props) {
    const isDarkMode = useColorScheme() === 'dark';
    const { username } = route.params;

    const handleNewConversation = () => {
        navigation.navigate('SelectConfiguration', { username });
    };

    const handleViewMessages = () => {
        // Navigate to conversation screen to view existing conversations
        navigation.navigate('Conversation', { username, configuration: '1:1' });
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.title}>What would you like to do?</Text>
                    <Text style={styles.subtitle}>
                        Choose to start a new conversation or continue with existing messages
                    </Text>
                </View>

                <View style={styles.optionsContainer}>
                    <TouchableOpacity
                        style={styles.optionCard}
                        onPress={handleNewConversation}
                        activeOpacity={0.7}>
                        <View style={[styles.iconCircle, { backgroundColor: '#4a90e2' }]}>
                            <Icon name="plus" size={32} color="#fff" />
                        </View>
                        <Text style={styles.optionTitle}>New Conversation</Text>
                        <Text style={styles.optionDescription}>
                            Start a fresh conversation with a new configuration
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.optionCard}
                        onPress={handleViewMessages}
                        activeOpacity={0.7}>
                        <View style={[styles.iconCircle, { backgroundColor: '#50c878' }]}>
                            <Icon name="comments" size={32} color="#fff" />
                        </View>
                        <Text style={styles.optionTitle}>View Messages</Text>
                        <Text style={styles.optionDescription}>
                            Continue with your existing conversation
                        </Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}>
                    <Icon name="arrow-left" size={16} color="#666" />
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        lineHeight: 24,
    },
    optionsContainer: {
        flex: 1,
        gap: 20,
    },
    optionCard: {
        backgroundColor: '#f8f9fa',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#e9ecef',
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    optionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    optionDescription: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
    },
    backButtonText: {
        fontSize: 16,
        color: '#666',
    },
});
