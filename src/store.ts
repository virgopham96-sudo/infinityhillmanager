import { useState, useEffect } from "react";
import { Room, BookingRecord, RoomStatus } from "./types";
import {
  fetchRoomsFromFirebase,
  fetchBookingsFromFirebase,
  saveRoomToFirebase,
  saveMultipleRoomsToFirebase,
  saveBookingToFirebase,
  deleteBookingFromFirebase,
} from "./firebase";
import { onSnapshot, collection } from "firebase/firestore";
import { db, auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

const ROOM_DATA: Record<
  string,
  { type: string; weekday: number; weekend: number }
> = {
  "101": { type: "G2", weekday: 1400000, weekend: 1600000 },
  "102": { type: "G2", weekday: 1400000, weekend: 1600000 },
  "103": { type: "G2", weekday: 1400000, weekend: 1600000 },
  "104": { type: "G2", weekday: 1400000, weekend: 1600000 },
  "105": { type: "G2", weekday: 1400000, weekend: 1600000 },
  "106": { type: "G2", weekday: 1400000, weekend: 1600000 },
  "107": { type: "G2", weekday: 1400000, weekend: 1600000 },
  "108": { type: "G2", weekday: 1400000, weekend: 1600000 },
  "201": { type: "G3", weekday: 1600000, weekend: 1800000 },
  "202": { type: "G2", weekday: 1400000, weekend: 1600000 },
  "203": { type: "G2", weekday: 1400000, weekend: 1600000 },
  "204": { type: "G2", weekday: 1400000, weekend: 1600000 },
  "205": { type: "G2", weekday: 1400000, weekend: 1600000 },
  "206": { type: "G2", weekday: 1400000, weekend: 1600000 },
  "207": { type: "G2", weekday: 1400000, weekend: 1600000 },
  "208": { type: "G3", weekday: 1600000, weekend: 1800000 },
  "301": { type: "G2V", weekday: 1700000, weekend: 1900000 },
  "302": { type: "G2", weekday: 1400000, weekend: 1600000 },
  "303": { type: "G2", weekday: 1400000, weekend: 1600000 },
  "304": { type: "G2", weekday: 1400000, weekend: 1600000 },
  "305": { type: "G2", weekday: 1400000, weekend: 1600000 },
  "306": { type: "G2", weekday: 1400000, weekend: 1600000 },
  "307": { type: "G2", weekday: 1400000, weekend: 1600000 },
  "308": { type: "G3", weekday: 1600000, weekend: 1800000 },
  "401": { type: "G1V", weekday: 1700000, weekend: 1900000 },
  "402": { type: "G1", weekday: 1200000, weekend: 1400000 },
  "403": { type: "G1", weekday: 1200000, weekend: 1400000 },
  "404": { type: "G1", weekday: 1200000, weekend: 1400000 },
  "405": { type: "G2", weekday: 1400000, weekend: 1600000 },
  "406": { type: "G2", weekday: 1400000, weekend: 1600000 },
  "407": { type: "G2", weekday: 1400000, weekend: 1600000 },
  "408": { type: "G3", weekday: 1600000, weekend: 1800000 },
};

const INITIAL_ROOMS: Room[] = Array.from({ length: 4 }).flatMap(
  (_, floorIndex) => {
    const floor = floorIndex + 1;
    return Array.from({ length: 8 }).map((_, roomIndex) => {
      const roomNumber = `${floor}0${roomIndex + 1}`;
      let status: RoomStatus = "available";

      const data = ROOM_DATA[roomNumber] || {
        type: "G2",
        weekday: 1400000,
        weekend: 1600000,
      };

      return {
        id: roomNumber,
        floor,
        status,
        type: data.type,
        weekdayPrice: data.weekday,
        weekendPrice: data.weekend,
      };
    });
  },
);

export function useStore() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const fbRooms = await fetchRoomsFromFirebase();
        if (!fbRooms) {
          // Initialize if empty
          await saveMultipleRoomsToFirebase(INITIAL_ROOMS);
          setRooms(INITIAL_ROOMS);
        } else {
          setRooms(fbRooms);
        }

        const fbBookings = await fetchBookingsFromFirebase();
        setBookings(fbBookings);
      } catch (err) {
        console.error("Failed to load data from Firebase:", err);
      } finally {
        setIsLoaded(true);
      }
    };

    loadInitialData();

    const unsubRooms = onSnapshot(collection(db, "rooms"), (snap) => {
      if (!snap.empty) {
        setRooms(
          snap.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as Room),
        );
      }
    });

    const unsubBookings = onSnapshot(collection(db, "bookings"), (snap) => {
      setBookings(
        snap.docs.map(
          (doc) => ({ ...doc.data(), id: doc.id }) as BookingRecord,
        ),
      );
    });

    return () => {
      unsubRooms();
      unsubBookings();
    };
  }, []);

  const updateRoom = async (updatedRoom: Room) => {
    await saveRoomToFirebase(updatedRoom);
  };

  const updateMultipleRooms = async (updatedRooms: Room[]) => {
    await saveMultipleRoomsToFirebase(updatedRooms);
  };

  const addBooking = async (booking: BookingRecord) => {
    await saveBookingToFirebase(booking);
  };

  const updateBooking = async (updatedBooking: BookingRecord) => {
    await saveBookingToFirebase(updatedBooking);
  };

  const removeBooking = async (id: string) => {
    await deleteBookingFromFirebase(id);
  };

  return {
    rooms,
    bookings,
    isLoaded,
    user,
    updateRoom,
    updateMultipleRooms,
    addBooking,
    updateBooking,
    removeBooking,
  };
}
