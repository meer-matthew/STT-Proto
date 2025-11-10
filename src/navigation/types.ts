export type RootStackParamList = {
    Welcome: undefined;
    Registration: undefined;
    RoleSelection: { username: string };
    ConversationOptions: { username: string };
    SelectConfiguration: { username: string };
    Conversation: { username: string; configuration?: string; conversationId?: number };
};