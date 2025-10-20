import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useTheme } from '../context/ThemeContext';
import { authService, User } from '../services/authService';
import { conversationService } from '../services/conversationService';

interface AddParticipantModalProps {
    visible: boolean;
    onClose: () => void;
    conversationId: string;
    currentParticipants: any[];
    onParticipantAdded: () => void;
}

export function AddParticipantModal({
    visible,
    onClose,
    conversationId,
    currentParticipants,
    onParticipantAdded,
}: AddParticipantModalProps) {
    const theme = useTheme();
    const styles = createStyles(theme);

    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [adding, setAdding] = useState<number | null>(null);

    useEffect(() => {
        if (visible) {
            loadUsers();
            setSearchQuery('');
        }
    }, [visible]);

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredUsers(users);
        } else {
            const query = searchQuery.toLowerCase();
            setFilteredUsers(
                users.filter(user =>
                    user.username.toLowerCase().includes(query)
                )
            );
        }
    }, [searchQuery, users]);

    const loadUsers = async () => {
        setLoading(true);
        try {
            // Get all users except self
            const allUsers = await authService.getUsers(undefined, false);
            
            // Filter out users who are already participants
            const participantUserIds = currentParticipants.map(p => p.user_id);
            const availableUsers = allUsers.filter(
                user => !participantUserIds.includes(user.id)
            );

            setUsers(availableUsers);
            setFilteredUsers(availableUsers);
        } catch (error: any) {
            console.error('Failed to load users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddParticipant = async (userId: number) => {
        setAdding(userId);
        try {
            await conversationService.addParticipant(Number(conversationId), userId);
            
            // Remove added user from the list
            setUsers(prev => prev.filter(u => u.id !== userId));
            setFilteredUsers(prev => prev.filter(u => u.id !== userId));
            
            onParticipantAdded();
        } catch (error: any) {
            console.error('Failed to add participant:', error);
            alert('Failed to add participant. Please try again.');
        } finally {
            setAdding(null);
        }
    };

    const renderUserItem = ({ item }: { item: User }) => (
        <View style={styles.userItem}>
            <View style={styles.userInfo}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {item.username.charAt(0).toUpperCase()}
                    </Text>
                </View>
                <View style={styles.userDetails}>
                    <Text style={styles.username}>{item.username}</Text>
                    <Text style={styles.userType}>
                        {item.user_type === 'caretaker' ? 'Caretaker' : 'User'}
                    </Text>
                </View>
            </View>
            <TouchableOpacity
                style={[
                    styles.addButton,
                    adding === item.id && styles.addButtonDisabled
                ]}
                onPress={() => handleAddParticipant(item.id)}
                disabled={adding === item.id}
                activeOpacity={0.7}>
                {adding === item.id ? (
                    <ActivityIndicator size="small" color={theme.colors.white} />
                ) : (
                    <Icon name="plus" size={16} color={theme.colors.white} />
                )}
            </TouchableOpacity>
        </View>
    );

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Add Participant</Text>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={onClose}
                            activeOpacity={0.7}>
                            <Icon name="times" size={20} color={theme.colors.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Search */}
                    <View style={styles.searchContainer}>
                        <Icon name="search" size={16} color={theme.colors.textSecondary} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search users..."
                            placeholderTextColor={theme.colors.textSecondary}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>

                    {/* User List */}
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={theme.colors.primary} />
                        </View>
                    ) : filteredUsers.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Icon name="users" size={48} color={theme.colors.disabled} />
                            <Text style={styles.emptyText}>
                                {searchQuery ? 'No users found' : 'No users available to add'}
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={filteredUsers}
                            keyExtractor={item => item.id.toString()}
                            renderItem={renderUserItem}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                        />
                    )}
                </View>
            </View>
        </Modal>
    );
}

const createStyles = (theme: any) => StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.lg,
    },
    modalContainer: {
        width: '100%',
        maxWidth: 500,
        maxHeight: '80%',
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.lg,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.lg,
        borderBottomWidth: theme.borderWidth.thin,
        borderBottomColor: theme.colors.borderLight,
    },
    title: {
        fontSize: theme.fontSize.xl,
        fontWeight: '600',
        color: theme.colors.text,
    },
    closeButton: {
        padding: theme.spacing.xs,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        padding: theme.spacing.md,
        margin: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        borderWidth: theme.borderWidth.thin,
        borderColor: theme.colors.borderLight,
    },
    searchInput: {
        flex: 1,
        fontSize: theme.fontSize.md,
        color: theme.colors.text,
        padding: 0,
    },
    listContent: {
        padding: theme.spacing.md,
    },
    userItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.md,
        marginBottom: theme.spacing.sm,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        borderWidth: theme.borderWidth.thin,
        borderColor: theme.colors.borderLight,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        flex: 1,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: theme.fontSize.lg,
        fontWeight: '600',
        color: theme.colors.white,
    },
    userDetails: {
        flex: 1,
    },
    username: {
        fontSize: theme.fontSize.md,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 2,
    },
    userType: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
    },
    addButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButtonDisabled: {
        backgroundColor: theme.colors.disabled,
    },
    loadingContainer: {
        padding: theme.spacing.xl,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        padding: theme.spacing.xl,
        justifyContent: 'center',
        alignItems: 'center',
        gap: theme.spacing.md,
    },
    emptyText: {
        fontSize: theme.fontSize.md,
        color: theme.colors.textSecondary,
        textAlign: 'center',
    },
});
