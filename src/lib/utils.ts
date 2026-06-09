import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { eachDayOfInterval, isWeekend, getDay, parseISO, startOfDay } from "date-fns";
import { Room, RoomStatus } from "../types";

export function getLiveRoomState(room: Room): {
  status: RoomStatus;
  guestName?: string;
  checkInTime?: string;
  checkOutTime?: string;
} {
  if (room.status === "maintenance") {
    return { status: "maintenance" };
  }

  const now = new Date();
  const today = startOfDay(now);

  if (room.status === "occupied") {
    return {
      status: "occupied",
      guestName: room.guestName,
      checkInTime: room.checkInTime,
      checkOutTime: room.checkOutTime,
    };
  }

  // Gather all active reservations (including the main one if room.status is "reserved")
  const allReservations = [];
  if (room.status === "reserved" && room.checkInTime && room.checkOutTime) {
    allReservations.push({
      guestName: room.guestName,
      checkInTime: room.checkInTime,
      checkOutTime: room.checkOutTime,
    });
  }
  if (room.reservations) {
    allReservations.push(...room.reservations);
  }

  // Find if any reservation is active *today*
  for (const res of allReservations) {
    const inDate = parseISO(res.checkInTime);
    const outDate = parseISO(res.checkOutTime);
    const inDay = startOfDay(inDate);
    // It's considered 'reserved' today if the check-in day is today or earlier,
    // and it hasn't reached check-out time yet
    // Wait, if outDate is today, they checkout today, room should be available after checkOut or maybe currently?
    // "now < outDate" will make it true if they haven't checked out yet.
    if (today >= inDay && now < outDate) {
      return {
        status: "reserved",
        guestName: res.guestName,
        checkInTime: res.checkInTime,
        checkOutTime: res.checkOutTime,
      };
    }
  }

  return { status: "available" };
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

// Check if a date is considered a weekend in our pricing model (Friday, Saturday, Sunday)
export function isWeekendOrHoliday(date: Date) {
  const day = getDay(date);
  return day === 0 || day === 5 || day === 6; // 0 = Sunday, 5 = Friday, 6 = Saturday
}

export function calculateTotalPrice(
  checkIn: string | Date,
  checkOut: string | Date,
  weekdayPrice: number,
  weekendPrice: number,
): number {
  const start = new Date(checkIn);
  let end = new Date(checkOut);

  // Ensure at least 1 day
  if (end <= start) {
    end = new Date(start.getTime() + 86400000);
  }

  // Get all days in the interval, excluding the checkout day (unless same day)
  const days = eachDayOfInterval({ start, end });
  if (days.length > 1) {
    days.pop(); // Remove the checkout day
  }

  return days.reduce((total, day) => {
    return total + (isWeekendOrHoliday(day) ? weekendPrice : weekdayPrice);
  }, 0);
}
