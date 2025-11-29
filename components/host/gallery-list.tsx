import { useColors } from '@/hooks/use-theme-color';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

type GalleryListProps = {
    images: string[];
};

export function GalleryList({ images }: GalleryListProps) {
    const c = useColors();
    const styles = makeStyles(c);

    if (!images || images.length === 0) return null;

    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gallery</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.galleryScroll}
            >
                {images.map((img, index) => (
                    <Image key={index} source={{ uri: img }} style={styles.galleryImage} />
                ))}
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
        galleryScroll: {
            gap: 12,
            paddingHorizontal: 24,
        },
        galleryImage: {
            width: 160,
            height: 120,
            borderRadius: 12,
            backgroundColor: c.bg2,
        },
    });
