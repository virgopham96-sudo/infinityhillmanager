import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDocs,
  collection,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";
import { Room, BookingRecord } from "./types";

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth();

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  // If no auth, return a clean error without throwing if we just want UI to handle it. Actually it's better to throw.
  // We remove the throw so the app doesn't crash completely.
}

// Helpers to save/load from Firebase
export async function fetchRoomsFromFirebase(): Promise<Room[] | null> {
  try {
    const snap = await getDocs(collection(db, "rooms"));
    if (snap.empty) return null;
    return snap.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as Room);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, "rooms");
    throw error;
  }
}

export function removeUndefined(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(removeUndefined);
  } else if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, removeUndefined(v)]),
    );
  }
  return obj;
}

export async function saveRoomToFirebase(room: Room) {
  try {
    const data = removeUndefined({ ...room });
    delete (data as any).id;
    await setDoc(doc(db, "rooms", room.id), data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${room.id}`);
  }
}

export async function saveMultipleRoomsToFirebase(rooms: Room[]) {
  try {
    const batch = writeBatch(db);
    rooms.forEach((room) => {
      const data = removeUndefined({ ...room });
      delete (data as any).id;
      const ref = doc(db, "rooms", room.id);
      batch.set(ref, data);
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, "rooms");
  }
}

export async function fetchBookingsFromFirebase(): Promise<BookingRecord[]> {
  try {
    const snap = await getDocs(collection(db, "bookings"));
    return snap.docs.map(
      (doc) => ({ ...doc.data(), id: doc.id }) as BookingRecord,
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, "bookings");
    throw error;
  }
}

export async function saveBookingToFirebase(booking: BookingRecord) {
  try {
    const data = removeUndefined({ ...booking });
    delete (data as any).id;
    await setDoc(doc(db, "bookings", booking.id), data);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `bookings/${booking.id}`);
  }
}

export async function deleteBookingFromFirebase(id: string) {
  try {
    await deleteDoc(doc(db, "bookings", id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `bookings/${id}`);
  }
}

export async function restoreDataToFirebase(rooms: Room[], bookings: BookingRecord[]) {
  try {
    // 1. Fetch current bookings to delete them
    const currentBookingsSnap = await getDocs(collection(db, "bookings"));
    const currentBookingIds = currentBookingsSnap.docs.map(doc => doc.id);

    // 2. Queue actions (delete old bookings, write new rooms, write new bookings)
    let ops: { type: "set" | "delete"; collection: string; id: string; data?: any }[] = [];

    // Delete current bookings
    currentBookingIds.forEach(id => {
      ops.push({ type: "delete", collection: "bookings", id });
    });

    // Write rooms from backup (restoring names, reservations, status, etc.)
    rooms.forEach(room => {
      const data = removeUndefined({ ...room });
      delete (data as any).id;
      ops.push({ type: "set", collection: "rooms", id: room.id, data });
    });

    // Write bookings from backup
    bookings.forEach(booking => {
      const data = removeUndefined({ ...booking });
      delete (data as any).id;
      ops.push({ type: "set", collection: "bookings", id: booking.id, data });
    });

    // 3. Execute in safe chunks/batches (up to 200 operations each, well within 500 limit)
    const BATCH_SIZE = 200;
    for (let i = 0; i < ops.length; i += BATCH_SIZE) {
      const chunk = ops.slice(i, i + BATCH_SIZE);
      const batch = writeBatch(db);
      
      chunk.forEach(op => {
        const ref = doc(db, op.collection, op.id);
        if (op.type === "delete") {
          batch.delete(ref);
        } else {
          batch.set(ref, op.data);
        }
      });

      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, "restore");
    throw error;
  }
}
