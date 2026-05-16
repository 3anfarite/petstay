import { arrayRemove, arrayUnion, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";
import { Listing, ListingService } from "./listingService";

export const WishlistService = {
    /**
     * Toggles a listing in the user's wishlist
     */
    toggleWishlist: async (userId: string, listingId: string) => {
        const userRef = doc(db, "users", userId);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) return;
        
        const wishlist = userDoc.data().wishlist || [];
        const isWishlisted = wishlist.includes(listingId);
        
        await updateDoc(userRef, {
            wishlist: isWishlisted ? arrayRemove(listingId) : arrayUnion(listingId)
        });
        
        return !isWishlisted;
    },

    /**
     * Checks if a listing is in the user's wishlist
     */
    isInWishlist: async (userId: string, listingId: string) => {
        const userRef = doc(db, "users", userId);
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) return false;
        
        const wishlist = userDoc.data().wishlist || [];
        return wishlist.includes(listingId);
    },

    /**
     * Gets all listings in the user's wishlist
     */
    getWishlistListings: async (userId: string): Promise<Listing[]> => {
        const userRef = doc(db, "users", userId);
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) return [];
        
        const wishlistIds = userDoc.data().wishlist || [];
        if (wishlistIds.length === 0) return [];
        
        // Fetch each listing details. 
        // Note: For large wishlists, you'd use query(where(documentId(), 'in', wishlistIds))
        const listings = await Promise.all(
            wishlistIds.map((id: string) => ListingService.getListingById(id))
        );
        
        return listings.filter(l => l !== null) as Listing[];
    }
};
