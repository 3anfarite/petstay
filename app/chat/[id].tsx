import { useColors } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import i18n from '@/i18n';
import React, { useEffect, useRef, useState } from 'react';
import {
    FlatList,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChatService, Message } from '@/lib/chatService';
import { useAuthStore } from '@/store/useAuthStore';

export default function ChatDetailScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const c = useColors();
    const insets = useSafeAreaInsets();
    const { user } = useAuthStore();
    
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const flatListRef = useRef<FlatList>(null);
    const [keyboardVisible, setKeyboardVisible] = useState(false);

    const otherUserId = params.id as string;
    const chatId = user ? ChatService.getChatId(user.uid, otherUserId) : '';

    useEffect(() => {
        if (!chatId) return;
        const unsubscribe = ChatService.subscribeToMessages(chatId, (fetchedMessages) => {
            setMessages(fetchedMessages);
            // Mark as read when new messages arrive and we are in the chat
            if (user) {
                ChatService.markAsRead(chatId, user.uid);
            }
            // Optional: scroll to end on new messages
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        });
        return () => unsubscribe();
    }, [chatId]);

    useEffect(() => {
        const keyboardWillShow = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            () => setKeyboardVisible(true)
        );
        const keyboardWillHide = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => setKeyboardVisible(false)
        );

        return () => {
            keyboardWillShow.remove();
            keyboardWillHide.remove();
        };
    }, []);

    const sendMessage = async () => {
        if (!inputText.trim() || !user || !chatId) return;

        const textToSend = inputText.trim();
        setInputText(''); // Optimistic clear

        try {
            await ChatService.sendMessage(chatId, user.uid, textToSend, otherUserId);
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        } catch (error) {
            console.error("Failed to send message", error);
            setInputText(textToSend); // Restore if failed
        }
    };

    const formatTime = (timestamp: any) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <View style={[styles.container, { backgroundColor: c.bg2, paddingTop: insets.top }]}>
            <View style={[styles.header, { borderBottomColor: c.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={c.text} />
                </TouchableOpacity>

                <View style={styles.headerContent}>
                    <Image
                        source={{ 
                            uri: (params.avatar && !(params.avatar as string).includes('unsplash.com') && !(params.avatar as string).includes('placecats.com')) 
                                ? (params.avatar as string) 
                                : `https://ui-avatars.com/api/?name=${encodeURIComponent((params.name as string) || 'User')}&background=F3F4F6&color=374151&size=200` 
                        }}
                        style={styles.avatar}
                    />
                    <View>
                        <Text style={[styles.name, { color: c.text }]}>
                            {params.name || 'Guest'}
                        </Text>
                        <Text style={[styles.status, { color: c.textMuted }]}>{i18n.t('chat_status_active', { defaultValue: 'Active' })}</Text>
                    </View>
                </View>

                <TouchableOpacity style={styles.headerAction}>
                    <Ionicons name="call-outline" size={24} color={c.primary} />
                </TouchableOpacity>
            </View>

            {/* Messages */}
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id!}
                contentContainerStyle={styles.messageList}
                renderItem={({ item }) => {
                    const isMe = item.senderId === user?.uid;
                    return (
                        <View style={[
                            styles.messageBubble,
                            isMe ? styles.myMessage : styles.theirMessage,
                            isMe ? { backgroundColor: c.primary } : { backgroundColor: c.bg },
                        ]}>
                            <Text style={[
                                styles.messageText,
                                isMe ? { color: 'white' } : { color: c.text }
                            ]}>
                                {item.text}
                            </Text>
                            <Text style={[
                                styles.messageTime,
                                isMe ? { color: 'rgba(255,255,255,0.7)' } : { color: c.textMuted }
                            ]}>
                                {formatTime(item.createdAt)}
                            </Text>
                        </View>
                    );
                }}
            />

            {/* Input */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <View style={[
                    styles.inputContainer,
                    {
                        backgroundColor: c.bg,
                        borderTopColor: c.border,
                        paddingBottom: keyboardVisible ? 12 : 34 // Dynamic padding
                    }
                ]}>
                    <TouchableOpacity style={styles.attachButton}>
                        <Ionicons name="add" size={24} color={c.primary} />
                    </TouchableOpacity>

                    <TextInput
                        style={[styles.input, { backgroundColor: c.bg2, color: c.text }]}
                        placeholder={i18n.t('chat_input_placeholder', { defaultValue: 'Type a message...' })}
                        placeholderTextColor={c.textMuted}
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                    />

                    <TouchableOpacity
                        style={[styles.sendButton, { backgroundColor: inputText.trim() ? c.primary : c.border }]}
                        disabled={!inputText.trim()}
                        onPress={sendMessage}
                    >
                        <Ionicons name="arrow-up" size={20} color="white" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    headerContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
    },
    status: {
        fontSize: 12,
    },
    headerAction: {
        padding: 8,
    },
    messageList: {
        padding: 16,
        gap: 16,
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 20,
    },
    myMessage: {
        alignSelf: 'flex-end',
        borderBottomRightRadius: 4,
    },
    theirMessage: {
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 16,
        lineHeight: 22,
    },
    messageTime: {
        fontSize: 11,
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    attachButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        minHeight: 40,
        maxHeight: 100,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 16,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
