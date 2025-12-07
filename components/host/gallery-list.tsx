import { useColors } from '@/hooks/use-theme-color';
import i18n from '@/i18n';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type GalleryListProps = {
    images: string[];
};

export function GalleryList({ images }: GalleryListProps) {
    const c = useColors();
    const styles = makeStyles(c);
    const insets = useSafeAreaInsets();
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    if (!images || images.length === 0) return null;

    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{i18n.t('host_gallery')}</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.galleryScroll}
            >
                {images.map((img, index) => (
                    <TouchableOpacity key={index} onPress={() => setSelectedImage(img)}>
                        <Image source={{ uri: img }} style={styles.galleryImage} />
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <Modal
                visible={!!selectedImage}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setSelectedImage(null)}
            >
                <View style={styles.modalContainer}>
                    {/* Close button area - high z-index */}
                    <View
                        style={[styles.modalHeader, { paddingTop: insets.top + 10 }]}
                        pointerEvents="box-none"
                    >
                        <TouchableOpacity
                            onPress={() => setSelectedImage(null)}
                            style={styles.closeButton}
                            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                        >
                            <Ionicons name="close" size={28} color="white" />
                        </TouchableOpacity>
                    </View>

                    {/* Content area - tap to close */}
                    <TouchableWithoutFeedback onPress={() => setSelectedImage(null)}>
                        <View style={styles.modalContent}>
                            {selectedImage && (
                                <TouchableWithoutFeedback>
                                    <Image
                                        source={{ uri: selectedImage }}
                                        style={styles.fullScreenImage}
                                        resizeMode="contain"
                                    />
                                </TouchableWithoutFeedback>
                            )}
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </Modal>
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
        modalContainer: {
            flex: 1,
            backgroundColor: 'black',
        },
        modalHeader: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 20, // Ensure it's above everything
            alignItems: 'flex-end',
            paddingHorizontal: 20,
        },
        closeButton: {
            padding: 10,
            backgroundColor: 'rgba(0,0,0,0.5)',
            borderRadius: 20,
        },
        modalContent: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            height: '100%',
        },
        fullScreenImage: {
            width: '100%',
            height: '100%',
        },
    });
