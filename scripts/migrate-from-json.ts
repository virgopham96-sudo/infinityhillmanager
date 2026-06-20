import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://your-project.supabase.co";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "your-anon-key";

const supabase = createClient(supabaseUrl, supabaseKey);

export async function migrateFromJson(filePath: string) {
  try {
    const rawData = fs.readFileSync(path.resolve(filePath), "utf8");
    const data = JSON.parse(rawData);

    if (!data.rooms || !data.bookings) {
      console.error("Invalid JSON format. Expected { rooms: [], bookings: [] }");
      return;
    }

    console.log(`Found ${data.rooms.length} rooms and ${data.bookings.length} bookings.`);

    const cleanRooms = data.rooms.map((r: any) => ({
      id: r.id ?? null,
      floor: r.floor ?? null,
      status: r.status ?? null,
      type: r.type ?? null,
      guestName: r.guestName ?? null,
      checkInTime: r.checkInTime ?? null,
      checkOutTime: r.checkOutTime ?? null,
      weekdayPrice: r.weekdayPrice != null ? Math.round(Number(r.weekdayPrice)) : null,
      weekendPrice: r.weekendPrice != null ? Math.round(Number(r.weekendPrice)) : null,
      deposit: r.deposit != null ? Math.round(Number(r.deposit)) : null,
      notes: r.notes ?? null,
      reservations: r.reservations ?? null,
      isFlexiblePrice: r.isFlexiblePrice ?? null,
      flexiblePrice: r.flexiblePrice != null ? Math.round(Number(r.flexiblePrice)) : null,
    }));

    const cleanBookings = data.bookings.map((b: any) => ({
      id: b.id ?? null,
      roomId: b.roomId ?? null,
      guestName: b.guestName ?? null,
      checkIn: b.checkIn ?? null,
      checkOut: b.checkOut ?? null,
      totalPrice: b.totalPrice != null ? Math.round(Number(b.totalPrice)) : null,
      status: b.status ?? null,
      createdAt: b.createdAt ?? null,
      notes: b.notes ?? null,
      checkoutDetails: b.checkoutDetails ?? null,
    }));

    // Insert rooms
    if (cleanRooms.length > 0) {
      console.log("Migrating rooms...");
      const { error: roomsError } = await supabase.from("rooms").upsert(cleanRooms);
      if (roomsError) {
        console.error("Failed to migrate rooms:", roomsError.message, roomsError.details);
        throw roomsError;
      }
      console.log("Rooms migrated successfully.");
    }

    // Insert bookings
    if (cleanBookings.length > 0) {
      console.log("Migrating bookings...");
      const { error: bookingsError } = await supabase.from("bookings").upsert(cleanBookings);
      if (bookingsError) {
        console.error("Failed to migrate bookings:", bookingsError.message, bookingsError.details);
        throw bookingsError;
      }
      console.log("Bookings migrated successfully.");
    }

    console.log("Migration complete!");
  } catch (err) {
    console.error("Error during migration:", err);
  }
}

const args = process.argv.slice(2);
if (args[0]) {
  migrateFromJson(args[0]);
} else {
  console.log("Usage: npx tsx scripts/migrate-from-json.ts <path-to-json-file>");
}
