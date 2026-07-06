import { Room, BookingRecord } from "../types";

const KEY_MAPS_SNAKE_TO_CAMEL: Record<string, string> = {
  room_id: "roomId",
  guest_name: "guestName",
  check_in_time: "checkInTime",
  check_out_time: "checkOutTime",
  weekday_price: "weekdayPrice",
  weekend_price: "weekendPrice",
  is_flexible_price: "isFlexiblePrice",
  flexible_price: "flexiblePrice",
  check_in: "checkIn",
  check_out: "checkOut",
  total_price: "totalPrice",
  created_at: "createdAt",
  checkout_details: "checkoutDetails",
};

export function normalizeObject(obj: any): any {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(normalizeObject);
  
  const newObj: any = {};
  for (const key of Object.keys(obj)) {
    const camelKey = KEY_MAPS_SNAKE_TO_CAMEL[key] || key;
    let val = obj[key];
    if (camelKey === "reservations" && typeof val === "string") {
      try { val = JSON.parse(val); } catch (e) {}
    }
    if (camelKey === "checkoutDetails" && typeof val === "string") {
      try { val = JSON.parse(val); } catch (e) {}
    }
    newObj[camelKey] = normalizeObject(val);
  }
  return newObj;
}

export function normalizeJsonBackup(data: any): { rooms?: Room[]; bookings?: BookingRecord[] } {
  if (!data) return {};
  
  let rawRooms: any[] = [];
  let rawBookings: any[] = [];
  
  // Standard backup
  if (data.rooms || data.bookings) {
    rawRooms = data.rooms ? normalizeObject(data.rooms) : [];
    rawBookings = data.bookings ? normalizeObject(data.bookings) : [];
  } else if (Array.isArray(data)) {
    const normalizedList = normalizeObject(data);
    const hasRoomProp = normalizedList.some((item: any) => item.floor !== undefined || item.weekdayPrice !== undefined);
    const hasBookingProp = normalizedList.some((item: any) => item.roomId !== undefined || item.totalPrice !== undefined);
    if (hasRoomProp) {
      rawRooms = normalizedList;
    } else if (hasBookingProp) {
      rawBookings = normalizedList;
    }
  }

  // If no rooms are present, return normalized raw data
  if (rawRooms.length === 0) {
    return {
      rooms: undefined,
      bookings: rawBookings.length > 0 ? rawBookings : undefined
    };
  }

  // 2. Reconstruct room states and future reservations from the bookings list
  const roomMap: Record<string, Room> = {};
  rawRooms.forEach((r: any) => {
    roomMap[r.id] = {
      id: String(r.id),
      floor: Number(r.floor !== undefined ? r.floor : 1),
      type: r.type || "G",
      status: "available", // default fallback, will be updated by active bookings below
      weekdayPrice: Number(r.weekdayPrice || 0),
      weekendPrice: Number(r.weekendPrice || 0),
      notes: r.notes || "",
      reservations: Array.isArray(r.reservations) ? r.reservations : []
    };
  });

  const historicalBookings: BookingRecord[] = [];

  rawBookings.forEach((b: any) => {
    if (!b || !b.roomId) return;
    
    const idStr = String(b.id || "");
    const statusStr = String(b.status || "").toLowerCase();
    const roomId = String(b.roomId);
    
    // Check if it is an active check-in (occupied)
    if (idStr.startsWith("B_active_") || statusStr === "active" || statusStr === "checked_in" || statusStr === "occupied") {
      if (roomMap[roomId]) {
        roomMap[roomId].status = "occupied";
        roomMap[roomId].guestName = b.guestName || "Khách";
        roomMap[roomId].checkInTime = b.checkIn;
        roomMap[roomId].checkOutTime = b.checkOut;
        roomMap[roomId].deposit = Number(b.deposit || b.checkoutDetails?.deposit || 0);
        roomMap[roomId].notes = b.notes || roomMap[roomId].notes || "";
        roomMap[roomId].minibar = b.checkoutDetails?.minibar || {};
        roomMap[roomId].compensation = Number(b.checkoutDetails?.compensation || 0);
      }
    }
    // Check if it is a main active reservation for a room
    else if (idStr.startsWith("R_main_") || (statusStr === "reserved" && (idStr.includes("_main") || !idStr.includes("_res_")))) {
      if (roomMap[roomId]) {
        // Only set status to reserved if not occupied
        if (roomMap[roomId].status !== "occupied") {
          roomMap[roomId].status = "reserved";
          roomMap[roomId].guestName = b.guestName || "Khách đặt trước";
          roomMap[roomId].checkInTime = b.checkIn;
          roomMap[roomId].checkOutTime = b.checkOut;
          roomMap[roomId].deposit = Number(b.deposit || 0);
          roomMap[roomId].notes = b.notes || roomMap[roomId].notes || "";
        } else {
          // If the room is already occupied, this acts as a future reservation
          if (!roomMap[roomId].reservations) {
            roomMap[roomId].reservations = [];
          }
          const resId = idStr.replace("R_main_", "").replace("R_res_", "") || `R_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
          if (!roomMap[roomId].reservations!.some(r => r.id === resId)) {
            roomMap[roomId].reservations!.push({
              id: resId,
              guestName: b.guestName || "Khách đặt trước",
              checkInTime: b.checkIn,
              checkOutTime: b.checkOut,
              deposit: Number(b.deposit || 0),
              notes: b.notes || ""
            });
          }
        }
      }
    }
    // Check if it is a future nested reservation
    else if (idStr.startsWith("R_res_") || statusStr === "reserved") {
      if (roomMap[roomId]) {
        if (!roomMap[roomId].reservations) {
          roomMap[roomId].reservations = [];
        }
        const resId = idStr.replace("R_res_", "").replace("R_main_", "") || `R_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        if (!roomMap[roomId].reservations!.some(r => r.id === resId)) {
          roomMap[roomId].reservations!.push({
            id: resId,
            guestName: b.guestName || "Khách đặt trước",
            checkInTime: b.checkIn,
            checkOutTime: b.checkOut,
            deposit: Number(b.deposit || 0),
            notes: b.notes || ""
          });
        }
      }
    }
    // Otherwise, this is a real completed or cancelled booking record to keep in history
    else {
      let finalStatus: "active" | "completed" | "cancelled" = "completed";
      if (statusStr === "cancelled" || statusStr === "cancel") {
        finalStatus = "cancelled";
      } else if (statusStr === "active" || statusStr === "checked_in") {
        finalStatus = "active";
      }
      
      historicalBookings.push({
        id: b.id,
        roomId: roomId,
        guestName: b.guestName || "Khách",
        checkIn: b.checkIn,
        checkOut: b.checkOut,
        totalPrice: Number(b.totalPrice || 0),
        status: finalStatus,
        createdAt: b.createdAt || new Date().toISOString(),
        notes: b.notes || "",
        checkoutDetails: b.checkoutDetails || {
          roomPrice: Number(b.totalPrice || 0),
          deposit: Number(b.deposit || 0),
          minibar: {},
          compensation: 0
        }
      });
    }
  });

  return {
    rooms: Object.values(roomMap),
    bookings: historicalBookings
  };
}

export function formatSqlValue(val: any): string {
  if (val === null || val === undefined) {
    return "NULL";
  }
  if (typeof val === "boolean") {
    return val ? "true" : "false";
  }
  if (typeof val === "number") {
    return String(val);
  }
  if (typeof val === "object") {
    return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
  }
  return `'${String(val).replace(/'/g, "''")}'`;
}

export function generateSqlBackup(rooms: Room[], bookings: BookingRecord[], hotelName: string): string {
  let sql = `-- Infinity Hill Manager - Database Backup for Supabase / PostgreSQL\n`;
  sql += `-- Hotel Name: ${hotelName}\n`;
  sql += `-- Generated At: ${new Date().toISOString()}\n\n`;
  
  sql += `-- Schema definitions for Supabase compatibility\n`;
  sql += `CREATE TABLE IF NOT EXISTS rooms (\n`;
  sql += `  id TEXT PRIMARY KEY,\n`;
  sql += `  floor INT4,\n`;
  sql += `  type TEXT,\n`;
  sql += `  status TEXT,\n`;
  sql += `  guest_name TEXT,\n`;
  sql += `  check_in_time TEXT,\n`;
  sql += `  check_out_time TEXT,\n`;
  sql += `  weekday_price INT4,\n`;
  sql += `  weekend_price INT4,\n`;
  sql += `  deposit INT4,\n`;
  sql += `  notes TEXT,\n`;
  sql += `  reservations JSONB,\n`;
  sql += `  is_flexible_price BOOLEAN,\n`;
  sql += `  flexible_price INT4\n`;
  sql += `);\n\n`;

  sql += `CREATE TABLE IF NOT EXISTS bookings (\n`;
  sql += `  id TEXT PRIMARY KEY,\n`;
  sql += `  room_id TEXT,\n`;
  sql += `  guest_name TEXT,\n`;
  sql += `  check_in TEXT,\n`;
  sql += `  check_out TEXT,\n`;
  sql += `  total_price INT4,\n`;
  sql += `  status TEXT,\n`;
  sql += `  created_at TEXT,\n`;
  sql += `  notes TEXT,\n`;
  sql += `  checkout_details JSONB\n`;
  sql += `);\n\n`;

  sql += `-- Truncate active entries prior to restoration to avoid double insertions\n`;
  sql += `TRUNCATE TABLE rooms CASCADE;\n`;
  sql += `TRUNCATE TABLE bookings CASCADE;\n\n`;

  if (rooms.length > 0) {
    sql += `-- Seed data for rooms\n`;
    sql += `INSERT INTO rooms (\n`;
    sql += `  id, floor, type, status, guest_name, check_in_time, check_out_time,\n`;
    sql += `  weekday_price, weekend_price, deposit, notes, reservations, is_flexible_price, flexible_price\n`;
    sql += `) VALUES\n`;
    
    const roomRows = rooms.map(r => {
      const vals = [
        r.id,
        r.floor,
        r.type,
        r.status,
        r.guestName || null,
        r.checkInTime || null,
        r.checkOutTime || null,
        r.weekdayPrice,
        r.weekendPrice,
        r.deposit || null,
        r.notes || null,
        r.reservations || [],
        r.isFlexiblePrice || false,
        r.flexiblePrice || null
      ];
      return `  (${vals.map(formatSqlValue).join(", ")})`;
    });
    sql += roomRows.join(",\n") + ";\n\n";
  }

  if (bookings.length > 0) {
    sql += `-- Seed data for bookings\n`;
    sql += `INSERT INTO bookings (\n`;
    sql += `  id, room_id, guest_name, check_in, check_out, total_price, status, created_at, notes, checkout_details\n`;
    sql += `) VALUES\n`;
    
    const bookingRows = bookings.map(b => {
      const vals = [
        b.id,
        b.roomId,
        b.guestName,
        b.checkIn,
        b.checkOut,
        b.totalPrice,
        b.status,
        b.createdAt,
        b.notes || null,
        b.checkoutDetails || null
      ];
      return `  (${vals.map(formatSqlValue).join(", ")})`;
    });
    sql += bookingRows.join(",\n") + ";\n\n";
  }

  return sql;
}

export function parseSqlValues(valuesStr: string): any[][] {
  const rows: any[][] = [];
  let i = 0;
  
  while (i < valuesStr.length) {
    // Find next '('
    while (i < valuesStr.length && valuesStr[i] !== '(') {
      i++;
    }
    if (i >= valuesStr.length) break;
    i++; // pass '('
    
    // Parse values in this row
    const row: any[] = [];
    while (i < valuesStr.length && valuesStr[i] !== ')') {
      // Trim spaces
      while (i < valuesStr.length && /\s/.test(valuesStr[i])) {
        i++;
      }
      if (valuesStr[i] === ')') break;
      
      // Parse a single value
      let val: any = null;
      if (valuesStr[i] === "'") {
        // Parse single-quoted string
        i++; // pass "'"
        let str = "";
        while (i < valuesStr.length) {
          if (valuesStr[i] === "'" && valuesStr[i + 1] === "'") {
            // Escaped quote ''
            str += "'";
            i += 2;
          } else if (valuesStr[i] === "'") {
            i++; // pass "'"
            break;
          } else {
            str += valuesStr[i];
            i++;
          }
        }
        val = str;
        
        // Skip casting like ::jsonb if any
        if (valuesStr.slice(i, i + 7) === "::jsonb") {
          i += 7;
        }
      } else if (valuesStr.slice(i, i + 4).toLowerCase() === "null") {
        val = null;
        i += 4;
      } else if (valuesStr.slice(i, i + 4).toLowerCase() === "true") {
        val = true;
        i += 4;
      } else if (valuesStr.slice(i, i + 5).toLowerCase() === "false") {
        val = false;
        i += 5;
      } else {
        // Parse number or unquoted word
        let numStr = "";
        while (i < valuesStr.length && /[-0-9.a-zA-Z_]/.test(valuesStr[i])) {
          numStr += valuesStr[i];
          i++;
        }
        if (/^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?$/.test(numStr)) {
          val = Number(numStr);
        } else {
          val = numStr;
        }
      }
      
      row.push(val);
      
      // Trim spaces
      while (i < valuesStr.length && /\s/.test(valuesStr[i])) {
        i++;
      }
      
      // Check if comma
      if (valuesStr[i] === ',') {
        i++;
      }
    }
    
    rows.push(row);
    if (i < valuesStr.length && valuesStr[i] === ')') {
      i++;
    }
  }
  
  return rows;
}

export function parseSqlBackup(sqlText: string): { rooms: Room[]; bookings: BookingRecord[] } {
  const rooms: Room[] = [];
  const bookings: BookingRecord[] = [];
  
  // Find all INSERT statements
  const insertRegex = /INSERT\s+INTO\s+([a-zA-Z0-9._"`[\]]+)\s*\(([^)]+)\)\s*VALUES\s*([\s\S]+?);/gi;
  let match;
  
  while ((match = insertRegex.exec(sqlText)) !== null) {
    const tableNameFull = match[1].toLowerCase().replace(/['"`[\]]/g, "");
    // Extract base table name if structured e.g., public.rooms -> rooms
    const parts = tableNameFull.split(".");
    const tableName = parts[parts.length - 1];
    
    const columns = match[2].split(",").map(c => c.trim().replace(/['"`]/g, ""));
    const valuesPart = match[3];
    
    const parsedRows = parseSqlValues(valuesPart);
    
    for (const rowVals of parsedRows) {
      if (rowVals.length === 0) continue;
      
      // Build object from columns and values
      const origObj: any = {};
      columns.forEach((col, idx) => {
        if (idx < rowVals.length) {
          origObj[col] = rowVals[idx];
        }
      });
      
      // Normalize object to camelCase
      const normalized = normalizeObject(origObj);
      
      if (tableName.includes("room")) {
        if (normalized.id) {
          rooms.push({
            id: String(normalized.id),
            floor: typeof normalized.floor === 'number' ? normalized.floor : 1,
            type: normalized.type || "G",
            status: normalized.status || "available",
            guestName: normalized.guestName || undefined,
            checkInTime: normalized.checkInTime || undefined,
            checkOutTime: normalized.checkOutTime || undefined,
            weekdayPrice: typeof normalized.weekdayPrice === 'number' ? normalized.weekdayPrice : 0,
            weekendPrice: typeof normalized.weekendPrice === 'number' ? normalized.weekendPrice : 0,
            deposit: typeof normalized.deposit === 'number' ? normalized.deposit : undefined,
            notes: normalized.notes || undefined,
            reservations: Array.isArray(normalized.reservations) ? normalized.reservations : [],
            isFlexiblePrice: !!normalized.isFlexiblePrice,
            flexiblePrice: typeof normalized.flexiblePrice === 'number' ? normalized.flexiblePrice : undefined,
          });
        }
      } else if (tableName.includes("booking")) {
        if (normalized.id && normalized.roomId) {
          bookings.push({
            id: String(normalized.id),
            roomId: String(normalized.roomId),
            guestName: normalized.guestName || "",
            checkIn: normalized.checkIn || "",
            checkOut: normalized.checkOut || "",
            totalPrice: typeof normalized.totalPrice === 'number' ? normalized.totalPrice : 0,
            status: normalized.status || "active",
            createdAt: normalized.createdAt || new Date().toISOString(),
            notes: normalized.notes || undefined,
            checkoutDetails: normalized.checkoutDetails || undefined,
          });
        }
      }
    }
  }
  
  return { rooms, bookings };
}
