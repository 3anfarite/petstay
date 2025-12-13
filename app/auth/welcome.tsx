import { useColors } from '@/hooks/use-theme-color';
import i18n from '@/i18n';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, Image, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
    const router = useRouter();
    const c = useColors();
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { backgroundColor: c.bg2 }]}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {/* Hero Image */}
            <View style={styles.heroContainer}>
                <Image
                    source={{ uri: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=2969&auto=format&fit=crop' }}
                    style={styles.heroImage}
                />
                <LinearGradient
                    colors={['transparent', c.bg2]}
                    style={styles.gradient}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    locations={[0.2, 1]}
                />
            </View>

            {/* Content */}
            <View style={[styles.content, { paddingBottom: insets.bottom + 20 }]}>
                <View style={styles.header}>
                    <Text style={[styles.title, { color: c.text }]}>{i18n.t('auth_welcome_title')}</Text>
                    <Text style={[styles.subtitle, { color: c.textMuted }]}>
                        {i18n.t('auth_welcome_subtitle')}
                    </Text>
                </View>

                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.button, styles.emailButton, { backgroundColor: c.primary }]}
                        onPress={() => router.push({ pathname: '/auth/authenticate', params: { mode: 'login' } })}
                    >
                        <Ionicons name="mail-outline" size={20} color="white" />
                        <Text style={[styles.buttonText, { color: 'white' }]}>
                            {i18n.t('auth_continue_email')}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.button, styles.socialButton, { borderColor: c.border }]}>
                        <Ionicons name="logo-apple" size={20} color={c.text} />
                        <Text style={[styles.buttonText, { color: c.text }]}>
                            {i18n.t('auth_continue_apple')}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.button, styles.socialButton, { borderColor: c.border }]}>
                        <Ionicons name="logo-google" size={20} color={c.text} />
                        <Text style={[styles.buttonText, { color: c.text }]}>
                            {i18n.t('auth_continue_google')}
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: c.textMuted }]}>
                        {i18n.t('auth_no_account')}
                    </Text>
                    <TouchableOpacity onPress={() => router.push({ pathname: '/auth/authenticate', params: { mode: 'signup' } })}>
                        <Text style={[styles.linkText, { color: c.text }]}>
                            {i18n.t('auth_signup')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    heroContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: height * 0.6,
    },
    heroImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    gradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '40%', // Fade over the bottom 40% of the image
    },
    content: {
        flex: 1,
        justifyContent: 'flex-end',
        paddingHorizontal: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        textAlign: 'center',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        paddingHorizontal: 20,
        lineHeight: 24,
    },
    actions: {
        gap: 16,
        marginBottom: 24,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 16,
        gap: 12,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    emailButton: {
        borderWidth: 0,
    },
    socialButton: {
        backgroundColor: 'transparent',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    footerText: {
        fontSize: 14,
    },
    linkText: {
        fontSize: 14,
        fontWeight: 'bold',
        textDecorationLine: 'underline',
    },
});
