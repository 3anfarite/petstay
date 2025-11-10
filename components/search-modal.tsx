import { useColors } from '@/hooks/use-theme-color';
import { AntDesign } from '@expo/vector-icons';
import React from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Pressable,
  StyleSheet
} from 'react-native';

type Rect = { x: number; y: number; width: number; height: number } | null;

interface Props {
  visible: boolean;
  startRect: Rect;
  onRequestClose?: () => void; // called when user requests close (before reverse animation)
  onCloseCompleted?: () => void; // called after reverse animation completes
  children?: React.ReactNode;
}

export const SearchModal: React.FC<Props> = ({ visible, startRect, onRequestClose, onCloseCompleted, children }) => {
  const c = useColors();
  const anim = React.useRef(new Animated.Value(0)).current; // 0 closed -> 1 open
  const [rendered, setRendered] = React.useState(visible);
  const { width: screenW, height: screenH } = Dimensions.get('window');

  React.useEffect(() => {
    if (visible && startRect) {
      setRendered(true);
      anim.setValue(0);
      Animated.timing(anim, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    }
  }, [visible, startRect, anim]);

  const handleClose = () => {
    // notify parent to start any UI changes (like label fade)
    onRequestClose?.();

    // reverse animation then notify completion
    Animated.timing(anim, {
      toValue: 0,
      duration: 250,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: false,
    }).start(() => {
      setRendered(false);
      onCloseCompleted?.();
    });
  };

  if (!rendered) return null;

  const start = startRect ?? { x: screenW / 2 - 150, y: 100, width: 300, height: 48 };
  const top = anim.interpolate({ inputRange: [0, 1], outputRange: [start.y, 0] });
  const left = anim.interpolate({ inputRange: [0, 1], outputRange: [start.x, 0] });
  const width = anim.interpolate({ inputRange: [0, 1], outputRange: [start.width, screenW] });
  const height = anim.interpolate({ inputRange: [0, 1], outputRange: [start.height, screenH] });
  const borderRadius = anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] });
  const contentOpacity = anim.interpolate({ inputRange: [0.6, 1], outputRange: [0, 1], extrapolate: 'clamp' });

  return (
    <Animated.View pointerEvents="box-none" style={[StyleSheet.absoluteFill, { zIndex: 999 }]}>
      <Animated.View
        style={{
          position: 'absolute',
          top,
          left,
          width,
          height,
          borderRadius,
          backgroundColor: c.bg,
          overflow: 'hidden',
        }}
      >
        <Pressable style={styles.close} onPress={handleClose} hitSlop={12}>
          <AntDesign name="close" size={24} color={c.text} />
        </Pressable>

        <Animated.View style={{ flex: 1, opacity: contentOpacity }} pointerEvents="auto">
          {children}
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  close: { position: 'absolute', top: 56, right: 20, zIndex: 1 },
});

export default SearchModal;
