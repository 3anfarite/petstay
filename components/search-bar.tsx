// SearchBar.tsx
import { useColors } from '@/hooks/use-theme-color';
import { Feather } from '@expo/vector-icons';
import React from 'react';
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import ExpandingModal from './search-modal';

interface Props {
  onPress?: () => void;
}

export const SearchBar: React.FC<Props> = ({ onPress }) => {
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
        activeOpacity={0.9}
        style={[styles.container, { backgroundColor: c.bg2, borderColor: c.border }]}
        onPress={() => {
          // call optional external handler if provided
          onPress?.();
          open();
        }}
      >
        <Feather name="search" size={20} color={c.text} />
        <Animated.Text style={[styles.label, { color: c.textMuted, opacity: labelOpacity }]}>Where to?</Animated.Text>
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
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 40 }}>
          <Animated.Text style={{ color: c.text, fontSize: 18 }}>Modal content here</Animated.Text>
        </View>
      </ExpandingModal>
    </>
  );
};

const makeStyles = (c: ReturnType<typeof useColors>) =>
  StyleSheet.create({
  container: {
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    gap: 8,
    backgroundColor: c.bg2,

  // --- iOS Shadow (uses specific properties) ---
  ...Platform.select({
    ios: {
      shadowColor: 'black', // The color of the shadow
      shadowOffset: { width: 0, height: 3 }, // X and Y offset
      shadowOpacity: 1, // The shadow's transparency (0.0 to 1.0)
      shadowRadius: 5, // The blur radius
    },
    // --- Android Shadow (uses 'elevation') ---
    android: {
      elevation: 5, // Higher number for a more prominent lift
    },
    // --- Web Shadow (uses standard CSS 'boxShadow') ---
    web: {
      // The CSS equivalent: '0px 3px 5px rgba(0, 0, 0, 0.1)'
      boxShadow: '0px 3px 5px rgba(0, 0, 0, 0.1)',
    },
  }),
  },
  label: {
    fontSize: 16,
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