import { useColors } from '@/hooks/use-theme-color';
import i18n from '@/i18n';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PetProfile, PetService } from '@/lib/petService';
import { useAuthStore } from '@/store/useAuthStore';
import { AppFonts } from '@/constants/theme';
import { useQuery } from '@tanstack/react-query';

type BookingModalProps = {
    visible: boolean;
    onClose: () => void;
    onConfirm: (data: { startDate: Date; endDate: Date; pets: PetProfile[]; totalPrice: number; nights: number }) => void;
    pricePerNight: number;
    hostName: string;
    isSubmitting?: boolean;
    serviceType: string;
    unavailableDates?: Date[];
    unavailableTimes?: Record<string, string[]>;
};

const TIME_SLOTS = ["08:00 AM", "10:00 AM", "12:00 PM", "02:00 PM", "04:00 PM", "06:00 PM"];

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function BookingModal({ visible, onClose, onConfirm, pricePerNight, hostName, isSubmitting, serviceType, unavailableDates = [], unavailableTimes = {} }: BookingModalProps) {
    const c = useColors();
    const styles = makeStyles(c);
    const insets = useSafeAreaInsets();

    const isHourlyService = ['grooming', 'walking', 'training', 'vets'].includes((serviceType || '').toLowerCase());

    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string>(TIME_SLOTS[0]);
    const { user } = useAuthStore();

    const { data: myPets = [] } = useQuery({
        queryKey: ['pets', user?.uid],
        queryFn: () => PetService.getUserPets(user!.uid),
        enabled: visible && !!user?.uid,
    });

    const [selectedPets, setSelectedPets] = useState<PetProfile[]>([]);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Generate localized week days
    const weekDays = useMemo(() => {
        // Jan 7, 2024 is a Sunday. We use this as a base to generate Sunday-Saturday
        const baseDate = new Date(2024, 0, 7);
        const days = [];
        // Helper to format date manually if toLocaleString fails or behaves unexpectedly on Android text
        // But standard toLocaleString usually works. We ensure 'en-US' fallback if locale is missing.
        const locale = i18n.locale || 'en-US';

        for (let i = 0; i < 7; i++) {
            const date = new Date(baseDate);
            date.setDate(baseDate.getDate() + i);
            days.push(date.toLocaleString(locale, { weekday: 'short' }));
        }
        return days;
    }, [i18n.locale]);

    // Animation Values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.spring(slideAnim, {
                    toValue: 0,
                    useNativeDriver: true,
                    damping: 25,
                    stiffness: 120,
                    mass: 0.8,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: SCREEN_HEIGHT,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    const handleClose = () => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: SCREEN_HEIGHT,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => onClose());
    };

    // Calendar Logic
    const calendarDays = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayIndex = firstDay.getDay(); // 0 = Sunday

        const days = [];
        // Empty slots for previous month
        for (let i = 0; i < startingDayIndex; i++) {
            days.push(null);
        }
        // Days of current month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }
        return days;
    }, [currentMonth]);

    const handleDatePress = (date: Date) => {
        if (isDateDisabled(date)) return;

        if (isHourlyService) {
            setStartDate(date);
            setEndDate(null);
            return;
        }

        if (!startDate || (startDate && endDate)) {
            setStartDate(date);
            setEndDate(null);
        } else {
            if (date < startDate) {
                setStartDate(date);
            } else {
                let hasDisabledDate = false;
                const current = new Date(startDate);
                current.setDate(current.getDate() + 1);
                current.setHours(0,0,0,0);
                
                const end = new Date(date);
                end.setHours(0,0,0,0);

                while (current <= end) {
                    if (isDateDisabled(current)) {
                        hasDisabledDate = true;
                        break;
                    }
                    current.setDate(current.getDate() + 1);
                }

                if (hasDisabledDate) {
                    setStartDate(date);
                    setEndDate(null);
                } else {
                    setEndDate(date);
                }
            }
        }
    };

    const isDateSelected = (date: Date) => {
        if (!startDate) return false;
        if (startDate.getTime() === date.getTime()) return true;
        if (!isHourlyService && endDate && endDate.getTime() === date.getTime()) return true;
        return false;
    };

    const isDateDisabled = (date: Date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (date < today) return true;

        return unavailableDates.some(unavailable => 
            unavailable.getDate() === date.getDate() &&
            unavailable.getMonth() === date.getMonth() &&
            unavailable.getFullYear() === date.getFullYear()
        );
    };

    const isDateInRange = (date: Date) => {
        if (isHourlyService) return false;
        if (!startDate || !endDate) return false;
        return date > startDate && date < endDate;
    };

    // Price Calculation
    const nights = useMemo(() => {
        if (isHourlyService) return 1; // Hourly services count as 1 Base Session mathematically
        if (!startDate || !endDate) return 0;
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }, [startDate, endDate, isHourlyService]);

    const serviceFee = 25;
    const totalPrice = (nights * pricePerNight) + serviceFee;

    const changeMonth = (increment: number) => {
        const newDate = new Date(currentMonth);
        newDate.setMonth(newDate.getMonth() + increment);
        setCurrentMonth(newDate);
    };

    const handleConfirm = () => {
        if (!startDate) return;
        
        let finalStart = new Date(startDate);
        let finalEnd = endDate ? new Date(endDate) : new Date(startDate);
        
        if (isHourlyService) {
            const [time, period] = selectedTime.split(' ');
            let [hours, minutes] = time.split(':').map(Number);
            if (period === 'PM' && hours !== 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;
            
            finalStart.setHours(hours, minutes, 0, 0);
            finalEnd = new Date(finalStart);
            finalEnd.setHours(finalEnd.getHours() + 1); // Exact 1 Hour block
        }

        onConfirm({ startDate: finalStart, endDate: finalEnd, pets: selectedPets, totalPrice, nights });
    };

    if (!visible) return null;

    return (
        <Modal
            transparent={true}
            visible={visible}
            animationType="none"
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
                    <TouchableOpacity style={StyleSheet.absoluteFill} onPress={handleClose} />
                </Animated.View>

                <Animated.View
                    style={[
                        styles.container,
                        {
                            paddingBottom: insets.bottom + 20,
                            transform: [{ translateY: slideAnim }]
                        }
                    ]}
                >

                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>{i18n.t('booking_title')}</Text>
                        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={c.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Calendar Section */}
                        <View style={styles.section}>
                            <View style={styles.monthHeader}>
                                <TouchableOpacity onPress={() => changeMonth(-1)}>
                                    <Ionicons name="chevron-back" size={24} color={c.text} />
                                </TouchableOpacity>
                                <Text style={styles.monthTitle}>
                                    {currentMonth.toLocaleString(i18n.locale, { month: 'long', year: 'numeric' })}
                                </Text>
                                <TouchableOpacity onPress={() => changeMonth(1)}>
                                    <Ionicons name="chevron-forward" size={24} color={c.text} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.weekDays}>
                                {weekDays.map(day => (
                                    <Text key={day} style={styles.weekDayText}>{day}</Text>
                                ))}
                            </View>

                            <View style={styles.daysGrid}>
                                {calendarDays.map((date, index) => {
                                    if (!date) return <View key={`empty-${index}`} style={styles.dayCell} />;

                                    const isSelected = isDateSelected(date);
                                    const inRange = isDateInRange(date);
                                    const isToday = new Date().toDateString() === date.toDateString();
                                    const isDisabled = isDateDisabled(date);

                                    return (
                                        <TouchableOpacity
                                            key={index}
                                            style={[
                                                styles.dayCell,
                                                isSelected && styles.selectedDay,
                                                inRange && styles.inRangeDay,
                                                isDisabled && styles.disabledDay,
                                            ]}
                                            onPress={() => handleDatePress(date)}
                                            disabled={isDisabled}
                                        >
                                            <Text style={[
                                                styles.dayText,
                                                isSelected && styles.selectedDayText,
                                                inRange && styles.inRangeDayText,
                                                isToday && !isSelected && !inRange && !isDisabled && styles.todayText,
                                                isDisabled && styles.disabledDayText
                                            ]}>
                                                {date.getDate()}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                            <TouchableOpacity
                                onPress={() => { setStartDate(null); setEndDate(null); }}
                                style={styles.clearButton}
                            >
                                <Text style={styles.clearButtonText}>{i18n.t('booking_clear_dates')}</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.divider} />

                        {/* Hourly Time Slot Selection conditionally rendered */}
                        {isHourlyService && (
                            <>
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>{i18n.t('booking_time_slot')}</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeScroll}>
                                        {TIME_SLOTS.map(time => {
                                            const dateStr = startDate ? `${startDate.getFullYear()}-${(startDate.getMonth() + 1).toString().padStart(2, '0')}-${startDate.getDate().toString().padStart(2, '0')}` : '';
                                            const bookedTimes = unavailableTimes[dateStr] || [];
                                            const isDisabled = bookedTimes.includes(time);
                                            return (
                                                <TouchableOpacity
                                                    key={time}
                                                    style={[
                                                        styles.timeSlotBtn, 
                                                        selectedTime === time && styles.timeSlotBtnSelected, 
                                                        { borderColor: c.border },
                                                        isDisabled && { opacity: 0.3, backgroundColor: c.border }
                                                    ]}
                                                    onPress={() => setSelectedTime(time)}
                                                    disabled={isDisabled}
                                                >
                                                    <Text style={[styles.timeSlotText, { color: selectedTime === time ? 'white' : (isDisabled ? c.textMuted : c.text) }]}>
                                                        {time}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </ScrollView>
                                </View>
                                <View style={styles.divider} />
                            </>
                        )}

                        {/* Pets */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>{i18n.t('booking_pets', { defaultValue: 'Pets' })}</Text>
                            {myPets.length === 0 ? (
                                <Text style={{ color: c.textMuted, fontFamily: AppFonts.body, marginTop: 8 }}>
                                    You haven't added any pets yet. Please add a pet in your profile first.
                                </Text>
                            ) : (
                                <View style={{ gap: 10, marginTop: 8 }}>
                                    {myPets.map(pet => {
                                        const isSelected = selectedPets.some(p => p.id === pet.id);
                                        return (
                                            <TouchableOpacity 
                                                key={pet.id!} 
                                                style={[styles.petSelectRow, { borderColor: isSelected ? c.primary : c.border, backgroundColor: isSelected ? c.bg2 : c.bg }]}
                                                onPress={() => {
                                                    if (isSelected) {
                                                        setSelectedPets(prev => prev.filter(p => p.id !== pet.id));
                                                    } else {
                                                        setSelectedPets(prev => [...prev, pet]);
                                                    }
                                                }}
                                            >
                                                <View style={{ flex: 1 }}>
                                                    <Text style={{ color: c.text, fontFamily: AppFonts.bodyBold, fontSize: 16 }}>{pet.name}</Text>
                                                    <Text style={{ color: c.textMuted, fontFamily: AppFonts.body, fontSize: 13, marginTop: 2 }}>{pet.breed} • {pet.age}</Text>
                                                </View>
                                                {isSelected ? (
                                                    <Ionicons name="checkmark-circle" size={24} color={c.primary} />
                                                ) : (
                                                    <Ionicons name="ellipse-outline" size={24} color={c.border} />
                                                )}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            )}
                        </View>

                        <View style={styles.divider} />

                        {/* Price Breakdown */}
                        {nights > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>{i18n.t('booking_price_breakdown')}</Text>
                                <View style={styles.priceRow}>
                                    <Text style={styles.priceLabel}>
                                        {isHourlyService ? i18n.t('booking_session_rate', { price: pricePerNight }) : i18n.t('booking_nightly_rate', { price: pricePerNight, count: nights })}
                                    </Text>
                                    <Text style={styles.priceValue}>{pricePerNight * nights} MAD</Text>
                                </View>
                                <View style={styles.priceRow}>
                                    <Text style={styles.priceLabel}>{i18n.t('booking_service_fee')}</Text>
                                    <Text style={styles.priceValue}>{serviceFee} MAD</Text>
                                </View>
                                <View style={[styles.divider, { marginVertical: 12 }]} />
                                <View style={styles.priceRow}>
                                    <Text style={styles.totalLabel}>{i18n.t('booking_total')}</Text>
                                    <Text style={styles.totalValue}>{totalPrice} MAD</Text>
                                </View>
                            </View>
                        )}

                    </ScrollView>

                    {/* Footer Button */}
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={[styles.confirmButton, (!startDate || (!isHourlyService && !endDate) || selectedPets.length === 0 || isSubmitting) && styles.confirmButtonDisabled]}
                            disabled={!startDate || (!isHourlyService && !endDate) || selectedPets.length === 0 || isSubmitting}
                            onPress={handleConfirm}
                        >
                            <Text style={styles.confirmButtonText}>
                                {isSubmitting ? i18n.t('booking_processing', { defaultValue: 'Processing...' }) : (startDate && (isHourlyService || endDate) ? (selectedPets.length > 0 ? i18n.t('booking_confirm') : 'Select Pets') : i18n.t('booking_select_dates'))}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}

const makeStyles = (c: any) => StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    container: {
        backgroundColor: c.bg2,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
        minHeight: '60%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: c.border,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: c.text,
    },
    closeButton: {
        padding: 4,
    },
    section: {
        padding: 20,
    },
    monthHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    monthTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: c.text,
    },
    weekDays: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    weekDayText: {
        flex: 1,
        textAlign: 'center',
        color: c.textMuted,
        fontSize: 12,
        fontWeight: '600',
    },
    daysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    dayCell: {
        width: '14.28%',
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 2,
        borderRadius: 20,
    },
    dayText: {
        color: c.text,
        fontSize: 14,
    },
    selectedDay: {
        backgroundColor: c.primary,
    },
    selectedDayText: {
        color: 'white',
        fontWeight: 'bold',
    },
    inRangeDay: {
        backgroundColor: c.primary + '20', // 20% opacity
        borderRadius: 0,
    },
    inRangeDayText: {
        color: c.primary,
        fontWeight: '600',
    },
    disabledDay: {
        opacity: 0.4,
    },
    disabledDayText: {
        color: c.textMuted,
        textDecorationLine: 'line-through',
    },
    todayText: {
        color: c.primary,
        fontWeight: 'bold',
    },
    clearButton: {
        alignSelf: 'flex-end',
        marginTop: 10,
    },
    clearButtonText: {
        color: c.textMuted,
        textDecorationLine: 'underline',
    },
    divider: {
        height: 1,
        backgroundColor: c.border,
        marginHorizontal: 20,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    label: {
        fontSize: 16,
        color: c.text,
        fontWeight: '500',
    },
    counter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    counterBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: c.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    counterBtnDisabled: {
        opacity: 0.5,
        borderColor: c.border,
    },
    counterValue: {
        fontSize: 16,
        fontWeight: '600',
        color: c.text,
        minWidth: 20,
        textAlign: 'center',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 16,
        color: c.text,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    priceLabel: {
        color: c.textMuted,
        fontSize: 14,
    },
    priceValue: {
        color: c.text,
        fontSize: 14,
    },
    totalLabel: {
        color: c.text,
        fontSize: 16,
        fontWeight: 'bold',
    },
    totalValue: {
        color: c.text,
        fontSize: 16,
        fontWeight: 'bold',
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: c.border,
    },
    confirmButton: {
        backgroundColor: c.primary,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    confirmButtonDisabled: {
        opacity: 0.5,
    },
    confirmButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    petSelectRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderWidth: 1,
        borderRadius: 12,
    },
    timeScroll: {
        gap: 12,
        paddingVertical: 8,
    },
    timeSlotBtn: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
    },
    timeSlotBtnSelected: {
        backgroundColor: c.primary,
        borderColor: c.primary,
    },
    timeSlotText: {
        fontSize: 14,
        fontWeight: '600',
    },
});
