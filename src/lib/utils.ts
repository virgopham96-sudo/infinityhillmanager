import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { eachDayOfInterval, isWeekend, getDay } from "date-fns";

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
