import { useColors } from '@/hooks/use-theme-color';
import i18n from '@/i18n';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignUpScreen() {
    const router = useRouter();
    const c = useColors();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSignUp = () => {
        // Navigate straight to tabs as requested
        router.replace('/(tabs)');
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: c.bg2 }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={c.text} />
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    <Text style={[styles.title, { color: c.text }]}>{i18n.t('auth_create_account')}</Text>
                    <Text style={[styles.subtitle, { color: c.textMuted }]}>
                        {i18n.t('auth_create_profile')}
                    </Text>

                    <View style={styles.form}>
                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: c.text }]}>{i18n.t('auth_name')}</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: c.bg, color: c.text }]}
                                placeholder="John Doe"
                                placeholderTextColor={c.textMuted}
                                value={name}
                                onChangeText={setName}
                                autoCapitalize="words"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: c.text }]}>{i18n.t('auth_email')}</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: c.bg, color: c.text }]}
                                placeholder="name@example.com"
                                placeholderTextColor={c.textMuted}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: c.text }]}>{i18n.t('auth_password')}</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: c.bg, color: c.text }]}
                                placeholder="********"
                                placeholderTextColor={c.textMuted}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>
                    </View>

                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: c.primary }]}
                            onPress={handleSignUp}
                        >
                            <Text style={styles.buttonText}>{i18n.t('auth_create_account')}</Text>
                        </TouchableOpacity>

                        <View style={styles.signupContainer}>
                            <Text style={[styles.signupText, { color: c.textMuted }]}>
                                {i18n.t('auth_already_account')}
                            </Text>
                            <TouchableOpacity onPress={() => router.push('/auth/login')}>
                                <Text style={[styles.linkText, { color: c.text }]}>
                                    {i18n.t('auth_login')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 24,
        paddingVertical: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 40,
    },
    form: {
        gap: 24,
    },
    inputContainer: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
    },
    input: {
        height: 52,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    footer: {
        marginTop: 'auto',
        marginBottom: 20,
        gap: 24,
    },
    button: {
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    signupContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    signupText: {
        fontSize: 14,
    },
    linkText: {
        fontSize: 14,
        fontWeight: 'bold',
        textDecorationLine: 'underline',
    },
});
