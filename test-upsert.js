import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const cleanRooms = [
    {
      "isFlexiblePrice": false,
      "status": "occupied",
      "checkOutTime": "2026-06-20T05:00:00.000Z",
      "type": "G2",
      "deposit": 500000,
      "checkInTime": "2026-06-19T07:00:00.000Z",
      "weekendPrice": 1600000,
      "floor": 1,
      "weekdayPrice": 1400000,
      "guestName": "a sơn ",
      "reservations": [],
      "notes": "",
      "id": "101"
    }
  ];
  console.log("Upserting rooms...");
  const { error } = await supabase.from("rooms").upsert(cleanRooms);
  console.log("Error rooms:", error);
}
test();
