/**
 * INFINITY HILL HOTEL MANAGER - GOOGLE APPS SCRIPT DATABASE ENGINE
 * This script runs server-side on Google Apps Script and acts as the backend for the
 * Infinity Hill Manager system. It manages persistent sheets, relational updates,
 * handles API webhooks, and serves the beautiful interactive management dashboard.
 */

// --- GLOBAL CONFIGURATION ---
var DATABASE_NAME = "Infinity Hill Hotel Database";

/**
 * Hàm mặc định để khởi tạo và phân quyền cho cơ sở dữ liệu trên Google Sheets.
 * Giúp khắc phục lỗi "myFunction đã bị xóa" khi nhấn nút "Chạy" mặc định trong Apps Script.
 */
function myFunction() {
  Logger.log("Bắt đầu khởi tạo cơ sở dữ liệu cho Infinity Hill Hotel...");
  var ss = getSpreadsheet();
  initializeSheets(ss);
  Logger.log("Khởi tạo thành công! Đường dẫn bảng tính Google Sheets: " + ss.getUrl());
}

/**
 * Serves the beautiful AlpineJS-powered hotel management portal.
 */
function doGet(e) {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Infinity Hill Manager')
    .setSandboxMode(HtmlService.SandboxMode.IFRAME)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Handles Web API POST requests (e.g. sync from the React applet or integrations).
 */
function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action;

    if (action === 'sync') {
      var result = syncDataFromWebApp(payload);
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "Đồng bộ thành công sang Google Sheets",
        details: result
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: "Yêu cầu không được hỗ trợ"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: "Lỗi xử lý API: " + err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Returns the active or newly created spreadsheet, storing its ID.
 */
function getSpreadsheet() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss) return ss;
  } catch (err) {
    // Silently proceed to standalone fallback
  }

  var props = PropertiesService.getUserProperties();
  var sheetId = props.getProperty('SPREADSHEET_ID');
  if (sheetId) {
    try {
      return SpreadsheetApp.openById(sheetId);
    } catch (e) {
      // ID was deleted or access revoked, clear it
      props.deleteProperty('SPREADSHEET_ID');
    }
  }

  // Search in Drive
  try {
    var files = DriveApp.getFilesByName(DATABASE_NAME);
    if (files.hasNext()) {
      var file = files.next();
      var ss = SpreadsheetApp.openById(file.getId());
      props.setProperty('SPREADSHEET_ID', ss.getId());
      return ss;
    }
  } catch (e) {
    // DriveApp might not be authorized yet
  }

  // Create a brand new spreadsheet
  var ss = SpreadsheetApp.create(DATABASE_NAME);
  props.setProperty('SPREADSHEET_ID', ss.getId());
  initializeSheets(ss);
  return ss;
}

/**
 * Safely opens or creates a sheet by name and sets up headers if newly created.
 */
function getOrCreateSheet(ss, sheetName, headers) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(headers);
    // Format Header Row
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#0f172a") // slate-900
               .setFontColor("#f8fafc")  // slate-50
               .setFontWeight("bold")
               .setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * Initializes all database tables/sheets with the necessary schemas and seeds default data.
 */
function initializeSheets(ss) {
  if (!ss) ss = getSpreadsheet();

  // 1. Rooms (Dynamic sync with 32 standard rooms matching the exact Web App database design)
  var roomHeaders = ["Room Number", "Floor", "Type", "Status", "Weekday Price", "Weekend Price", "Notes"];
  var roomSheet = getOrCreateSheet(ss, "Rooms", roomHeaders);
  if (roomSheet.getLastRow() <= 1) {
    var ROOM_DATA_CATALOG = {
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

    var defaultRooms = [];
    for (var floor = 1; floor <= 4; floor++) {
      for (var rIdx = 1; rIdx <= 8; rIdx++) {
        var rNum = floor + "0" + rIdx;
        var rInfo = ROOM_DATA_CATALOG[rNum] || { type: "G2", weekday: 1400000, weekend: 1600000 };
        defaultRooms.push([
          rNum,
          floor,
          rInfo.type,
          "AVAILABLE",
          rInfo.weekday,
          rInfo.weekend,
          "Phòng lầu " + floor + " loại " + rInfo.type
        ]);
      }
    }

    for (var i = 0; i < defaultRooms.length; i++) {
      roomSheet.appendRow(defaultRooms[i]);
    }
  }

  // 2. Bookings
  var bookingHeaders = [
    "Booking ID", "Room Number", "Guest Name", "Phone", "Check In", 
    "Check Out", "Status", "Notes", "Room Total", "Deposit", 
    "Minibar Total", "Compensation", "Payment Method", "Created At", "Group Code"
  ];
  getOrCreateSheet(ss, "Bookings", bookingHeaders);

  // 3. Services (Minibar catalog precisely matching the React front-end metadata)
  var serviceHeaders = ["Code", "Name", "Price", "Active"];
  var serviceSheet = getOrCreateSheet(ss, "Services", serviceHeaders);
  if (serviceSheet.getLastRow() <= 1) {
    var defaultServices = [
      ["mi_coc", "Mì cốc Hảo Hảo", 20000, "TRUE"],
      ["bim_bim", "Bim bim", 15000, "TRUE"],
      ["snack_khoai_tay", "Snack khoai tây", 50000, "TRUE"],
      ["mit_say", "Mít sấy", 70000, "TRUE"],
      ["bo_kho", "Bò khô", 100000, "TRUE"],
      ["nuoc_loc", "Nước lọc", 10000, "TRUE"],
      ["red_bull", "Bò húc (Red Bull)", 20000, "TRUE"],
      ["bia_halong", "Bia Hạ Long Bạc", 25000, "TRUE"],
      ["oreo", "Bánh Oreo", 20000, "TRUE"]
    ];
    for (var i = 0; i < defaultServices.length; i++) {
      serviceSheet.appendRow(defaultServices[i]);
    }
  }

  // 4. MinibarUsage
  var minibarHeaders = ["Booking ID", "Service Code", "Qty", "Price", "Timestamp"];
  getOrCreateSheet(ss, "MinibarUsage", minibarHeaders);

  // 5. Compensations
  var compHeaders = ["Booking ID", "Item Name", "Amount", "Timestamp"];
  getOrCreateSheet(ss, "Compensations", compHeaders);

  // 6. Settings
  var settingsHeaders = ["Key", "Value"];
  var settingsSheet = getOrCreateSheet(ss, "Settings", settingsHeaders);
  if (settingsSheet.getLastRow() <= 1) {
    var defaultSettings = [
      ["HotelName", "Infinity Hill Hotel"],
      ["HotelPhone", "0383696666"],
      ["HotelAddress", "Đảo Quan Lạn, Vân Đồn, Quảng Ninh"]
    ];
    for (var i = 0; i < defaultSettings.length; i++) {
      settingsSheet.appendRow(defaultSettings[i]);
    }
  }

  // Update Room Status Matrix (Hiện trạng đặt phòng)
  try {
    updateRoomStatusMatrix(ss);
  } catch(e) {
    Logger.log("Lỗi khởi tạo Hiện trạng đặt phòng: " + e.toString());
  }

  // Remove default sheet if exists
  var defaultSheet = ss.getSheetByName("Sheet1");
  if (defaultSheet) {
    try { ss.deleteSheet(defaultSheet); } catch(e) {}
  }
}

/**
 * Map sheet header titles to their 0-based column indices dynamically.
 */
function getSheetHeadersMap(sheet) {
  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) return {};
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var map = {};
  for (var i = 0; i < headers.length; i++) {
    map[headers[i].toString().trim()] = i;
  }
  return map;
}

/**
 * Main dashboard data loading function.
 */
