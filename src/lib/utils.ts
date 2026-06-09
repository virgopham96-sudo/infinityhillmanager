import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { eachDayOfInterval, isWeekend, getDay, parseISO } from "date-fns";
import { Room, RoomStatus } from "../types";

export function getLiveRoomState(room: Room): {
  status: RoomStatus;
  guestName?: string;
  checkInTime?: string;
  checkOutTime?: string;
} {
  const now = new Date();

  if (room.status === "maintenance") {
    return { status: "maintenance" };
  }

  // Check if main status applies right now
  if (room.status === "occupied") {
    return {
      status: "occupied",
      guestName: room.guestName,
      checkInTime: room.checkInTime,
      checkOutTime: room.checkOutTime,
    };
  }

  if (room.status === "reserved" && room.checkInTime && room.checkOutTime) {
    const inDate = parseISO(room.checkInTime);
    if (now >= inDate) {
      return {
        status: "reserved",
        guestName: room.guestName,
        checkInTime: room.checkInTime,
        checkOutTime: room.checkOutTime,
      };
    }
  }

  // Check reservations
  if (room.reservations) {
    for (const res of room.reservations) {
      const inDate = parseISO(res.checkInTime);
      const outDate = parseISO(res.checkOutTime);
      if (now >= inDate && now < outDate) {
        return {
          status: "reserved",
          guestName: res.guestName,
          checkInTime: res.checkInTime,
          checkOutTime: res.checkOutTime,
        };
      }
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
