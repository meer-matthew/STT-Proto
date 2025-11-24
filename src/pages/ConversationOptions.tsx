import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    useColorScheme,
    Alert,
    Animated,
    Dimensions,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useTheme } from '../context/ThemeContext';
import Icon from 'react-native-vector-icons/FontAwesome';
import LinearGradient from 'react-native-linear-gradient';

type Props = NativeStackScreenProps<RootStackParamList, 'ConversationOptions'>;

export function ConversationOptions({ navigation, route }: Props) {
    const theme = useTheme();
    const isDarkMode = useColorScheme() === 'dark';
    const { username } = route.params;

    // Animation refs
    const card1Scale = useRef(new Animated.Value(0)).current;
    const card2Scale = useRef(new Animated.Value(0)).current;
    const headerOpacity = useRef(new Animated.Value(0)).current;
    const card1Anim = useRef(new Animated.Value(0)).current;
    const card2Anim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Animate header
        Animated.timing(headerOpacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();

        // Stagger card animations
        Animated.sequence([
            Animated.timing(card1Scale, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.timing(card2Scale, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
        ]).start();

        // Secondary animations
        Animated.loop(
            Animated.sequence([
                Animated.timing(card1Anim, {
                    toValue: -8,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(card1Anim, {
                    toValue: 0,
                    duration: 2000,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(card2Anim, {
                    toValue: 8,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(card2Anim, {
                    toValue: 0,
                    duration: 2000,
                    useNativeDriver: true,
                }),
            ]),
            { delay: 500 }
        ).start();
    }, []);

    const handleNewConversation = () => {
        Animated.sequence([
            Animated.timing(card1Scale, {
                toValue: 0.95,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(card1Scale, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();
        setTimeout(() => {
            navigation.navigate('SelectConfiguration', { username });
        }, 200);
    };

    const handleViewMessages = () => {
        Animated.sequence([
            Animated.timing(card2Scale, {
                toValue: 0.95,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(card2Scale, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();
        setTimeout(() => {
            navigation.navigate('Conversation', { username, configuration: '1:1' });
        }, 200);
    };

    const styles = createStyles(theme);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />

            {/* Gradient Background Header */}
            <LinearGradient
                colors={[theme.colors.primary, '#5a7fd8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientHeader}>
                <Animated.View style={{ opacity: headerOpacity }}>
                    <Text style={styles.greeting}>Welcome back!</Text>
                    <Text style={styles.usernameDisplay}>@{username}</Text>
                    <Text style={styles.headerDescription}>
                        Ready to communicate and collaborate
                    </Text>
                </Animated.View>
            </LinearGradient>

            <View style={styles.content}>
                <Animated.View
                    style={[
                        styles.optionCard,
                        styles.card1,
                        {
                            transform: [
                                { scale: card1Scale },
                                { translateY: card1Anim },
                            ],
                        },
                    ]}>
                    <TouchableOpacity
                        onPress={handleNewConversation}
                        activeOpacity={0.8}
                        style={styles.cardTouchable}>
                        <LinearGradient
                            colors={['#4a90e2', '#357abd']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.gradientCard}>
                            <View style={styles.iconWrapper}>
                                <Icon name="plus" size={40} color="#fff" />
                            </View>
                            <Text style={styles.optionTitle}>New Conversation</Text>
                            <Text style={styles.optionDescription}>
                                Start fresh and create a new discussion
                            </Text>
                            <View style={styles.ctaContainer}>
                                <Text style={styles.ctaText}>Get Started</Text>
                                <Icon name="arrow-right" size={14} color="#fff" style={{ marginLeft: 8 }} />
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>

                <Animated.View
                    style={[
                        styles.optionCard,
                        styles.card2,
                        {
                            transform: [
                                { scale: card2Scale },
                                { translateY: card2Anim },
                            ],
                        },
                    ]}>
                    <TouchableOpacity
                        onPress={handleViewMessages}
                        activeOpacity={0.8}
                        style={styles.cardTouchable}>
                        <LinearGradient
                            colors={['#50c878', '#3ba85f']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.gradientCard}>
                            <View style={styles.iconWrapper}>
                                <Icon name="comments" size={40} color="#fff" />
                            </View>
                            <Text style={styles.optionTitle}>View Messages</Text>
                            <Text style={styles.optionDescription}>
                                Continue your conversations
                            </Text>
                            <View style={styles.ctaContainer}>
                                <Text style={styles.ctaText}>Continue</Text>
                                <Icon name="arrow-right" size={14} color="#fff" style={{ marginLeft: 8 }} />
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>

                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}>
                    <Icon name="arrow-left" size={16} color={theme.colors.primary} />
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const createStyles = (theme: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.white,
    },
    gradientHeader: {
        paddingTop: 60,
        paddingHorizontal: 24,
        paddingBottom: 40,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
    },
    greeting: {
        fontSize: 16,
        fontWeight: '500',
        color: 'rgba(255, 255, 255, 0.8)',
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    usernameDisplay: {
        fontSize: 32,
        fontWeight: '800',
        color: theme.colors.white,
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    headerDescription: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.85)',
        lineHeight: 24,
        fontWeight: '500',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 32,
        paddingBottom: 40,
        justifyContent: 'center',
    },
    optionCard: {
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 8,
    },
    card1: {},
    card2: {},
    cardTouchable: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    gradientCard: {
        borderRadius: 20,
        padding: 28,
        alignItems: 'center',
        minHeight: 240,
        justifyContent: 'center',
    },
    iconWrapper: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    optionTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: theme.colors.white,
        marginBottom: 12,
        textAlign: 'center',
        letterSpacing: -0.3,
    },
    optionDescription: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.85)',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 20,
        fontWeight: '500',
    },
    ctaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    ctaText: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.white,
        letterSpacing: 0.5,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        marginTop: 16,
    },
    backButtonText: {
        fontSize: 16,
        color: theme.colors.primary,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
});