function getDashboardData() {
  var ss = getSpreadsheet();
  // KHÔNG gọi initializeSheets() ở đây nữa để tránh quét lại cấu trúc phòng vô ích.

  var roomsSheet = ss.getSheetByName("Rooms");
  if (!roomsSheet) {
    initializeSheets(ss); // Chỉ kích hoạt phòng hờ nếu database hoàn toàn trống rỗng
    roomsSheet = ss.getSheetByName("Rooms");
  }
  
  var roomsData = roomsSheet.getDataRange().getValues();
  var roomsHeaders = getSheetHeadersMap(roomsSheet);

  var bookingsSheet = ss.getSheetByName("Bookings");
  var bookingsData = bookingsSheet.getDataRange().getValues();
  var bookingsHeaders = getSheetHeadersMap(bookingsSheet);

  var servicesSheet = ss.getSheetByName("Services");
  var servicesData = servicesSheet.getDataRange().getValues();
  var servicesHeaders = getSheetHeadersMap(servicesSheet);

  var settingsSheet = ss.getSheetByName("Settings");
  var settingsData = settingsSheet.getDataRange().getValues();

  // Parse Settings
  var settings = {};
  for (var i = 1; i < settingsData.length; i++) {
    settings[settingsData[i][0]] = settingsData[i][1];
  }

  // Parse Services
  var services = [];
  for (var i = 1; i < servicesData.length; i++) {
    if (servicesData[i][servicesHeaders["Active"]].toString().toUpperCase() === "TRUE") {
      services.push({
        code: servicesData[i][servicesHeaders["Code"]],
        name: servicesData[i][servicesHeaders["Name"]],
        price: Number(servicesData[i][servicesHeaders["Price"]])
      });
    }
  }

  // Helper arrays for fast lookup
  var activeBookingsMap = {};
  var nextBookingsMap = {};

  // Find latest active or upcoming bookings for each room
  for (var i = 1; i < bookingsData.length; i++) {
    var bId = bookingsData[i][bookingsHeaders["Booking ID"]];
    var rNum = bookingsData[i][bookingsHeaders["Room Number"]].toString();
    var bStatus = bookingsData[i][bookingsHeaders["Status"]];
    var gName = bookingsData[i][bookingsHeaders["Guest Name"]];
    var phone = bookingsData[i][bookingsHeaders["Phone"]];
    var checkIn = bookingsData[i][bookingsHeaders["Check In"]];
    var checkOut = bookingsData[i][bookingsHeaders["Check Out"]];
    var deposit = Number(bookingsData[i][bookingsHeaders["Deposit"]] || 0);
    var roomTotal = Number(bookingsData[i][bookingsHeaders["Room Total"]] || 0);

    var bookingObj = {
      id: bId,
      guestName: gName,
      phone: phone,
      checkIn: checkIn,
      checkOut: checkOut,
      deposit: deposit,
      roomTotal: roomTotal,
      status: bStatus
    };

    if (bStatus === "CHECKED_IN") {
      activeBookingsMap[rNum] = bookingObj;
    } else if (bStatus === "RESERVED") {
      // Keep earliest upcoming reservation
      if (!nextBookingsMap[rNum] || new Date(checkIn) < new Date(nextBookingsMap[rNum].checkIn)) {
        nextBookingsMap[rNum] = bookingObj;
      }
    }
  }

  // Parse Rooms and assign status / bookings
  var rooms = [];
  var availableCount = 0;
  var occupiedCount = 0;
  var reservedCount = 0;
  var maintenanceCount = 0;

  for (var i = 1; i < roomsData.length; i++) {
    var rNum = roomsData[i][roomsHeaders["Room Number"]].toString();
    var floor = Number(roomsData[i][roomsHeaders["Floor"]]);
    var type = roomsData[i][roomsHeaders["Type"]];
    var sheetStatus = roomsData[i][roomsHeaders["Status"]];
    var weekdayPrice = Number(roomsData[i][roomsHeaders["Weekday Price"]]);
    var weekendPrice = Number(roomsData[i][roomsHeaders["Weekend Price"]]);
    var notes = roomsData[i][roomsHeaders["Notes"]];

    var activeBooking = activeBookingsMap[rNum] || null;
    var nextBooking = nextBookingsMap[rNum] || null;

    // Determine room status dynamically based on current live bookings
    var status = "AVAILABLE";
    if (sheetStatus === "MAINTENANCE") {
      status = "MAINTENANCE";
      maintenanceCount++;
    } else if (activeBooking) {
      status = "OCCUPIED";
      occupiedCount++;
    } else if (nextBooking) {
      var checkInDate = new Date(nextBooking.checkIn);
      var now = new Date();
      var checkInDay = new Date(checkInDate.getFullYear(), checkInDate.getMonth(), checkInDate.getDate());
      var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      if (checkInDay <= today) {
        status = "RESERVED";
        reservedCount++;
      } else {
        status = "AVAILABLE";
        availableCount++;
      }
    } else {
      availableCount++;
    }

    rooms.push({
      roomNumber: rNum,
      floor: floor,
      roomType: type,
      status: status,
      weekdayPrice: weekdayPrice,
      weekendPrice: weekendPrice,
      notes: notes,
      activeBooking: activeBooking,
      nextBooking: nextBooking
    });
  }

  var totalRooms = rooms.length;
  var occupancy = totalRooms > 0 ? Math.round((occupiedCount / totalRooms) * 100) : 0;

  return {
    rooms: rooms,
    services: services,
    metrics: {
      available: availableCount,
      occupied: occupiedCount,
      reserved: reservedCount,
      maintenance: maintenanceCount,
      occupancy: occupancy
    },
    settings: settings
  };
}

/**
 * Return the URL of the active Spreadsheet to open directly.
 */
function openDatabase() {
  return getSpreadsheet().getUrl();
}

/**
 * Fetch highly detailed booking payload including items from minibar and compensation lists.
 */
function getBookingDetail(bookingId) {
  var ss = getSpreadsheet();
  
  var bookingsSheet = ss.getSheetByName("Bookings");
  var bData = bookingsSheet.getDataRange().getValues();
  var bHeaders = getSheetHeadersMap(bookingsSheet);

  var bookingRow = -1;
  for (var i = 1; i < bData.length; i++) {
    if (bData[i][bHeaders["Booking ID"]] === bookingId) {
      bookingRow = i;
      break;
    }
  }

  if (bookingRow === -1) {
    throw new Error("Không tìm thấy lượt đặt phòng có mã: " + bookingId);
  }

  var row = bData[bookingRow];
  var booking = {
    id: row[bHeaders["Booking ID"]],
    roomNumber: row[bHeaders["Room Number"]].toString(),
    guestName: row[bHeaders["Guest Name"]],
    phone: row[bHeaders["Phone"]],
    checkIn: row[bHeaders["Check In"]],
    checkOut: row[bHeaders["Check Out"]],
    status: row[bHeaders["Status"]],
    notes: row[bHeaders["Notes"]],
    roomTotal: Number(row[bHeaders["Room Total"]] || 0),
    deposit: Number(row[bHeaders["Deposit"]] || 0),
    minibarTotal: Number(row[bHeaders["Minibar Total"]] || 0),
    compensation: Number(row[bHeaders["Compensation"]] || 0),
    paymentMethod: row[bHeaders["Payment Method"]],
    groupCode: row[bHeaders["Group Code"]]
  };

  // Retrieve Minibar Items
  var minibarSheet = ss.getSheetByName("MinibarUsage");
  var mData = minibarSheet.getDataRange().getValues();
  var mHeaders = getSheetHeadersMap(minibarSheet);
  var minibarTotal = 0;
  var minibarItems = [];

  for (var i = 1; i < mData.length; i++) {
    if (mData[i][mHeaders["Booking ID"]] === bookingId) {
      var price = Number(mData[i][mHeaders["Price"]]);
      var qty = Number(mData[i][mHeaders["Qty"]]);
      var itemTotal = price * qty;
      minibarTotal += itemTotal;
      minibarItems.push({
        code: mData[i][mHeaders["Service Code"]],
        qty: qty,
        price: price,
        total: itemTotal,
        timestamp: mData[i][mHeaders["Timestamp"]]
      });
    }
  }

  // Retrieve Compensations
  var compSheet = ss.getSheetByName("Compensations");
  var cData = compSheet.getDataRange().getValues();
  var cHeaders = getSheetHeadersMap(compSheet);
  var compensationTotal = 0;
  var compItems = [];

  for (var i = 1; i < cData.length; i++) {
    if (cData[i][cHeaders["Booking ID"]] === bookingId) {
      var amount = Number(cData[i][cHeaders["Amount"]]);
      compensationTotal += amount;
      compItems.push({
        item: cData[i][cHeaders["Item Name"]],
        amount: amount,
        timestamp: cData[i][cHeaders["Timestamp"]]
      });
    }
  }

  // Ensure database fields match computed sums if out of sync
  var isOutOfSync = (booking.minibarTotal !== minibarTotal || booking.compensation !== compensationTotal);
  if (isOutOfSync) {
    bookingsSheet.getRange(bookingRow + 1, bHeaders["Minibar Total"] + 1).setValue(minibarTotal);
    bookingsSheet.getRange(bookingRow + 1, bHeaders["Compensation"] + 1).setValue(compensationTotal);
    booking.minibarTotal = minibarTotal;
    booking.compensation = compensationTotal;
  }

  var payable = booking.roomTotal + minibarTotal + compensationTotal - booking.deposit;

  return {
    booking: booking,
    minibarTotal: minibarTotal,
    compensation: compensationTotal,
    payable: payable,
    minibarItems: minibarItems,
    compItems: compItems
  };
}

/**
 * Calculates standard pricing dynamically by counting weekdays and weekend days (Friday & Saturday night)
 */
function calculateRoomPrice(roomNumber, checkInStr, checkOutStr) {
  var ss = getSpreadsheet();
  var roomsSheet = ss.getSheetByName("Rooms");
  var roomsData = roomsSheet.getDataRange().getValues();
  var rHeaders = getSheetHeadersMap(roomsSheet);

  var weekdayPrice = 500000;
  var weekendPrice = 700000;

  for (var i = 1; i < roomsData.length; i++) {
    if (roomsData[i][rHeaders["Room Number"]].toString() === roomNumber.toString()) {
      weekdayPrice = Number(roomsData[i][rHeaders["Weekday Price"]]);
      weekendPrice = Number(roomsData[i][rHeaders["Weekend Price"]]);
      break;
    }
  }

  var start = new Date(checkInStr);
  var end = new Date(checkOutStr);
  
  // Set times to midnight to calculate nights properly
  start.setHours(12, 0, 0, 0);
  end.setHours(12, 0, 0, 0);

  var timeDiff = end.getTime() - start.getTime();
  var nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
  if (nights <= 0) nights = 1;

  var total = 0;
  var tempDate = new Date(start.getTime());

  for (var i = 0; i < nights; i++) {
    var day = tempDate.getDay(); // 0: Sunday, 5: Friday, 6: Saturday
    // Typically, hotel weekend prices apply to Friday and Saturday nights
    if (day === 5 || day === 6) {
      total += weekendPrice;
    } else {
      total += weekdayPrice;
    }
    tempDate.setDate(tempDate.getDate() + 1);
  }

  return total;
}

