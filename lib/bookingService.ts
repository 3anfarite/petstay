import { addDoc, collection, doc, getDocs, orderBy, query, updateDoc, where } from "firebase/firestore";
import { db } from "./firebaseConfig";

export type BookingStatus = 'pending' | 'confirmed' | 'declined' | 'completed' | 'cancelled';

export interface Booking {
    id?: string;
    guestId: string;
    guestName: string;
    guestAvatar?: string;
    hostId: string;
    hostName: string;
    location?: string;
    serviceType: string;
    petType: string;
    startDate: string; // ISO 8601 Database string
    endDate: string; // ISO 8601 Database string
    totalPrice: number;
    status: BookingStatus;
    notes?: string;
    createdAt: string; // ISO 8601
}

export const BookingService = {
    /**
     * Creates a new booking request. Set to 'pending' by default.
     */
    createBooking: async (bookingData: Omit<Booking, 'id' | 'status' | 'createdAt'>): Promise<string> => {
        try {
            const newBooking: Booking = {
                ...bookingData,
                status: 'pending',
                createdAt: new Date().toISOString(),
            };

            const docRef = await addDoc(collection(db, "bookings"), newBooking);
            return docRef.id;
        } catch (error) {
            console.error("Failed to create booking:", error);
            throw error;
        }
    },

    /**
     * Fetch all bookings where the current user is the Guest
     */
    getGuestBookings: async (guestId: string): Promise<Booking[]> => {
        try {
            const bookingsRef = collection(db, "bookings");
            const q = query(
                bookingsRef,
                where("guestId", "==", guestId)
            );
            
            const querySnapshot = await getDocs(q);
            const rawBookings = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Booking));

            // Sort manually in JS memory to bypass strict Firebase Composite Index requirements
            return rawBookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        } catch (error) {
            console.error("Failed to fetch guest bookings:", error);
            throw error;
        }
    },

    /**
     * Fetch all incoming bookings where the current user is the Host
     */
    getHostBookings: async (hostId: string): Promise<Booking[]> => {
        try {
            const bookingsRef = collection(db, "bookings");
            const q = query(
                bookingsRef,
                where("hostId", "==", hostId)
            );
            
            const querySnapshot = await getDocs(q);
            const rawBookings = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Booking));

            // Sort manually in JS memory to bypass strict Firebase Composite Index requirements
            return rawBookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        } catch (error) {
            console.error("Failed to fetch host bookings:", error);
            throw error;
        }
    },

    /**
     * Allows a Host to accept/decline or a Guest to cancel
     */
    updateBookingStatus: async (bookingId: string, newStatus: BookingStatus): Promise<void> => {
        try {
            const bookingRef = doc(db, "bookings", bookingId);
            await updateDoc(bookingRef, {
                status: newStatus
            });
        } catch (error) {
            console.error("Failed to update booking status:", error);
            throw error;
        }
    }
};
