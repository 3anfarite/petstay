import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import { app } from './firebaseConfig';

const storage = getStorage(app);

/**
 * Convert a local file URI to a Blob using XMLHttpRequest.
 * This is the recommended approach for React Native, as fetch().blob()
 * can produce blobs that Firebase Storage SDK doesn't handle correctly.
 */
function uriToBlob(uri: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = () => resolve(xhr.response as Blob);
        xhr.onerror = () => reject(new Error('Failed to convert URI to blob'));
        xhr.responseType = 'blob';
        xhr.open('GET', uri, true);
        xhr.send(null);
    });
}

/**
 * Upload a local image URI to Firebase Storage and return a persistent download URL.
 * @param localUri - The local file:// URI from expo-image-picker
 * @param storagePath - The path in Firebase Storage (e.g. "listings/cover/abc123.jpg")
 * @returns The public download URL
 */
export async function uploadImage(localUri: string, storagePath: string): Promise<string> {
    // If the URI is already an https URL (not a local file), return it as-is
    if (localUri.startsWith('http://') || localUri.startsWith('https://')) {
        return localUri;
    }

    // Convert local file to blob using XHR (React Native compatible)
    const blob = await uriToBlob(localUri);

    // Upload to Firebase Storage with explicit metadata
    const storageRef = ref(storage, storagePath);
    const metadata = { contentType: 'image/jpeg' };
    
    await uploadBytes(storageRef, blob, metadata);

    // Get and return the download URL
    const downloadUrl = await getDownloadURL(storageRef);
    return downloadUrl;
}

/**
 * Upload multiple images and return their download URLs.
 * @param localUris - Array of local file:// URIs
 * @param baseStoragePath - Base path in Firebase Storage (e.g. "listings/gallery/abc123")
 * @returns Array of public download URLs
 */
export async function uploadImages(localUris: string[], baseStoragePath: string): Promise<string[]> {
    const uploadPromises = localUris.map((uri, index) => {
        const ext = uri.split('.').pop() || 'jpg';
        const path = `${baseStoragePath}/${Date.now()}_${index}.${ext}`;
        return uploadImage(uri, path);
    });
    return Promise.all(uploadPromises);
}