/**
 * Checks if a room has any overlapping bookings.
 * Throws an Error if an overlap is found.
 */
function checkBookingOverlap(roomNumber, checkInStr, checkOutStr, excludeBookingId) {
  var ss = getSpreadsheet();
  initializeSheets(ss);
  var bookingsSheet = ss.getSheetByName("Bookings");
  var bData = bookingsSheet.getDataRange().getValues();
  var bHeaders = getSheetHeadersMap(bookingsSheet);

  var inTime = new Date(checkInStr).getTime();
  var outTime = new Date(checkOutStr).getTime();

  if (isNaN(inTime) || isNaN(outTime)) {
    throw new Error("Thời gian nhận hoặc trả phòng không hợp lệ.");
  }
  if (inTime >= outTime) {
    throw new Error("Thời gian nhận phòng phải nhỏ hơn thời gian trả phòng.");
  }

  for (var i = 1; i < bData.length; i++) {
    var bId = bData[i][bHeaders["Booking ID"]];
    if (!bId || (excludeBookingId && bId.toString() === excludeBookingId.toString())) continue;

    var rNum = bData[i][bHeaders["Room Number"]].toString();
    if (rNum !== roomNumber.toString()) continue;

    var status = bData[i][bHeaders["Status"]].toString().toUpperCase();
    
    // Chỉ kiểm tra xung đột với các đơn đang thực tế ở hoặc đang giữ chỗ tương lai
    if (status === "CHECKED_IN" || status === "RESERVED" || status === "ACTIVE") {
      var existingIn = new Date(bData[i][bHeaders["Check In"]]).getTime();
      var existingOut = new Date(bData[i][bHeaders["Check Out"]]).getTime();

      if (isNaN(existingIn) || isNaN(existingOut)) continue;

      // Thuật toán kiểm tra giao thoa khoảng thời gian
      if (inTime < existingOut && existingIn < outTime) {
        var guestName = bData[i][bHeaders["Guest Name"]] || "Chưa rõ tên";
        var statusLabel = (status === "CHECKED_IN") ? "đang lưu trú" : "đã đặt trước lịch";
        throw new Error(
          "Xung đột lịch! Phòng " + roomNumber + " đã có khách '" + guestName + "' " + statusLabel + 
          " từ " + formatDateTime(bData[i][bHeaders["Check In"]]) + " đến " + formatDateTime(bData[i][bHeaders["Check Out"]]) + "."
        );
      }
    }
  }
}

// Simple helper to format dates in Vietnamese format for the error message
function formatDateTime(d) {
  try {
    var date = new Date(d);
    var day = date.getDate();
    var month = date.getMonth() + 1;
    var year = date.getFullYear();
    var hours = date.getHours();
    var mins = date.getMinutes();
    return (hours < 10 ? "0" + hours : hours) + ":" + (mins < 10 ? "0" + mins : mins) + " " + 
           (day < 10 ? "0" + day : day) + "/" + (month < 10 ? "0" + month : month) + "/" + year;
  } catch (e) {
    return d.toString();
  }
}

/**
 * Saves a single room booking.
 */
function saveBooking(form) {
  var ss = getSpreadsheet();
  initializeSheets(ss);
  
  var bookingId = form.bookingId || ("BK-" + Date.now());

  // Check overlap first, excluding this bookingId
  checkBookingOverlap(form.roomNumber, form.checkIn, form.checkOut, bookingId);

  var bookingsSheet = ss.getSheetByName("Bookings");
  var bHeaders = getSheetHeadersMap(bookingsSheet);

  var checkInDate = new Date(form.checkIn);
  var checkOutDate = new Date(form.checkOut);

  // Calculate pricing
  var roomTotal = 0;
  if (form.pricingMode === "FLEX" || form.pricingMode === "FLEX_TOTAL" || form.pricingMode === "CUSTOM") {
    roomTotal = Number(form.flexPrice || 0);
  } else {
    roomTotal = calculateRoomPrice(form.roomNumber, form.checkIn, form.checkOut);
  }

  // Find if row exists to update instead of duplicate
  var bData = bookingsSheet.getDataRange().getValues();
  var existingRowIdx = -1;
  for (var i = 1; i < bData.length; i++) {
    var rowId = bData[i][bHeaders["Booking ID"]];
    if (rowId && rowId.toString() === bookingId.toString()) {
      existingRowIdx = i + 1;
      break;
    }
  }

  if (existingRowIdx !== -1) {
    // Update existing row
    if (bHeaders["Room Number"] !== undefined) bookingsSheet.getRange(existingRowIdx, bHeaders["Room Number"] + 1).setValue(form.roomNumber.toString());
    if (bHeaders["Guest Name"] !== undefined) bookingsSheet.getRange(existingRowIdx, bHeaders["Guest Name"] + 1).setValue(form.guestName);
    if (bHeaders["Phone"] !== undefined) bookingsSheet.getRange(existingRowIdx, bHeaders["Phone"] + 1).setValue(form.phone || "");
    if (bHeaders["Check In"] !== undefined) bookingsSheet.getRange(existingRowIdx, bHeaders["Check In"] + 1).setValue(form.checkIn);
    if (bHeaders["Check Out"] !== undefined) bookingsSheet.getRange(existingRowIdx, bHeaders["Check Out"] + 1).setValue(form.checkOut);
    if (bHeaders["Status"] !== undefined) bookingsSheet.getRange(existingRowIdx, bHeaders["Status"] + 1).setValue(form.mode);
    if (bHeaders["Notes"] !== undefined) bookingsSheet.getRange(existingRowIdx, bHeaders["Notes"] + 1).setValue(form.note || "");
    if (bHeaders["Room Total"] !== undefined) bookingsSheet.getRange(existingRowIdx, bHeaders["Room Total"] + 1).setValue(roomTotal);
    if (bHeaders["Deposit"] !== undefined) bookingsSheet.getRange(existingRowIdx, bHeaders["Deposit"] + 1).setValue(Number(form.deposit || 0));
  } else {
    // Create booking row using dense array
    var rowData = [];
    var lastCol = bookingsSheet.getLastColumn() || 15;
    for (var colIdx = 0; colIdx < lastCol; colIdx++) {
      rowData.push("");
    }
    if (bHeaders["Booking ID"] !== undefined) rowData[bHeaders["Booking ID"]] = bookingId;
    if (bHeaders["Room Number"] !== undefined) rowData[bHeaders["Room Number"]] = form.roomNumber.toString();
    if (bHeaders["Guest Name"] !== undefined) rowData[bHeaders["Guest Name"]] = form.guestName;
    if (bHeaders["Phone"] !== undefined) rowData[bHeaders["Phone"]] = form.phone || "";
    if (bHeaders["Check In"] !== undefined) rowData[bHeaders["Check In"]] = form.checkIn;
    if (bHeaders["Check Out"] !== undefined) rowData[bHeaders["Check Out"]] = form.checkOut;
    if (bHeaders["Status"] !== undefined) rowData[bHeaders["Status"]] = form.mode; // "CHECKED_IN" or "RESERVED"
    if (bHeaders["Notes"] !== undefined) rowData[bHeaders["Notes"]] = form.note || "";
    if (bHeaders["Room Total"] !== undefined) rowData[bHeaders["Room Total"]] = roomTotal;
    if (bHeaders["Deposit"] !== undefined) rowData[bHeaders["Deposit"]] = Number(form.deposit || 0);
    if (bHeaders["Minibar Total"] !== undefined) rowData[bHeaders["Minibar Total"]] = 0;
    if (bHeaders["Compensation"] !== undefined) rowData[bHeaders["Compensation"]] = 0;
    if (bHeaders["Payment Method"] !== undefined) rowData[bHeaders["Payment Method"]] = "";
    if (bHeaders["Created At"] !== undefined) rowData[bHeaders["Created At"]] = new Date().toISOString();
    if (bHeaders["Group Code"] !== undefined) rowData[bHeaders["Group Code"]] = "";

    bookingsSheet.appendRow(rowData);
  }

  // Update room status
  var now = new Date();
  var inDate = new Date(form.checkIn);
  var outDate = new Date(form.checkOut);
  if (form.mode === "CHECKED_IN" || (now >= inDate && now < outDate && form.mode !== "RESERVED")) {
    updateRoomStatus(form.roomNumber, "OCCUPIED");
  } else {
    updateRoomStatus(form.roomNumber, "RESERVED");
  }

  // Update Room Status Matrix
  try {
    updateRoomStatusMatrix(ss);
  } catch(e) {
    Logger.log("Lỗi cập nhật Hiện trạng đặt phòng: " + e.toString());
  }

  return {
    success: true,
    message: "Đã lưu lịch đặt phòng thành công cho khách " + form.guestName,
    bookingId: bookingId
  };
}

