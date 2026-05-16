import { addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import { db } from "./firebaseConfig";

export interface Chat {
    id: string;
    participants: string[];
    participantDetails: {
        [uid: string]: {
            name: string;
            avatar: string;
        }
    };
    lastMessage: string;
    lastMessageTime: any;
    lastSenderId: string;
    unreadCount?: {
        [uid: string]: number;
    };
}

export interface Message {
    id: string;
    text: string;
    senderId: string;
    createdAt: any;
}

export const ChatService = {
    getChatId: (uid1: string, uid2: string) => {
        return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
    },

    /**
     * Initializes a chat and sends a message, useful for the first automated message upon booking
     */
    startChatAndSendMessage: async (
        hostId: string, 
        guestId: string, 
        hostName: string, 
        guestName: string,
        hostAvatar: string,
        guestAvatar: string,
        messageText: string
    ) => {
        const chatId = ChatService.getChatId(hostId, guestId);
        const chatRef = doc(db, "chats", chatId);
        
        // Ensure chat document exists and update last message
        await setDoc(chatRef, {
            participants: [hostId, guestId],
            participantDetails: {
                [hostId]: { name: hostName, avatar: hostAvatar || '' },
                [guestId]: { name: guestName, avatar: guestAvatar || '' },
            },
            lastMessageTime: serverTimestamp(),
            lastSenderId: hostId,
            unreadCount: {
                [guestId]: 1,
                [hostId]: 0
            }
        }, { merge: true });

        // Add the actual message to the subcollection
        await addDoc(collection(chatRef, "messages"), {
            text: messageText,
            senderId: hostId,
            createdAt: serverTimestamp()
        });
        
        return chatId;
    },

    sendMessage: async (chatId: string, senderId: string, text: string, recipientId: string) => {
        const chatRef = doc(db, "chats", chatId);
        
        await updateDoc(chatRef, {
            lastMessage: text,
            lastMessageTime: serverTimestamp(),
            lastSenderId: senderId,
            [`unreadCount.${recipientId}`]: 1 // In a production app, use increment(1)
        });

        await addDoc(collection(chatRef, "messages"), {
            text: text,
            senderId: senderId,
            createdAt: serverTimestamp()
        });
    },

    markAsRead: async (chatId: string, userId: string) => {
        const chatRef = doc(db, "chats", chatId);
        try {
            await updateDoc(chatRef, {
                [`unreadCount.${userId}`]: 0
            });
        } catch (e) {
            // Silently fail if doc doesn't exist
        }
    },

    subscribeToChats: (userId: string, callback: (chats: Chat[]) => void) => {
        const q = query(
            collection(db, "chats"), 
            where("participants", "array-contains", userId)
        );
        
        return onSnapshot(q, (snapshot) => {
            let chats = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Chat));
            
            // Sort manually in memory to avoid Firestore composite index requirement
            chats = chats.sort((a, b) => {
                const timeA = a.lastMessageTime?.toMillis ? a.lastMessageTime.toMillis() : 0;
                const timeB = b.lastMessageTime?.toMillis ? b.lastMessageTime.toMillis() : 0;
                return timeB - timeA;
            });
            
            callback(chats);
        });
    },

    subscribeToMessages: (chatId: string, callback: (messages: Message[]) => void) => {
        const q = query(
            collection(db, `chats/${chatId}/messages`),
            orderBy("createdAt", "desc")
        );

        return onSnapshot(q, (snapshot) => {
            const messages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Message));
            callback(messages);
        });
    }
};
