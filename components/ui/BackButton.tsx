import { useColors } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleProp, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';

interface BackButtonProps {
    onPress?: () => void;
    style?: StyleProp<ViewStyle>;
    icon?: keyof typeof Ionicons.glyphMap;
}

export const BackButton = ({ onPress, style, icon = "chevron-back" }: BackButtonProps) => {
    const c = useColors();
    const router = useRouter();

    return (
        <TouchableOpacity
            style={[styles.button, { backgroundColor: c.bg, borderColor: c.border }, style]}
            onPress={onPress || (() => router.back())}
        >
            <Ionicons name={icon} size={24} color={c.text} style={{ marginLeft: icon === 'chevron-back' ? -2 : 0 }} />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 0, // Flat design friendly
    }
});