/**
 * Saves a grouped batch of bookings (group booking).
 */
function saveGroupBookings(form) {
  var ss = getSpreadsheet();
  initializeSheets(ss);

  // Check overlaps for all rooms first!
  for (var i = 0; i < form.rooms.length; i++) {
    var rObj = form.rooms[i];
    var rNum = (typeof rObj === "object" && rObj !== null) ? rObj.roomNumber.toString() : rObj.toString();
    checkBookingOverlap(rNum, form.checkIn, form.checkOut);
  }

  var bookingsSheet = ss.getSheetByName("Bookings");
  var bHeaders = getSheetHeadersMap(bookingsSheet);

  var groupCode = form.groupCode || ("GRP-" + Date.now());
  var bookingsCreated = [];

  // Calculate nights
  var nights = 1;
  try {
    var start = new Date(form.checkIn);
    var end = new Date(form.checkOut);
    start.setHours(12, 0, 0, 0);
    end.setHours(12, 0, 0, 0);
    var timeDiff = end.getTime() - start.getTime();
    nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
    if (nights <= 0) nights = 1;
  } catch(e) {}

  for (var i = 0; i < form.rooms.length; i++) {
    var rObj = form.rooms[i];
    var rNum = (typeof rObj === "object" && rObj !== null) ? rObj.roomNumber.toString() : rObj.toString();
    var bookingId = "BK-" + Date.now() + "-" + i;

    var roomTotal = 0;
    var customRoomPrice = (form.customPrices && form.customPrices[rNum]) ? Number(form.customPrices[rNum]) : 0;
    if (customRoomPrice > 0) {
      roomTotal = customRoomPrice * nights;
    } else if (form.pricingMode === "FLEX" || form.pricingMode === "FLEX_TOTAL") {
      // Split the flex price among all rooms in the group
      roomTotal = Number(form.flexPrice || 0) / (form.rooms.length || 1);
    } else {
      roomTotal = calculateRoomPrice(rNum, form.checkIn, form.checkOut);
    }

    // Allocate deposit to the first room of the group only, or split it? Let's assign deposit fully to the first, and 0 to others.
    var depositAllocation = (i === 0) ? Number(form.deposit || 0) : 0;

    // Create booking row using dense array
    var rowData = [];
    var lastCol = bookingsSheet.getLastColumn() || 15;
    for (var colIdx = 0; colIdx < lastCol; colIdx++) {
      rowData.push("");
    }
    if (bHeaders["Booking ID"] !== undefined) rowData[bHeaders["Booking ID"]] = bookingId;
    if (bHeaders["Room Number"] !== undefined) rowData[bHeaders["Room Number"]] = rNum;
    if (bHeaders["Guest Name"] !== undefined) rowData[bHeaders["Guest Name"]] = form.guestName + " (Đoàn)";
    if (bHeaders["Phone"] !== undefined) rowData[bHeaders["Phone"]] = form.phone || "";
    if (bHeaders["Check In"] !== undefined) rowData[bHeaders["Check In"]] = form.checkIn;
    if (bHeaders["Check Out"] !== undefined) rowData[bHeaders["Check Out"]] = form.checkOut;
    if (bHeaders["Status"] !== undefined) rowData[bHeaders["Status"]] = form.mode; // "CHECKED_IN" or "RESERVED"
    if (bHeaders["Notes"] !== undefined) rowData[bHeaders["Notes"]] = "Mã đoàn: " + groupCode;
    if (bHeaders["Room Total"] !== undefined) rowData[bHeaders["Room Total"]] = roomTotal;
    if (bHeaders["Deposit"] !== undefined) rowData[bHeaders["Deposit"]] = depositAllocation;
    if (bHeaders["Minibar Total"] !== undefined) rowData[bHeaders["Minibar Total"]] = 0;
    if (bHeaders["Compensation"] !== undefined) rowData[bHeaders["Compensation"]] = 0;
    if (bHeaders["Payment Method"] !== undefined) rowData[bHeaders["Payment Method"]] = "";
    if (bHeaders["Created At"] !== undefined) rowData[bHeaders["Created At"]] = new Date().toISOString();
    if (bHeaders["Group Code"] !== undefined) rowData[bHeaders["Group Code"]] = groupCode;

    bookingsSheet.appendRow(rowData);

    // Update individual room status
    updateRoomStatus(rNum, form.mode === "CHECKED_IN" ? "OCCUPIED" : "RESERVED");
    bookingsCreated.push(bookingId);
  }

  // Update Room Status Matrix
  try {
    updateRoomStatusMatrix(ss);
  } catch(e) {
    Logger.log("Lỗi cập nhật Hiện trạng đặt phòng: " + e.toString());
  }

  return {
    success: true,
    message: "Đã tạo đặt phòng cho đoàn thành công cho " + form.rooms.length + " phòng. Mã đoàn: " + groupCode,
    groupCode: groupCode
  };
}

/**
 * Helper: Updates room status directly in the Rooms sheet.
 */
function updateRoomStatus(roomNumber, newStatus) {
  var ss = getSpreadsheet();
  var roomsSheet = ss.getSheetByName("Rooms");
  var rData = roomsSheet.getDataRange().getValues();
  var rHeaders = getSheetHeadersMap(roomsSheet);

  for (var i = 1; i < rData.length; i++) {
    if (rData[i][rHeaders["Room Number"]].toString() === roomNumber.toString()) {
      roomsSheet.getRange(i + 1, rHeaders["Status"] + 1).setValue(newStatus);
      break;
    }
  }
  // KHÔNG gọi ép buộc tạo lại ma trận màu Hiện trạng đặt phòng ở đây nữa!
}

/**
 * Executes checking-in for an existing upcoming reserved booking.
 */
function checkInReservedBooking(payload) {
  var ss = getSpreadsheet();
  var bookingsSheet = ss.getSheetByName("Bookings");
  var bData = bookingsSheet.getDataRange().getValues();
  var bHeaders = getSheetHeadersMap(bookingsSheet);

  var bookingId = payload.bookingId;
  for (var i = 1; i < bData.length; i++) {
    if (bData[i][bHeaders["Booking ID"]] === bookingId) {
      bookingsSheet.getRange(i + 1, bHeaders["Status"] + 1).setValue("CHECKED_IN");
      var roomNumber = bData[i][bHeaders["Room Number"]].toString();
      updateRoomStatus(roomNumber, "OCCUPIED");

      // Update Room Status Matrix
      try {
        updateRoomStatusMatrix(ss);
      } catch(e) {
        Logger.log("Lỗi cập nhật Hiện trạng đặt phòng: " + e.toString());
      }

      return { success: true, message: "Nhận phòng thành công!" };
    }
  }
  throw new Error("Không tìm thấy mã đặt phòng để nhận phòng: " + bookingId);
}

/**
 * Cancels a reservation.
 */
function cancelReservation(payload) {
  var ss = getSpreadsheet();
  var bookingsSheet = ss.getSheetByName("Bookings");
  var bData = bookingsSheet.getDataRange().getValues();
  var bHeaders = getSheetHeadersMap(bookingsSheet);

  var bookingId = payload.bookingId;
  var reason = payload.reason || "Hủy theo yêu cầu khách";

  for (var i = 1; i < bData.length; i++) {
    if (bData[i][bHeaders["Booking ID"]] === bookingId) {
      bookingsSheet.getRange(i + 1, bHeaders["Status"] + 1).setValue("CANCELLED");
      var currentNotes = bData[i][bHeaders["Notes"]] || "";
      var updatedNotes = currentNotes + (currentNotes ? " | " : "") + "Lý do hủy: " + reason;
      bookingsSheet.getRange(i + 1, bHeaders["Notes"] + 1).setValue(updatedNotes);

      var roomNumber = bData[i][bHeaders["Room Number"]].toString();
      updateRoomStatus(roomNumber, "AVAILABLE");

      // Update Room Status Matrix
      try {
        updateRoomStatusMatrix(ss);
      } catch(e) {
        Logger.log("Lỗi cập nhật Hiện trạng đặt phòng: " + e.toString());
      }

      return { success: true, message: "Hủy đặt phòng thành công!" };
    }
  }
  throw new Error("Không tìm thấy mã đặt phòng để hủy: " + bookingId);
}

/**
 * Adds a minibar record and updates the Booking sheet total sum.
 */
