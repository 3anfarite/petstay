import { useColors } from "@/hooks/use-theme-color";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type HostCardProps = {
  name: string;
  rating: number;
  location: string;
  price: string;
  services: string[];
  image: string;
  verified?: boolean;
  onPress?: () => void;
};

export default function HostCard({
  name,
  rating,
  location,
  price,
  services,
  image,
  verified,
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
        <View style={styles.servicesContainer}>
          {services.slice(0, 2).map((service, index) => (
            <View key={index} style={styles.serviceTag}>
              <Text style={styles.serviceText}>{service}</Text>
            </View>
          ))}
          {services.length > 2 && (
            <View style={styles.serviceTag}>
              <Text style={styles.serviceText}>+{services.length - 2}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.header}>
          <Text style={styles.locationText}>{location}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={styles.nameText}>{name}</Text>
          {verified && <Ionicons name="checkmark-circle" size={14} color={c.primary} style={{ marginTop: 4 }} />}
        </View>
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
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        android: {
          elevation: 3,
        },
        web: {
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        },
      }),
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
    servicesContainer: {
      position: "absolute",
      bottom: 12,
      left: 12,
      flexDirection: "row",
      gap: 6,
    },
    serviceTag: {
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      backdropFilter: "blur(4px)",
    },
    serviceText: {
      color: "white",
      fontSize: 10,
      fontWeight: "600",
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
      gap: 4,
    },
    ratingText: {
      fontSize: 14,
      color: c.text,
      fontWeight: "500",
    },
    nameText: {
      fontSize: 15,
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
      alignItems: "baseline",
      marginTop: 8,
      gap: 4,
    },
    priceText: {
      fontSize: 18,
      fontWeight: "bold",
      color: c.text,
    },
    priceUnitText: {
      fontSize: 14,
      color: c.textMuted,
    },
  });