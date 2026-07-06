/**
 * INFINITY HILL HOTEL MANAGER - GOOGLE APPS SCRIPT DATABASE ENGINE
 * This script runs server-side on Google Apps Script and acts as the backend for the
 * Infinity Hill Manager system. It manages persistent sheets, relational updates,
 * handles API webhooks, and serves the beautiful interactive management dashboard.
 */

// --- GLOBAL CONFIGURATION ---
var DATABASE_NAME = "Infinity Hill Hotel Database";

// =========================
// PERFORMANCE HELPERS
// =========================

function ensureDatabaseReady_(ss) {
  ss = ss || getSpreadsheet();
  var props = PropertiesService.getScriptProperties();
  if (props.getProperty('DB_READY') === '1') return ss;
  initializeSheets(ss);
  props.setProperty('DB_READY', '1');
  return ss;
}

function getSheetData_(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error('Không tìm thấy sheet: ' + sheetName);

  var values = sheet.getDataRange().getValues();
  var headers = values.length ? values[0] : [];
  var headerMap = {};

  for (var i = 0; i < headers.length; i++) {
    headerMap[String(headers[i]).trim()] = i;
  }

  return {
    sheet: sheet,
    values: values,
    headers: headerMap,
    lastRow: sheet.getLastRow(),
    lastCol: sheet.getLastColumn() || headers.length || 1
  };
}

function createDenseRow_(length) {
  var row = [];
  for (var i = 0; i < length; i++) row.push('');
  return row;
}

function appendRowsBatch_(sheet, rows) {
  if (!rows || !rows.length) return;
  var startRow = sheet.getLastRow() + 1;
  sheet.getRange(startRow, 1, rows.length, rows[0].length).setValues(rows);
}

function findRowById_(values, headerMap, headerName, target) {
  var idx = headerMap[headerName];
  if (idx === undefined) return -1;

  for (var i = 1; i < values.length; i++) {
    var cell = values[i][idx];
    if (cell !== '' && cell !== null && cell !== undefined && String(cell) === String(target)) {
      return i + 1; // row number in sheet
    }
  }
  return -1;
}

function buildBookingRow_(headers, lastCol, data, currentRow) {
  var row = currentRow ? currentRow.slice() : createDenseRow_(lastCol);
  while (row.length < lastCol) row.push('');

  function setVal(key, value) {
    if (headers[key] !== undefined) row[headers[key]] = value;
  }

  setVal('Booking ID', data.bookingId || '');
  setVal('Room Number', data.roomNumber || '');
  setVal('Guest Name', data.guestName || '');
  setVal('Phone', data.phone || '');
  setVal('Check In', data.checkIn || '');
  setVal('Check Out', data.checkOut || '');
  setVal('Status', data.status || '');
  setVal('Notes', data.notes || '');
  setVal('Room Total', Number(data.roomTotal || 0));
  setVal('Deposit', Number(data.deposit || 0));
  setVal('Minibar Total', Number(data.minibarTotal || 0));
  setVal('Compensation', Number(data.compensation || 0));
  setVal('Payment Method', data.paymentMethod || '');
  setVal('Created At', data.createdAt || '');
  setVal('Group Code', data.groupCode || '');

  return row;
}

function updateBookingTotalsFast_(bookingId) {
  var ss = getSpreadsheet();
  var bookingData = getSheetData_(ss, 'Bookings');
  var minibarData = getSheetData_(ss, 'MinibarUsage');
  var compData = getSheetData_(ss, 'Compensations');

  var bookingRowNumber = findRowById_(bookingData.values, bookingData.headers, 'Booking ID', bookingId);
  if (bookingRowNumber === -1) {
    throw new Error('Không tìm thấy lượt đặt phòng có mã: ' + bookingId);
  }

  var minibarTotal = 0;
  var mBookingIdx = minibarData.headers['Booking ID'];
  var mQtyIdx = minibarData.headers['Qty'];
  var mPriceIdx = minibarData.headers['Price'];

  for (var i = 1; i < minibarData.values.length; i++) {
    if (String(minibarData.values[i][mBookingIdx]) === String(bookingId)) {
      minibarTotal += Number(minibarData.values[i][mQtyIdx] || 0) * Number(minibarData.values[i][mPriceIdx] || 0);
    }
  }

  var compensationTotal = 0;
  var cBookingIdx = compData.headers['Booking ID'];
  var cAmountIdx = compData.headers['Amount'];

  for (var j = 1; j < compData.values.length; j++) {
    if (String(compData.values[j][cBookingIdx]) === String(bookingId)) {
      compensationTotal += Number(compData.values[j][cAmountIdx] || 0);
    }
  }

  var bookingRow = bookingData.sheet.getRange(bookingRowNumber, 1, 1, bookingData.lastCol).getValues()[0];

  if (bookingData.headers['Minibar Total'] !== undefined) {
    bookingRow[bookingData.headers['Minibar Total']] = minibarTotal;
  }
  if (bookingData.headers['Compensation'] !== undefined) {
    bookingRow[bookingData.headers['Compensation']] = compensationTotal;
  }

  bookingData.sheet.getRange(bookingRowNumber, 1, 1, bookingData.lastCol).setValues([bookingRow]);

  return {
    bookingRow: bookingRowNumber,
    minibarTotal: minibarTotal,
    compensationTotal: compensationTotal
  };
}

function updateBookingRowById_(bookingId, mutatorFn) {
  var ss = getSpreadsheet();
  var bookingData = getSheetData_(ss, 'Bookings');
  var rowNumber = findRowById_(bookingData.values, bookingData.headers, 'Booking ID', bookingId);

  if (rowNumber === -1) {
    throw new Error('Không tìm thấy lượt đặt phòng có mã: ' + bookingId);
  }

  var row = bookingData.sheet.getRange(rowNumber, 1, 1, bookingData.lastCol).getValues()[0];
  mutatorFn(row, bookingData.headers, bookingData);
  bookingData.sheet.getRange(rowNumber, 1, 1, bookingData.lastCol).setValues([row]);

  return {
    sheet: bookingData.sheet,
    headers: bookingData.headers,
    rowNumber: rowNumber,
    row: row
  };
}

function updateRoomRowByNumber_(roomNumber, mutatorFn) {
  var ss = getSpreadsheet();
  var roomData = getSheetData_(ss, 'Rooms');
  var rowNumber = findRowById_(roomData.values, roomData.headers, 'Room Number', roomNumber);

  if (rowNumber === -1) {
    throw new Error('Không tìm thấy mã phòng: ' + roomNumber);
  }

  var row = roomData.sheet.getRange(rowNumber, 1, 1, roomData.lastCol).getValues()[0];
  mutatorFn(row, roomData.headers, roomData);
  roomData.sheet.getRange(rowNumber, 1, 1, roomData.lastCol).setValues([row]);

  return {
    sheet: roomData.sheet,
    headers: roomData.headers,
    rowNumber: rowNumber,
    row: row
  };
}

