import { dummyCategories, dummyHosts } from '@/constants/dummyData';
import { useColors } from '@/hooks/use-theme-color';
import i18n from '@/i18n';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type FilterState = {
    location: string;
    selectedService: string | null;
    minPrice: string;
    maxPrice: string;
    isVerified: boolean;
};

export function FilterModalContent({ onClose, onApply }: { onClose: () => void, onApply?: (filters: FilterState) => void }) {
    const c = useColors();
    const styles = makeStyles(c);
    const insets = useSafeAreaInsets();

    const [location, setLocation] = useState('');
    const [selectedService, setSelectedService] = useState<string | null>(null);
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [isVerified, setIsVerified] = useState(false);

    const filteredCount = useMemo(() => {
        return dummyHosts.filter(host => {
            const matchesLocation = location ? host.location.toLowerCase().includes(location.toLowerCase()) : true;
            const matchesService = (selectedService && selectedService !== 'All') ? host.services.includes(selectedService) : true;
            const matchesMinPrice = minPrice ? host.price >= parseInt(minPrice) : true;
            const matchesMaxPrice = maxPrice ? host.price <= parseInt(maxPrice) : true;
            const matchesVerified = isVerified ? host.verified : true;

            return matchesLocation && matchesService && matchesMinPrice && matchesMaxPrice && matchesVerified;
        }).length;
    }, [location, selectedService, minPrice, maxPrice, isVerified]);

    const handleApply = () => {
        onApply?.({
            location,
            selectedService,
            minPrice,
            maxPrice,
            isVerified
        });
        onClose();
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onClose}>
                    <Text style={styles.cancelText}>{i18n.t('cancel')}</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{i18n.t('filter_title')}</Text>
                <TouchableOpacity onPress={() => {
                    setLocation('');
                    setSelectedService(null);
                    setMinPrice('');
                    setMaxPrice('');
                    setIsVerified(false);
                }}>
                    <Text style={styles.resetText}>{i18n.t('filter_reset')}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Location Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{i18n.t('filter_location')}</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="location-outline" size={20} color={c.textMuted} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder={i18n.t('search_placeholder')}
                            placeholderTextColor={c.textMuted}
                            value={location}
                            onChangeText={setLocation}
                        />
                    </View>
                </View>

                {/* Services Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{i18n.t('filter_service')}</Text>
                    <View style={styles.chipsContainer}>
                        {dummyCategories.map((cat) => {
                            const isSelected = selectedService === cat.name;
                            return (
                                <TouchableOpacity
                                    key={cat.id}
                                    style={[
                                        styles.chip,
                                        isSelected && styles.chipActive,
                                    ]}
                                    onPress={() => setSelectedService(isSelected ? null : cat.name)}
                                >
                                    <Text
                                        style={[
                                            styles.chipText,
                                            isSelected && styles.chipTextActive,
                                        ]}
                                    >
                                        {cat.name}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Price Range Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{i18n.t('filter_price_range')}</Text>
                    <View style={styles.priceRow}>
                        <View style={styles.priceInputContainer}>
                            <Text style={styles.currencyPrefix}>$</Text>
                            <TextInput
                                style={styles.priceInput}
                                placeholder={i18n.t('filter_min')}
                                placeholderTextColor={c.textMuted}
                                keyboardType="numeric"
                                value={minPrice}
                                onChangeText={setMinPrice}
                            />
                        </View>
                        <Text style={styles.priceSeparator}>-</Text>
                        <View style={styles.priceInputContainer}>
                            <Text style={styles.currencyPrefix}>$</Text>
                            <TextInput
                                style={styles.priceInput}
                                placeholder={i18n.t('filter_max')}
                                placeholderTextColor={c.textMuted}
                                keyboardType="numeric"
                                value={maxPrice}
                                onChangeText={setMaxPrice}
                            />
                        </View>
                    </View>
                </View>

                {/* Verified Only Toggle */}
                <View style={[styles.section, styles.rowBetween]}>
                    <View>
                        <Text style={styles.sectionTitle}>{i18n.t('filter_verified_title')}</Text>
                        <Text style={styles.sectionSubtitle}>{i18n.t('filter_verified_subtitle')}</Text>
                    </View>
                    <Switch
                        value={isVerified}
                        onValueChange={setIsVerified}
                        trackColor={{ false: c.border, true: c.primary }}
                        thumbColor={'white'}
                    />
                </View>

            </ScrollView>

            {/* Footer */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
                <TouchableOpacity style={styles.searchButton} onPress={handleApply}>
                    <Text style={styles.searchButtonText}>{i18n.t('show_homes', { count: filteredCount })}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const makeStyles = (c: any) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: c.bg2,
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: c.border,
        },
        headerTitle: {
            fontSize: 18,
            fontWeight: 'bold',
            color: c.text,
        },
        cancelText: {
            fontSize: 16,
            color: c.textMuted,
        },
        resetText: {
            fontSize: 16,
            fontWeight: '600',
            color: c.primary,
        },
        scrollContent: {
            padding: 20,
            paddingBottom: 100,
        },
        section: {
            marginBottom: 24,
        },
        sectionTitle: {
            fontSize: 16,
            fontWeight: '700',
            color: c.text,
            marginBottom: 12,
        },
        sectionSubtitle: {
            fontSize: 14,
            color: c.textMuted,
            marginTop: 4,
        },
        inputContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: c.bg2,
            borderRadius: 12,
            paddingHorizontal: 12,
            height: 50,
            borderWidth: 1,
            borderColor: c.border,
        },
        inputIcon: {
            marginRight: 8,
        },
        input: {
            flex: 1,
            fontSize: 16,
            color: c.text,
            height: '100%',
        },
        petTypeContainer: {
            flexDirection: 'row',
            gap: 12,
        },
        petTypeButton: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: c.border,
            backgroundColor: c.bg2,
            gap: 8,
        },
        petTypeButtonActive: {
            backgroundColor: c.primary,
            borderColor: c.primary,
        },
        petTypeText: {
            fontSize: 16,
            fontWeight: '600',
            color: c.text,
        },
        petTypeTextActive: {
            color: 'white',
        },
        chipsContainer: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 10,
        },
        chip: {
            paddingVertical: 8,
            paddingHorizontal: 16,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: c.border,
            backgroundColor: c.bg2,
        },
        chipActive: {
            backgroundColor: c.primary,
            borderColor: c.primary,
        },
        chipText: {
            fontSize: 14,
            color: c.text,
            fontWeight: '500',
        },
        chipTextActive: {
            color: 'white',
            fontWeight: '600',
        },
        priceRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
        },
        priceInputContainer: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: c.bg2,
            borderRadius: 12,
            paddingHorizontal: 12,
            height: 50,
            borderWidth: 1,
            borderColor: c.border,
        },
        currencyPrefix: {
            fontSize: 16,
            color: c.text,
            marginRight: 4,
        },
        priceInput: {
            flex: 1,
            fontSize: 16,
            color: c.text,
            height: '100%',
        },
        priceSeparator: {
            fontSize: 20,
            color: c.textMuted,
        },
        rowBetween: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        footer: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: 20,
            backgroundColor: c.bg2,
            borderTopWidth: 1,
            borderTopColor: c.border,
            paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        },
        searchButton: {
            backgroundColor: c.primary,
            paddingVertical: 16,
            borderRadius: 16,
            alignItems: 'center',
        },
        searchButtonText: {
            color: 'white',
            fontSize: 16,
            fontWeight: 'bold',
        },
    });
