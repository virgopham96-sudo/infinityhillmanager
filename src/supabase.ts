import { createClient } from "@supabase/supabase-js";
import { Room, BookingRecord } from "./types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://your-project.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "your-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: (...args) => fetch(...args),
  },
});

export async function fetchRoomsFromDatabase(): Promise<Room[] | null> {
  const { data, error } = await supabase.from("rooms").select("*");
  if (error) {
    console.error("Error fetching rooms:", error);
    return null;
  }
  if (!data || data.length === 0) return null;
  return data as Room[];
}

export async function saveRoomToDatabase(room: Room) {
  const cleanRoom = {
    id: room.id,
    floor: room.floor,
    status: room.status,
    type: room.type,
    guestName: room.guestName,
    checkInTime: room.checkInTime,
    checkOutTime: room.checkOutTime,
    weekdayPrice: room.weekdayPrice,
    weekendPrice: room.weekendPrice,
    deposit: room.deposit,
    notes: room.notes,
    reservations: room.reservations,
    isFlexiblePrice: room.isFlexiblePrice,
    flexiblePrice: room.flexiblePrice
  };
  const { error } = await supabase.from("rooms").upsert(cleanRoom);
  if (error) console.error("Error saving room:", error);
}

export async function saveMultipleRoomsToDatabase(rooms: Room[]) {
  const cleanRooms = rooms.map(r => ({
    id: r.id,
    floor: r.floor,
    status: r.status,
    type: r.type,
    guestName: r.guestName,
    checkInTime: r.checkInTime,
    checkOutTime: r.checkOutTime,
    weekdayPrice: r.weekdayPrice,
    weekendPrice: r.weekendPrice,
    deposit: r.deposit,
    notes: r.notes,
    reservations: r.reservations,
    isFlexiblePrice: r.isFlexiblePrice,
    flexiblePrice: r.flexiblePrice
  }));
  const { error } = await supabase.from("rooms").upsert(cleanRooms);
  if (error) console.error("Error saving multiple rooms:", error);
}

export async function fetchBookingsFromDatabase(): Promise<BookingRecord[]> {
  const { data, error } = await supabase.from("bookings").select("*");
  if (error) {
    console.error("Error fetching bookings:", error);
    return [];
  }
  return data as BookingRecord[];
}

export async function saveBookingToDatabase(booking: BookingRecord) {
  const cleanBooking = {
    id: booking.id,
    roomId: booking.roomId,
    guestName: booking.guestName,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    totalPrice: booking.totalPrice,
    status: booking.status,
    createdAt: booking.createdAt,
    notes: booking.notes,
    checkoutDetails: booking.checkoutDetails
  };
  const { error } = await supabase.from("bookings").upsert(cleanBooking);
  if (error) console.error("Error saving booking:", error);
}

export async function deleteBookingFromDatabase(id: string) {
  const { error } = await supabase.from("bookings").delete().eq("id", id);
  if (error) console.error("Error deleting booking:", error);
}

export async function restoreDataToDatabase(rooms: Room[], bookings: BookingRecord[]) {
  // Delete existing bookings
  const { error: deleteError } = await supabase.from("bookings").delete().neq("id", "dummy");
  if (deleteError) throw new Error("Error deleting current bookings: " + deleteError.message);

  const cleanRooms = rooms.map(r => ({
    id: r.id,
    floor: r.floor,
    status: r.status,
    type: r.type,
    guestName: r.guestName,
    checkInTime: r.checkInTime,
    checkOutTime: r.checkOutTime,
    weekdayPrice: r.weekdayPrice,
    weekendPrice: r.weekendPrice,
    deposit: r.deposit,
    notes: r.notes,
    reservations: r.reservations,
    isFlexiblePrice: r.isFlexiblePrice,
    flexiblePrice: r.flexiblePrice
  }));

  const cleanBookings = bookings.map(b => ({
    id: b.id,
    roomId: b.roomId,
    guestName: b.guestName,
    checkIn: b.checkIn,
    checkOut: b.checkOut,
    totalPrice: b.totalPrice,
    status: b.status,
    createdAt: b.createdAt,
    notes: b.notes,
    checkoutDetails: b.checkoutDetails
  }));

  // Upsert new rooms
  if (cleanRooms.length > 0) {
    const { error: roomsError } = await supabase.from("rooms").upsert(cleanRooms);
    if (roomsError) throw new Error("Error restoring rooms: " + roomsError.message);
  }

  // Upsert new bookings
  if (cleanBookings.length > 0) {
    const { error: bookingsError } = await supabase.from("bookings").upsert(cleanBookings);
    if (bookingsError) throw new Error("Error restoring bookings: " + bookingsError.message);
  }
}