function batchUpdateRoomStatuses_(roomStatusMap) {
  var ss = getSpreadsheet();
  var roomData = getSheetData_(ss, 'Rooms');
  var roomIdx = roomData.headers['Room Number'];
  var statusIdx = roomData.headers['Status'];

  if (roomIdx === undefined || statusIdx === undefined) return;

  var updates = [];
  for (var i = 1; i < roomData.values.length; i++) {
    var row = roomData.values[i].slice();
    var roomNumber = String(row[roomIdx]);
    if (roomStatusMap.hasOwnProperty(roomNumber)) {
      while (row.length < roomData.lastCol) row.push('');
      row[statusIdx] = roomStatusMap[roomNumber];
      updates.push({ rowNumber: i + 1, row: row });
    }
  }

  for (var j = 0; j < updates.length; j++) {
    roomData.sheet.getRange(updates[j].rowNumber, 1, 1, roomData.lastCol).setValues([updates[j].row]);
  }
}

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
 * Serves the beautiful AlpineJS-powered hotel management portal and handles API requests.
 */
function doGet(e) {
  var action = e && e.parameter && e.parameter.action;
  
  if (action === "getBackupData") {
    try {
      var fileName = "hotel_backup_data.json";
      var files = DriveApp.getFilesByName(fileName);
      if (files.hasNext()) {
        var file = files.next();
        var content = file.getBlob().getDataAsString();
        return ContentService.createTextOutput(content)
          .setMimeType(ContentService.MimeType.JSON);
      } else {
        // Fallback: If no file exists, auto-generate from current Sheets!
        var generated = createDriveBackupFile();
        if (generated && generated.success) {
          return ContentService.createTextOutput(generated.content)
            .setMimeType(ContentService.MimeType.JSON);
        }
        return ContentService.createTextOutput(JSON.stringify({ 
          error: "Không tìm thấy file sao lưu hotel_backup_data.json trên Google Drive. Hãy nhấn 'Tạo sao lưu JSON' trong Cấu hình trước!" 
        })).setMimeType(ContentService.MimeType.JSON);
      }
    } catch (err) {
      return ContentService.createTextOutput(JSON.stringify({ 
        error: "Lỗi truy cập Drive: " + err.toString() 
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }

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
      
      // Auto-save a backup JSON file to Google Drive during sync
      try {
        var fileName = "hotel_backup_data.json";
        var files = DriveApp.getFilesByName(fileName);
        var fileContent = JSON.stringify({
          rooms: payload.rooms || [],
          bookings: payload.bookings || []
        }, null, 2);
        
        if (files.hasNext()) {
          var file = files.next();
          file.setContent(fileContent);
        } else {
          DriveApp.createFile(fileName, fileContent, MimeType.PLAIN_TEXT);
        }
      } catch (driveErr) {
        // Ignored if permissions are not fully authorized
      }

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "Đồng bộ thành công sang Google Sheets và tự động cập nhật bản sao lưu JSON trên Drive!",
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
 * Safe date parser that handles ISO strings, DD/MM/YYYY, YYYY-MM-DD, and Date objects.
 */
function parseSafeDate(val) {
  if (!val) return null;
  if (val instanceof Date) return val;
  var str = val.toString().trim();
  if (!str) return null;

  // Try parsing ISO/YMD format first: YYYY-MM-DD
  var ymdMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (ymdMatch) {
    var y = parseInt(ymdMatch[1], 10);
    var m = parseInt(ymdMatch[2], 10) - 1;
    var d = parseInt(ymdMatch[3], 10);
    var timeMatch = str.match(/\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);
    if (timeMatch) {
      var hh = parseInt(timeMatch[1], 10);
      var mm = parseInt(timeMatch[2], 10);
      var ss = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
      return new Date(y, m, d, hh, mm, ss);
    }
    return new Date(y, m, d);
  }

  // Try parsing DMY format: DD/MM/YYYY
  var dmyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (dmyMatch) {
    var d = parseInt(dmyMatch[1], 10);
    var m = parseInt(dmyMatch[2], 10) - 1;
    var y = parseInt(dmyMatch[3], 10);
    var timeMatch = str.match(/\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);
    if (timeMatch) {
      var hh = parseInt(timeMatch[1], 10);
      var mm = parseInt(timeMatch[2], 10);
      var ss = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
      return new Date(y, m, d, hh, mm, ss);
    }
    return new Date(y, m, d);
  }

  // Fallback to standard parser
  var d = new Date(str);
  if (!isNaN(d.getTime())) return d;
  return null;
}

/**
 * Main dashboard data loading function.
 */
function getDashboardData() {
  var ss = getSpreadsheet();
  var roomsSheet = ss.getSheetByName('Rooms');
  if (!roomsSheet) {
    ensureDatabaseReady_(ss);
  }

  var roomData = getSheetData_(ss, 'Rooms');
  var bookingData = getSheetData_(ss, 'Bookings');
  var serviceData = getSheetData_(ss, 'Services');
  var settingsData = getSheetData_(ss, 'Settings');

  var settings = {};
  for (var i = 1; i < settingsData.values.length; i++) {
    settings[settingsData.values[i][0]] = settingsData.values[i][1];
  }

  var services = [];
  for (var s = 1; s < serviceData.values.length; s++) {
    var activeVal = String(serviceData.values[s][serviceData.headers['Active']] || '').toUpperCase();
    if (activeVal === 'TRUE') {
      services.push({
        code: serviceData.values[s][serviceData.headers['Code']],
        name: serviceData.values[s][serviceData.headers['Name']],
        price: Number(serviceData.values[s][serviceData.headers['Price']] || 0)
      });
    }
  }

  var activeBookingsMap = {};
  var nextBookingsMap = {};
  var today = new Date();
  today = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  for (var b = 1; b < bookingData.values.length; b++) {
    var row = bookingData.values[b];
    var status = String(row[bookingData.headers['Status']] || '').toUpperCase();
    var roomNumber = String(row[bookingData.headers['Room Number']] || '');
    if (!roomNumber) continue;

    var bookingObj = {
      id: row[bookingData.headers['Booking ID']],
      guestName: row[bookingData.headers['Guest Name']],
      phone: row[bookingData.headers['Phone']],
      checkIn: row[bookingData.headers['Check In']],
      checkOut: row[bookingData.headers['Check Out']],
      deposit: Number(row[bookingData.headers['Deposit']] || 0),
      roomTotal: Number(row[bookingData.headers['Room Total']] || 0),
      status: status
    };

    if (status === 'CHECKED_IN') {
      activeBookingsMap[roomNumber] = bookingObj;
      continue;
    }

    if (status === 'RESERVED') {
      var checkInDate = parseSafeDate(bookingObj.checkIn);
      var checkOutDate = parseSafeDate(bookingObj.checkOut);
      if (!checkInDate || !checkOutDate) continue;

      var checkOutDay = new Date(checkOutDate.getFullYear(), checkOutDate.getMonth(), checkOutDate.getDate());
      if (checkOutDay < today) continue;

      if (!nextBookingsMap[roomNumber] || checkInDate < parseSafeDate(nextBookingsMap[roomNumber].checkIn)) {
        nextBookingsMap[roomNumber] = bookingObj;
      }
    }
  }

  var rooms = [];
  var availableCount = 0;
  var occupiedCount = 0;
  var reservedCount = 0;
  var maintenanceCount = 0;

  for (var r = 1; r < roomData.values.length; r++) {
    var roomRow = roomData.values[r];
    var roomNumber = String(roomRow[roomData.headers['Room Number']] || '');
    var sheetStatus = String(roomRow[roomData.headers['Status']] || 'AVAILABLE').toUpperCase();
    var activeBooking = activeBookingsMap[roomNumber] || null;
    var nextBooking = nextBookingsMap[roomNumber] || null;
    var status = 'AVAILABLE';

    if (sheetStatus === 'MAINTENANCE') {
      status = 'MAINTENANCE';
      maintenanceCount++;
    } else if (activeBooking) {
      status = 'OCCUPIED';
      occupiedCount++;
    } else if (nextBooking) {
      var checkInDate2 = parseSafeDate(nextBooking.checkIn);
      var checkOutDate2 = parseSafeDate(nextBooking.checkOut);

      if (checkInDate2 && checkOutDate2) {
        var checkInDay = new Date(checkInDate2.getFullYear(), checkInDate2.getMonth(), checkInDate2.getDate());
        var checkOutDay2 = new Date(checkOutDate2.getFullYear(), checkOutDate2.getMonth(), checkOutDate2.getDate());

        if (checkInDay <= today && today < checkOutDay2) {
          status = 'RESERVED';
          reservedCount++;
        } else {
          availableCount++;
        }
      } else {
        availableCount++;
      }
    } else {
      availableCount++;
    }

    rooms.push({
      roomNumber: roomNumber,
      floor: Number(roomRow[roomData.headers['Floor']] || 0),
      roomType: roomRow[roomData.headers['Type']],
      status: status,
      weekdayPrice: Number(roomRow[roomData.headers['Weekday Price']] || 0),
      weekendPrice: Number(roomRow[roomData.headers['Weekend Price']] || 0),
      notes: roomRow[roomData.headers['Notes']] || '',
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
  var bookingData = getSheetData_(ss, 'Bookings');
  var minibarData = getSheetData_(ss, 'MinibarUsage');
  var compData = getSheetData_(ss, 'Compensations');

  var bookingRowNumber = findRowById_(bookingData.values, bookingData.headers, 'Booking ID', bookingId);
  if (bookingRowNumber === -1) {
    throw new Error('Không tìm thấy lượt đặt phòng có mã: ' + bookingId);
  }

  var row = bookingData.sheet.getRange(bookingRowNumber, 1, 1, bookingData.lastCol).getValues()[0];
  var booking = {
    id: row[bookingData.headers['Booking ID']],
    roomNumber: String(row[bookingData.headers['Room Number']] || ''),
    guestName: row[bookingData.headers['Guest Name']],
    phone: row[bookingData.headers['Phone']],
    checkIn: row[bookingData.headers['Check In']],
    checkOut: row[bookingData.headers['Check Out']],
    status: row[bookingData.headers['Status']],
    notes: row[bookingData.headers['Notes']],
    roomTotal: Number(row[bookingData.headers['Room Total']] || 0),
    deposit: Number(row[bookingData.headers['Deposit']] || 0),
    minibarTotal: Number(row[bookingData.headers['Minibar Total']] || 0),
    compensation: Number(row[bookingData.headers['Compensation']] || 0),
    paymentMethod: row[bookingData.headers['Payment Method']],
    groupCode: row[bookingData.headers['Group Code']]
  };

  var minibarItems = [];
  var minibarTotal = 0;
  for (var i = 1; i < minibarData.values.length; i++) {
    if (String(minibarData.values[i][minibarData.headers['Booking ID']]) === String(bookingId)) {
      var price = Number(minibarData.values[i][minibarData.headers['Price']] || 0);
      var qty = Number(minibarData.values[i][minibarData.headers['Qty']] || 0);
      var itemTotal = price * qty;
      minibarTotal += itemTotal;
      minibarItems.push({
        code: minibarData.values[i][minibarData.headers['Service Code']],
        qty: qty,
        price: price,
        total: itemTotal,
        timestamp: minibarData.values[i][minibarData.headers['Timestamp']]
      });
    }
  }

  var compItems = [];
  var compensationTotal = 0;
  for (var j = 1; j < compData.values.length; j++) {
    if (String(compData.values[j][compData.headers['Booking ID']]) === String(bookingId)) {
      var amount = Number(compData.values[j][compData.headers['Amount']] || 0);
      compensationTotal += amount;
      compItems.push({
        item: compData.values[j][compData.headers['Item Name']],
        amount: amount,
        timestamp: compData.values[j][compData.headers['Timestamp']]
      });
    }
  }

  if (booking.minibarTotal !== minibarTotal || booking.compensation !== compensationTotal) {
    if (bookingData.headers['Minibar Total'] !== undefined) {
      row[bookingData.headers['Minibar Total']] = minibarTotal;
    }
    if (bookingData.headers['Compensation'] !== undefined) {
      row[bookingData.headers['Compensation']] = compensationTotal;
    }
    bookingData.sheet.getRange(bookingRowNumber, 1, 1, bookingData.lastCol).setValues([row]);
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
  var ss = ensureDatabaseReady_(getSpreadsheet());
  var bookingId = form.bookingId || ('BK-' + Date.now());

  checkBookingOverlap(form.roomNumber, form.checkIn, form.checkOut, bookingId);

  var bookingData = getSheetData_(ss, 'Bookings');

  var roomTotal = 0;
  if (form.pricingMode === 'FLEX' || form.pricingMode === 'FLEX_TOTAL' || form.pricingMode === 'CUSTOM') {
    roomTotal = Number(form.flexPrice || 0);
  } else {
    roomTotal = calculateRoomPrice(form.roomNumber, form.checkIn, form.checkOut);
  }

  var existingRowNumber = findRowById_(bookingData.values, bookingData.headers, 'Booking ID', bookingId);

  var payload = {
    bookingId: bookingId,
    roomNumber: String(form.roomNumber),
    guestName: form.guestName || '',
    phone: form.phone || '',
    checkIn: form.checkIn,
    checkOut: form.checkOut,
    status: form.mode,
    notes: form.note || '',
    roomTotal: roomTotal,
    deposit: Number(form.deposit || 0),
    minibarTotal: 0,
    compensation: 0,
    paymentMethod: '',
    createdAt: new Date().toISOString(),
    groupCode: ''
  };

  if (existingRowNumber !== -1) {
    var currentRow = bookingData.sheet.getRange(existingRowNumber, 1, 1, bookingData.lastCol).getValues()[0];

    payload.minibarTotal = currentRow[bookingData.headers['Minibar Total']] || 0;
    payload.compensation = currentRow[bookingData.headers['Compensation']] || 0;
    payload.paymentMethod = currentRow[bookingData.headers['Payment Method']] || '';
    payload.createdAt = currentRow[bookingData.headers['Created At']] || payload.createdAt;
    payload.groupCode = currentRow[bookingData.headers['Group Code']] || '';

    var updatedRow = buildBookingRow_(bookingData.headers, bookingData.lastCol, payload, currentRow);
    bookingData.sheet.getRange(existingRowNumber, 1, 1, bookingData.lastCol).setValues([updatedRow]);
  } else {
    var newRow = buildBookingRow_(bookingData.headers, bookingData.lastCol, payload);
    appendRowsBatch_(bookingData.sheet, [newRow]);
  }

  var now = new Date();
  var inDate = new Date(form.checkIn);
  var outDate = new Date(form.checkOut);

  if (form.mode === 'CHECKED_IN' || (now >= inDate && now < outDate && form.mode !== 'RESERVED')) {
    updateRoomStatus(form.roomNumber, 'OCCUPIED');
  } else {
    updateRoomStatus(form.roomNumber, 'RESERVED');
  }

  try {
    updateRoomStatusMatrix(ss);
  } catch (e) {
    Logger.log('Lỗi cập nhật Hiện trạng đặt phòng: ' + e.toString());
  }

  return {
    success: true,
    message: 'Đã lưu lịch đặt phòng thành công cho khách ' + form.guestName,
    bookingId: bookingId
  };
}

/**
 * Saves a grouped batch of bookings (group booking).
 */
function saveGroupBookings(form) {
  var ss = ensureDatabaseReady_(getSpreadsheet());

  for (var i = 0; i < form.rooms.length; i++) {
    var rObj = form.rooms[i];
    var rNum = (typeof rObj === 'object' && rObj !== null) ? String(rObj.roomNumber) : String(rObj);
    checkBookingOverlap(rNum, form.checkIn, form.checkOut);
  }

  var bookingData = getSheetData_(ss, 'Bookings');
  var groupCode = form.groupCode || ('GRP-' + Date.now());
  var bookingsCreated = [];
  var rowsToAppend = [];

  var nights = 1;
  try {
    var start = new Date(form.checkIn);
    var end = new Date(form.checkOut);
    start.setHours(12, 0, 0, 0);
    end.setHours(12, 0, 0, 0);
    var timeDiff = end.getTime() - start.getTime();
    nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
    if (nights <= 0) nights = 1;
  } catch (e) {}

  var roomStatusMap = {};
  var nowSeed = Date.now();

  for (var k = 0; k < form.rooms.length; k++) {
    var roomObj = form.rooms[k];
    var roomNumber = (typeof roomObj === 'object' && roomObj !== null) ? String(roomObj.roomNumber) : String(roomObj);
    var bookingId = 'BK-' + nowSeed + '-' + k;

    var customRoomPrice = (form.customPrices && form.customPrices[roomNumber]) ? Number(form.customPrices[roomNumber]) : 0;
    var roomTotal = 0;

    if (customRoomPrice > 0) {
      roomTotal = customRoomPrice * nights;
    } else if (form.pricingMode === 'FLEX' || form.pricingMode === 'FLEX_TOTAL') {
      roomTotal = Number(form.flexPrice || 0) / (form.rooms.length || 1);
    } else {
      roomTotal = calculateRoomPrice(roomNumber, form.checkIn, form.checkOut);
    }

    var depositAllocation = (k === 0) ? Number(form.deposit || 0) : 0;

    rowsToAppend.push(buildBookingRow_(bookingData.headers, bookingData.lastCol, {
      bookingId: bookingId,
      roomNumber: roomNumber,
      guestName: (form.guestName || '') + ' (Đoàn)',
      phone: form.phone || '',
      checkIn: form.checkIn,
      checkOut: form.checkOut,
      status: form.mode,
      notes: 'Mã đoàn: ' + groupCode,
      roomTotal: roomTotal,
      deposit: depositAllocation,
      minibarTotal: 0,
      compensation: 0,
      paymentMethod: '',
      createdAt: new Date().toISOString(),
      groupCode: groupCode
    }));

    roomStatusMap[roomNumber] = (form.mode === 'CHECKED_IN') ? 'OCCUPIED' : 'RESERVED';
    bookingsCreated.push(bookingId);
  }

  appendRowsBatch_(bookingData.sheet, rowsToAppend);
  batchUpdateRoomStatuses_(roomStatusMap);

  try {
    updateRoomStatusMatrix(ss);
  } catch (e) {
    Logger.log('Lỗi cập nhật Hiện trạng đặt phòng: ' + e.toString());
  }

  return {
    success: true,
    message: 'Đã tạo đặt phòng cho đoàn thành công cho ' + form.rooms.length + ' phòng. Mã đoàn: ' + groupCode,
    groupCode: groupCode,
    bookingIds: bookingsCreated
  };
}

/**
 * Helper: Updates room status directly in the Rooms sheet.
 */
function updateRoomStatus(roomNumber, newStatus) {
  var ss = getSpreadsheet();
  var roomData = getSheetData_(ss, 'Rooms');
  var rowNumber = findRowById_(roomData.values, roomData.headers, 'Room Number', roomNumber);

  if (rowNumber === -1) return;

  var row = roomData.sheet.getRange(rowNumber, 1, 1, roomData.lastCol).getValues()[0];
  row[roomData.headers['Status']] = newStatus;
  roomData.sheet.getRange(rowNumber, 1, 1, roomData.lastCol).setValues([row]);
}

/**
 * Executes checking-in for an existing upcoming reserved booking.
 */
function checkInReservedBooking(payload) {
  var ss = getSpreadsheet();
  var bookingId = payload.bookingId;
  var roomNumber = '';

  updateBookingRowById_(bookingId, function(row, headers) {
    row[headers['Status']] = 'CHECKED_IN';
    roomNumber = String(row[headers['Room Number']]);
  });

  updateRoomStatus(roomNumber, 'OCCUPIED');

  try {
    updateRoomStatusMatrix(ss);
  } catch (e) {
    Logger.log('Lỗi cập nhật Hiện trạng đặt phòng: ' + e.toString());
  }

  return { success: true, message: 'Nhận phòng thành công!' };
}

/**
 * Cancels a reservation.
 */
function cancelReservation(payload) {
  var ss = getSpreadsheet();
  var bookingId = payload.bookingId;
  var reason = payload.reason || 'Hủy theo yêu cầu khách';
  var roomNumber = '';

  updateBookingRowById_(bookingId, function(row, headers) {
    var currentNotes = row[headers['Notes']] || '';
    row[headers['Status']] = 'CANCELLED';
    row[headers['Notes']] = currentNotes + (currentNotes ? ' | ' : '') + 'Lý do hủy: ' + reason;
    roomNumber = String(row[headers['Room Number']]);
  });

  updateRoomStatus(roomNumber, 'AVAILABLE');

  try {
    updateRoomStatusMatrix(ss);
  } catch (e) {
    Logger.log('Lỗi cập nhật Hiện trạng đặt phòng: ' + e.toString());
  }

  return { success: true, message: 'Hủy đặt phòng thành công!' };
}

/**
 * Adds a minibar record and updates the Booking sheet total sum.
 */
function addMinibarUsage(payload) {
  var ss = getSpreadsheet();
  var serviceData = getSheetData_(ss, 'Services');
  var miniData = getSheetData_(ss, 'MinibarUsage');

  var sCode = payload.serviceCode;
  var price = 0;

  for (var i = 1; i < serviceData.values.length; i++) {
    if (serviceData.values[i][serviceData.headers['Code']] === sCode) {
      price = Number(serviceData.values[i][serviceData.headers['Price']]);
      break;
    }
  }

  if (price === 0) price = 20000;

  var row = createDenseRow_(miniData.lastCol);
  row[miniData.headers['Booking ID']] = payload.bookingId;
  row[miniData.headers['Service Code']] = sCode;
  row[miniData.headers['Qty']] = Number(payload.qty || 1);
  row[miniData.headers['Price']] = price;
  row[miniData.headers['Timestamp']] = new Date().toISOString();

  appendRowsBatch_(miniData.sheet, [row]);
  updateBookingTotalsFast_(payload.bookingId);

  return {
    success: true,
    message: 'Đã ghi nhận dịch vụ minibar!'
  };
}

/**
 * Adds a compensation surcharge / damage item.
 */
function addCompensation(payload) {
  var ss = getSpreadsheet();
  var compData = getSheetData_(ss, 'Compensations');

  var row = createDenseRow_(compData.lastCol);
  row[compData.headers['Booking ID']] = payload.bookingId;
  row[compData.headers['Item Name']] = payload.item;
  row[compData.headers['Amount']] = Number(payload.amount);
  row[compData.headers['Timestamp']] = new Date().toISOString();

  appendRowsBatch_(compData.sheet, [row]);
  updateBookingTotalsFast_(payload.bookingId);

  return {
    success: true,
    message: 'Đã thêm phụ phí đền bù thành công!'
  };
}

/**
 * Transfers a guest to another available room.
 */
function transferBooking(payload) {
  var ss = getSpreadsheet();
  var bookingId = payload.bookingId;
  var targetRoom = String(payload.targetRoom);
  var sourceRoom = '';
  var checkIn = '';
  var checkOut = '';

  var detail = getBookingDetail(bookingId);
  checkIn = detail.booking.checkIn;
  checkOut = detail.booking.checkOut;

  checkBookingOverlap(targetRoom, checkIn, checkOut, bookingId);

  updateBookingRowById_(bookingId, function(row, headers) {
    sourceRoom = String(row[headers['Room Number']]);
    row[headers['Room Number']] = targetRoom;
  });

  batchUpdateRoomStatuses_((function() {
    var map = {};
    map[sourceRoom] = 'AVAILABLE';
    map[targetRoom] = 'OCCUPIED';
    return map;
  })());

  try {
    updateRoomStatusMatrix(ss);
  } catch (e) {
    Logger.log('Lỗi cập nhật Hiện trạng đặt phòng: ' + e.toString());
  }

  return {
    success: true,
    message: 'Chuyển từ phòng ' + sourceRoom + ' sang ' + targetRoom + ' thành công!'
  };
}

/**
 * Performs full check-out and closes the booking.
 */
function checkoutBooking(payload) {
  var ss = getSpreadsheet();
  var bookingId = payload.bookingId;
  var paymentMethod = payload.paymentMethod || 'Tiền mặt';
  var roomNumber = '';

  updateBookingRowById_(bookingId, function(row, headers) {
    row[headers['Status']] = 'COMPLETED';
    row[headers['Payment Method']] = paymentMethod;
    roomNumber = String(row[headers['Room Number']]);
  });

  updateRoomStatus(roomNumber, 'AVAILABLE');

  try {
    updateRoomStatusMatrix(ss);
  } catch (e) {
    Logger.log('Lỗi cập nhật Hiện trạng đặt phòng: ' + e.toString());
  }

  return {
    success: true,
    message: 'Đã thanh toán & hoàn tất trả phòng ' + roomNumber + '!'
  };
}

/**
 * Puts a room into maintenance.
 */
function setMaintenance(payload) {
  var ss = getSpreadsheet();
  var roomNumber = String(payload.roomNumber);
  var isMaintenance = !!payload.maintenance;
  var note = payload.note || '';

  updateRoomRowByNumber_(roomNumber, function(row, headers) {
    row[headers['Status']] = isMaintenance ? 'MAINTENANCE' : 'AVAILABLE';
    row[headers['Notes']] = note;
  });

  try {
    updateRoomStatusMatrix(ss);
  } catch (e) {
    Logger.log('Lỗi cập nhật Hiện trạng đặt phòng: ' + e.toString());
  }

  return {
    success: true,
    message: 'Cập nhật trạng thái bảo trì phòng ' + roomNumber + ' thành công!'
  };
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
 * Robust Sync function that merges and stores the state backup from the React frontend applet in bulk.
 */
function syncDataFromWebApp(payload) {
  var ss = ensureDatabaseReady_(getSpreadsheet());

  var roomsList = payload.rooms || [];
  var bookingsList = payload.bookings || [];

  var roomsSheet = ss.getSheetByName('Rooms');
  var bookingsSheet = ss.getSheetByName('Bookings');

  var roomHeaders = ['Room Number', 'Floor', 'Type', 'Status', 'Weekday Price', 'Weekend Price', 'Notes'];
  var bookingHeaders = [
    'Booking ID', 'Room Number', 'Guest Name', 'Phone', 'Check In',
    'Check Out', 'Status', 'Notes', 'Room Total', 'Deposit',
    'Minibar Total', 'Compensation', 'Payment Method', 'Created At', 'Group Code'
  ];

  if (!roomsSheet) roomsSheet = getOrCreateSheet(ss, 'Rooms', roomHeaders);
  if (!bookingsSheet) bookingsSheet = getOrCreateSheet(ss, 'Bookings', bookingHeaders);

  var roomValues = roomsList.map(function(room) {
    var statusStr = String(room.status || 'available').toUpperCase();
    if (statusStr === 'ACTIVE') statusStr = 'OCCUPIED';

    return [
      String(room.id || ''),
      Number(room.floor || 0),
      room.type || '',
      statusStr,
      Number(room.weekdayPrice || 0),
      Number(room.weekendPrice || 0),
      room.notes || ''
    ];
  });

  var currentRoomRows = roomsSheet.getLastRow();
  if (currentRoomRows > 1) {
    roomsSheet.getRange(2, 1, currentRoomRows - 1, 7).clearContent();
  }
  if (roomValues.length) {
    roomsSheet.getRange(2, 1, roomValues.length, 7).setValues(roomValues);
  }

  var MINIBAR_PRICES = {
    'mi_coc': 20000,
    'bim_bim': 15000,
    'snack_khoai_tay': 50000,
    'mit_say': 70000,
    'bo_kho': 100000,
    'nuoc_loc': 10000,
    'red_bull': 20000,
    'bia_halong': 25000,
    'oreo': 20000
  };

  var bookingRows = [];
  for (var i = 0; i < bookingsList.length; i++) {
    var booking = bookingsList[i];
    if (!booking || booking.id === undefined || booking.id === null) continue;

    var minibarTotal = 0;
    if (booking.checkoutDetails && booking.checkoutDetails.minibar) {
      for (var key in booking.checkoutDetails.minibar) {
        var qty = Number(booking.checkoutDetails.minibar[key] || 0);
        var normKey = String(key).toLowerCase().trim();
        minibarTotal += qty * Number(MINIBAR_PRICES[normKey] || 0);
      }
    }

    var statusStr2 = String(booking.status || 'reserved').toUpperCase();
    if (statusStr2 === 'ACTIVE') statusStr2 = 'CHECKED_IN';

    bookingRows.push(buildBookingRow_(
      (function() {
        var map = {};
        for (var h = 0; h < bookingHeaders.length; h++) map[bookingHeaders[h]] = h;
        return map;
      })(),
      bookingHeaders.length,
      {
        bookingId: String(booking.id),
        roomNumber: booking.roomId ? String(booking.roomId) : '',
        guestName: booking.guestName || '',
        phone: booking.phone || '',
        checkIn: booking.checkIn || '',
        checkOut: booking.checkOut || '',
        status: statusStr2,
        notes: booking.notes || '',
        roomTotal: Number((booking.checkoutDetails && booking.checkoutDetails.roomPrice !== undefined) ? booking.checkoutDetails.roomPrice : (booking.totalPrice || 0)),
        deposit: Number((booking.checkoutDetails && booking.checkoutDetails.deposit !== undefined) ? booking.checkoutDetails.deposit : 0),
        minibarTotal: minibarTotal,
        compensation: Number((booking.checkoutDetails && booking.checkoutDetails.compensation !== undefined) ? booking.checkoutDetails.compensation : 0),
        paymentMethod: (booking.checkoutDetails && booking.checkoutDetails.paymentMethod) ? booking.checkoutDetails.paymentMethod : '',
        createdAt: booking.createdAt || new Date().toISOString(),
        groupCode: booking.groupCode || ''
      }
    ));
  }

  var currentBookingRows = bookingsSheet.getLastRow();
  if (currentBookingRows > 1) {
    bookingsSheet.getRange(2, 1, currentBookingRows - 1, bookingHeaders.length).clearContent();
  }
  if (bookingRows.length) {
    bookingsSheet.getRange(2, 1, bookingRows.length, bookingHeaders.length).setValues(bookingRows);
  }

  try {
    updateRoomStatusMatrix(ss);
  } catch (e) {
    Logger.log('Lỗi cập nhật Hiện trạng đặt phòng: ' + e.toString());
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
  var isNew = false;
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    isNew = true;
  } else {
    // Clear only text content to preserve conditional formatting, row heights, and column widths
    sheet.clearContents();
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
  
  if (isNew) {
    sheet.setFrozenRows(1);
    sheet.setFrozenColumns(2);
    sheet.setRowHeight(1, 28);
    sheet.setColumnWidth(1, 85);  // Room number
    sheet.setColumnWidth(2, 95);  // Room type
  }

  // Style headers
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground("#0f172a") // slate-900
             .setFontColor("#f8fafc")  // slate-50
             .setFontWeight("bold")
             .setHorizontalAlignment("center")
             .setVerticalAlignment("middle");

  if (headers.length > 2 && isNew) {
    sheet.setColumnWidths(3, headers.length - 2, 110);
  }

  // Load rooms data using helper
  var roomData = getSheetData_(ss, "Rooms");
  var rooms = [];
  for (var i = 1; i < roomData.values.length; i++) {
    var rNum = roomData.values[i][roomData.headers["Room Number"]];
    var rType = roomData.values[i][roomData.headers["Type"]];
    var rStatus = roomData.values[i][roomData.headers["Status"]];
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

  // Load bookings and index them by room to avoid nested loops (extremely fast!)
  var bookingData = getSheetData_(ss, "Bookings");
  var bookingsByRoom = {};
  
  for (var i = 1; i < bookingData.values.length; i++) {
    var bId = bookingData.values[i][bookingData.headers["Booking ID"]];
    var rNum = bookingData.values[i][bookingData.headers["Room Number"]];
    var gName = bookingData.values[i][bookingData.headers["Guest Name"]] || "Khách";
    var checkIn = bookingData.values[i][bookingData.headers["Check In"]];
    var checkOut = bookingData.values[i][bookingData.headers["Check Out"]];
    var bStatus = bookingData.values[i][bookingData.headers["Status"]];

    if (bId && rNum && checkIn && checkOut && bStatus !== "CANCELLED") {
      var roomId = rNum.toString();
      if (!bookingsByRoom[roomId]) {
        bookingsByRoom[roomId] = [];
      }
      bookingsByRoom[roomId].push({
        id: bId.toString(),
        roomId: roomId,
        guestName: gName.toString(),
        checkIn: checkIn,
        checkOut: checkOut,
        status: bStatus.toString().toUpperCase()
      });
    }
  }

  // Helper parsing functions
  function startOfDay(dateVal) {
    var d = new Date(dateVal);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function parseDateString(val) {
    var d = parseSafeDate(val);
    return d ? d : new Date();
  }

  // Check occupancy status of a room on a given day using our index map
  function getCellStatus(room, checkDate) {
    var checkTime = startOfDay(checkDate).getTime();
    var roomBookings = bookingsByRoom[room.id] || [];

    for (var i = 0; i < roomBookings.length; i++) {
      var b = roomBookings[i];
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
  for (var r = 0; r < rooms.length; r++) {
    var room = rooms[r];
    var rowValues = [room.id, room.type];

    for (var d = 0; d < dates.length; d++) {
      var cellData = getCellStatus(room, dates[d]);

      var text = "Trống";
      if (cellData.status === "occupied") {
        text = "Đang ở (" + cellData.guestName + ")";
      } else if (cellData.status === "reserved") {
        text = "Đã đặt (" + cellData.guestName + ")";
      } else if (cellData.status === "maintenance") {
        text = "Bảo trì";
      }

      rowValues.push(text);
    }
    values.push(rowValues);
  }

  if (values.length > 0) {
    var range = sheet.getRange(2, 1, values.length, headers.length);
    range.setValues(values);

    // Apply row heights in bulk
    sheet.setRowHeights(2, values.length, 24);

    // Enforce high-performance conditional format rules
    var rules = sheet.getConditionalFormatRules();
    if (rules.length === 0 || isNew) {
      var colorRange = sheet.getRange(2, 3, values.length, headers.length - 2);

      var ruleEmpty = SpreadsheetApp.newConditionalFormatRule()
        .whenTextStartsWith("Trống")
        .setBackground("#10b981")
        .setFontColor("#ffffff")
        .setRanges([colorRange])
        .build();

      var ruleOccupied = SpreadsheetApp.newConditionalFormatRule()
        .whenTextStartsWith("Đang ở")
        .setBackground("#f43f5e")
        .setFontColor("#ffffff")
        .setRanges([colorRange])
        .build();

      var ruleReserved = SpreadsheetApp.newConditionalFormatRule()
        .whenTextStartsWith("Đã đặt")
        .setBackground("#fbbf24")
        .setFontColor("#0f172a")
        .setRanges([colorRange])
        .build();

      var ruleMaintenance = SpreadsheetApp.newConditionalFormatRule()
        .whenTextStartsWith("Bảo trì")
        .setBackground("#334155")
        .setFontColor("#ffffff")
        .setRanges([colorRange])
        .build();

      sheet.setConditionalFormatRules([ruleEmpty, ruleOccupied, ruleReserved, ruleMaintenance]);
    }

    // Set layout parameters and alignments in bulk
    sheet.getRange(2, 1, values.length, headers.length)
         .setHorizontalAlignment("center")
         .setVerticalAlignment("middle")
         .setFontWeight("bold");
         
    // Set standard white background for columns A-B to look perfectly clean
    sheet.getRange(2, 1, values.length, 2)
         .setBackgrounds(values.map(function() { return ["#ffffff", "#f1f5f9"]; }))
         .setFontColors(values.map(function() { return ["#0f172a", "#334155"]; }));
  }
}

/**
 * LẤY TOÀN BỘ LỊCH SỬ ĐẶT PHÒNG CỦA MỘT PHÒNG ĐỂ HIỂN THỊ LÊN TIMELINE
 */
function getRoomBookingHistory(roomNumber) {
  try {
    var ss = getSpreadsheet();
    var bookingData = getSheetData_(ss, 'Bookings');
    var history = [];
    
    // Nhãn trạng thái hiển thị bằng tiếng Việt
    var statusLabels = {
      "RESERVED": "Đã đặt trước",
      "CHECKED_IN": "Đang lưu trú",
      "COMPLETED": "Đã trả phòng",
      "CANCELLED": "Đã hủy đơn"
    };

    var rNumIdx = bookingData.headers["Room Number"];
    var bIdIdx = bookingData.headers["Booking ID"];
    var gNameIdx = bookingData.headers["Guest Name"];
    var checkInIdx = bookingData.headers["Check In"];
    var checkOutIdx = bookingData.headers["Check Out"];
    var statusIdx = bookingData.headers["Status"];

    for (var i = 1; i < bookingData.values.length; i++) {
      var rNum = bookingData.values[i][rNumIdx];
      if (rNum && String(rNum) === String(roomNumber)) {
        var rawStatus = String(bookingData.values[i][statusIdx] || '').toUpperCase();
        history.push({
          id: bookingData.values[i][bIdIdx],
          guestName: bookingData.values[i][gNameIdx] || "Khách",
          checkIn: bookingData.values[i][checkInIdx],
          checkOut: bookingData.values[i][checkOutIdx],
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

/**
 * Compiles the entire Sheets database (Rooms, Bookings) into a JSON backup file on Google Drive.
 */
function createDriveBackupFile() {
  try {
    var ss = getSpreadsheet();
    
    // 1. Fetch Rooms Data
    var rooms = [];
    var roomsSheet = ss.getSheetByName("Rooms");
    if (roomsSheet) {
      var roomData = getSheetData_(ss, "Rooms");
      var rNumIdx = roomData.headers["Room Number"];
      var floorIdx = roomData.headers["Floor"];
      var typeIdx = roomData.headers["Type"];
      var statusIdx = roomData.headers["Status"];
      var weekdayIdx = roomData.headers["Weekday Price"];
      var weekendIdx = roomData.headers["Weekend Price"];
      var notesIdx = roomData.headers["Notes"];
      
      for (var i = 1; i < roomData.values.length; i++) {
        var row = roomData.values[i];
        var idVal = row[rNumIdx];
        if (idVal !== undefined && idVal !== null && idVal !== "") {
          rooms.push({
            id: idVal.toString(),
            floor: Number(row[floorIdx] || 0),
            type: row[typeIdx] || "",
            status: row[statusIdx] || "AVAILABLE",
            weekdayPrice: Number(row[weekdayIdx] || 0),
            weekendPrice: Number(row[weekendIdx] || 0),
            notes: row[notesIdx] || ""
          });
        }
      }
    }
    
    // 2. Fetch Bookings Data
    var bookings = [];
    var bookingsSheet = ss.getSheetByName("Bookings");
    if (bookingsSheet) {
      var bookingData = getSheetData_(ss, "Bookings");
      var bIdIdx = bookingData.headers["Booking ID"];
      var rNumIdx = bookingData.headers["Room Number"];
      var gNameIdx = bookingData.headers["Guest Name"];
      var phoneIdx = bookingData.headers["Phone"];
      var checkInIdx = bookingData.headers["Check In"];
      var checkOutIdx = bookingData.headers["Check Out"];
      var statusIdx = bookingData.headers["Status"];
      var notesIdx = bookingData.headers["Notes"];
      var roomTotalIdx = bookingData.headers["Room Total"];
      var depositIdx = bookingData.headers["Deposit"];
      var minibarIdx = bookingData.headers["Minibar Total"];
      var compensationIdx = bookingData.headers["Compensation"];
      var paymentMethodIdx = bookingData.headers["Payment Method"];
      var createdAtIdx = bookingData.headers["Created At"];
      var groupCodeIdx = bookingData.headers["Group Code"];
      
      for (var j = 1; j < bookingData.values.length; j++) {
        var brow = bookingData.values[j];
        var bIdVal = brow[bIdIdx];
        if (bIdVal !== undefined && bIdVal !== null && bIdVal !== "") {
          var roomTotal = Number(brow[roomTotalIdx] || 0);
          var minibarTotal = Number(brow[minibarIdx] || 0);
          var compTotal = Number(brow[compensationIdx] || 0);
          var totalPrice = roomTotal + minibarTotal + compTotal;
          
          bookings.push({
            id: bIdVal.toString(),
            roomId: (brow[rNumIdx] || "").toString(),
            guestName: brow[gNameIdx] || "",
            phone: (brow[phoneIdx] || "").toString(),
            checkIn: brow[checkInIdx] || "",
            checkOut: brow[checkOutIdx] || "",
            status: brow[statusIdx] || "RESERVED",
            notes: brow[notesIdx] || "",
            totalPrice: totalPrice,
            deposit: Number(brow[depositIdx] || 0),
            createdAt: brow[createdAtIdx] || new Date().toISOString(),
            groupCode: brow[groupCodeIdx] || ""
          });
        }
      }
    }
    
    // Compile to backup JSON format
    var backupObj = {
      rooms: rooms,
      bookings: bookings
    };
    var fileContent = JSON.stringify(backupObj, null, 2);
    
    // Save to Google Drive
    var fileName = "hotel_backup_data.json";
    var files = DriveApp.getFilesByName(fileName);
    var file;
    if (files.hasNext()) {
      file = files.next();
      file.setContent(fileContent);
    } else {
      file = DriveApp.createFile(fileName, fileContent, MimeType.PLAIN_TEXT);
    }
    
    return {
      success: true,
      message: "Tạo file sao lưu JSON thành công trên Google Drive!",
      fileName: fileName,
      fileId: file.getId(),
      content: fileContent,
      roomCount: rooms.length,
      bookingCount: bookings.length
    };
  } catch (err) {
    return {
      success: false,
      message: "Lỗi tạo file sao lưu: " + err.toString()
    };
  }
}

/**
 * Reads hotel_backup_data.json from Google Drive and restores it into the Spreadsheet.
 */
function restoreFromBackupJsonFile() {
  try {
    var fileName = "hotel_backup_data.json";
    var files = DriveApp.getFilesByName(fileName);
    if (!files.hasNext()) {
      return {
        success: false,
        message: "Không tìm thấy file sao lưu hotel_backup_data.json trên Google Drive. Bạn cần tạo hoặc đồng bộ sao lưu trước!"
      };
    }
    
    var file = files.next();
    var content = file.getBlob().getDataAsString();
    var data = JSON.parse(content);
    
    var rooms = data.rooms || [];
    var bookings = data.bookings || [];
    
    // Normalize data format for sync function compatibility
    var normalizedRooms = rooms.map(function(r) {
      return {
        id: (r.id || r.room_id || r.roomNumber || "").toString(),
        floor: Number(r.floor !== undefined ? r.floor : 0),
        type: r.type || r.room_type || "",
        status: r.status || "AVAILABLE",
        weekdayPrice: Number(r.weekdayPrice || r.weekday_price || 0),
        weekendPrice: Number(r.weekendPrice || r.weekend_price || 0),
        notes: r.notes || ""
      };
    });
    
    var normalizedBookings = bookings.map(function(b) {
      var checkDetails = b.checkoutDetails || b.checkout_details || null;
      if (!checkDetails && (b.minibarTotal || b.compensation)) {
        checkDetails = {
          minibar: {},
          deposit: b.deposit || 0,
          roomPrice: b.totalPrice || 0,
          compensation: b.compensation || 0,
          paymentMethod: b.paymentMethod || ""
        };
      }
      return {
        id: (b.id || b.booking_id || "").toString(),
        roomId: (b.roomId || b.room_id || b.roomNumber || "").toString(),
        guestName: b.guestName || b.guest_name || "",
        phone: (b.phone || "").toString(),
        checkIn: b.checkIn || b.check_in || "",
        checkOut: b.checkOut || b.check_out || "",
        status: b.status || "RESERVED",
        notes: b.notes || "",
        totalPrice: Number(b.totalPrice || b.total_price || 0),
        createdAt: b.createdAt || b.created_at || new Date().toISOString(),
        groupCode: b.groupCode || b.group_code || "",
        checkoutDetails: checkDetails
      };
    });
    
    var result = syncDataFromWebApp({
      rooms: normalizedRooms,
      bookings: normalizedBookings
    });
    
    return {
      success: true,
      message: "Đã phục hồi dữ liệu thành công từ file sao lưu JSON trên Google Drive!",
      roomCount: normalizedRooms.length,
      bookingCount: normalizedBookings.length,
      details: result
    };
  } catch (err) {
    return {
      success: false,
      message: "Lỗi khôi phục dữ liệu: " + err.toString()
    };
  }
}
