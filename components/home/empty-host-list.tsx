import { dummyCategories } from "@/constants/dummyData";
import { useColors } from "@/hooks/use-theme-color";
import i18n from "@/i18n";
import { StyleSheet, Text, View } from "react-native";
import { IconSymbol } from "../ui/icon-symbol";

interface EmptyHostListProps {
    selectedCategory: string;
    selectedService: string | null | undefined;
}

export function EmptyHostList({ selectedCategory, selectedService }: EmptyHostListProps) {
    const c = useColors();
    const styles = makeStyles(c);

    const categoryName = selectedService || selectedCategory;
    const iconName = (dummyCategories.find((c) => c.name === selectedCategory)?.icon as any) || 'magnifyingglass';

    return (
        <View style={styles.emptyContainer}>
            <IconSymbol
                name={iconName}
                size={48}
                color={c.textMuted}
            />
            <Text style={[styles.emptyText, { color: c.textMuted }]}>
                {i18n.t('empty_no_homes', { category: categoryName })}
            </Text>
        </View>
    );
}

const makeStyles = (c: any) => StyleSheet.create({
    emptyContainer: {

        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    emptyText: {
        fontSize: 16,
        textAlign: 'center',
    },
});
