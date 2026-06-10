export type RoomStatus = "available" | "occupied" | "reserved" | "maintenance";

export interface Reservation {
  id: string;
  guestName: string;
  checkInTime: string;
  checkOutTime: string;
  deposit?: number;
  notes?: string;
}

export interface Room {
  id: string; // e.g. "101"
  floor: number;
  type: string; // e.g. "G1", "G2"
  status: RoomStatus;
  guestName?: string;
  checkInTime?: string; // ISO string
  checkOutTime?: string; // ISO string
  weekdayPrice: number;
  weekendPrice: number;
  deposit?: number;
  notes?: string;
  reservations?: Reservation[]; // Future reservations
}

export interface BookingRecord {
  id: string;
  roomId: string;
  guestName: string;
  checkIn: string; // ISO string
  checkOut: string; // ISO string
  totalPrice: number;
  status: "active" | "completed" | "cancelled";
  createdAt: string; // ISO string
  notes?: string;
}