function addMinibarUsage(payload) {
  var ss = getSpreadsheet();
  var servicesSheet = ss.getSheetByName("Services");
  var sData = servicesSheet.getDataRange().getValues();
  var sHeaders = getSheetHeadersMap(servicesSheet);

  var sCode = payload.serviceCode;
  var price = 0;
  for (var i = 1; i < sData.length; i++) {
    if (sData[i][sHeaders["Code"]] === sCode) {
      price = Number(sData[i][sHeaders["Price"]]);
      break;
    }
  }

  if (price === 0) price = 20000; // default backup fallback

  // Append minibar record using dense array
  var miniSheet = ss.getSheetByName("MinibarUsage");
  var mHeaders = getSheetHeadersMap(miniSheet);
  
  var rowData = [];
  var lastCol = miniSheet.getLastColumn() || 5;
  for (var colIdx = 0; colIdx < lastCol; colIdx++) {
    rowData.push("");
  }
  if (mHeaders["Booking ID"] !== undefined) rowData[mHeaders["Booking ID"]] = payload.bookingId;
  if (mHeaders["Service Code"] !== undefined) rowData[mHeaders["Service Code"]] = sCode;
  if (mHeaders["Qty"] !== undefined) rowData[mHeaders["Qty"]] = Number(payload.qty || 1);
  if (mHeaders["Price"] !== undefined) rowData[mHeaders["Price"]] = price;
  if (mHeaders["Timestamp"] !== undefined) rowData[mHeaders["Timestamp"]] = new Date().toISOString();

  miniSheet.appendRow(rowData);

  // Recalculate Booking minibar totals
  getBookingDetail(payload.bookingId); // Updates auto-sync totals in Sheet

  return { success: true, message: "Đã ghi nhận dịch vụ minibar!" };
}

/**
 * Adds a compensation surcharge / damage item.
 */
function addCompensation(payload) {
  var ss = getSpreadsheet();
  var compSheet = ss.getSheetByName("Compensations");
  var cHeaders = getSheetHeadersMap(compSheet);

  // Append compensation using dense array
  var rowData = [];
  var lastCol = compSheet.getLastColumn() || 4;
  for (var colIdx = 0; colIdx < lastCol; colIdx++) {
    rowData.push("");
  }
  if (cHeaders["Booking ID"] !== undefined) rowData[cHeaders["Booking ID"]] = payload.bookingId;
  if (cHeaders["Item Name"] !== undefined) rowData[cHeaders["Item Name"]] = payload.item;
  if (cHeaders["Amount"] !== undefined) rowData[cHeaders["Amount"]] = Number(payload.amount);
  if (cHeaders["Timestamp"] !== undefined) rowData[cHeaders["Timestamp"]] = new Date().toISOString();

  compSheet.appendRow(rowData);

  // Recalculate Booking totals
  getBookingDetail(payload.bookingId);

  return { success: true, message: "Đã thêm phụ phí đền bù thành công!" };
}

/**
 * Transfers a guest to another available room.
 */
function transferBooking(payload) {
  var ss = getSpreadsheet();
  var bookingsSheet = ss.getSheetByName("Bookings");
  var bData = bookingsSheet.getDataRange().getValues();
  var bHeaders = getSheetHeadersMap(bookingsSheet);

  var bookingId = payload.bookingId;
  var targetRoom = payload.targetRoom.toString();

  var detail = getBookingDetail(bookingId);
  var booking = detail.booking;

  // Validate overlap on target room excluding this booking ID
  checkBookingOverlap(targetRoom, booking.checkIn, booking.checkOut, bookingId);

  for (var i = 1; i < bData.length; i++) {
    if (bData[i][bHeaders["Booking ID"]] === bookingId) {
      var sourceRoom = bData[i][bHeaders["Room Number"]].toString();
      
      // Update room number on the booking row
      bookingsSheet.getRange(i + 1, bHeaders["Room Number"] + 1).setValue(targetRoom);
      
      // Update room statuses accordingly
      updateRoomStatus(sourceRoom, "AVAILABLE");
      updateRoomStatus(targetRoom, "OCCUPIED");

      // Update Room Status Matrix
      try {
        updateRoomStatusMatrix(ss);
      } catch(e) {
        Logger.log("Lỗi cập nhật Hiện trạng đặt phòng: " + e.toString());
      }

      return { success: true, message: "Chuyển từ phòng " + sourceRoom + " sang " + targetRoom + " thành công!" };
    }
  }
  throw new Error("Không tìm thấy mã đặt phòng để chuyển.");
}

/**
 * Performs full check-out and closes the booking.
 */
function checkoutBooking(payload) {
  var ss = getSpreadsheet();
  var bookingsSheet = ss.getSheetByName("Bookings");
  var bData = bookingsSheet.getDataRange().getValues();
  var bHeaders = getSheetHeadersMap(bookingsSheet);

  var bookingId = payload.bookingId;
  var paymentMethod = payload.paymentMethod || "Tiền mặt";

  for (var i = 1; i < bData.length; i++) {
    if (bData[i][bHeaders["Booking ID"]] === bookingId) {
      bookingsSheet.getRange(i + 1, bHeaders["Status"] + 1).setValue("COMPLETED");
      bookingsSheet.getRange(i + 1, bHeaders["Payment Method"] + 1).setValue(paymentMethod);
      
      var roomNumber = bData[i][bHeaders["Room Number"]].toString();
      updateRoomStatus(roomNumber, "AVAILABLE");

      // Update Room Status Matrix
      try {
        updateRoomStatusMatrix(ss);
      } catch(e) {
        Logger.log("Lỗi cập nhật Hiện trạng đặt phòng: " + e.toString());
      }

      return { success: true, message: "Đã thanh toán & hoàn tất trả phòng " + roomNumber + "!" };
    }
  }
  throw new Error("Không tìm thấy lượt đặt phòng để thanh toán.");
}

/**
 * Puts a room into maintenance.
 */
function setMaintenance(payload) {
  var ss = getSpreadsheet();
  var roomsSheet = ss.getSheetByName("Rooms");
  var rData = roomsSheet.getDataRange().getValues();
  var rHeaders = getSheetHeadersMap(roomsSheet);

  var rNum = payload.roomNumber.toString();
  var isMaintenance = payload.maintenance;
  var note = payload.note || "";

  for (var i = 1; i < rData.length; i++) {
    if (rData[i][rHeaders["Room Number"]].toString() === rNum) {
      roomsSheet.getRange(i + 1, rHeaders["Status"] + 1).setValue(isMaintenance ? "MAINTENANCE" : "AVAILABLE");
      roomsSheet.getRange(i + 1, rHeaders["Notes"] + 1).setValue(note);

      // Update Room Status Matrix
      try {
        updateRoomStatusMatrix(ss);
      } catch(e) {
        Logger.log("Lỗi cập nhật Hiện trạng đặt phòng: " + e.toString());
      }

      return { success: true, message: "Cập nhật trạng thái bảo trì phòng " + rNum + " thành công!" };
    }
  }
  throw new Error("Không tìm thấy mã phòng.");
}

/**
 * Generates 14 timeline days starting from a certain date, including occupancy.
 */
function getTimelineData(startDateStr) {
  var start = startDateStr ? new Date(startDateStr) : new Date();
  var days = [];
  
  for (var i = 0; i < 14; i++) {
    var tempDate = new Date(start.getTime());
    tempDate.setDate(start.getDate() + i);
    var dateStr = tempDate.toISOString().split('T')[0];
    var day = tempDate.getDate();
    var month = tempDate.getMonth() + 1;
    days.push({
      date: dateStr,
      label: (day < 10 ? "0" + day : day) + "/" + (month < 10 ? "0" + month : month)
    });
  }

  var ss = getSpreadsheet();
  initializeSheets(ss);
  var bookingsSheet = ss.getSheetByName("Bookings");
  var bData = bookingsSheet.getDataRange().getValues();
  var bHeaders = getSheetHeadersMap(bookingsSheet);
  var bookings = [];

  for (var i = 1; i < bData.length; i++) {
    var bId = bData[i][bHeaders["Booking ID"]];
    if (!bId) continue;
    var rNum = bData[i][bHeaders["Room Number"]].toString();
    var gName = bData[i][bHeaders["Guest Name"]] || "Khách vãng lai";
    var checkIn = bData[i][bHeaders["Check In"]];
    var checkOut = bData[i][bHeaders["Check Out"]];
    var status = bData[i][bHeaders["Status"]];

    var statusUpper = status.toString().toUpperCase();
    if (statusUpper === "CHECKED_IN" || statusUpper === "RESERVED" || statusUpper === "ACTIVE") {
      bookings.push({
        id: bId,
        roomNumber: rNum,
        guestName: gName,
        checkIn: checkIn,
        checkOut: checkOut,
        status: statusUpper === "ACTIVE" ? "CHECKED_IN" : statusUpper
      });
    }
  }

  return { days: days, bookings: bookings };
}

/**
 * Returns historical or active guest bookings matching query.
 */
