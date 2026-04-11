import { AppFonts } from '@/constants/theme';
import { useColors } from '@/hooks/use-theme-color';
import i18n from '@/i18n';
import { AuthService } from '@/lib/authService';
import { useAuthStore } from '@/store/useAuthStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const RoleCard = ({
    type,
    title,
    desc,
    icon,
    isSelected,
    onPress
}: {
    type: 'guest' | 'host',
    title: string,
    desc: string,
    icon: keyof typeof Ionicons.glyphMap,
    isSelected: boolean,
    onPress: () => void
}) => {
    const c = useColors();
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const borderAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Run scale purely on JS thread so we can animate colors safely
        Animated.spring(scaleAnim, {
            toValue: isSelected ? 1.02 : 1,
            friction: 5,
            tension: 40,
            useNativeDriver: false,
        }).start();

        // Run border color changes on JS thread
        Animated.timing(borderAnim, {
            toValue: isSelected ? 1 : 0,
            duration: 200,
            easing: Easing.out(Easing.ease),
            useNativeDriver: false,
        }).start();
    }, [isSelected]);

    const borderColor = borderAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [c.border, c.primary]
    });

    return (
        <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
            <Animated.View style={[
                styles.card,
                {
                    backgroundColor: isSelected ? c.primary + '0A' : c.bg2,
                    borderColor: borderColor,
                    transform: [{ scale: scaleAnim }],
                    shadowColor: isSelected ? c.primary : '#000',
                    shadowOpacity: isSelected ? 0.15 : 0.05,
                    borderWidth: isSelected ? 2 : 1,
                }
            ]}>
                <View style={[styles.iconBox, { backgroundColor: isSelected ? c.primary : c.bg }]}>
                    <Ionicons name={icon} size={28} color={isSelected ? '#fff' : c.text} />
                </View>
                <View style={styles.cardContent}>
                    <Text style={[styles.cardTitle, { color: c.text }]}>{title}</Text>
                    <Text style={[styles.cardDesc, { color: c.textMuted }]}>{desc}</Text>
                </View>
                <View style={[styles.radioCircle, { borderColor: isSelected ? c.primary : c.border }]}>
                    {isSelected && <View style={[styles.radioInner, { backgroundColor: c.primary }]} />}
                </View>
            </Animated.View>
        </TouchableOpacity>
    );
};

export default function RoleSelectionScreen() {
    const c = useColors();
    const router = useRouter();
    const { user, setRole } = useAuthStore();
    const [selectedRole, setSelectedRole] = useState<'guest' | 'host' | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    const handleContinue = async () => {
        if (!user || !selectedRole) return;
        setIsUpdating(true);
        try {
            await AuthService.updateRole(user.uid, selectedRole);
            setRole(selectedRole);
            // Routing automatically handled by _layout.tsx based on activeRole
        } catch (error) {
            console.error(error);
            setIsUpdating(false);
            alert('Failed to set role. Please try again.');
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: c.text }]}>Welcome!</Text>
                <Text style={[styles.subtitle, { color: c.textMuted }]}>
                    {i18n.t('auth_role_prompt')}
                </Text>
            </View>

            <View style={styles.cardContainer}>
                <RoleCard
                    type="guest"
                    title={i18n.t('auth_role_guest')}
                    desc="Discover loving homes and sitters for your pet's perfect stay."
                    icon="search"
                    isSelected={selectedRole === 'guest'}
                    onPress={() => setSelectedRole('guest')}
                />

                <RoleCard
                    type="host"
                    title={i18n.t('auth_role_host')}
                    desc="Open your doors, care for pets, and earn money on your own schedule."
                    icon="home"
                    isSelected={selectedRole === 'host'}
                    onPress={() => setSelectedRole('host')}
                />
            </View>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.continueBtn, { backgroundColor: selectedRole ? c.primary : c.bg2, opacity: selectedRole ? 1 : 0.5 }]}
                    disabled={!selectedRole || isUpdating}
                    onPress={handleContinue}
                >
                    {isUpdating ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={[styles.continueText, { color: selectedRole ? '#fff' : c.textMuted }]}>
                            Continue
                        </Text>
                    )}
                </TouchableOpacity>
            </View>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        marginTop: 60,
        marginBottom: 40,
        paddingHorizontal: 28,
    },
    title: {
        fontSize: 34,
        fontFamily: AppFonts.title,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 18,
        fontFamily: AppFonts.body,
        lineHeight: 26,
    },
    cardContainer: {
        paddingHorizontal: 24,
        gap: 20,
    },
    card: {
        flexDirection: 'row',
        padding: 20,
        borderRadius: 24,
        alignItems: 'center',
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 16,
        elevation: 4, // for android
    },
    iconBox: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    cardContent: {
        flex: 1,
        paddingRight: 16,
    },
    cardTitle: {
        fontSize: 18,
        fontFamily: AppFonts.title,
        marginBottom: 4,
    },
    cardDesc: {
        fontSize: 14,
        fontFamily: AppFonts.body,
        lineHeight: 20,
    },
    radioCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    footer: {
        marginTop: 'auto',
        paddingHorizontal: 24,
        paddingBottom: Platform.OS === 'ios' ? 20 : 40,
    },
    continueBtn: {
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 2,
    },
    continueText: {
        fontSize: 18,
        fontFamily: AppFonts.bodyBold,
    }
});
