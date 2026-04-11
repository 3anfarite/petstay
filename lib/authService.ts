import {
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithCredential,
    signInWithEmailAndPassword,
    signOut,
    UserCredential
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebaseConfig";

// Depending on your Expo setup for social logins, you typically wrap
// react-native-google-signin or expo-apple-authentication and pass the credentials to Firebase. 
// We are setting up the structure so you can drop them in easily!

export const AuthService = {
    /**
     * Firebase Sign Up with Email/Password
     */
    signUp: async (email: string, password: string, name: string): Promise<UserCredential> => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

            // Build the user profile in Firestore
            await setDoc(doc(db, "users", userCredential.user.uid), {
                email: userCredential.user.email,
                name: name,
                role: 'unassigned', // New users always go to the Interstitial first
                profilePic: '',
                createdAt: new Date().toISOString()
            });

            return userCredential;
        } catch (error: any) {
            console.error("Sign Up Error inside Service:", error);
            throw error;
        }
    },

    /**
     * Sign in an existing user
     */
    signIn: async (email: string, password: string): Promise<UserCredential> => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return userCredential;
        } catch (error: any) {
            throw error;
        }
    },

    /**
     * Log the user out of their session
     */
    signOutUser: async (): Promise<void> => {
        try {
            await signOut(auth);
        } catch (error: any) {
            throw error;
        }
    },

    /**
     * Update the user's role in Firestore
     */
    updateRole: async (uid: string, newRole: 'guest' | 'host'): Promise<void> => {
        try {
            await setDoc(doc(db, "users", uid), { role: newRole }, { merge: true });
        } catch (error: any) {
            console.error("Failed to update role:", error);
            throw error;
        }
    },

    /**
     * Firebase Google Sign In using ID Token
     */
    signInWithGoogle: async (idToken: string): Promise<UserCredential> => {
        try {
            const credential = GoogleAuthProvider.credential(idToken);
            const userCredential = await signInWithCredential(auth, credential);

            // Just like normal signUp, ensure they have a profile!
            const docRef = doc(db, "users", userCredential.user.uid);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                await setDoc(docRef, {
                    email: userCredential.user.email,
                    name: userCredential.user.displayName || 'Google User',
                    role: 'unassigned', // Intercept into the new User Interstitial Modal
                    profilePic: userCredential.user.photoURL || '',
                    createdAt: new Date().toISOString(),
                });
            }
            return userCredential;
        } catch (error: any) {
            console.error("Google Sign In Error inside Service:", error);
            throw error;
        }
    },

    /**
     * Placeholder for Apple Sign In
     * Requires: expo-apple-authentication
     */
    signInWithApple: async () => {
        console.warn("Apple Sign-In is not yet fully implemented. Requires native module setup.");
        // 1. Get Apple identity token from expo-apple-authentication
        // 2. const credential = OAuthProvider.credential('apple.com', { idToken: identityToken });
        // 3. return signInWithCredential(auth, credential);
    }
};
