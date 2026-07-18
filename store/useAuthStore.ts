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
                    } else {
                        // Check if the user was literally just created (within the last 5 seconds)
                        // This prevents a race condition where the auth listener fires before the signup function finishes writing the Firestore document!
                        const creationTime = new Date(firebaseUser.metadata.creationTime || '').getTime();
                        const now = new Date().getTime();
                        
                        if (now - creationTime < 5000) {
                            console.log("New user detected, waiting for Firestore document to be created...");
                            userRole = 'unassigned';
                        } else {
                            // GHOST SESSION DETECTED: They are authenticated but have no database profile!
                            console.warn("Ghost session detected (No Firestore Profile). Forcing logout.");
                            await auth.signOut();
                            set({ user: null, activeRole: 'unassigned', isLoading: false });
                            return;
                        }
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
