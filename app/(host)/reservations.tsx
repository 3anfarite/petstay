import { useColors } from '@/hooks/use-theme-color';
import i18n from '@/i18n';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HostReservations() {
    const c = useColors();
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { backgroundColor: c.bg2, paddingTop: insets.top }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: c.text }]}>{i18n.t('host_reservations_title')}</Text>
            </View>
            <View style={styles.content}>
                <Ionicons name="calendar-outline" size={48} color={c.textMuted} />
                <Text style={{ color: c.textMuted, marginTop: 16 }}>{i18n.t('host_reservations_empty')}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
