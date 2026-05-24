import { AppFonts } from '@/constants/theme';
import { useColors } from '@/hooks/use-theme-color';
import i18n from '@/i18n';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ReviewModalProps {
    visible: boolean;
    onClose: () => void;
    hostName: string;
    onSubmit: (rating: number, comment: string) => Promise<void>;
}

export function ReviewModal({ visible, onClose, hostName, onSubmit }: ReviewModalProps) {
    const c = useColors();
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Animation Values
    const fadeAnim = React.useRef(new Animated.Value(0)).current;
    const slideAnim = React.useRef(new Animated.Value(SCREEN_HEIGHT)).current;

    React.useEffect(() => {
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
            // Reset for next open
            fadeAnim.setValue(0);
            slideAnim.setValue(SCREEN_HEIGHT);
        }
    }, [visible]);

    const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Amazing'];

    const handleSubmit = async () => {
        if (rating === 0) return;
        setIsSubmitting(true);
        try {
            await onSubmit(rating, comment.trim());
            // Reset state after successful submission
            setRating(0);
            setComment('');
        } catch (error) {
            console.error('Review submission failed:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

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
        ]).start(() => {
            setRating(0);
            setComment('');
            onClose();
        });
    };

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
            <View style={styles.overlay}>
                {/* Background overlay that closes modal */}
                <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', opacity: fadeAnim }]}>
                    <TouchableOpacity
                        style={StyleSheet.absoluteFill}
                        activeOpacity={1}
                        onPress={handleClose}
                    />
                </Animated.View>
                
                <Animated.View style={{ width: '100%', transform: [{ translateY: slideAnim }] }}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        style={{ width: '100%' }}
                    >
                        <View style={[styles.sheet, { backgroundColor: c.bg }]}>
                                {/* Handle Bar */}
                                <View style={styles.handleBarContainer}>
                                    <View style={[styles.handleBar, { backgroundColor: c.border }]} />
                                </View>

                                {/* Header */}
                                <View style={styles.header}>
                                    <Text style={[styles.title, { color: c.text }]}>
                                        {i18n.t('review_title', { defaultValue: 'Rate your experience' })}
                                    </Text>
                                    <Text style={[styles.subtitle, { color: c.textMuted }]}>
                                        {i18n.t('review_subtitle', { defaultValue: 'How was your stay with' })} {hostName}?
                                    </Text>
                                </View>

                                {/* Star Rating */}
                                <View style={styles.starsSection}>
                                    <View style={styles.starsRow}>
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <TouchableOpacity
                                                key={star}
                                                onPress={() => setRating(star)}
                                                activeOpacity={0.7}
                                                style={styles.starTouch}
                                            >
                                                <Ionicons
                                                    name={star <= rating ? 'star' : 'star-outline'}
                                                    size={40}
                                                    color={star <= rating ? '#FFD700' : c.border}
                                                />
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                    {rating > 0 && (
                                        <Text style={[styles.ratingLabel, { color: c.primary }]}>
                                            {ratingLabels[rating]}
                                        </Text>
                                    )}
                                </View>

                                {/* Comment Input */}
                                <View style={[styles.commentContainer, { backgroundColor: c.bg2, borderColor: c.border }]}>
                                    <TextInput
                                        style={[styles.commentInput, { color: c.text }]}
                                        placeholder={i18n.t('review_comment_placeholder', { defaultValue: 'Share your experience (optional)...' })}
                                        placeholderTextColor={c.textMuted}
                                        value={comment}
                                        onChangeText={setComment}
                                        multiline
                                        numberOfLines={4}
                                        textAlignVertical="top"
                                    />
                                </View>

                                {/* Actions */}
                                <View style={styles.actions}>
                                    <TouchableOpacity
                                        style={[
                                            styles.submitBtn,
                                            { backgroundColor: rating > 0 ? c.primary : c.border },
                                        ]}
                                        onPress={handleSubmit}
                                        disabled={rating === 0 || isSubmitting}
                                        activeOpacity={0.85}
                                    >
                                        {isSubmitting ? (
                                            <ActivityIndicator color="white" />
                                        ) : (
                                            <Text style={styles.submitBtnText}>
                                                {i18n.t('review_submit', { defaultValue: 'Submit Review' })}
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.cancelBtn, { borderColor: c.border }]}
                                        onPress={handleClose}
                                    >
                                        <Text style={[styles.cancelBtnText, { color: c.textMuted }]}>
                                            {i18n.t('review_later', { defaultValue: 'Maybe Later' })}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </KeyboardAvoidingView>
                    </Animated.View>
                </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    sheet: {
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    handleBarContainer: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    handleBar: {
        width: 40,
        height: 4,
        borderRadius: 2,
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 22,
        fontFamily: AppFonts.title,
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 15,
        fontFamily: AppFonts.body,
        textAlign: 'center',
    },
    starsSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    starsRow: {
        flexDirection: 'row',
        gap: 10,
    },
    starTouch: {
        padding: 4,
    },
    ratingLabel: {
        fontSize: 16,
        fontFamily: AppFonts.bodyBold,
        marginTop: 10,
    },
    commentContainer: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
        minHeight: 100,
        marginBottom: 24,
    },
    commentInput: {
        fontSize: 15,
        fontFamily: AppFonts.body,
        lineHeight: 22,
        minHeight: 80,
    },
    actions: {
        gap: 12,
    },
    submitBtn: {
        height: 54,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 4,
    },
    submitBtnText: {
        color: 'white',
        fontSize: 16,
        fontFamily: AppFonts.bodyBold,
    },
    cancelBtn: {
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    cancelBtnText: {
        fontSize: 15,
        fontFamily: AppFonts.bodyBold,
    },
});
