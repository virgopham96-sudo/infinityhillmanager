import { useState, useEffect } from "react";
import { Room, BookingRecord, RoomStatus } from "./types";

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
      // Add some initial mock data
      if (roomNumber === "101") status = "occupied";
      if (roomNumber === "204") status = "reserved";
      if (roomNumber === "408") status = "maintenance";

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
        guestName:
          roomNumber === "101"
            ? "Nguyễn Văn A"
            : roomNumber === "204"
              ? "Trần Thị B"
              : undefined,
        checkInTime:
          roomNumber === "101"
            ? new Date(Date.now() - 86400000).toISOString()
            : undefined,
        checkOutTime:
          roomNumber === "101"
            ? new Date(Date.now() + 86400000).toISOString()
            : roomNumber === "204"
              ? new Date(Date.now() + 172800000).toISOString()
              : undefined,
      };
    });
  },
);

const INITIAL_BOOKINGS: BookingRecord[] = [
  {
    id: "B101",
    roomId: "101",
    guestName: "Nguyễn Văn A",
    checkIn: new Date(Date.now() - 86400000).toISOString(),
    checkOut: new Date(Date.now() + 86400000).toISOString(),
    totalPrice: 1000000,
    status: "active",
    createdAt: new Date().toISOString(),
  },
];

export function useStore() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const storedRooms = localStorage.getItem("hotel_rooms");
    const storedBookings = localStorage.getItem("hotel_bookings");

    if (storedRooms) {
      const parsed = JSON.parse(storedRooms) as Room[];
      const migrated = parsed.map((r) => {
        const data = ROOM_DATA[r.id] || {
          type: "G2",
          weekday: 1400000,
          weekend: 1600000,
        };
        return {
          ...r,
          type: data.type,
          weekdayPrice: data.weekday,
          weekendPrice: data.weekend,
        };
      });
      setRooms(migrated);
    } else {
      setRooms(INITIAL_ROOMS);
      localStorage.setItem("hotel_rooms", JSON.stringify(INITIAL_ROOMS));
    }

    if (storedBookings) {
      setBookings(JSON.parse(storedBookings));
    } else {
      setBookings(INITIAL_BOOKINGS);
      localStorage.setItem("hotel_bookings", JSON.stringify(INITIAL_BOOKINGS));
    }

    setIsLoaded(true);
  }, []);

  const saveRooms = (newRooms: Room[]) => {
    setRooms(newRooms);
    localStorage.setItem("hotel_rooms", JSON.stringify(newRooms));
  };

  const saveBookings = (newBookings: BookingRecord[]) => {
    setBookings(newBookings);
    localStorage.setItem("hotel_bookings", JSON.stringify(newBookings));
  };

  const updateRoom = (updatedRoom: Room) => {
    const newRooms = rooms.map((r) =>
      r.id === updatedRoom.id ? updatedRoom : r,
    );
    saveRooms(newRooms);
  };

  const updateMultipleRooms = (updatedRooms: Room[]) => {
    const updatedMap = new Map(updatedRooms.map((r) => [r.id, r]));
    const newRooms = rooms.map((r) =>
      updatedMap.has(r.id) ? updatedMap.get(r.id)! : r,
    );
    saveRooms(newRooms);
  };

  const addBooking = (booking: BookingRecord) => {
    saveBookings([...bookings, booking]);
  };

  const updateBooking = (updatedBooking: BookingRecord) => {
    saveBookings(
      bookings.map((b) => (b.id === updatedBooking.id ? updatedBooking : b)),
    );
  };

  return {
    rooms,
    bookings,
    isLoaded,
    updateRoom,
    updateMultipleRooms,
    addBooking,
    updateBooking,
  };
}
