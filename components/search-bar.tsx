// SearchBar.tsx
import { useColors } from '@/hooks/use-theme-color';
import { AntDesign, Feather } from '@expo/vector-icons';
import React from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';


interface Props {
  onPress: () => void;
}

export const SearchBar: React.FC<Props> = ({ onPress }) => {
  const c = useColors();
  const [visible, setVisible] = React.useState(false);
  const styles = makeStyles(c)

  return (
   <>
    <TouchableOpacity style={[styles.container, { backgroundColor: c.bg2, borderColor: c.border }]} 
         onPress={() => setVisible(true)}>
        <Feather name="search" size={20} color={c.text} />
      <Text style={[styles.label, { color: c.textMuted }]}>Where to?</Text>
    </TouchableOpacity>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setVisible(false)}
      >
        <View style={[styles.modal, { backgroundColor: c.bg }]}>
          {/* close button */}
          <Pressable
            style={styles.close}
            onPress={() => setVisible(false)}
            hitSlop={12}
          >
            <AntDesign name="close" size={24} color={c.text} />
          </Pressable>

          {/* placeholder content */}
          <View style={styles.center}>
            <Text style={{ color: c.text, fontSize: 18 }}>Modal content here</Text>
          </View>
        </View>
      </Modal>
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