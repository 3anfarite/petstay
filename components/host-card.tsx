import { useColors } from "@/hooks/use-theme-color";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type HostCardProps = {
  name: string;
  rating: number;
  location: string;
  price: string;
  services: string[];
  image: string;
  onPress?: () => void;
};

export default function HostCard({
  name,
  rating,
  location,
  price,
  services,
  image,
  onPress,
}: HostCardProps) {
  const c = useColors();
  const styles = makeStyles(c);

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.95} onPress={onPress}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: image }} style={styles.image} />
        <TouchableOpacity style={styles.favoriteButton}>
          <Ionicons name="heart-outline" size={24} color={c.bg2} />
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.header}>
          <Text style={styles.locationText}>{location}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color={c.text} />
            <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
          </View>
        </View>
        <Text style={styles.nameText}>{name}</Text>
        <Text style={styles.dateText}>Oct 20 - 25</Text>
        <View style={styles.priceContainer}>
          <Text style={styles.priceText}>{price}</Text>
          <Text style={styles.priceUnitText}>night</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export const makeStyles = (c: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.bg2,
      borderRadius: 16,
      overflow: "hidden",
      marginBottom: 24,
    },
    imageContainer: {
      position: "relative",
    },
    image: {
      width: "100%",
      height: 280,
      borderRadius: 16,
    },
    favoriteButton: {
      position: "absolute",
      top: 12,
      right: 12,
      backgroundColor: "rgba(0, 0, 0, 0.3)",
      borderRadius: 20,
      padding: 6,
    },
    infoContainer: {
      padding: 16,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    locationText: {
      fontSize: 16,
      fontWeight: "600",
      color: c.text,
    },
    ratingContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    ratingText: {
      marginLeft: 4,
      fontSize: 14,
      color: c.text,
    },
    nameText: {
      fontSize: 14,
      color: c.textMuted,
      marginTop: 4,
    },
    dateText: {
      fontSize: 14,
      color: c.textMuted,
      marginTop: 2,
    },
    priceContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 8,
    },
    priceText: {
      fontSize: 16,
      fontWeight: "bold",
      color: c.text,
    },
    priceUnitText: {
      fontSize: 14,
      color: c.textMuted,
      marginLeft: 4,
    },
  });