function getGuestBookings(query) {
  var ss = getSpreadsheet();
  var bookingsSheet = ss.getSheetByName("Bookings");
  var bData = bookingsSheet.getDataRange().getValues();
  var bHeaders = getSheetHeadersMap(bookingsSheet);

  var results = [];
  var filter = query ? query.toString().toLowerCase() : "";

  // Loop in reverse order to return latest bookings first
  for (var i = bData.length - 1; i >= 1; i--) {
    var bId = bData[i][bHeaders["Booking ID"]];
    var rNum = bData[i][bHeaders["Room Number"]].toString();
    var gName = bData[i][bHeaders["Guest Name"]] || "";
    var phone = bData[i][bHeaders["Phone"]] || "";
    var status = bData[i][bHeaders["Status"]];
    var groupCode = bData[i][bHeaders["Group Code"]] || "";
    var roomTotal = Number(bData[i][bHeaders["Room Total"]] || 0);
    var checkIn = bData[i][bHeaders["Check In"]];
    var checkOut = bData[i][bHeaders["Check Out"]];

    var match = !filter || 
                bId.toLowerCase().indexOf(filter) !== -1 ||
                rNum.toLowerCase().indexOf(filter) !== -1 ||
                gName.toLowerCase().indexOf(filter) !== -1 ||
                phone.toLowerCase().indexOf(filter) !== -1 ||
                groupCode.toLowerCase().indexOf(filter) !== -1;

    if (match) {
      results.push({
        id: bId,
        groupCode: groupCode,
        roomNumber: rNum,
        guestName: gName,
        phone: phone,
        checkIn: checkIn,
        checkOut: checkOut,
        roomTotal: roomTotal,
        status: status
      });
      if (results.length >= 100) break; // Limit to latest 100 records for performance
    }
  }
  return results;
}

/**
 * Upserts service catalogs.
 */
function saveServiceCatalogItem(form) {
  var ss = getSpreadsheet();
  var servicesSheet = ss.getSheetByName("Services");
  var sData = servicesSheet.getDataRange().getValues();
  var sHeaders = getSheetHeadersMap(servicesSheet);

  var sCode = form.code.toString().trim().toUpperCase();
  var foundRow = -1;

  for (var i = 1; i < sData.length; i++) {
    if (sData[i][sHeaders["Code"]].toString().trim().toUpperCase() === sCode) {
      foundRow = i;
      break;
    }
  }

  if (foundRow !== -1) {
    // Update existing row
    servicesSheet.getRange(foundRow + 1, sHeaders["Name"] + 1).setValue(form.name);
    servicesSheet.getRange(foundRow + 1, sHeaders["Price"] + 1).setValue(Number(form.price));
    servicesSheet.getRange(foundRow + 1, sHeaders["Active"] + 1).setValue(form.active ? "TRUE" : "FALSE");
  } else {
    // Create new service row
    var rowData = [];
    rowData[sHeaders["Code"]] = sCode;
    rowData[sHeaders["Name"]] = form.name;
    rowData[sHeaders["Price"]] = Number(form.price);
    rowData[sHeaders["Active"]] = "TRUE";
    servicesSheet.appendRow(rowData);
  }

  return { success: true, message: "Đã lưu sản phẩm/dịch vụ " + form.name + " thành công!" };
}

/**
 * Forces default catalog reload.
 */
function syncDefaultMinibarPrices() {
  var ss = getSpreadsheet();
  var servicesSheet = ss.getSheetByName("Services");
  servicesSheet.clearContents();
  
  var serviceHeaders = ["Code", "Name", "Price", "Active"];
  servicesSheet.appendRow(serviceHeaders);
  
  var headerRange = servicesSheet.getRange(1, 1, 1, serviceHeaders.length);
  headerRange.setBackground("#0f172a").setFontColor("#f8fafc").setFontWeight("bold").setHorizontalAlignment("center");

  var defaultServices = [
    ["BIA_HALONG", "Bia Hạ Long Bạc", 25000, "TRUE"],
    ["MI_COC", "Mì cốc Hảo Hảo", 20000, "TRUE"],
    ["NUOC_SUOI", "Nước suối Lavie 500ml", 15000, "TRUE"],
    ["COCA_COLA", "Coca Cola lon", 20000, "TRUE"],
    ["SAY_KHO", "Khăn ướt/Đồ khô ăn vặt", 10000, "TRUE"],
    ["GIAT_LA", "Dịch vụ giặt là (kg)", 35000, "TRUE"],
    ["THUE_XE_MAY", "Thuê xe máy (ngày)", 15000, "TRUE"]
  ];

  for (var i = 0; i < defaultServices.length; i++) {
    servicesSheet.appendRow(defaultServices[i]);
  }

  return { success: true, message: "Đã đồng bộ & tải lại danh mục vật tư chuẩn." };
}

/**
 * Extracts comprehensive revenues and filters completed checkout bookings.
 */
function getReportData(dateFromStr, dateToStr) {
  var ss = getSpreadsheet();
  var bookingsSheet = ss.getSheetByName("Bookings");
  var bData = bookingsSheet.getDataRange().getValues();
  var bHeaders = getSheetHeadersMap(bookingsSheet);

  var rows = [];
  var totalRoom = 0;
  var totalMinibar = 0;
  var totalComp = 0;
  var totalDeposit = 0;
  var totalPayable = 0;

  var filterStart = dateFromStr ? new Date(dateFromStr) : null;
  var filterEnd = dateToStr ? new Date(dateToStr) : null;

  if (filterStart) filterStart.setHours(0,0,0,0);
  if (filterEnd) filterEnd.setHours(23,59,59,999);

  for (var i = 1; i < bData.length; i++) {
    var status = bData[i][bHeaders["Status"]];
    if (status !== "COMPLETED") continue;

    // We filter by Check Out date
    var checkOutVal = bData[i][bHeaders["Check Out"]];
    var checkOutDate = new Date(checkOutVal);

    if (filterStart && checkOutDate < filterStart) continue;
    if (filterEnd && checkOutDate > filterEnd) continue;

    var rTotal = Number(bData[i][bHeaders["Room Total"]] || 0);
    var mTotal = Number(bData[i][bHeaders["Minibar Total"]] || 0);
    var comp = Number(bData[i][bHeaders["Compensation"]] || 0);
    var dep = Number(bData[i][bHeaders["Deposit"]] || 0);
    var payable = rTotal + mTotal + comp - dep;

    totalRoom += rTotal;
    totalMinibar += mTotal;
    totalComp += comp;
    totalDeposit += dep;
    totalPayable += payable;

    rows.push({
      id: bData[i][bHeaders["Booking ID"]],
      groupCode: bData[i][bHeaders["Group Code"]] || "",
      roomNumber: bData[i][bHeaders["Room Number"]].toString(),
      guestName: bData[i][bHeaders["Guest Name"]],
      checkIn: bData[i][bHeaders["Check In"]],
      checkOut: checkOutVal,
      roomTotal: rTotal,
      minibarTotal: mTotal,
      compensation: comp,
      paymentMethod: bData[i][bHeaders["Payment Method"]] || "Tiền mặt"
    });
  }

  return {
    rows: rows,
    totals: {
      room: totalRoom,
      minibar: totalMinibar,
      compensation: totalComp,
      deposit: totalDeposit,
      payable: totalPayable
    }
  };
}

/**
 * Updates application general configurations.
 */
function updateAppSettings(form) {
  var ss = getSpreadsheet();
  var settingsSheet = ss.getSheetByName("Settings");
  var sData = settingsSheet.getDataRange().getValues();

  var mapKeys = {
    "HotelName": form.HotelName,
    "HotelPhone": form.HotelPhone,
    "HotelAddress": form.HotelAddress
  };

  for (var i = 1; i < sData.length; i++) {
    var key = sData[i][0];
    if (mapKeys.hasOwnProperty(key)) {
      settingsSheet.getRange(i + 1, 2).setValue(mapKeys[key]);
    }
  }

  return { success: true, message: "Đã cập nhật cấu hình hệ thống thành công!" };
}

/**
 * Robust Sync function that merges and stores the state backup from the React frontend applet.
 */
