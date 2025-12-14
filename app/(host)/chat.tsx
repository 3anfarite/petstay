import { useColors } from '@/hooks/use-theme-color';
import i18n from '@/i18n';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CHATS = [
  {
    id: '1',
    name: 'PetStay Support',
    avatar: 'https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?w=200&h=200&fit=crop',
    lastMessage: 'Hi Alex! How can we help you with your booking today?',
    time: '2m ago',
    type: 'Support',
    unread: 2,
    isSupport: true,
  },
  {
    id: '2',
    name: 'Sarah Wilson',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
    lastMessage: 'Looking forward to meeting Max this weekend! 🐕',
    time: '1h ago',
    type: 'Clients',
    unread: 0,
  },
  {
    id: '3',
    name: 'David Chen',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
    lastMessage: 'Thanks for the review! It was a pleasure hosting.',
    time: '1d ago',
    type: 'Clients',
    unread: 0,
  },
  {
    id: '4',
    name: 'Emily Parker',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
    lastMessage: 'Is 2 PM okay for drop-off?',
    time: '2d ago',
    type: 'Clients',
    unread: 1,
  },
  {
    id: '5',
    name: 'Michael Brown',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
    lastMessage: 'See you then!',
    time: '3d ago',
    type: 'Clients',
    unread: 0,
  },
];

export default function ChatScreen() {
  const router = useRouter();
  const c = useColors();
  const [selectedTag, setSelectedTag] = useState('All');
  const insets = useSafeAreaInsets();

  // Translate tags dynamically
  const tags = [
    { id: 'All', label: i18n.t('chat_filter_all') },
    { id: 'Clients', label: i18n.t('chat_filter_clients') },
    { id: 'Support', label: i18n.t('chat_filter_support') },
  ];

  const filteredChats = CHATS.filter(chat => {
    if (selectedTag === 'All') return true;
    return chat.type === selectedTag;
  });

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
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.chatRow, { borderBottomColor: c.border }]}
            onPress={() => router.push({
              pathname: `/chat/[id]`,
              params: { id: item.id, name: item.name, avatar: item.avatar }
            })}
          >
            <View style={styles.avatarContainer}>
              <Image source={{ uri: item.avatar }} style={styles.avatar} />
              {item.isSupport && (
                <View style={[styles.badgeIcon, { backgroundColor: c.primary }]}>
                  <Ionicons name="shield-checkmark" size={10} color="white" />
                </View>
              )}
            </View>

            <View style={styles.chatContent}>
              <View style={styles.chatHeader}>
                <Text style={[styles.name, { color: c.text }]}>{item.name}</Text>
                <Text style={[styles.time, { color: c.textMuted }]}>{item.time}</Text>
              </View>
              <Text
                numberOfLines={1}
                style={[
                  styles.message,
                  {
                    color: item.unread ? c.text : c.textMuted,
                    fontWeight: item.unread ? '600' : '400'
                  }
                ]}
              >
                {item.lastMessage}
              </Text>
            </View>

            {item.unread > 0 && (
              <View style={[styles.unreadBadge, { backgroundColor: c.primary }]}>
                <Text style={styles.unreadText}>{item.unread}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
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
  badgeIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
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
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
