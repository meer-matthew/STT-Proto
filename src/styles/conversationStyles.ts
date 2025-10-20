import { StyleSheet } from 'react-native';

export const conversationStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fafafa',
    },
    splitContainer: {
        flex: 1,
        flexDirection: 'row',
    },
    conversationListPanel: {
        width: '25%',
        minWidth: 250,
        maxWidth: 350,
    },
    conversationPanel: {
        flex: 1,
        backgroundColor: '#fafafa',
    },
    conversationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 3,
        borderBottomColor: '#d0d0d0',
        backgroundColor: '#fff',
    },
    toggleButton: {
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 60,
        minHeight: 60,
    },
    scrollContainer: {
        flexGrow: 1,
        paddingBottom: 24,
    },
    messagesContainer: {
        paddingTop: 24,
        flex: 1,
    },
    emptyStateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingTop: 60,
    },
    emptyStateTitle: {
        fontSize: 32,
        fontWeight: '700',
        color: '#000',
        marginBottom: 20,
        textAlign: 'center',
    },
    emptyStateDescription: {
        fontSize: 22,
        fontWeight: '600',
        color: '#555',
        textAlign: 'center',
        lineHeight: 34,
    },
});