/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import Sidebar from "./components/Sidebar";
import RoomGrid from "./components/RoomGrid";
import RevenueReport from "./components/RevenueReport";
import RoomSchedule from "./components/RoomSchedule";
import GuestView from "./components/GuestView";
import BookingModal from "./components/BookingModal";
import MultiBookingModal from "./components/MultiBookingModal";
import { useStore } from "./store";
import { Room } from "./types";
import { Loader2, PlusSquare, Building } from "lucide-react";

export default function App() {
  const {
    rooms,
    bookings,
    isLoaded,
    updateRoom,
    updateMultipleRooms,
    addBooking,
    removeBooking,
  } = useStore();
  const [currentView, setCurrentView] = useState<
    "dashboard" | "revenue" | "schedule" | "guests"
  >("dashboard");
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [bookingInitialDate, setBookingInitialDate] = useState<Date | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showMultiBooking, setShowMultiBooking] = useState(false);
  const [initialMultiBookingGuest, setInitialMultiBookingGuest] = useState<string | null>(null);

  // Login State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-100 w-full max-w-sm">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-blue-600 p-3 rounded-xl mb-4 shadow-sm">
              <Building className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight text-center">
              Infinity Hill Manager
            </h1>
            <p className="text-slate-500 text-sm mt-2 text-center">
              Vui lòng đăng nhập để tiếp tục
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (username === "Admin" && password === "1234") {
                setIsAuthenticated(true);
                setLoginError("");
              } else {
                setLoginError("Tài khoản hoặc mật khẩu không chính xác");
              }
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Tên đăng nhập
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Mật khẩu
              </label>
              <input
                type="password"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••"
                required
              />
            </div>
            {loginError && (
              <p className="text-rose-500 text-sm font-medium">{loginError}</p>
            )}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors mt-2 shadow-sm"
            >
              Đăng nhập
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Calculate some simple dashboard stats
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const isReservedToday = (checkIn?: string, checkOut?: string) => {
    if (!checkIn || !checkOut) return false;
    const inDate = new Date(checkIn);
    const outDate = new Date(checkOut);
    return inDate < todayEnd && outDate > todayStart;
  };

  const availableRooms = rooms.filter((r) => {
    if (r.status === "maintenance" || r.status === "occupied") return false;
    if (r.status === "reserved" && isReservedToday(r.checkInTime, r.checkOutTime)) return false;
    if (r.reservations?.some((res) => isReservedToday(res.checkInTime, res.checkOutTime))) return false;
    return true;
  }).length;

  const occupiedRooms = rooms.filter((r) => r.status === "occupied").length;
  const reservedRooms = rooms.filter((r) => {
    if (r.status === "reserved" && isReservedToday(r.checkInTime, r.checkOutTime)) return true;
    if (r.status !== "occupied" && r.reservations?.some((res) => isReservedToday(res.checkInTime, res.checkOutTime))) return true;
    return false;
  }).length;

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans relative">
      
      {/* Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 bg-slate-900 md:bg-transparent transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar
          currentView={currentView}
          onChangeView={(view) => {
            setCurrentView(view);
            setIsMobileMenuOpen(false);
          }}
        />
      </div>

      <main className="flex-1 flex flex-col h-screen overflow-hidden w-full relative z-10">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-3 md:px-8 py-3 md:py-5 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-2 md:gap-3">
            <button
              className="md:hidden p-1.5 md:p-2 text-slate-500 hover:bg-slate-100 rounded-lg shrink-0"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <svg
                className="w-5 h-5 md:w-6 md:h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <h1 className="text-lg md:text-2xl font-semibold text-slate-800 tracking-tight flex-1 truncate">
              {currentView === "dashboard" && "Sơ đồ phòng"}
              {currentView === "revenue" && "Doanh thu"}
              {currentView === "schedule" && "Lịch đặt"}
              {currentView === "guests" && "Khách đặt"}
            </h1>
          </div>

          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            {currentView === "dashboard" && (
              <button
                onClick={() => setShowMultiBooking(true)}
                className="flex items-center justify-center w-8 h-8 md:w-auto md:h-auto md:px-4 md:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors shrink-0"
                title="Đặt theo đoàn"
              >
                <PlusSquare className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline text-sm font-medium">
                  Đặt theo đoàn
                </span>
              </button>
            )}

            <div className="hidden lg:flex items-center gap-4 border border-slate-200 rounded-lg p-1 bg-slate-50">
              <div className="px-3 py-1 flex items-center gap-2 border-r border-slate-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-sm font-medium text-slate-600">
                  Trống: {availableRooms}
                </span>
              </div>
              <div className="px-3 py-1 flex items-center gap-2 border-r border-slate-200">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span className="text-sm font-medium text-slate-600">
                  Đang ở: {occupiedRooms}
                </span>
              </div>
              <div className="px-3 py-1 flex items-center gap-2 pr-3">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span className="text-sm font-medium text-slate-600">
                  Đã đặt: {reservedRooms}
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-8">
          <div className="max-w-7xl mx-auto h-full">
            {currentView === "dashboard" && (
              <RoomGrid rooms={rooms} onRoomSelect={setSelectedRoom} />
            )}
            {currentView === "revenue" && (
              <RevenueReport
                bookings={bookings}
                onRemoveBooking={removeBooking}
              />
            )}
            {currentView === "schedule" && (
              <RoomSchedule 
                rooms={rooms}
                onBookRoom={(roomId, date) => {
                  const roomToBook = rooms.find((r) => r.id === roomId);
                  if (roomToBook) {
                    setSelectedRoom(roomToBook);
                    setBookingInitialDate(date);
                  }
                }}
              />
            )}
            {currentView === "guests" && (
              <GuestView 
                onEditGroup={(name) => {
                  setInitialMultiBookingGuest(name);
                  setShowMultiBooking(true);
                }}
              />
            )}
          </div>
        </div>
      </main>

      {selectedRoom && (
        <BookingModal
          room={rooms.find((r) => r.id === selectedRoom.id) || selectedRoom}
          onClose={() => {
            setSelectedRoom(null);
            setBookingInitialDate(null);
          }}
          onUpdateRoom={updateRoom}
          onAddBooking={addBooking}
          initialCheckInDate={bookingInitialDate || undefined}
        />
      )}

      {showMultiBooking && (
        <MultiBookingModal
          rooms={rooms}
          onClose={() => {
            setShowMultiBooking(false);
            setInitialMultiBookingGuest(null);
          }}
          onUpdateRooms={updateMultipleRooms}
          initialGuestName={initialMultiBookingGuest || undefined}
        />
      )}
    </div>
  );
}
