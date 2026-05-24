import { useColors } from '@/hooks/use-theme-color';
import i18n from '@/i18n';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chat, ChatService } from '@/lib/chatService';
import { useAuthStore } from '@/store/useAuthStore';

export default function ChatScreen() {
  const router = useRouter();
  const c = useColors();
  const [selectedTag, setSelectedTag] = useState('All');
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [chats, setChats] = useState<Chat[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = ChatService.subscribeToChats(user.uid, (fetchedChats) => {
      setChats(fetchedChats);
    });
    return () => unsubscribe();
  }, [user]);

  // Translate tags dynamically
  const tags = [
    { id: 'All', label: i18n.t('chat_filter_all') },
    { id: 'Hosts', label: i18n.t('chat_filter_hosts') },
    { id: 'Support', label: i18n.t('chat_filter_support') },
  ];

  const filteredChats = chats; // Keep it simple for now, since we only have user chats. You can add logic to filter by host/support if desired.

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={[styles.container, { backgroundColor: c.bg2, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.text }]}>{i18n.t('chat_title')}</Text>
      </View>

      <View style={styles.tagsContainer}>
        {tags.map((tag) => {
          const isActive = selectedTag === tag.id;
          return (
            <TouchableOpacity
              key={tag.id}
              style={[
                styles.tag,
                {
                  backgroundColor: isActive ? c.primary : c.bg,
                  borderColor: isActive ? c.primary : c.border,
                }
              ]}
              onPress={() => setSelectedTag(tag.id)}
            >
              <Text style={[
                styles.tagText,
                { color: isActive ? 'white' : c.text }
              ]}>
                {tag.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={filteredChats}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Ionicons name="chatbubbles-outline" size={48} color={c.textMuted} />
            <Text style={{ color: c.textMuted, marginTop: 16 }}>{i18n.t('chat_no_messages', { defaultValue: 'No messages yet' })}</Text>
          </View>
        }
        renderItem={({ item }) => {
          // Identify the other participant
          const otherUserId = item.participants.find(id => id !== user?.uid) || item.participants[0];
          const otherUser = item.participantDetails[otherUserId] || { name: 'Unknown', avatar: '' };

          let displayAvatar = otherUser.avatar;
          if (!displayAvatar || displayAvatar.includes('unsplash.com') || displayAvatar.includes('placecats.com')) {
            displayAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser.name || 'User')}&background=F3F4F6&color=374151&size=200`;
          }

          const isUnread = (item.unreadCount?.[user?.uid || ''] || 0) > 0;

          return (
            <TouchableOpacity
              style={[styles.chatRow, { borderBottomColor: c.border }]}
              onPress={() => router.push({
                pathname: `/chat/[id]`,
                params: { id: otherUserId, name: otherUser.name, avatar: displayAvatar }
              })}
            >
              <View style={styles.avatarContainer}>
                <Image 
                  source={{ uri: displayAvatar }} 
                  style={styles.avatar} 
                />
              </View>

              <View style={styles.chatContent}>
                <View style={styles.chatHeader}>
                  <Text style={[styles.name, { color: c.text }]}>{otherUser.name}</Text>
                  <Text style={[styles.time, { color: c.textMuted }]}>{formatTime(item.lastMessageTime)}</Text>
                </View>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.message,
                    {
                      color: isUnread ? c.text : c.textMuted,
                      fontWeight: isUnread ? '600' : '400'
                    }
                  ]}
                >
                  {item.lastMessage}
                </Text>
              </View>

              {isUnread && (
                <View style={[styles.unreadBadge, { backgroundColor: c.primary }]} />
              )}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  tagsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  tag: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 20,
  },
  chatRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  chatContent: {
    flex: 1,
    gap: 4,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  time: {
    fontSize: 12,
  },
  message: {
    fontSize: 14,
  },
  unreadBadge: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
