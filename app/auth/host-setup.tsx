import { LocationCoords, LocationPickerModal } from '@/components/host/LocationPickerModal';
import { AppFonts } from '@/constants/theme';
import { useColors } from '@/hooks/use-theme-color';
import i18n from '@/i18n';
import { AuthService } from '@/lib/authService';
import { useAuthStore } from '@/store/useAuthStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ServiceType = 'boarding' | 'walking' | 'daycare' | 'grooming' | 'training' | 'vets';
type PetType = 'all' | 'dogs' | 'cats' | 'exotics';

const SERVICES = [
    { id: 'boarding', icon: 'home' as any },
    { id: 'walking', icon: 'walk' as any },
    { id: 'daycare', icon: 'sunny' as any },
    { id: 'grooming', icon: 'cut' as any },
    { id: 'training', icon: 'school' as any },
    { id: 'vets', icon: 'medkit' as any }
];

const PET_TYPES = [
    { id: 'all', icon: 'apps' as any },
    { id: 'dogs', icon: 'paw' as any },
    { id: 'cats', icon: 'logo-octocat' as any }, // Using octocat as a funny placeholder for cat
    { id: 'exotics', icon: 'leaf' as any }
];

export default function HostSetupScreen() {
    const c = useColors();
    const router = useRouter();
    const { user, setRole } = useAuthStore();

    const [location, setLocation] = useState('');
    const [locationCoords, setLocationCoords] = useState<LocationCoords | undefined>(undefined);
    const [isMapVisible, setIsMapVisible] = useState(false);
    const [bio, setBio] = useState('');

    // Multi-select states
    const [services, setServices] = useState<ServiceType[]>([]);
    const [petsAllowed, setPetsAllowed] = useState<PetType[]>([]);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const toggleService = (id: ServiceType) => {
        setServices(prev =>
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    const togglePet = (id: PetType) => {
        setPetsAllowed(prev => {
            if (id === 'all') {
                // If they click 'all', toggle it. If turning on, clear specific pets.
                return prev.includes('all') ? [] : ['all'];
            }
            // If they click a specific pet, remove 'all' tag if it was active
            const withoutAll = prev.filter(p => p !== 'all');
            return withoutAll.includes(id) ? withoutAll.filter(p => p !== id) : [...withoutAll, id];
        });
    };

    const handleSubmit = async () => {
        if (!location.trim() || services.length === 0 || petsAllowed.length === 0) {
            Alert.alert(i18n.t('host_setup_err_title'), i18n.t('host_setup_err_desc'));
            return;
        }

        if (!user?.uid) return;

        setIsSubmitting(true);
        try {
            const hostData = {
                location,
                locationCoords,
                services,
                petsAllowed,
                bio,
                isHostApproved: true,
            };

            await AuthService.completeHostOnboarding(user.uid, hostData);
            setRole('host'); // Triggers _layout.tsx to route to (host)/dashboard!
        } catch (error) {
            console.error(error);
            Alert.alert("Error", i18n.t('host_setup_err_fail'));
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={28} color={c.text} />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.titleContainer}>
                        <Text style={[styles.title, { color: c.text }]}>{i18n.t('host_setup_title')}</Text>
                        <Text style={[styles.subtitle, { color: c.textMuted }]}>
                            {i18n.t('host_setup_subtitle')}
                        </Text>
                    </View>

                    {/* Location */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: c.text }]}>{i18n.t('host_setup_location')}</Text>
                        <TouchableOpacity
                            style={[styles.inputBox, { backgroundColor: c.bg2, borderColor: c.border }]}
                            onPress={() => setIsMapVisible(true)}
                        >
                            <Ionicons name="location-outline" size={20} color={c.textMuted} style={styles.icon} />
                            <Text style={[styles.input, { color: location ? c.text : c.textMuted }]}>
                                {location || i18n.t('host_setup_location_ph')}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Services Array */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: c.text }]}>{i18n.t('host_setup_services')}</Text>
                        <View style={styles.chipContainer}>
                            {SERVICES.map((s) => {
                                const active = services.includes(s.id as ServiceType);
                                return (
                                    <TouchableOpacity
                                        key={s.id}
                                        style={[
                                            styles.chip,
                                            { backgroundColor: active ? c.primary : c.bg2, borderColor: active ? c.primary : c.border }
                                        ]}
                                        onPress={() => toggleService(s.id as ServiceType)}
                                    >
                                        <Ionicons name={s.icon} size={18} color={active ? '#fff' : c.text} style={{ marginRight: 6 }} />
                                        <Text style={[styles.chipText, { color: active ? '#fff' : c.text }]}>{i18n.t(`service_${s.id}`)}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* Pet Array */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: c.text }]}>{i18n.t('host_setup_pets')}</Text>
                        <View style={styles.chipContainer}>
                            {PET_TYPES.map((p) => {
                                const active = petsAllowed.includes(p.id as PetType);
                                return (
                                    <TouchableOpacity
                                        key={p.id}
                                        style={[
                                            styles.chip,
                                            { backgroundColor: active ? c.primary : c.bg2, borderColor: active ? c.primary : c.border }
                                        ]}
                                        onPress={() => togglePet(p.id as PetType)}
                                    >
                                        <Ionicons name={p.icon} size={18} color={active ? '#fff' : c.text} style={{ marginRight: 6 }} />
                                        <Text style={[styles.chipText, { color: active ? '#fff' : c.text }]}>{i18n.t(`pet_${p.id}`)}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>



                    {/* Bio */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: c.text }]}>{i18n.t('host_setup_bio')}</Text>
                        <View style={[styles.inputBox, { backgroundColor: c.bg2, borderColor: c.border, height: 100, alignItems: 'flex-start', paddingTop: 16 }]}>
                            <TextInput
                                style={[styles.input, { color: c.text, textAlignVertical: 'top' }]}
                                placeholder={i18n.t('host_setup_bio_ph')}
                                placeholderTextColor={c.textMuted}
                                multiline
                                numberOfLines={4}
                                value={bio}
                                onChangeText={setBio}
                            />
                        </View>
                    </View>

                    {/* Submit Foot */}
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={[styles.submitButton, { backgroundColor: c.primary }]}
                            onPress={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.submitText}>{i18n.t('host_setup_submit')}</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>

            <LocationPickerModal
                visible={isMapVisible}
                onClose={() => setIsMapVisible(false)}
                initialCoords={locationCoords}
                onConfirm={(addr, coords) => {
                    setLocation(addr);
                    setLocationCoords(coords);
                    setIsMapVisible(false);
                }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingHorizontal: 24,
        paddingTop: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 60,
    },
    titleContainer: {
        marginBottom: 32,
    },
    title: {
        fontSize: 32,
        fontFamily: AppFonts.title,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        fontFamily: AppFonts.body,
    },
    section: {
        marginBottom: 28,
    },
    sectionTitle: {
        fontSize: 16,
        fontFamily: AppFonts.bodyBold,
        marginBottom: 12,
    },
    inputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 56,
        borderRadius: 16,
        paddingHorizontal: 16,
        borderWidth: 1,
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontFamily: AppFonts.body,
        fontSize: 16,
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 20,
        borderWidth: 1,
    },
    chipText: {
        fontFamily: AppFonts.bodyBold,
        fontSize: 14,
    },
    footer: {
        marginTop: 20,
    },
    submitButton: {
        height: 58,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    submitText: {
        color: 'white',
        fontSize: 16,
        fontFamily: AppFonts.bodyBold,
    }
});
