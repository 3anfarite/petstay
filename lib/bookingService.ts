import { addDoc, collection, doc, getDocs, orderBy, query, updateDoc, where, getDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";
import { PetProfile } from './petService';

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
    pets?: PetProfile[];
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
            // 1. Removed personal overlap check per user request
            
            const bookingsRef = collection(db, "bookings");
            const reqStart = new Date(bookingData.startDate).getTime();
            const reqEnd = new Date(bookingData.endDate).getTime();

            // 2. Check global host capacity
            const hostDocRef = doc(db, "users", bookingData.hostId);
            const hostDocSnap = await getDoc(hostDocRef);
            const hostData = hostDocSnap.exists() ? hostDocSnap.data() : null;
            const maxCapacity = hostData?.maxPetCapacity || 1; // default to 1 if not set

            const allHostBookingsQuery = query(
                bookingsRef,
                where("hostId", "==", bookingData.hostId),
                where("status", "in", ["pending", "confirmed"])
            );
            const allHostBookings = await getDocs(allHostBookingsQuery);

            let overlappingPets = 0;
            allHostBookings.docs.forEach(d => {
                const b = d.data() as Booking;
                const bStart = new Date(b.startDate).getTime();
                const bEnd = new Date(b.endDate).getTime();
                
                if (reqStart < bEnd && reqEnd > bStart) {
                    const match = b.petType.match(/\d+/);
                    const pets = match ? parseInt(match[0], 10) : 1;
                    overlappingPets += pets;
                }
            });

            const newPetsMatch = bookingData.petType.match(/\d+/);
            const newPets = newPetsMatch ? parseInt(newPetsMatch[0], 10) : 1;

            if (overlappingPets + newPets > maxCapacity) {
                if (newPets > maxCapacity) {
                    throw new Error(`You are requesting to book for ${newPets} pet(s), but this host has a maximum capacity of ${maxCapacity} pet(s).`);
                } else {
                    const availableSpace = maxCapacity - overlappingPets;
                    throw new Error(`The host cannot accommodate ${newPets} pet(s) for these dates. They only have space for ${availableSpace} more pet(s) (Max capacity: ${maxCapacity}, Already booked: ${overlappingPets}).`);
                }
            }

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
            const now = Date.now();
            
            const rawBookings = await Promise.all(querySnapshot.docs.map(async (docSnap) => {
                const b = { id: docSnap.id, ...docSnap.data() } as Booking;
                
                // Auto-complete confirmed bookings that have passed their end date
                if (b.status === 'confirmed') {
                    const endTime = new Date(b.endDate).getTime();
                    if (now > endTime) {
                        await updateDoc(doc(db, "bookings", docSnap.id), { status: 'completed' });
                        return { ...b, status: 'completed' as BookingStatus };
                    }
                }
                return b;
            }));

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
            const now = Date.now();

            const rawBookings = await Promise.all(querySnapshot.docs.map(async (docSnap) => {
                const b = { id: docSnap.id, ...docSnap.data() } as Booking;
                
                // Auto-complete confirmed bookings that have passed their end date
                if (b.status === 'confirmed') {
                    const endTime = new Date(b.endDate).getTime();
                    if (now > endTime) {
                        await updateDoc(doc(db, "bookings", docSnap.id), { status: 'completed' });
                        return { ...b, status: 'completed' as BookingStatus };
                    }
                }
                return b;
            }));

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
