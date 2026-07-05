import { Platform } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

// We use dynamic imports (require) to prevent the app from crashing 
// if the native 'expo-notifications' module is not yet compiled into the build.

export const NotificationService = {
  registerForPushNotificationsAsync: async (userId: string) => {
    let token;

    try {
      // Dynamic requires
      const Notifications = require('expo-notifications');
      const Device = require('expo-device');

      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') {
          console.warn('Failed to get push token for push notification!');
          return;
        }
        
        try {
          token = (await Notifications.getExpoPushTokenAsync()).data;
          
          // Store token in Firestore
          if (userId) {
            await updateDoc(doc(db, "users", userId), {
              pushToken: token
            });
          }
        } catch (e) {
          console.warn("Could not get push token (native error):", e);
        }
      } else {
        console.warn('Must use physical device for Push Notifications');
      }
    } catch (e) {
      console.warn("Notification system unavailable (native module missing). Rebuild the app to enable.");
    }

    return token;
  },

  // Helper to send a local notification (simulating push)
  sendLocalNotification: async (title: string, body: string, data: any = {}) => {
    try {
      const Notifications = require('expo-notifications');
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
        },
        trigger: null, // immediate
      });
    } catch (e) {
      console.warn("Cannot send local notification: module missing");
    }
  }
};
