
import { dummyCategories } from '@/constants/dummyData';
import { useColors } from '@/hooks/use-theme-color';
import { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { IconSymbol } from './ui/icon-symbol';

export const Categories = () => {
  const c = useColors();
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <FlatList
      data={dummyCategories}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        gap: 24,
        paddingHorizontal: 16,
        paddingVertical: 12,
      }}
      renderItem={({ item, index }) => {
        const isActive = activeIndex === index;
        return (
          <TouchableOpacity
            onPress={() => setActiveIndex(index)}
            style={[
              styles.cat,
              {
                borderBottomWidth: isActive ? 2 : 0,
                borderBottomColor: isActive ? c.primary : 'transparent',
              },
            ]}
          >
            <IconSymbol
              name={item.icon as any}
              size={24}
              color={isActive ? c.primary : c.textMuted}
            />
            <Text
              style={[
                styles.catText,
                {
                  color: isActive ? c.primary : c.textMuted,
                  fontWeight: isActive ? '600' : '500',
                },
              ]}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        );
      }}
    />
  );
};

const styles = StyleSheet.create({
  cat: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 8,
    gap: 4,
  },
  catText: {
    fontSize: 13,
  },
});