function syncDataFromWebApp(payload) {
  var ss = getSpreadsheet();
  initializeSheets(ss);

  var roomsList = payload.rooms || [];
  var bookingsList = payload.bookings || [];

  // 1. Sync Rooms
  var roomsSheet = ss.getSheetByName("Rooms");
  var rData = roomsSheet.getDataRange().getValues();
  var rHeaders = getSheetHeadersMap(roomsSheet);
  var existingRooms = {};

  // Safeguard headers
  if (rHeaders["Room Number"] === undefined) {
    var roomHeaders = ["Room Number", "Floor", "Type", "Status", "Weekday Price", "Weekend Price", "Notes"];
    roomsSheet.getRange(1, 1, 1, roomHeaders.length).setValues([roomHeaders]);
    rHeaders = getSheetHeadersMap(roomsSheet);
  }

  for (var i = 1; i < rData.length; i++) {
    var rNumVal = rData[i][rHeaders["Room Number"]];
    if (rNumVal === undefined || rNumVal === null) continue;
    var rNum = rNumVal.toString().trim();
    if (!rNum) continue;
    existingRooms[rNum] = i + 1; // row index
  }

  for (var i = 0; i < roomsList.length; i++) {
    var room = roomsList[i];
    if (!room || room.id === undefined || room.id === null) continue;
    var rNum = room.id.toString();
    var statusStr = (room.status || "available").toString().toUpperCase();
    if (statusStr === "ACTIVE") statusStr = "OCCUPIED"; // Map correctly

    if (existingRooms[rNum]) {
      // Update room details
      var rowIdx = existingRooms[rNum];
      if (rHeaders["Floor"] !== undefined) roomsSheet.getRange(rowIdx, rHeaders["Floor"] + 1).setValue(room.floor);
      if (rHeaders["Type"] !== undefined) roomsSheet.getRange(rowIdx, rHeaders["Type"] + 1).setValue(room.type);
      if (rHeaders["Status"] !== undefined) roomsSheet.getRange(rowIdx, rHeaders["Status"] + 1).setValue(statusStr);
      if (rHeaders["Notes"] !== undefined) roomsSheet.getRange(rowIdx, rHeaders["Notes"] + 1).setValue(room.notes || "");
      if (rHeaders["Weekday Price"] !== undefined) roomsSheet.getRange(rowIdx, rHeaders["Weekday Price"] + 1).setValue(room.weekdayPrice || (room.type.includes("VIP") ? 1700000 : 1400000));
      if (rHeaders["Weekend Price"] !== undefined) roomsSheet.getRange(rowIdx, rHeaders["Weekend Price"] + 1).setValue(room.weekendPrice || (room.type.includes("VIP") ? 1900000 : 1600000));
    } else {
      // Append new room using dense array
      var rowData = [];
      var lastCol = roomsSheet.getLastColumn() || 7;
      for (var colIdx = 0; colIdx < lastCol; colIdx++) {
        rowData.push("");
      }
      if (rHeaders["Room Number"] !== undefined) rowData[rHeaders["Room Number"]] = rNum;
      if (rHeaders["Floor"] !== undefined) rowData[rHeaders["Floor"]] = room.floor;
      if (rHeaders["Type"] !== undefined) rowData[rHeaders["Type"]] = room.type;
      if (rHeaders["Status"] !== undefined) rowData[rHeaders["Status"]] = statusStr;
      if (rHeaders["Weekday Price"] !== undefined) rowData[rHeaders["Weekday Price"]] = room.weekdayPrice || (room.type.includes("VIP") ? 1700000 : 1400000);
      if (rHeaders["Weekend Price"] !== undefined) rowData[rHeaders["Weekend Price"]] = room.weekendPrice || (room.type.includes("VIP") ? 1900000 : 1600000);
      if (rHeaders["Notes"] !== undefined) rowData[rHeaders["Notes"]] = room.notes || "";
      roomsSheet.appendRow(rowData);
    }
  }

  // 2. Sync Bookings
  var bookingsSheet = ss.getSheetByName("Bookings");
  var bData = bookingsSheet.getDataRange().getValues();
  var bHeaders = getSheetHeadersMap(bookingsSheet);

  // Safeguard headers
  if (bHeaders["Booking ID"] === undefined) {
    var bookingHeaders = [
      "Booking ID", "Room Number", "Guest Name", "Phone", "Check In", 
      "Check Out", "Status", "Notes", "Room Total", "Deposit", 
      "Minibar Total", "Compensation", "Payment Method", "Created At", "Group Code"
    ];
    bookingsSheet.getRange(1, 1, 1, bookingHeaders.length).setValues([bookingHeaders]);
    bHeaders = getSheetHeadersMap(bookingsSheet);
  }

  // Find and delete stale temporary bookings (live checked-in or reserved that no longer exist)
  var incomingIds = {};
  for (var k = 0; k < bookingsList.length; k++) {
    if (bookingsList[k] && bookingsList[k].id) {
      incomingIds[bookingsList[k].id.toString()] = true;
    }
  }

  for (var rIdx = bData.length; rIdx >= 2; rIdx--) {
    var rowIdVal = bData[rIdx - 1][bHeaders["Booking ID"]];
    if (rowIdVal === undefined || rowIdVal === null) continue;
    var rowId = rowIdVal.toString().trim();
    if (rowId.indexOf("B_active_") === 0 || rowId.indexOf("R_res_") === 0) {
      if (!incomingIds[rowId]) {
        bookingsSheet.deleteRow(rIdx);
      }
    }
  }

  // Reload bData and rebuild fresh existingBookings map
  bData = bookingsSheet.getDataRange().getValues();
  var existingBookings = {};
  for (var i = 1; i < bData.length; i++) {
    var bIdVal = bData[i][bHeaders["Booking ID"]];
    if (bIdVal === undefined || bIdVal === null) continue;
    var bId = bIdVal.toString().trim();
    if (!bId) continue;
    existingBookings[bId] = i + 1; // row index
  }

  // Service price configuration dictionary
  var MINIBAR_PRICES = {
    "mi_coc": 20000,
    "bim_bim": 15000,
    "snack_khoai_tay": 50000,
    "mit_say": 70000,
    "bo_kho": 100000,
    "nuoc_loc": 10000,
    "red_bull": 20000,
    "bia_halong": 25000,
    "oreo": 20000
  };

  for (var i = 0; i < bookingsList.length; i++) {
    var booking = bookingsList[i];
    if (!booking || booking.id === undefined || booking.id === null) continue;
    var bId = booking.id.toString();
    var statusStr = (booking.status || "reserved").toString().toUpperCase();
    if (statusStr === "ACTIVE") statusStr = "CHECKED_IN";

    var checkInVal = booking.checkIn || "";
    var checkOutVal = booking.checkOut || "";
    var roomTotal = Number((booking.checkoutDetails && booking.checkoutDetails.roomPrice !== undefined) ? booking.checkoutDetails.roomPrice : (booking.totalPrice || 0));
    var deposit = Number((booking.checkoutDetails && booking.checkoutDetails.deposit !== undefined) ? booking.checkoutDetails.deposit : 0);
    var minibarTotal = 0;
    var compensation = Number((booking.checkoutDetails && booking.checkoutDetails.compensation !== undefined) ? booking.checkoutDetails.compensation : 0);

    // Compute minibar usage total from details (quantity multiplied by standard price)
    if (booking.checkoutDetails && booking.checkoutDetails.minibar) {
      for (var key in booking.checkoutDetails.minibar) {
        var qty = Number(booking.checkoutDetails.minibar[key] || 0);
        var normKey = key.toString().toLowerCase().trim();
        var itemPrice = MINIBAR_PRICES[normKey] || 0;
        minibarTotal += qty * itemPrice;
      }
    }

    var rIdStr = booking.roomId ? booking.roomId.toString() : "";

    if (existingBookings[bId]) {
      var rowIdx = existingBookings[bId];
      if (bHeaders["Room Number"] !== undefined) bookingsSheet.getRange(rowIdx, bHeaders["Room Number"] + 1).setValue(rIdStr);
      if (bHeaders["Guest Name"] !== undefined) bookingsSheet.getRange(rowIdx, bHeaders["Guest Name"] + 1).setValue(booking.guestName || "");
      if (bHeaders["Check In"] !== undefined) bookingsSheet.getRange(rowIdx, bHeaders["Check In"] + 1).setValue(checkInVal);
      if (bHeaders["Check Out"] !== undefined) bookingsSheet.getRange(rowIdx, bHeaders["Check Out"] + 1).setValue(checkOutVal);
      if (bHeaders["Status"] !== undefined) bookingsSheet.getRange(rowIdx, bHeaders["Status"] + 1).setValue(statusStr);
      if (bHeaders["Notes"] !== undefined) bookingsSheet.getRange(rowIdx, bHeaders["Notes"] + 1).setValue(booking.notes || "");
      if (bHeaders["Room Total"] !== undefined) bookingsSheet.getRange(rowIdx, bHeaders["Room Total"] + 1).setValue(roomTotal);
      if (bHeaders["Deposit"] !== undefined) bookingsSheet.getRange(rowIdx, bHeaders["Deposit"] + 1).setValue(deposit);
      if (bHeaders["Minibar Total"] !== undefined) bookingsSheet.getRange(rowIdx, bHeaders["Minibar Total"] + 1).setValue(minibarTotal);
      if (bHeaders["Compensation"] !== undefined) bookingsSheet.getRange(rowIdx, bHeaders["Compensation"] + 1).setValue(compensation);
    } else {
      // Append booking using dense array to prevent column shifting
      var rowData = [];
      var lastCol = bookingsSheet.getLastColumn() || 15;
      for (var colIdx = 0; colIdx < lastCol; colIdx++) {
        rowData.push("");
      }
      if (bHeaders["Booking ID"] !== undefined) rowData[bHeaders["Booking ID"]] = bId;
      if (bHeaders["Room Number"] !== undefined) rowData[bHeaders["Room Number"]] = rIdStr;
      if (bHeaders["Guest Name"] !== undefined) rowData[bHeaders["Guest Name"]] = booking.guestName || "";
      if (bHeaders["Phone"] !== undefined) rowData[bHeaders["Phone"]] = "";
      if (bHeaders["Check In"] !== undefined) rowData[bHeaders["Check In"]] = checkInVal;
      if (bHeaders["Check Out"] !== undefined) rowData[bHeaders["Check Out"]] = checkOutVal;
      if (bHeaders["Status"] !== undefined) rowData[bHeaders["Status"]] = statusStr;
      if (bHeaders["Notes"] !== undefined) rowData[bHeaders["Notes"]] = booking.notes || "";
      if (bHeaders["Room Total"] !== undefined) rowData[bHeaders["Room Total"]] = roomTotal;
      if (bHeaders["Deposit"] !== undefined) rowData[bHeaders["Deposit"]] = deposit;
      if (bHeaders["Minibar Total"] !== undefined) rowData[bHeaders["Minibar Total"]] = minibarTotal;
      if (bHeaders["Compensation"] !== undefined) rowData[bHeaders["Compensation"]] = compensation;
      if (bHeaders["Payment Method"] !== undefined) rowData[bHeaders["Payment Method"]] = "";
      if (bHeaders["Created At"] !== undefined) rowData[bHeaders["Created At"]] = booking.createdAt || new Date().toISOString();
      if (bHeaders["Group Code"] !== undefined) rowData[bHeaders["Group Code"]] = "";
      bookingsSheet.appendRow(rowData);
    }
  }

  // Update Room Status Matrix (Hiện trạng đặt phòng)
  try {
    updateRoomStatusMatrix(ss);
  } catch(e) {
    Logger.log("Lỗi cập nhật Hiện trạng đặt phòng: " + e.toString());
  }

  return {
    roomsProcessed: roomsList.length,
    bookingsProcessed: bookingsList.length
  };
}

