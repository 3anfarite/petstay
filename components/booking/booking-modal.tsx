import { useColors } from '@/hooks/use-theme-color';
import i18n from '@/i18n';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type BookingModalProps = {
    visible: boolean;
    onClose: () => void;
    onConfirm: () => void;
    pricePerNight: number;
    hostName: string;
};

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function BookingModal({ visible, onClose, onConfirm, pricePerNight, hostName }: BookingModalProps) {
    const c = useColors();
    const styles = makeStyles(c);
    const insets = useSafeAreaInsets();

    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [petCount, setPetCount] = useState(1);
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
        if (!startDate || (startDate && endDate)) {
            setStartDate(date);
            setEndDate(null);
        } else {
            if (date < startDate) {
                setStartDate(date);
            } else {
                setEndDate(date);
            }
        }
    };

    const isDateSelected = (date: Date) => {
        if (!startDate) return false;
        if (startDate.getTime() === date.getTime()) return true;
        if (endDate && endDate.getTime() === date.getTime()) return true;
        return false;
    };

    const isDateInRange = (date: Date) => {
        if (!startDate || !endDate) return false;
        return date > startDate && date < endDate;
    };

    // Price Calculation
    const nights = useMemo(() => {
        if (!startDate || !endDate) return 0;
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }, [startDate, endDate]);

    const serviceFee = 25;
    const totalPrice = (nights * pricePerNight) + serviceFee;

    const changeMonth = (increment: number) => {
        const newDate = new Date(currentMonth);
        newDate.setMonth(newDate.getMonth() + increment);
        setCurrentMonth(newDate);
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

                                    return (
                                        <TouchableOpacity
                                            key={index}
                                            style={[
                                                styles.dayCell,
                                                isSelected && styles.selectedDay,
                                                inRange && styles.inRangeDay,
                                            ]}
                                            onPress={() => handleDatePress(date)}
                                        >
                                            <Text style={[
                                                styles.dayText,
                                                isSelected && styles.selectedDayText,
                                                inRange && styles.inRangeDayText,
                                                isToday && !isSelected && !inRange && styles.todayText
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

                        {/* Guests & Pets */}
                        <View style={styles.section}>
                            <View style={styles.row}>
                                <Text style={styles.label}>{i18n.t('booking_pets')}</Text>
                                <View style={styles.counter}>
                                    <TouchableOpacity
                                        onPress={() => setPetCount(Math.max(1, petCount - 1))}
                                        style={[styles.counterBtn, petCount <= 1 && styles.counterBtnDisabled]}
                                        disabled={petCount <= 1}
                                    >
                                        <Ionicons name="remove" size={20} color={petCount <= 1 ? c.textMuted : c.text} />
                                    </TouchableOpacity>
                                    <Text style={styles.counterValue}>{petCount}</Text>
                                    <TouchableOpacity
                                        onPress={() => setPetCount(petCount + 1)}
                                        style={styles.counterBtn}
                                    >
                                        <Ionicons name="add" size={20} color={c.text} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        {/* Price Breakdown */}
                        {nights > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>{i18n.t('booking_price_breakdown')}</Text>
                                <View style={styles.priceRow}>
                                    <Text style={styles.priceLabel}>
                                        {i18n.t('booking_nightly_rate', { price: pricePerNight, count: nights })}
                                    </Text>
                                    <Text style={styles.priceValue}>${pricePerNight * nights}</Text>
                                </View>
                                <View style={styles.priceRow}>
                                    <Text style={styles.priceLabel}>{i18n.t('booking_service_fee')}</Text>
                                    <Text style={styles.priceValue}>${serviceFee}</Text>
                                </View>
                                <View style={[styles.divider, { marginVertical: 12 }]} />
                                <View style={styles.priceRow}>
                                    <Text style={styles.totalLabel}>{i18n.t('booking_total')}</Text>
                                    <Text style={styles.totalValue}>${totalPrice}</Text>
                                </View>
                            </View>
                        )}

                    </ScrollView>

                    {/* Footer Button */}
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={[styles.confirmButton, (!startDate || !endDate) && styles.confirmButtonDisabled]}
                            disabled={!startDate || !endDate}
                            onPress={onConfirm}
                        >
                            <Text style={styles.confirmButtonText}>
                                {startDate && endDate ? i18n.t('booking_confirm') : i18n.t('booking_select_dates')}
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
        backgroundColor: c.border,
    },
    confirmButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
