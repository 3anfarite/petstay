import i18n from '@/i18n';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    FlatList,
    Image,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const SLIDES = [
    {
        id: '1',
        image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=2969&auto=format&fit=crop',
    },
    {
        id: '2',
        image: 'https://images.unsplash.com/photo-1551730459-92db2a308d6a?q=80&w=2487&auto=format&fit=crop',
    },
    {
        id: '3',
        image: 'https://images.unsplash.com/photo-1623387641168-d9803ddd3f35?q=80&w=2000&auto=format&fit=crop',
    },
];

export default function OnboardingScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollX = useRef(new Animated.Value(0)).current;
    const slidesRef = useRef<FlatList>(null);

    const viewablyItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;

    const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

    const scrollToNext = async () => {
        if (currentIndex < SLIDES.length - 1) {
            slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
        } else {
            await completeOnboarding();
        }
    };

    const completeOnboarding = async () => {
        try {
            await AsyncStorage.setItem('hasSeenOnboarding', 'true');
            router.replace('/auth/welcome');
        } catch (err) {
            console.error('Error saving onboarding status:', err);
            router.replace('/auth/welcome');
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {/* Full Screen Background Images */}
            <View style={StyleSheet.absoluteFill}>
                {SLIDES.map((slide, index) => {
                    const opacity = scrollX.interpolate({
                        inputRange: [
                            (index - 1) * width,
                            index * width,
                            (index + 1) * width,
                        ],
                        outputRange: [0, 1, 0],
                        extrapolate: 'clamp',
                    });

                    return (
                        <Animated.View
                            key={slide.id}
                            style={[StyleSheet.absoluteFill, { opacity }]}
                        >
                            <Image
                                source={{ uri: slide.image }}
                                style={{ width, height, resizeMode: 'cover' }}
                            />
                        </Animated.View>
                    );
                })}
            </View>

            {/* Gradient Overlay */}
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)', '#000']}
                locations={[0, 0.4, 0.7, 1]}
                style={[StyleSheet.absoluteFill]}
            />

            {/* Skip Button (Top Right) */}
            <TouchableOpacity
                style={[styles.skipButton, { top: insets.top + 10 }]}
                onPress={completeOnboarding}
            >
                <Text style={styles.skipText}>{i18n.t('onboarding_skip')}</Text>
            </TouchableOpacity>

            {/* Content Container (Bottom) */}
            <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 30 }]}>

                {/* Text Carousel */}
                <FlatList
                    ref={slidesRef}
                    data={SLIDES}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    bounces={false}
                    keyExtractor={(item) => item.id}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                        { useNativeDriver: false }
                    )}
                    onViewableItemsChanged={viewablyItemsChanged}
                    viewabilityConfig={viewConfig}
                    scrollEventThrottle={32}
                    renderItem={({ item, index }) => (
                        <View style={{ width, paddingHorizontal: 32 }}>
                            <Text style={styles.title}>
                                {i18n.t(`onboarding_slide${index + 1}_title`).toUpperCase()}
                            </Text>
                            <Text style={styles.description}>
                                {i18n.t(`onboarding_slide${index + 1}_desc`)}
                            </Text>
                        </View>
                    )}
                />

                {/* Footer Controls */}
                <View style={styles.footer}>
                    {/* Paginator */}
                    <View style={styles.paginator}>
                        {SLIDES.map((_, i) => {
                            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];

                            const dotWidth = scrollX.interpolate({
                                inputRange,
                                outputRange: [8, 24, 8],
                                extrapolate: 'clamp',
                            });

                            const opacity = scrollX.interpolate({
                                inputRange,
                                outputRange: [0.5, 1, 0.5],
                                extrapolate: 'clamp',
                            });

                            return (
                                <Animated.View
                                    key={i.toString()}
                                    style={[
                                        styles.dot,
                                        { width: dotWidth, opacity },
                                    ]}
                                />
                            );
                        })}
                    </View>

                    {/* Next Button */}
                    <TouchableOpacity
                        style={[
                            currentIndex === SLIDES.length - 1 ? styles.startButton : styles.nextButton
                        ]}
                        onPress={scrollToNext}
                        activeOpacity={0.8}
                    >
                        {currentIndex === SLIDES.length - 1 ? (
                            <>
                                <Text style={styles.startText}>{i18n.t('onboarding_start')}</Text>
                                <Ionicons name="arrow-forward" size={20} color="#000" style={{ marginLeft: 8 }} />
                            </>
                        ) : (
                            <Ionicons name="arrow-forward" size={24} color="#000" />
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    skipButton: {
        position: 'absolute',
        right: 24,
        zIndex: 10,
        padding: 8,
    },
    skipText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
        opacity: 0.8,
    },
    bottomContainer: {
        position: 'absolute',
        bottom: 0,
        width: width,
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: 'white',
        marginBottom: 12,
        letterSpacing: 0.5,
    },
    description: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
        lineHeight: 24,
        maxWidth: '90%',
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 32,
        marginTop: 40,
    },
    paginator: {
        flexDirection: 'row',
        height: 64,
        alignItems: 'center',
    },
    dot: {
        height: 6,
        borderRadius: 3,
        marginHorizontal: 4,
        backgroundColor: 'white',
    },
    nextButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
    },
    startButton: {
        flexDirection: 'row',
        height: 56,
        paddingHorizontal: 24,
        borderRadius: 28,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
    },
    startText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
