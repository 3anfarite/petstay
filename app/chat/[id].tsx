import { useColors } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MOCK_MESSAGES = [
    {
        id: '1',
        text: "Hi Alex! Thanks for booking with me. I'm looking forward to hosting Max!",
        sender: 'them',
        time: '09:41 AM',
    },
    {
        id: '2',
        text: "Hi Sarah! We're excited too. Quick question - do you have a fenced yard?",
        sender: 'me',
        time: '09:42 AM',
    },
    {
        id: '3',
        text: "Yes, I have a fully fenced backyard. It's about 500 sq ft, plenty of space for running around.",
        sender: 'them',
        time: '09:45 AM',
    },
    {
        id: '4',
        text: "That sounds perfect! What about walks? How many times a day do you usually go?",
        sender: 'me',
        time: '09:46 AM',
    },
    {
        id: '5',
        text: "I usually do a long morning walk (45 mins) and two shorter ones in the afternoon/evening. Does that work for Max?",
        sender: 'them',
        time: '09:48 AM',
    },
];

export default function ChatDetailScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const c = useColors();
    const insets = useSafeAreaInsets();
    const [messages, setMessages] = useState(MOCK_MESSAGES);
    const [inputText, setInputText] = useState('');
    const flatListRef = useRef<FlatList>(null);

    const sendMessage = () => {
        if (!inputText.trim()) return;

        const newMessage = {
            id: Date.now().toString(),
            text: inputText.trim(),
            sender: 'me',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages([...messages, newMessage]);
        setInputText('');

        // Simulate slight delay for scroll to bottom
        setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
    };

    return (
        <View style={[styles.container, { backgroundColor: c.bg2, paddingTop: insets.top }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: c.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={c.text} />
                </TouchableOpacity>

                <View style={styles.headerContent}>
                    <Image
                        source={{ uri: (params.avatar as string) || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop' }}
                        style={styles.avatar}
                    />
                    <View>
                        <Text style={[styles.name, { color: c.text }]}>
                            {params.name || 'Sarah Wilson'}
                        </Text>
                        <Text style={[styles.status, { color: c.textMuted }]}>Active now</Text>
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
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.messageList}
                renderItem={({ item }) => (
                    <View style={[
                        styles.messageBubble,
                        item.sender === 'me' ? styles.myMessage : styles.theirMessage,
                        item.sender === 'me' ? { backgroundColor: c.primary } : { backgroundColor: c.bg },
                    ]}>
                        <Text style={[
                            styles.messageText,
                            item.sender === 'me' ? { color: 'white' } : { color: c.text }
                        ]}>
                            {item.text}
                        </Text>
                        <Text style={[
                            styles.messageTime,
                            item.sender === 'me' ? { color: 'rgba(255,255,255,0.7)' } : { color: c.textMuted }
                        ]}>
                            {item.time}
                        </Text>
                    </View>
                )}
            />

            {/* Input */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <View style={[styles.inputContainer, { backgroundColor: c.bg, borderTopColor: c.border }]}>
                    <TouchableOpacity style={styles.attachButton}>
                        <Ionicons name="add" size={24} color={c.primary} />
                    </TouchableOpacity>

                    <TextInput
                        style={[styles.input, { backgroundColor: c.bg2, color: c.text }]}
                        placeholder="Type a message..."
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
        paddingHorizontal: 12,
        paddingTop: 12,
        paddingBottom: 34, // Added extra padding for home indicator
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
