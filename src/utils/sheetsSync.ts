import { Room, BookingRecord } from "../types";
import { calculateTotalPrice } from "../lib/utils";

/**
 * Automatically synchronizes current active, reserved, and historic bookings to the configured Google Sheet URL.
 */
export async function syncRoomsAndBookingsToSheets(rooms: Room[], bookings: BookingRecord[]) {
  const DEFAULT_SHEETS_URL = "https://script.google.com/macros/s/AKfycbzHHwWgZHy-4NZVqhHrMy8Oky34rJ9ZQEcMc1raNBarMn7Mi9vi5c6y_CcELGgjjU5r/exec";
  const sheetsUrl = localStorage.getItem("google_sheets_web_app_url") || DEFAULT_SHEETS_URL;
  
  if (!sheetsUrl) {
    console.warn("No Google Sheets Appscript URL configured. Skipping auto sync.");
    return;
  }

  // 1. Gather historical bookings
  const syncedBookings: any[] = bookings.map(b => ({
    id: b.id,
    roomId: b.roomId,
    guestName: b.guestName,
    checkIn: b.checkIn,
    checkOut: b.checkOut,
    totalPrice: b.totalPrice,
    status: b.status,
    createdAt: b.createdAt,
    notes: b.notes || "",
    checkoutDetails: b.checkoutDetails || {},
  }));

  // 2. Gather active rooms & future reservations
  rooms.forEach(room => {
    if (room.status === "occupied" && room.guestName) {
      const calculatedPrice = room.isFlexiblePrice 
        ? (room.flexiblePrice || 0) 
        : calculateTotalPrice(
            room.checkInTime || new Date().toISOString(),
            room.checkOutTime || new Date().toISOString(),
            room.weekdayPrice,
            room.weekendPrice
          );

      syncedBookings.push({
        id: `B_active_${room.id}`,
        roomId: room.id,
        guestName: room.guestName,
        checkIn: room.checkInTime || new Date().toISOString(),
        checkOut: room.checkOutTime || new Date().toISOString(),
        totalPrice: calculatedPrice,
        status: "active" as any,
        createdAt: room.checkInTime || new Date().toISOString(),
        notes: room.notes || "",
        checkoutDetails: {
          roomPrice: calculatedPrice,
          deposit: room.deposit || 0,
          minibar: room.minibar || {},
          compensation: room.compensation || 0,
        }
      });
    }

    if (room.status === "reserved" && room.guestName) {
      const calculatedPrice = room.isFlexiblePrice 
        ? (room.flexiblePrice || 0) 
        : calculateTotalPrice(
            room.checkInTime || new Date().toISOString(),
            room.checkOutTime || new Date().toISOString(),
            room.weekdayPrice,
            room.weekendPrice
          );

      syncedBookings.push({
        id: `R_main_${room.id}`,
        roomId: room.id,
        guestName: room.guestName,
        checkIn: room.checkInTime || new Date().toISOString(),
        checkOut: room.checkOutTime || new Date().toISOString(),
        totalPrice: calculatedPrice,
        status: "reserved" as any,
        createdAt: room.checkInTime || new Date().toISOString(),
        notes: room.notes || "",
        checkoutDetails: {
          roomPrice: calculatedPrice,
          deposit: room.deposit || 0,
          minibar: {},
          compensation: 0,
        }
      });
    }

    if (room.reservations && room.reservations.length > 0) {
      room.reservations.forEach(res => {
        const calculatedPrice = res.isFlexiblePrice 
          ? (res.flexiblePrice || 0) 
          : calculateTotalPrice(
              res.checkInTime,
              res.checkOutTime,
              room.weekdayPrice,
              room.weekendPrice
            );

        syncedBookings.push({
          id: `R_res_${res.id}`,
          roomId: room.id,
          guestName: res.guestName,
          checkIn: res.checkInTime,
          checkOut: res.checkOutTime,
          totalPrice: calculatedPrice,
          status: "reserved" as any,
          createdAt: res.checkInTime,
          notes: res.notes || "",
          checkoutDetails: {
            roomPrice: calculatedPrice,
            deposit: res.deposit || 0,
            minibar: {},
            compensation: 0,
          }
        });
      });
    }
  });

  try {
    console.log("Automatically syncing to Google Sheets via Web App...");
    await fetch(sheetsUrl, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify({
        action: "sync",
        rooms: rooms.map(r => ({
          id: r.id,
          floor: r.floor,
          type: r.type,
          status: r.status,
          weekdayPrice: r.weekdayPrice,
          weekendPrice: r.weekendPrice,
          notes: r.notes || "",
        })),
        bookings: syncedBookings,
      }),
    });
    console.log("Auto sync completed successfully.");
  } catch (err) {
    console.error("Error during auto sync to Google Sheets:", err);
  }
}
