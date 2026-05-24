import { addDoc, collection, getDocs, query, where, doc, updateDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

export interface Review {
    id?: string;
    hostId: string;       // The host user ID being reviewed
    listingId?: string;    // Optional: specific listing reviewed
    guestId: string;       // The guest who wrote the review
    guestName: string;
    bookingId: string;     // Link to the booking (to prevent duplicate reviews)
    rating: number;        // 1-5 stars
    comment: string;
    createdAt: string;     // ISO 8601
}

export interface HostRatingSummary {
    averageRating: number;
    reviewCount: number;
}

export const ReviewService = {
    /**
     * Submit a new review for a host. Also updates the host's aggregate rating.
     */
    async submitReview(data: Omit<Review, 'id' | 'createdAt'>): Promise<string> {
        const reviewsRef = collection(db, 'reviews');
        const docRef = await addDoc(reviewsRef, {
            ...data,
            createdAt: new Date().toISOString(),
        });

        // Recalculate and update the host's aggregate rating
        await this.updateHostAggregateRating(data.hostId);

        return docRef.id;
    },

    /**
     * Get all reviews for a specific host.
     */
    async getHostReviews(hostId: string): Promise<Review[]> {
        try {
            const q = query(collection(db, 'reviews'), where('hostId', '==', hostId));
            const snapshot = await getDocs(q);
            const reviews = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Review));
            return reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        } catch (error) {
            console.error('Failed to fetch host reviews:', error);
            return [];
        }
    },

    /**
     * Check if a guest has already reviewed a specific booking.
     */
    async hasReviewedBooking(bookingId: string): Promise<boolean> {
        try {
            const q = query(collection(db, 'reviews'), where('bookingId', '==', bookingId));
            const snapshot = await getDocs(q);
            return !snapshot.empty;
        } catch (error) {
            console.error('Failed to check review status:', error);
            return false;
        }
    },

    /**
     * Get the aggregate rating summary for a host.
     */
    async getHostRating(hostId: string): Promise<HostRatingSummary> {
        try {
            const reviews = await this.getHostReviews(hostId);
            if (reviews.length === 0) {
                return { averageRating: 0, reviewCount: 0 };
            }
            const total = reviews.reduce((sum, r) => sum + r.rating, 0);
            return {
                averageRating: parseFloat((total / reviews.length).toFixed(1)),
                reviewCount: reviews.length,
            };
        } catch (error) {
            console.error('Failed to compute host rating:', error);
            return { averageRating: 0, reviewCount: 0 };
        }
    },

    /**
     * Recalculate and persist the host's aggregate rating on their user document.
     * This lets us display it without re-querying all reviews every time.
     */
    async updateHostAggregateRating(hostId: string): Promise<void> {
        try {
            const summary = await this.getHostRating(hostId);
            const hostRef = doc(db, 'users', hostId);
            await updateDoc(hostRef, {
                averageRating: summary.averageRating,
                reviewCount: summary.reviewCount,
            });
        } catch (error) {
            console.error('Failed to update host aggregate rating:', error);
        }
    },
};
