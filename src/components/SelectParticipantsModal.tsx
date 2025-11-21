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
    SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useTheme } from '../context/ThemeContext';
import { authService, User } from '../services/authService';

interface SelectParticipantsModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: (selectedUsers: User[]) => void;
}

export function SelectParticipantsModal({
    visible,
    onClose,
    onConfirm,
}: SelectParticipantsModalProps) {
    const theme = useTheme();
    const styles = createStyles(theme);

    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());

    useEffect(() => {
        if (visible) {
            loadUsers();
            setSearchQuery('');
            setSelectedUsers(new Set());
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
            setUsers(allUsers);
            setFilteredUsers(allUsers);
        } catch (error: any) {
            console.error('Failed to load users:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleUserSelection = (userId: number) => {
        const newSelected = new Set(selectedUsers);
        if (newSelected.has(userId)) {
            newSelected.delete(userId);
        } else {
            newSelected.add(userId);
        }
        setSelectedUsers(newSelected);
    };

    const handleConfirm = () => {
        const selectedUsersList = users.filter(u => selectedUsers.has(u.id));
        onConfirm(selectedUsersList);
        onClose();
    };

    const renderUserItem = ({ item }: { item: User }) => {
        const isSelected = selectedUsers.has(item.id);
        return (
            <TouchableOpacity
                style={[
                    styles.userItem,
                    isSelected && styles.userItemSelected
                ]}
                onPress={() => toggleUserSelection(item.id)}
                activeOpacity={0.7}>
                <View style={styles.userInfo}>
                    <View style={[
                        styles.avatar,
                        isSelected && styles.avatarSelected
                    ]}>
                        {isSelected ? (
                            <Icon name="check" size={16} color={theme.colors.white} />
                        ) : (
                            <Text style={styles.avatarText}>
                                {item.username.charAt(0).toUpperCase()}
                            </Text>
                        )}
                    </View>
                    <View style={styles.userDetails}>
                        <Text style={styles.username}>{item.username}</Text>
                        <Text style={styles.userType}>
                            {item.user_type === 'caretaker' ? 'Caretaker' : 'User'}
                        </Text>
                    </View>
                </View>
                <View style={[
                    styles.checkbox,
                    isSelected && styles.checkboxSelected
                ]}>
                    {isSelected && (
                        <Icon name="check" size={12} color={theme.colors.white} />
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.overlay}>
                    <View style={styles.modalContainer}>
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.title}>Select Participants</Text>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={onClose}
                                activeOpacity={0.7}>
                                <Icon name="times" size={20} color={theme.colors.text} />
                            </TouchableOpacity>
                        </View>

                        {/* Subtitle */}
                        <Text style={styles.subtitle}>
                            Add users to this conversation (optional)
                        </Text>

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
                                    {searchQuery ? 'No users found' : 'No users available'}
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

                        {/* Footer with action buttons */}
                        <View style={styles.footer}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={onClose}
                                activeOpacity={0.7}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.confirmButton,
                                    selectedUsers.size === 0 && styles.confirmButtonDisabled
                                ]}
                                onPress={handleConfirm}
                                activeOpacity={0.7}
                                disabled={selectedUsers.size === 0}>
                                <Text style={styles.confirmButtonText}>
                                    Create ({selectedUsers.size})
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </SafeAreaView>
        </Modal>
    );
}

const createStyles = (theme: any) => StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
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
        maxHeight: '85%',
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.lg,
        overflow: 'hidden',
        flexDirection: 'column',
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
        fontWeight: '700',
        color: theme.colors.text,
    },
    closeButton: {
        padding: theme.spacing.xs,
    },
    subtitle: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.md,
        marginBottom: theme.spacing.md,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        padding: theme.spacing.md,
        marginHorizontal: theme.spacing.md,
        marginBottom: theme.spacing.md,
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
    userItemSelected: {
        backgroundColor: '#e8f4f8',
        borderColor: theme.colors.primary,
        borderWidth: theme.borderWidth.medium,
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
    avatarSelected: {
        backgroundColor: theme.colors.primary,
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
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: theme.borderWidth.thin,
        borderColor: theme.colors.borderLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxSelected: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    loadingContainer: {
        padding: theme.spacing.xl,
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
    },
    emptyContainer: {
        padding: theme.spacing.xl,
        justifyContent: 'center',
        alignItems: 'center',
        gap: theme.spacing.md,
        flex: 1,
    },
    emptyText: {
        fontSize: theme.fontSize.md,
        color: theme.colors.textSecondary,
        textAlign: 'center',
    },
    footer: {
        flexDirection: 'row',
        gap: theme.spacing.md,
        padding: theme.spacing.lg,
        borderTopWidth: theme.borderWidth.thin,
        borderTopColor: theme.colors.borderLight,
        backgroundColor: theme.colors.surface,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.borderRadius.md,
        borderWidth: theme.borderWidth.thin,
        borderColor: theme.colors.borderLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: theme.fontSize.md,
        fontWeight: '600',
        color: theme.colors.text,
    },
    confirmButton: {
        flex: 1,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.borderRadius.md,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmButtonDisabled: {
        backgroundColor: theme.colors.disabled,
    },
    confirmButtonText: {
        fontSize: theme.fontSize.md,
        fontWeight: '600',
        color: theme.colors.white,
    },
});
