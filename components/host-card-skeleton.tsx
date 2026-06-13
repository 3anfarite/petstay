import React, { useRef, useEffect } from 'react';
import { Animated, View } from 'react-native';
import { useColors } from '@/hooks/use-theme-color';

const SkeletonPulse = ({ width, height, borderRadius, style }: any) => {
    const c = useColors();
    const animatedValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(animatedValue, { toValue: 1, duration: 800, useNativeDriver: true }),
                Animated.timing(animatedValue, { toValue: 0, duration: 800, useNativeDriver: true })
            ])
        ).start();
    }, []);

    const opacity = animatedValue.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });
    return <Animated.View style={[{ width, height, borderRadius: borderRadius || 8, backgroundColor: c.border, opacity }, style]} />;
};

export const HostCardSkeleton = () => {
    const c = useColors();
    return (
        <View style={{ backgroundColor: c.bg2, borderRadius: 16, overflow: 'hidden', marginBottom: 24 }}>
            {/* Image Placeholder */}
            <View style={{ position: 'relative' }}>
                <SkeletonPulse width="100%" height={280} borderRadius={16} />
                {/* tags inside image */}
                <View style={{ position: 'absolute', bottom: 12, left: 12, flexDirection: 'row', gap: 6 }}>
                    <SkeletonPulse width={60} height={20} borderRadius={8} style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
                    <SkeletonPulse width={60} height={20} borderRadius={8} style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
                </View>
            </View>

            {/* Info Placeholder */}
            <View style={{ padding: 16, gap: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <SkeletonPulse width="60%" height={20} borderRadius={6} />
                    <SkeletonPulse width="15%" height={20} borderRadius={6} />
                </View>
                <SkeletonPulse width="40%" height={16} borderRadius={6} />
                <SkeletonPulse width="30%" height={16} borderRadius={6} />
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                    <SkeletonPulse width="25%" height={22} borderRadius={6} />
                </View>
            </View>
        </View>
    );
};
