import React from 'react';
import {
    StatusBar,
    useColorScheme,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { GroupIcon } from '../components/icons/GroupIcon';
import { SmallUserIcon } from '../components/icons/SmallUserIcon';
import { HeartIcon } from '../components/icons/HeartIcon';
import { useTheme } from '../context/ThemeContext';
import { AppLayout } from '../components/AppLayout';

type Props = NativeStackScreenProps<RootStackParamList, 'RoleSelection'>;

export function RoleSelectionScreen({ navigation, route }: Props) {
    const isDarkMode = useColorScheme() === 'dark';
    const theme = useTheme();
    const styles = createStyles(theme);
    const { username } = route.params;

    const handleRoleSelect = (role: string) => {
        console.log(`${username} selected role:`, role);
        navigation.navigate('ConversationOptions', { username });
    };

    const handleGoBack = () => {
        navigation.goBack();
    };

    return (
        <AppLayout showHeader={true} showHeaderBorder={false}>
            <ScrollView
                contentContainerStyle={styles.scrollContainer}>
                <View style={styles.content}>
                <GroupIcon />

                <Text style={styles.title}>
                    Choose Your Role
                </Text>

                <Text style={styles.description}>
                    Please select how you'll be using the app today
                </Text>

                <View style={styles.rolesContainer}>
                    {/* User Role Card */}
                    <TouchableOpacity
                        style={styles.roleCard}
                        onPress={() => handleRoleSelect('user')}
                        activeOpacity={0.7}>
                        <SmallUserIcon />
                        <Text style={styles.roleTitle}>
                            User
                        </Text>
                        <Text style={styles.roleDescription}>
                            I want to use the speech-to-text features
                        </Text>
                        <View style={styles.arrowContainer}>
                            <Text style={styles.arrow}>
                                →
                            </Text>
                        </View>
                    </TouchableOpacity>

                    {/* Caregiver Role Card */}
                    <TouchableOpacity
                        style={styles.roleCard}
                        onPress={() => handleRoleSelect('caregiver')}
                        activeOpacity={0.7}>
                        <HeartIcon />
                        <Text style={styles.roleTitle}>
                            Caregiver
                        </Text>
                        <Text style={styles.roleDescription}>
                            I'm helping someone use this app
                        </Text>
                        <View style={styles.arrowContainer}>
                            <Text style={styles.arrow}>
                                →
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={styles.backButton}
                    onPress={handleGoBack}
                    activeOpacity={0.7}>
                    <Text style={styles.backButtonText}>
                        ← Go Back
                    </Text>
                </TouchableOpacity>
            </View>
            </ScrollView>
        </AppLayout>
    );
}

const createStyles = (theme: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    scrollContainer: {
        flexGrow: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: '600',
        marginBottom: theme.spacing.sm,
        textAlign: 'center',
        color: theme.colors.text,
    },
    description: {
        fontSize: theme.fontSize.sm,
        textAlign: 'center',
        marginBottom: 40,
        paddingHorizontal: theme.spacing.lg,
        color: '#666',
    },
    rolesContainer: {
        width: '100%',
        gap: theme.spacing.md,
        marginBottom: theme.spacing.xl,
    },
    roleCard: {
        width: '100%',
        borderRadius: theme.borderRadius.md,
        borderWidth: theme.borderWidth.thin,
        padding: theme.spacing.xl,
        alignItems: 'center',
        position: 'relative',
        backgroundColor: theme.colors.white,
        borderColor: theme.colors.borderLight,
    },
    roleTitle: {
        fontSize: theme.fontSize.xl,
        fontWeight: '600',
        marginBottom: theme.spacing.xs,
        color: theme.colors.text,
    },
    roleDescription: {
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 18,
        color: '#666',
    },
    arrowContainer: {
        position: 'absolute',
        bottom: 20,
        right: theme.spacing.xl,
    },
    arrow: {
        fontSize: theme.fontSize.lg,
        color: '#999',
    },
    backButton: {
        width: '100%',
        height: 52,
        borderRadius: theme.borderRadius.sm,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: theme.spacing.md,
        backgroundColor: theme.colors.surface,
    },
    backButtonText: {
        fontSize: theme.fontSize.md,
        fontWeight: '500',
        color: theme.colors.text,
    },
});