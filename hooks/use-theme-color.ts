/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { palettes } from '@/constants/colors';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';


export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}

type Palette = typeof palettes.light | typeof palettes.dark;


export const useColors = (): Palette => {
  const mode = useColorScheme();   // 'light' | 'dark' | null
  return palettes[mode === 'dark' ? 'dark' : 'light'];
};