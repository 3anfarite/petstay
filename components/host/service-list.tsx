import { useColors } from '@/hooks/use-theme-color';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type ServiceListProps = {
    services: string[];
    price: number;
    selectedService: string;
    onSelectService: (service: string) => void;
};

export function ServiceList({
    services,
    price,
    selectedService,
    onSelectService,
}: ServiceListProps) {
    const c = useColors();
    const styles = makeStyles(c);

    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Services</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.servicesScroll}
            >
                {services.map((service) => {
                    const isSelected = selectedService === service;
                    return (
                        <TouchableOpacity
                            key={service}
                            onPress={() => onSelectService(service)}
                            style={[
                                styles.serviceCard,
                                {
                                    borderColor: isSelected ? c.primary : c.border,
                                    backgroundColor: isSelected ? c.primary + '10' : c.bg2,
                                },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.serviceName,
                                    {
                                        color: isSelected ? c.primary : c.text,
                                        fontWeight: isSelected ? '900' : '100',
                                    },
                                ]}
                            >
                                {service}
                            </Text>
                            <Text style={styles.servicePrice}>
                                ${price}
                                <Text style={styles.serviceUnit}>/night</Text>
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
}

const makeStyles = (c: any) =>
    StyleSheet.create({
        section: {
            paddingVertical: 16,
        },
        sectionTitle: {
            fontSize: 18,
            fontWeight: '700',
            marginBottom: 12,
            paddingHorizontal: 24,
            color: c.text,
        },
        servicesScroll: {
            gap: 12,
            paddingHorizontal: 24,
        },
        serviceCard: {
            padding: 16,
            borderRadius: 16,
            borderWidth: 1,
            minWidth: 140,
            gap: 8,
        },
        serviceName: {
            fontSize: 15,
        },
        servicePrice: {
            fontSize: 16,
            fontWeight: '700',
            color: c.text,
        },
        serviceUnit: {
            color: c.textMuted,
            fontSize: 12,
            fontWeight: '400',
        },
    });
