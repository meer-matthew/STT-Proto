import React, { useState } from 'react';
import {
    View,
    Modal,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Animated,
    Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useTheme } from '../context/ThemeContext';
import { ConversationList } from './ConversationList';

type ConversationDrawerProps = {
    visible: boolean;
    onClose: () => void;
    onSelectConversation: (conversationId: string) => void;
    selectedConversationId: string | null;
    onCreateConversation: (selectedUsers?: any[]) => void;
};

const DRAWER_WIDTH = Dimensions.get('window').width * 0.75;

export function ConversationDrawer({
    visible,
    onClose,
    onSelectConversation,
    selectedConversationId,
    onCreateConversation,
}: ConversationDrawerProps) {
    const theme = useTheme();
    const styles = createStyles(theme);
    const [slideAnim] = React.useState(new Animated.Value(-DRAWER_WIDTH));

    React.useEffect(() => {
        if (visible) {
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: false,
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: -DRAWER_WIDTH,
                duration: 300,
                useNativeDriver: false,
            }).start();
        }
    }, [visible, slideAnim]);

    const handleSelectConversation = (conversationId: string) => {
        onSelectConversation(conversationId);
        onClose();
    };

    const handleCreateConversation = (selectedUsers?: any[]) => {
        onCreateConversation(selectedUsers);
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="none">
            {/* Overlay */}
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay} />
            </TouchableWithoutFeedback>

            {/* Drawer */}
            <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
                <View style={styles.closeButtonContainer}>
                    <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={styles.closeButton}>
                        <Icon name="chevron-left" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                </View>

                <ConversationList
                    onSelectConversation={handleSelectConversation}
                    selectedConversationId={selectedConversationId}
                    onCreateConversation={handleCreateConversation}
                />
            </Animated.View>
        </Modal>
    );
}

const createStyles = (theme: any) =>
    StyleSheet.create({
        overlay: {
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
        },
        drawer: {
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: DRAWER_WIDTH,
            backgroundColor: theme.colors.white,
            zIndex: 1000,
            shadowColor: '#000',
            shadowOffset: { width: 2, height: 0 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 10,
        },
        closeButtonContainer: {
            paddingHorizontal: theme.spacing.md,
            paddingVertical: theme.spacing.sm,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.borderLight,
        },
        closeButton: {
            padding: theme.spacing.xs,
        },
    });