/**
 * Creates or updates the "Hiện trạng đặt phòng" visual occupancy matrix sheet.
 * Includes formatting, styling, and status labels corresponding to the web app's design.
 */
function updateRoomStatusMatrix(ss) {
  if (!ss) ss = getSpreadsheet();

  var now = new Date();
  var year = now.getFullYear();
  var month = now.getMonth(); // 0-based
  var monthStr = ("0" + (month + 1)).slice(-2);
  var sheetName = "Hiện trạng đặt phòng";

  // Get or create sheet
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  } else {
    sheet.clear(); // Clear old content and styling
  }

  // Generate headers for all days of the current month
  var daysInMonth = new Date(year, month + 1, 0).getDate();
  var headers = ["Số phòng", "Loại phòng"];
  var dates = [];
  for (var d = 1; d <= daysInMonth; d++) {
    var dStr = ("0" + d).slice(-2);
    headers.push(dStr + "/" + monthStr);
    dates.push(new Date(year, month, d));
  }

  // Write headers
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(2);

  // Style headers: dark slate color scheme
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground("#0f172a") // slate-900
             .setFontColor("#f8fafc")  // slate-50
             .setFontWeight("bold")
             .setHorizontalAlignment("center")
             .setVerticalAlignment("middle");
  sheet.setRowHeight(1, 28);

  // Set column widths in bulk
  sheet.setColumnWidth(1, 85);  // Room number
  sheet.setColumnWidth(2, 95);  // Room type
  if (headers.length > 2) {
    sheet.setColumnWidths(3, headers.length - 2, 110);
  }

  // Load rooms data
  var roomsSheet = ss.getSheetByName("Rooms");
  if (!roomsSheet) return;
  var roomsData = roomsSheet.getDataRange().getValues();
  var rHeaders = getSheetHeadersMap(roomsSheet);

  var rooms = [];
  for (var i = 1; i < roomsData.length; i++) {
    var rNum = roomsData[i][rHeaders["Room Number"]];
    var rType = roomsData[i][rHeaders["Type"]];
    var rStatus = roomsData[i][rHeaders["Status"]];
    if (rNum) {
      rooms.push({
        id: rNum.toString(),
        type: rType ? rType.toString() : "G2",
        status: rStatus ? rStatus.toString().toUpperCase() : "AVAILABLE"
      });
    }
  }

  // Sort rooms numerically/alphabetically
  rooms.sort(function(a, b) {
    return a.id.localeCompare(b.id, undefined, {numeric: true, sensitivity: 'base'});
  });

  // Load bookings
  var bookingsSheet = ss.getSheetByName("Bookings");
  var bookings = [];
  if (bookingsSheet) {
    var bookingsData = bookingsSheet.getDataRange().getValues();
    var bHeaders = getSheetHeadersMap(bookingsSheet);
    for (var i = 1; i < bookingsData.length; i++) {
      var bId = bookingsData[i][bHeaders["Booking ID"]];
      var rNum = bookingsData[i][bHeaders["Room Number"]];
      var gName = bookingsData[i][bHeaders["Guest Name"]] || "Khách";
      var checkIn = bookingsData[i][bHeaders["Check In"]];
      var checkOut = bookingsData[i][bHeaders["Check Out"]];
      var bStatus = bookingsData[i][bHeaders["Status"]];

      if (bId && rNum && checkIn && checkOut && bStatus !== "CANCELLED") {
        bookings.push({
          id: bId.toString(),
          roomId: rNum.toString(),
          guestName: gName.toString(),
          checkIn: checkIn,
          checkOut: checkOut,
          status: bStatus.toString().toUpperCase()
        });
      }
    }
  }

  // Helper parsing functions
  function startOfDay(dateVal) {
    var d = new Date(dateVal);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function parseDateString(val) {
    if (val instanceof Date) return val;
    var d = new Date(val);
    if (!isNaN(d.getTime())) return d;
    return new Date();
  }

  // Check occupancy status of a room on a given day
  function getCellStatus(room, checkDate) {
    var checkTime = startOfDay(checkDate).getTime();

    for (var i = 0; i < bookings.length; i++) {
      var b = bookings[i];
      if (b.roomId !== room.id) continue;

      var inDate = startOfDay(parseDateString(b.checkIn));
      var outDate = startOfDay(parseDateString(b.checkOut));

      if (checkTime >= inDate.getTime() && checkTime < outDate.getTime()) {
        return {
          status: b.status === "CHECKED_IN" || b.status === "COMPLETED" ? "occupied" : "reserved",
          guestName: b.guestName
        };
      }
    }

    if (room.status === "MAINTENANCE") {
      return { status: "maintenance" };
    }

    return { status: "available" };
  }

  // Populate matrix values and styles
  var values = [];
  var backgrounds = [];
  var fontColors = [];
  var alignments = [];

  for (var r = 0; r < rooms.length; r++) {
    var room = rooms[r];
    var rowValues = [room.id, room.type];
    var rowBg = ["#ffffff", "#f1f5f9"];
    var rowFont = ["#0f172a", "#334155"];
    var rowAlign = ["center", "center"];

    for (var d = 0; d < dates.length; d++) {
      var cellData = getCellStatus(room, dates[d]);

      var text = "Trống";
      var bg = "#10b981"; // emerald-500 (emerald green)
      var font = "#ffffff";

      if (cellData.status === "occupied") {
        text = "Đang ở (" + cellData.guestName + ")";
        bg = "#f43f5e"; // rose-500 (rose pink/red)
      } else if (cellData.status === "reserved") {
        text = "Đã đặt (" + cellData.guestName + ")";
        bg = "#fbbf24"; // amber-400 (warm gold/amber)
        font = "#0f172a"; // high contrast dark text
      } else if (cellData.status === "maintenance") {
        text = "Bảo trì";
        bg = "#334155"; // slate-700 (dark slate gray)
      }

      rowValues.push(text);
      rowBg.push(bg);
      rowFont.push(font);
      rowAlign.push("center");
    }

    values.push(rowValues);
    backgrounds.push(rowBg);
    fontColors.push(rowFont);
    alignments.push(rowAlign);
  }

  if (values.length > 0) {
    var range = sheet.getRange(2, 1, values.length, headers.length);
    range.setValues(values)
         .setBackgrounds(backgrounds)
         .setFontColors(fontColors)
         .setHorizontalAlignments(alignments)
         .setVerticalAlignment("middle")
         .setFontWeight("bold");

    // Set height for all data rows in bulk
    sheet.setRowHeights(2, values.length, 24);
  }
}

/**
 * LẤY TOÀN BỘ LỊCH SỬ ĐẶT PHÒNG CỦA MỘT PHÒNG ĐỂ HIỂN THỊ LÊN TIMELINE
 */
function getRoomBookingHistory(roomNumber) {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName("Bookings");
    if (!sheet) return [];
    
    var data = sheet.getDataRange().getValues();
    var headers = getSheetHeadersMap(sheet);
    var history = [];
    
    // Nhãn trạng thái hiển thị bằng tiếng Việt
    var statusLabels = {
      "RESERVED": "Đã đặt trước",
      "CHECKED_IN": "Đang lưu trú",
      "COMPLETED": "Đã trả phòng",
      "CANCELLED": "Đã hủy đơn"
    };

    for (var i = 1; i < data.length; i++) {
      var rNum = data[i][headers["Room Number"]];
      if (rNum && rNum.toString() === roomNumber.toString()) {
        var rawStatus = data[i][headers["Status"]].toString().toUpperCase();
        history.push({
          id: data[i][headers["Booking ID"]],
          guestName: data[i][headers["Guest Name"]],
          checkIn: data[i][headers["Check In"]],
          checkOut: data[i][headers["Check Out"]],
          status: rawStatus,
          statusLabel: statusLabels[rawStatus] || rawStatus
        });
      }
    }
    
    // Sắp xếp lịch sử theo thời gian Check-in mới nhất lên đầu
    history.sort(function(a, b) {
      return new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime();
    });
    
    return history;
  } catch (error) {
    Logger.log("Lỗi trong getRoomBookingHistory: " + error.toString());
    throw new Error(error.toString());
  }
}
