/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import Sidebar from './components/Sidebar';
import RoomGrid from './components/RoomGrid';
import RevenueReport from './components/RevenueReport';
import RoomSchedule from './components/RoomSchedule';
import BookingModal from './components/BookingModal';
import MultiBookingModal from './components/MultiBookingModal';
import { useStore } from './store';
import { Room } from './types';
import { Loader2, PlusSquare } from 'lucide-react';

export default function App() {
  const { rooms, bookings, isLoaded, updateRoom, updateMultipleRooms, addBooking } = useStore();
  const [currentView, setCurrentView] = useState<'dashboard' | 'revenue' | 'schedule'>('dashboard');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showMultiBooking, setShowMultiBooking] = useState(false);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  // Calculate some simple dashboard stats
  const availableRooms = rooms.filter(r => r.status === 'available').length;
  const occupiedRooms = rooms.filter(r => r.status === 'occupied').length;
  const reservedRooms = rooms.filter(r => r.status === 'reserved').length;

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <div className={`${isMobileMenuOpen ? 'fixed inset-0 z-40 bg-slate-900/50 block md:hidden' : 'hidden'}`} onClick={() => setIsMobileMenuOpen(false)}></div>
      <div className={`${isMobileMenuOpen ? 'fixed inset-y-0 left-0 z-50 transform translate-x-0 transition-transform duration-300' : 'hidden md:block'}`}>
        <Sidebar currentView={currentView} onChangeView={(view) => { setCurrentView(view); setIsMobileMenuOpen(false); }} />
      </div>

      <main className="flex-1 flex flex-col h-screen overflow-hidden w-full">
        <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-5 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg" onClick={() => setIsMobileMenuOpen(true)}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <h1 className="text-xl md:text-2xl font-semibold text-slate-800 tracking-tight flex-1">
              {currentView === 'dashboard' && 'Sơ đồ phòng'}
              {currentView === 'revenue' && 'Báo cáo doanh thu'}
              {currentView === 'schedule' && 'Hiện trạng đặt phòng'}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            {currentView === 'dashboard' && (
              <button 
                onClick={() => setShowMultiBooking(true)}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
              >
                <PlusSquare className="w-4 h-4" />
                Đặt theo đoàn
              </button>
            )}

            <div className="hidden lg:flex items-center gap-4 border border-slate-200 rounded-lg p-1 bg-slate-50">
              <div className="px-3 py-1 flex items-center gap-2 border-r border-slate-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-sm font-medium text-slate-600">Trống: {availableRooms}</span>
              </div>
              <div className="px-3 py-1 flex items-center gap-2 border-r border-slate-200">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span className="text-sm font-medium text-slate-600">Đang ở: {occupiedRooms}</span>
              </div>
              <div className="px-3 py-1 flex items-center gap-2 pr-3">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span className="text-sm font-medium text-slate-600">Đã đặt: {reservedRooms}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto h-full">
            {currentView === 'dashboard' && <RoomGrid rooms={rooms} onRoomSelect={setSelectedRoom} />}
            {currentView === 'revenue' && <RevenueReport bookings={bookings} />}
            {currentView === 'schedule' && <RoomSchedule rooms={rooms} />}
          </div>
        </div>
      </main>

      {selectedRoom && (
        <BookingModal
          room={rooms.find(r => r.id === selectedRoom.id) || selectedRoom}
          onClose={() => setSelectedRoom(null)}
          onUpdateRoom={updateRoom}
          onAddBooking={addBooking}
        />
      )}

      {showMultiBooking && (
        <MultiBookingModal
          rooms={rooms}
          onClose={() => setShowMultiBooking(false)}
          onUpdateRooms={updateMultipleRooms}
        />
      )}
    </div>
  );
}
