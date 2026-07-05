import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

export type PetType = 'dogs' | 'cats' | 'exotics';

export interface PetProfile {
    id?: string;
    ownerId: string;
    name: string;
    type: PetType;
    breed: string;
    age: string; // e.g., "3 years", "6 months"
    weight: string; // e.g., "15", "4"
    medicalConditions: string;
    temperament: string;
    image?: string;
    createdAt: string;
}

export const PetService = {
    async getUserPets(ownerId: string): Promise<PetProfile[]> {
        try {
            const petsRef = collection(db, 'users', ownerId, 'pets');
            const snapshot = await getDocs(petsRef);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PetProfile))
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        } catch (error) {
            console.error('Failed to get user pets:', error);
            return [];
        }
    },

    async getPetById(ownerId: string, petId: string): Promise<PetProfile | null> {
        try {
            const docRef = doc(db, 'users', ownerId, 'pets', petId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() } as PetProfile;
            }
            return null;
        } catch (error) {
            console.error('Failed to fetch pet:', error);
            return null;
        }
    },

    async addPet(ownerId: string, data: Omit<PetProfile, 'id' | 'createdAt' | 'ownerId'>): Promise<string> {
        try {
            const petsRef = collection(db, 'users', ownerId, 'pets');
            const docRef = await addDoc(petsRef, {
                ...data,
                ownerId,
                createdAt: new Date().toISOString()
            });
            return docRef.id;
        } catch (error) {
            console.error('Failed to add pet:', error);
            throw error;
        }
    },

    async updatePet(ownerId: string, petId: string, data: Partial<PetProfile>): Promise<void> {
        try {
            const docRef = doc(db, 'users', ownerId, 'pets', petId);
            await updateDoc(docRef, data);
        } catch (error) {
            console.error('Failed to update pet:', error);
            throw error;
        }
    },

    async deletePet(ownerId: string, petId: string): Promise<void> {
        try {
            const docRef = doc(db, 'users', ownerId, 'pets', petId);
            await deleteDoc(docRef);
        } catch (error) {
            console.error('Failed to delete pet:', error);
            throw error;
        }
    }
};
