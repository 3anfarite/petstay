// SearchBar.tsx
import { useColors } from '@/hooks/use-theme-color';
import i18n from '@/i18n';
import { Feather } from '@expo/vector-icons';
import React from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  TouchableOpacity,
  View,
  Text
} from 'react-native';

import { AppFonts, CardShadow } from '@/constants/theme';
import { FilterModalContent, FilterState } from './filter-modal';
import ExpandingModal from './search-modal';

import { Listing } from '@/lib/listingService';

interface Props {
  onPress?: () => void;
  onApply?: (filters: FilterState) => void;
  listings?: Listing[];
}

export const SearchBar: React.FC<Props> = ({ onPress, onApply, listings = [] }) => {
  const c = useColors();
  const [visible, setVisible] = React.useState(false);
  const [measured, setMeasured] = React.useState<null | { x: number; y: number; width: number; height: number }>(null);
  // attach ref directly to the TouchableOpacity so we measure the actual touchable bounds
  const containerRef = React.useRef<any>(null);
  const labelAnim = React.useRef(new Animated.Value(0)).current; // 0 visible -> 1 hidden
  const styles = makeStyles(c);

  const open = () => {
    containerRef.current?.measureInWindow((x: number, y: number, width: number, height: number) => {
      setMeasured({ x, y, width, height });
      // fade out label while modal expands
      Animated.timing(labelAnim, { toValue: 1, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
      setVisible(true);
    });
  };

  const labelOpacity = labelAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0], extrapolate: 'clamp' });

  return (
    <>
      <TouchableOpacity
        ref={containerRef}
        activeOpacity={0.95}
        style={[styles.container, { backgroundColor: c.bg2 }]}
        onPress={() => {
          // call optional external handler if provided
          onPress?.();
          open();
        }}
      >
        <View style={styles.searchIconContainer}>
            <Feather name="search" size={24} color={c.text} style={styles.searchIcon} />
        </View>
        <Animated.View style={[styles.textContainer, { opacity: labelOpacity }]}>
            <Text style={[styles.title, { color: c.text }]}>{i18n.t('search_title', { defaultValue: 'Find a sitter' })}</Text>
            <Text style={[styles.subtitle, { color: c.textMuted }]}>{i18n.t('search_subtitle', { defaultValue: 'Any service • Any date • Any pet' })}</Text>
        </Animated.View>
      </TouchableOpacity>

      <ExpandingModal
        visible={visible}
        startRect={measured}
        onRequestClose={() => {
          // start label fade immediately when close is requested from inside the modal
          Animated.timing(labelAnim, { toValue: 0, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: false }).start();
        }}
        onCloseCompleted={() => {
          // actual visibility cleanup after modal animation finishes
          setVisible(false);
          setMeasured(null);
        }}
      >
        <FilterModalContent onClose={() => { }} onApply={onApply} listings={listings} />
      </ExpandingModal>
    </>
  );
};

const makeStyles = (c: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: {
      height: 60,
      borderRadius: 30,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      marginHorizontal: 16,
      marginTop: 8,
      marginBottom: 12,
      gap: 16,
      backgroundColor: c.bg2,
      ...CardShadow,
      borderWidth: 0,
    },
    searchIconContainer: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    searchIcon: {
      fontWeight: 'bold',
    },
    textContainer: {
      flex: 1,
      justifyContent: 'center',
    },
    title: {
      fontSize: 15,
      fontFamily: AppFonts.title,
      marginBottom: 2,
    },
    subtitle: {
      fontSize: 13,
      fontFamily: AppFonts.body,
    },
    bar: {
      height: 48,
      borderRadius: 24,
      borderWidth: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginHorizontal: 16,
      marginVertical: 8,
    },
    modal: { flex: 1 },
    close: { position: 'absolute', top: 56, right: 20, zIndex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  });