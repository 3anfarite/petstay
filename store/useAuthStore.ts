import { User, onAuthStateChanged } from 'firebase/auth';
import { create } from 'zustand';
import { auth } from '../lib/firebaseConfig';

interface AuthState {
    user: User | null;
    isLoading: boolean; // True while we check AsyncStorage/Firebase for a session
    activeRole: 'guest' | 'host'; // Tracks if the user is currently looking at PetStay as a guest or a host

    // Actions
    setUser: (user: User | null) => void;
    setRole: (role: 'guest' | 'host') => void;
    initializeAuthListener: () => () => void; // Returns the unsubscribe function
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isLoading: true, // App should show a loading splash screen until this is false
    activeRole: 'guest', // Default to looking for pet sitters (guest)

    setUser: (user) => set({ user }),

    setRole: (role) => set({ activeRole: role }),

    initializeAuthListener: () => {
        // This listener automatically fires whenever the user logs in, logs out, 
        // or when the app starts up and Firebase checks local storage for a session.
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            set({
                user: firebaseUser,
                isLoading: false
            });
        });

        return unsubscribe;
    }
}));
