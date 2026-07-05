import { Stack, useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/use-theme-color';
import i18n from '@/i18n';

export default function PetsLayout() {
    const c = useColors();
    const router = useRouter();
    return (
        <Stack
            screenOptions={{
                headerStyle: { backgroundColor: c.bg },
                headerTintColor: c.text,
                headerShadowVisible: false,
                headerBackTitleVisible: false,
            }}
        >
            <Stack.Screen
                name="index"
                options={{
                    title: i18n.t('pets_title', { defaultValue: 'My Pets' }),
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 8 }}>
                            <Ionicons name="chevron-back" size={28} color={c.text} />
                        </TouchableOpacity>
                    ),
                }}
            />
            <Stack.Screen
                name="[id]"
                options={{
                    title: i18n.t('pets_add', { defaultValue: 'Add Pet' }),
                }}
            />
        </Stack>
    );
}
