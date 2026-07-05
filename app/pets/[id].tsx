import { AppFonts } from '@/constants/theme';
import { useColors } from '@/hooks/use-theme-color';
import { PetProfile, PetService, PetType } from '@/lib/petService';
import { uploadImage } from '@/lib/storageService';
import { useAuthStore } from '@/store/useAuthStore';
import i18n from '@/i18n';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const PET_TYPES: { labelKey: string; defaultLabel: string; value: PetType }[] = [
    { labelKey: 'pets_form_type_dog', defaultLabel: 'Dog', value: 'dogs' },
    { labelKey: 'pets_form_type_cat', defaultLabel: 'Cat', value: 'cats' },
    { labelKey: 'pets_form_type_exotic', defaultLabel: 'Exotic/Other', value: 'exotics' },
];

export default function PetFormScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const isNew = id === 'new';

    const c = useColors();
    const router = useRouter();
    const { user } = useAuthStore();

    const queryClient = useQueryClient();

    const [saving, setSaving] = useState(false);

    const [name, setName] = useState('');
    const [type, setType] = useState<PetType>('dogs');
    const [breed, setBreed] = useState('');
    const [age, setAge] = useState('');
    const [weight, setWeight] = useState('');
    const [medicalConditions, setMedicalConditions] = useState('');
    const [temperament, setTemperament] = useState('');
    const [imageUri, setImageUri] = useState<string | null>(null);

    const { data: pet, isLoading: loading } = useQuery({
        queryKey: ['pet', user?.uid, id],
        queryFn: async () => {
            const fetched = await PetService.getPetById(user!.uid, id);
            if (!fetched) {
                Alert.alert(i18n.t('pets_form_error'), i18n.t('pets_form_error_not_found'));
                router.back();
                throw new Error('Not found');
            }
            return fetched;
        },
        enabled: !isNew && !!user?.uid,
    });

    useEffect(() => {
        if (pet) {
            setName(pet.name);
            setType(pet.type);
            setBreed(pet.breed);
            setAge(pet.age);
            setWeight(pet.weight);
            setMedicalConditions(pet.medicalConditions);
            setTemperament(pet.temperament);
            setImageUri(pet.image || null);
        }
    }, [pet]);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        if (!user) return;
        if (!name || !breed || !age || !weight || !medicalConditions) {
            Alert.alert(i18n.t('pets_form_missing'), i18n.t('pets_form_missing_msg'));
            return;
        }

        setSaving(true);
        try {
            let finalImageUrl = imageUri;

            // If image is a local file (from image picker), upload it
            if (imageUri && !imageUri.startsWith('http')) {
                const storagePath = `users/${user.uid}/pets/${Date.now()}.jpg`;
                finalImageUrl = await uploadImage(imageUri, storagePath);
            }

            const petData: Omit<PetProfile, 'id' | 'createdAt' | 'ownerId'> = {
                name,
                type,
                breed,
                age,
                weight,
                medicalConditions,
                temperament,
                image: finalImageUrl || '',
            };

            if (isNew) {
                await PetService.addPet(user.uid, petData);
            } else {
                await PetService.updatePet(user.uid, id, petData);
            }

            queryClient.invalidateQueries({ queryKey: ['pets'] });
            router.back();
        } catch (error) {
            console.error(error);
            Alert.alert(i18n.t('pets_form_error'), i18n.t('pets_form_error_save'));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = () => {
        Alert.alert(i18n.t('pets_form_delete_title'), i18n.t('pets_form_delete_msg'), [
            { text: i18n.t('pets_form_cancel'), style: 'cancel' },
            {
                text: i18n.t('pets_form_delete_title'),
                style: 'destructive',
                onPress: async () => {
                    if (!user) return;
                    setSaving(true);
                    try {
                        await PetService.deletePet(user.uid, id);
                        queryClient.invalidateQueries({ queryKey: ['pets'] });
                        router.back();
                    } catch (error) {
                        console.error(error);
                        setSaving(false);
                    }
                }
            }
        ]);
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: c.bg, justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={c.primary} />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: c.bg }]}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
        >
            <Stack.Screen
                options={{
                    title: isNew ? i18n.t('pets_add') : i18n.t('pets_edit'),
                }}
            />
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                {/* Image Picker */}
                <View style={styles.imageSection}>
                    <TouchableOpacity style={[styles.imageCircle, { backgroundColor: c.bg2, borderColor: c.border }]} onPress={pickImage}>
                        {imageUri ? (
                            <Image source={{ uri: imageUri }} style={styles.image} contentFit="cover" />
                        ) : (
                            <Ionicons name="camera" size={40} color={c.textMuted} />
                        )}
                        <View style={[styles.editBadge, { backgroundColor: c.primary, borderColor: c.bg }]}>
                            <Ionicons name="pencil" size={12} color="white" />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Form Fields */}
                <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: c.text }]}>{i18n.t('pets_form_name')}</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: c.bg2, color: c.text, borderColor: c.border }]}
                        value={name}
                        onChangeText={setName}
                        placeholder={i18n.t('pets_form_name_ph')}
                        placeholderTextColor={c.textMuted}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: c.text }]}>{i18n.t('pets_form_type')}</Text>
                    <View style={styles.typeSelector}>
                        {PET_TYPES.map((pt) => (
                            <TouchableOpacity
                                key={pt.value}
                                style={[
                                    styles.typeButton,
                                    { backgroundColor: type === pt.value ? c.primary : c.bg2, borderColor: type === pt.value ? c.primary : c.border }
                                ]}
                                onPress={() => setType(pt.value)}
                            >
                                <Text style={[styles.typeButtonText, { color: type === pt.value ? 'white' : c.text }]}>
                                    {i18n.t(pt.labelKey, { defaultValue: pt.defaultLabel })}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.row}>
                    <View style={[styles.formGroup, { flex: 1 }]}>
                        <Text style={[styles.label, { color: c.text }]}>{i18n.t('pets_form_breed')}</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: c.bg2, color: c.text, borderColor: c.border }]}
                            value={breed}
                            onChangeText={setBreed}
                            placeholder={i18n.t('pets_form_breed_ph')}
                            placeholderTextColor={c.textMuted}
                        />
                    </View>
                </View>

                <View style={styles.row}>
                    <View style={[styles.formGroup, { flex: 1 }]}>
                        <Text style={[styles.label, { color: c.text }]}>{i18n.t('pets_form_age')}</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: c.bg2, color: c.text, borderColor: c.border }]}
                            value={age}
                            onChangeText={setAge}
                            placeholder={i18n.t('pets_form_age_ph')}
                            placeholderTextColor={c.textMuted}
                        />
                    </View>
                    <View style={[styles.formGroup, { flex: 1 }]}>
                        <Text style={[styles.label, { color: c.text }]}>{i18n.t('pets_form_weight')}</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: c.bg2, color: c.text, borderColor: c.border }]}
                            value={weight}
                            onChangeText={setWeight}
                            placeholder={i18n.t('pets_form_weight_ph')}
                            keyboardType="numeric"
                            placeholderTextColor={c.textMuted}
                        />
                    </View>
                </View>

                <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: c.text }]}>{i18n.t('pets_form_medical')}</Text>
                    <TextInput
                        style={[styles.textArea, { backgroundColor: c.bg2, color: c.text, borderColor: c.border }]}
                        value={medicalConditions}
                        onChangeText={setMedicalConditions}
                        placeholder={i18n.t('pets_form_medical_ph')}
                        placeholderTextColor={c.textMuted}
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: c.text }]}>{i18n.t('pets_form_temperament')}</Text>
                    <TextInput
                        style={[styles.textArea, { backgroundColor: c.bg2, color: c.text, borderColor: c.border }]}
                        value={temperament}
                        onChangeText={setTemperament}
                        placeholder={i18n.t('pets_form_temperament_ph')}
                        placeholderTextColor={c.textMuted}
                        multiline
                        numberOfLines={2}
                        textAlignVertical="top"
                    />
                </View>

                {/* Save Button */}
                <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: c.primary, opacity: saving ? 0.7 : 1 }]}
                    onPress={handleSave}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.saveButtonText}>{i18n.t('pets_form_save')}</Text>
                    )}
                </TouchableOpacity>

                {/* Delete Button */}
                {!isNew && (
                    <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={handleDelete}
                        disabled={saving}
                    >
                        <Text style={[styles.deleteButtonText, { color: c.error }]}>{i18n.t('pets_form_delete')}</Text>
                    </TouchableOpacity>
                )}

            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 40,
    },
    imageSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    imageCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    image: {
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
    },
    row: {
        flexDirection: 'row',
        gap: 16,
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontFamily: AppFonts.bodyBold,
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        fontFamily: AppFonts.body,
    },
    textArea: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        fontFamily: AppFonts.body,
        minHeight: 80,
    },
    typeSelector: {
        flexDirection: 'row',
        gap: 8,
    },
    typeButton: {
        flex: 1,
        borderWidth: 1,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    typeButtonText: {
        fontFamily: AppFonts.bodyBold,
        fontSize: 14,
    },
    saveButton: {
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 12,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontFamily: AppFonts.bodyBold,
    },
    deleteButton: {
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    deleteButtonText: {
        fontSize: 16,
        fontFamily: AppFonts.bodyBold,
    }
});
