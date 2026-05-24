import { AppFonts } from '@/constants/theme';
import { useColors } from '@/hooks/use-theme-color';
import i18n from '@/i18n';
import { AuthService } from '@/lib/authService';
import { Ionicons } from '@expo/vector-icons';
import * as AuthSession from 'expo-auth-session';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    KeyboardAvoidingView,
    LayoutAnimation,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

WebBrowser.maybeCompleteAuthSession();

type AuthMode = 'login' | 'signup';

const getPasswordStrength = (pw: string) => {
    if (!pw) return { level: 0, label: '', color: 'transparent' };
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { level: 1, label: 'Weak', color: '#EF4444' };
    if (score <= 3) return { level: 2, label: 'Fair', color: '#F59E0B' };
    return { level: 3, label: 'Strong', color: '#10B981' };
};

export default function AuthScreen() {
    const router = useRouter();
    const c = useColors();
    const params = useLocalSearchParams<{ mode: AuthMode }>();
    const [mode, setMode] = useState<AuthMode>(params.mode || 'login');

    // Form State
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const [isLoadingAuth, setIsLoadingAuth] = useState(false);

    const pwStrength = mode === 'signup' ? getPasswordStrength(password) : null;

    // Google Auth Configuration
    const [request, response, promptAsync] = AuthSession.useAuthRequest(
        {
            clientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID || process.env.EXPO_PUBLIC_WEB_CLEINT_ID || process.env.EXPO_WEB_CLEINT_ID || '',
            scopes: ['openid', 'profile', 'email'],
            responseType: AuthSession.ResponseType.IdToken,
            redirectUri: AuthSession.makeRedirectUri(),
        },
        {
            authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
            tokenEndpoint: 'https://oauth2.googleapis.com/token',
            revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
        }
    );

    useEffect(() => {
        if (response?.type === 'success') {
            const { id_token } = response.params;
            if (id_token) {
                setIsLoadingAuth(true);
                AuthService.signInWithGoogle(id_token)
                    .then(() => {
                        setIsLoadingAuth(false);
                        // No router.replace needed here! _layout.tsx will dynamically handle it because user & role changed globally!
                    })
                    .catch((err) => {
                        setIsLoadingAuth(false);
                        Alert.alert('Google Sign-In Failed', err.message);
                    });
            }
        }
    }, [response]);

    const switchMode = (newMode: AuthMode) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setMode(newMode);
    };

    const handleSubmit = async () => {
        if (!email || !password) {
            alert('Please fill in all fields');
            return;
        }

        setIsLoadingAuth(true);
        const trimmedEmail = email.trim();
        try {
            if (mode === 'signup') {
                await AuthService.signUp(trimmedEmail, password, name);
            } else {
                await AuthService.signIn(trimmedEmail, password);
            }

            // _layout.tsx listener will catch this and naturally route!

        } catch (error: any) {
            if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
                Alert.alert(i18n.t('auth_err_login_failed'), i18n.t('auth_err_not_found'));
            } else if (error.code === 'auth/email-already-in-use') {
                Alert.alert(i18n.t('auth_err_reg_failed'), i18n.t('auth_err_email_in_use'));
            } else if (error.code === 'auth/invalid-email') {
                Alert.alert(i18n.t('auth_err_invalid_email_title'), i18n.t('auth_err_invalid_email_desc'));
            } else if (error.code === 'auth/missing-password') {
                Alert.alert(i18n.t('auth_err_missing_pass_title'), i18n.t('auth_err_missing_pass_desc'));
            } else {
                Alert.alert(i18n.t('auth_err_error'), error.message);
            }
        } finally {
            setIsLoadingAuth(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                {/* Close Button */}
                <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: c.bg2 }]}>
                    <Ionicons name="close" size={22} color={c.text} />
                </TouchableOpacity>

                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={[styles.contentScroll, { paddingBottom: 40 }]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.headerArea}>
                        <View style={[styles.iconWrapper, { backgroundColor: c.primary + '15' }]}>
                            <Ionicons name={mode === 'login' ? "paw" : "person-add"} size={32} color={c.primary} />
                        </View>
                        <Text style={[styles.title, { color: c.text }]}>
                            {mode === 'login' ? i18n.t('auth_welcome_back') : i18n.t('auth_create_account')}
                        </Text>
                        <Text style={[styles.subtitle, { color: c.textMuted }]}>
                            {mode === 'login' ? i18n.t('auth_welcome_subtitle') : i18n.t('auth_create_profile')}
                        </Text>
                    </View>

                    <View style={styles.form}>
                        {mode === 'signup' && (
                            <View style={[styles.inputContainer, { backgroundColor: c.bg2, borderColor: focusedField === 'name' ? c.primary : c.border }]}>
                                <Ionicons name="person-outline" size={20} color={focusedField === 'name' ? c.primary : c.textMuted} style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, { color: c.text }]}
                                    placeholder={i18n.t('auth_name') || "Name"}
                                    placeholderTextColor={c.textMuted}
                                    value={name}
                                    onChangeText={setName}
                                    autoCapitalize="words"
                                    onFocus={() => setFocusedField('name')}
                                    onBlur={() => setFocusedField(null)}
                                />
                            </View>
                        )}

                        <View style={[styles.inputContainer, { backgroundColor: c.bg2, borderColor: focusedField === 'email' ? c.primary : c.border }]}>
                            <Ionicons name="mail-outline" size={20} color={focusedField === 'email' ? c.primary : c.textMuted} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: c.text }]}
                                placeholder={i18n.t('auth_email') || "Email Address"}
                                placeholderTextColor={c.textMuted}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                onFocus={() => setFocusedField('email')}
                                onBlur={() => setFocusedField(null)}
                            />
                        </View>

                        <View>
                            <View style={[styles.inputContainer, { backgroundColor: c.bg2, borderColor: focusedField === 'password' ? c.primary : c.border }]}>
                                <Ionicons name="lock-closed-outline" size={20} color={focusedField === 'password' ? c.primary : c.textMuted} style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, { color: c.text }]}
                                    placeholder={i18n.t('auth_password') || "Password"}
                                    placeholderTextColor={c.textMuted}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    onFocus={() => setFocusedField('password')}
                                    onBlur={() => setFocusedField(null)}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={c.textMuted} />
                                </TouchableOpacity>
                            </View>

                            {/* Password Strength — signup only */}
                            {mode === 'signup' && password.length > 0 && pwStrength && (
                                <View style={styles.strengthRow}>
                                    <View style={styles.strengthBars}>
                                        {[1, 2, 3].map(i => (
                                            <View
                                                key={i}
                                                style={[styles.strengthBar, { backgroundColor: i <= pwStrength.level ? pwStrength.color : c.border }]}
                                            />
                                        ))}
                                    </View>
                                    <Text style={[styles.strengthLabel, { color: pwStrength.color }]}>{pwStrength.label}</Text>
                                </View>
                            )}
                        </View>

                        {mode === 'login' && (
                            <TouchableOpacity style={styles.forgotPassword}>
                                <Text style={[styles.forgotPasswordText, { color: c.primary }]}>
                                    {i18n.t('auth_forgot_password')}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: c.primary, opacity: isLoadingAuth ? 0.7 : 1 }]}
                            onPress={handleSubmit}
                            disabled={isLoadingAuth}
                            activeOpacity={0.85}
                        >
                            {isLoadingAuth ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.buttonText}>
                                    {mode === 'login' ? i18n.t('auth_signin_btn') : i18n.t('auth_create_account')}
                                </Text>
                            )}
                        </TouchableOpacity>

                        {/* Divider */}
                        <View style={styles.dividerRow}>
                            <View style={[styles.dividerLine, { backgroundColor: c.border }]} />
                            <Text style={[styles.dividerText, { color: c.textMuted }]}>{i18n.t('auth_or', { defaultValue: 'or' })}</Text>
                            <View style={[styles.dividerLine, { backgroundColor: c.border }]} />
                        </View>

                        <TouchableOpacity
                            style={[styles.socialButton, { backgroundColor: c.bg2, borderColor: c.border }]}
                            onPress={() => promptAsync()}
                            disabled={!request || isLoadingAuth}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="logo-google" size={20} color="#4285F4" style={{ position: 'absolute', left: 20 }} />
                            <Text style={[styles.socialButtonText, { color: c.text }]}>{i18n.t('auth_continue_google')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.toggleModeButton}
                            onPress={() => switchMode(mode === 'login' ? 'signup' : 'login')}
                        >
                            <Text style={[styles.toggleModeText, { color: c.textMuted }]}>
                                {mode === 'login' ? (i18n.locale === 'fr' ? "Pas encore de compte ? " : "Don't have an account? ") : (i18n.locale === 'fr' ? "Déjà un compte ? " : "Already have an account? ")}
                                <Text style={{ color: c.primary, fontFamily: AppFonts.bodyBold }}>
                                    {mode === 'login' ? (i18n.locale === 'fr' ? "S'inscrire" : "Sign up") : (i18n.locale === 'fr' ? "Se connecter" : "Log in")}
                                </Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backButton: {
        position: 'absolute',
        top: 20,
        right: 24,
        zIndex: 10,
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentScroll: {
        flexGrow: 1,
        paddingHorizontal: 32,
        paddingTop: 60,
    },
    headerArea: {
        alignItems: 'center',
        marginBottom: 40,
        marginTop: 20,
    },
    iconWrapper: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 30,
        marginBottom: 8,
        fontFamily: AppFonts.title,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        fontFamily: AppFonts.body,
        textAlign: 'center',
    },
    form: {
        gap: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 58,
        borderRadius: 16,
        paddingHorizontal: 16,
        borderWidth: 1.5,
    },
    inputIcon: {
        marginRight: 14,
    },
    input: {
        flex: 1,
        fontSize: 16,
        fontFamily: AppFonts.body,
    },
    strengthRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 10,
        paddingHorizontal: 4,
    },
    strengthBars: {
        flexDirection: 'row',
        gap: 4,
        flex: 1,
    },
    strengthBar: {
        flex: 1,
        height: 4,
        borderRadius: 2,
    },
    strengthLabel: {
        fontSize: 12,
        fontFamily: AppFonts.bodyBold,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginTop: 4,
    },
    forgotPasswordText: {
        fontSize: 14,
        fontFamily: AppFonts.bodyBold,
    },
    footer: {
        marginTop: 'auto',
        gap: 16,
        paddingTop: 40,
    },
    button: {
        height: 58,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
        elevation: 4,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontFamily: AppFonts.bodyBold,
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    dividerLine: {
        flex: 1,
        height: 1,
    },
    dividerText: {
        fontSize: 13,
        fontFamily: AppFonts.body,
    },
    socialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 58,
        borderRadius: 16,
        borderWidth: 1,
    },
    socialButtonText: {
        fontSize: 16,
        fontFamily: AppFonts.bodyBold,
    },
    toggleModeButton: {
        marginTop: 8,
        alignItems: 'center',
        padding: 8,
    },
    toggleModeText: {
        fontSize: 15,
        fontFamily: AppFonts.body,
    },
});
