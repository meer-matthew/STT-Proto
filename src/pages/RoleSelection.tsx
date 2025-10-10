import React from 'react';
import {
    StatusBar,
    useColorScheme,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { GroupIcon } from '../components/icons/GroupIcon';
import { SmallUserIcon } from '../components/icons/SmallUserIcon';
import { HeartIcon } from '../components/icons/HeartIcon';
import { roleSelectionStyles } from '../styles/roleSelectionStyles';

type Props = NativeStackScreenProps<RootStackParamList, 'RoleSelection'>;

export function RoleSelectionScreen({ navigation, route }: Props) {
    const isDarkMode = useColorScheme() === 'dark';
    const { username } = route.params;

    const handleRoleSelect = (role: string) => {
        console.log(`${username} selected role:`, role);
        navigation.navigate('ConversationOptions', { username });
    };

    const handleGoBack = () => {
        navigation.goBack();
    };

    return (
        <ScrollView
            contentContainerStyle={roleSelectionStyles.scrollContainer}
            style={[
                roleSelectionStyles.container,
                { backgroundColor: isDarkMode ? '#000' : '#fff' },
            ]}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
            <View style={roleSelectionStyles.content}>
                <GroupIcon />

                <Text style={[roleSelectionStyles.title, { color: isDarkMode ? '#fff' : '#000' }]}>
                    Choose Your Role
                </Text>

                <Text style={[roleSelectionStyles.description, { color: isDarkMode ? '#8e8e93' : '#666' }]}>
                    Please select how you'll be using the app today
                </Text>

                <View style={roleSelectionStyles.rolesContainer}>
                    {/* User Role Card */}
                    <TouchableOpacity
                        style={[
                            roleSelectionStyles.roleCard,
                            {
                                backgroundColor: isDarkMode ? '#1c1c1e' : '#fff',
                                borderColor: isDarkMode ? '#38383a' : '#e0e0e0',
                            },
                        ]}
                        onPress={() => handleRoleSelect('user')}
                        activeOpacity={0.7}>
                        <SmallUserIcon />
                        <Text style={[roleSelectionStyles.roleTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
                            User
                        </Text>
                        <Text style={[roleSelectionStyles.roleDescription, { color: isDarkMode ? '#8e8e93' : '#666' }]}>
                            I want to use the speech-to-text features
                        </Text>
                        <View style={roleSelectionStyles.arrowContainer}>
                            <Text style={[roleSelectionStyles.arrow, { color: isDarkMode ? '#8e8e93' : '#999' }]}>
                                →
                            </Text>
                        </View>
                    </TouchableOpacity>

                    {/* Caregiver Role Card */}
                    <TouchableOpacity
                        style={[
                            roleSelectionStyles.roleCard,
                            {
                                backgroundColor: isDarkMode ? '#1c1c1e' : '#fff',
                                borderColor: isDarkMode ? '#38383a' : '#e0e0e0',
                            },
                        ]}
                        onPress={() => handleRoleSelect('caregiver')}
                        activeOpacity={0.7}>
                        <HeartIcon />
                        <Text style={[roleSelectionStyles.roleTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
                            Caregiver
                        </Text>
                        <Text style={[roleSelectionStyles.roleDescription, { color: isDarkMode ? '#8e8e93' : '#666' }]}>
                            I'm helping someone use this app
                        </Text>
                        <View style={roleSelectionStyles.arrowContainer}>
                            <Text style={[roleSelectionStyles.arrow, { color: isDarkMode ? '#8e8e93' : '#999' }]}>
                                →
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={[
                        roleSelectionStyles.backButton,
                        {
                            backgroundColor: isDarkMode ? '#1c1c1e' : '#f5f5f5',
                        },
                    ]}
                    onPress={handleGoBack}
                    activeOpacity={0.7}>
                    <Text style={[roleSelectionStyles.backButtonText, { color: isDarkMode ? '#fff' : '#000' }]}>
                        ← Go Back
                    </Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}