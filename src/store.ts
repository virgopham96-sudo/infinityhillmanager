import { useState, useEffect } from "react";
import { Room, BookingRecord, RoomStatus } from "./types";
import {
  supabase,
  fetchRoomsFromDatabase,
  fetchBookingsFromDatabase,
  saveRoomToDatabase,
  saveMultipleRoomsToDatabase,
  saveBookingToDatabase,
  deleteBookingFromDatabase,
  restoreDataToDatabase,
} from "./supabase";

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
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Optionally listen to Supabase auth state changes here if needed
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const dbRooms = await fetchRoomsFromDatabase();
        if (!dbRooms) {
          // Initialize if empty
          await saveMultipleRoomsToDatabase(INITIAL_ROOMS);
          setRooms(INITIAL_ROOMS);
        } else {
          setRooms(dbRooms);
        }

        const dbBookings = await fetchBookingsFromDatabase();
        setBookings(dbBookings);
      } catch (err) {
        console.error("Failed to load data from database:", err);
      } finally {
        setIsLoaded(true);
      }
    };

    if (import.meta.env.VITE_SUPABASE_URL) {
      loadInitialData();

      const roomsChannelName = `custom-all-channel-rooms-${Math.random()}`;
      const roomsChannel = supabase.channel(roomsChannelName)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'rooms' },
          () => {
            fetchRoomsFromDatabase().then(data => { if(data) setRooms(data) });
          }
        )
        .subscribe();

      const bookingsChannelName = `custom-all-channel-bookings-${Math.random()}`;
      const bookingsChannel = supabase.channel(bookingsChannelName)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'bookings' },
          () => {
            fetchBookingsFromDatabase().then(data => setBookings(data));
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(roomsChannel);
        supabase.removeChannel(bookingsChannel);
      };
    } else {
      // Mock data if Supabase is not configured
      setIsLoaded(true);
      setRooms(INITIAL_ROOMS);
    }
  }, []);

  const updateRoom = async (updatedRoom: Room) => {
    if (import.meta.env.VITE_SUPABASE_URL) {
      await saveRoomToDatabase(updatedRoom);
    } else {
      setRooms(prev => prev.map(r => r.id === updatedRoom.id ? updatedRoom : r));
    }
  };

  const updateMultipleRooms = async (updatedRooms: Room[]) => {
    if (import.meta.env.VITE_SUPABASE_URL) {
      await saveMultipleRoomsToDatabase(updatedRooms);
    } else {
      setRooms(prev => prev.map(r => updatedRooms.find(u => u.id === r.id) || r));
    }
  };

  const addBooking = async (booking: BookingRecord) => {
    if (import.meta.env.VITE_SUPABASE_URL) {
      await saveBookingToDatabase(booking);
    } else {
      setBookings(prev => [...prev, booking]);
    }
  };

  const updateBooking = async (updatedBooking: BookingRecord) => {
    if (import.meta.env.VITE_SUPABASE_URL) {
      await saveBookingToDatabase(updatedBooking);
    } else {
      setBookings(prev => prev.map(b => b.id === updatedBooking.id ? updatedBooking : b));
    }
  };

  const removeBooking = async (id: string) => {
    if (import.meta.env.VITE_SUPABASE_URL) {
      await deleteBookingFromDatabase(id);
    } else {
      setBookings(prev => prev.filter(b => b.id !== id));
    }
  };

  const restoreData = async (roomsToRestore: Room[], bookingsToRestore: BookingRecord[]) => {
    if (import.meta.env.VITE_SUPABASE_URL) {
      await restoreDataToDatabase(roomsToRestore, bookingsToRestore);
    } else {
      setRooms(roomsToRestore);
      setBookings(bookingsToRestore);
    }
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
    restoreData,
  };
}

