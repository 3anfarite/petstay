import { collection, addDoc, getDocs, query, where, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

export interface Listing {
    id?: string;
    hostId: string;
    hostName: string;
    hostAvatar?: string;
    title: string;
    location: string;
    price: number;
    services: string[];
    image: string;
    gallery: string[];
    about: string;
    verified: boolean;
    status: 'active' | 'inactive';
    createdAt: string;
}

export const ListingService = {
    async createListing(data: Omit<Listing, 'id' | 'createdAt'>): Promise<string> {
        const listingsRef = collection(db, "listings");
        const docRef = await addDoc(listingsRef, {
            ...data,
            createdAt: new Date().toISOString()
        });
        return docRef.id;
    },

    async getHostListings(hostId: string): Promise<Listing[]> {
        try {
            const q = query(collection(db, "listings"), where("hostId", "==", hostId));
            const snapshot = await getDocs(q);
            const raw = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Listing));
            return raw.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        } catch (error) {
            console.error("Failed to fetch host listings", error);
            return [];
        }
    },

    async getAllActiveListings(): Promise<Listing[]> {
        try {
            const q = query(collection(db, "listings"), where("status", "==", "active"));
            const snapshot = await getDocs(q);
            const raw = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Listing));
            return raw.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        } catch (error) {
            console.error("Failed to fetch all listings", error);
            return [];
        }
    },

    async getListingById(id: string): Promise<Listing | null> {
        try {
            const docRef = doc(db, "listings", id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() } as Listing;
            }
            return null;
        } catch (error) {
            console.error("Failed to fetch listing", error);
            return null;
        }
    }
};
