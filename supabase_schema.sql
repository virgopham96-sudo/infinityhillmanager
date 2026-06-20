-- Drop existing tables if they exist to apply new schema
DROP TABLE IF EXISTS public.bookings;
DROP TABLE IF EXISTS public.rooms;

-- Create rooms table
CREATE TABLE public.rooms (
  id TEXT PRIMARY KEY,
  floor INTEGER,
  status TEXT DEFAULT 'available',
  type TEXT,
  "guestName" TEXT,
  "checkInTime" TEXT,
  "checkOutTime" TEXT,
  "weekdayPrice" INTEGER,
  "weekendPrice" INTEGER,
  deposit INTEGER,
  notes TEXT,
  reservations JSONB,
  "isFlexiblePrice" BOOLEAN,
  "flexiblePrice" INTEGER
);

-- Create bookings table
CREATE TABLE public.bookings (
  id TEXT PRIMARY KEY,
  "roomId" TEXT REFERENCES public.rooms(id) ON DELETE CASCADE,
  "guestName" TEXT,
  "checkIn" TEXT,
  "checkOut" TEXT,
  "totalPrice" INTEGER,
  status TEXT,
  "createdAt" TEXT,
  notes TEXT,
  "checkoutDetails" JSONB
);

-- Enable real time for these tables
alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.bookings;
