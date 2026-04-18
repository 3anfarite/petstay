import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { create } from 'zustand';
import { auth, db } from '../lib/firebaseConfig';

interface AuthState {
    user: User | null;
    isLoading: boolean; // True while we check AsyncStorage/Firebase for a session
    activeRole: 'guest' | 'host' | 'unassigned'; // Tracks if the user is currently looking at PetStay as a guest or a host

    // Actions
    setUser: (user: User | null) => void;
    setRole: (role: 'guest' | 'host' | 'unassigned') => void;
    initializeAuthListener: () => () => void; // Returns the unsubscribe function
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isLoading: true, // App should show a loading splash screen until this is false
    activeRole: 'unassigned', // Default to looking for pet sitters (guest)

    setUser: (user) => set({ user }),

    setRole: (role) => set({ activeRole: role }),

    initializeAuthListener: () => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    // Fetch the user's document to determine their role
                    const docRef = doc(db, 'users', firebaseUser.uid);
                    const docSnap = await getDoc(docRef);
                    let userRole: 'guest' | 'host' | 'unassigned' = 'unassigned';

                    if (docSnap.exists()) {
                        userRole = docSnap.data()?.role || 'guest'; // Keep guest fallback for very old docs
                    }

                    set({
                        user: firebaseUser,
                        activeRole: userRole,
                        isLoading: false
                    });
                } catch (error) {
                    console.error("Error fetching user role:", error);
                    set({ user: firebaseUser, isLoading: false });
                }
            } else {
                set({ user: null, activeRole: 'unassigned', isLoading: false });
            }
        });

        return unsubscribe;
    }
}));
