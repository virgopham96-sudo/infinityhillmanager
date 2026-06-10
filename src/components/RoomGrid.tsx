import { useState } from "react";
import { Room } from "../types";
import RoomCard from "./RoomCard";
import { Filter } from "lucide-react";
import { getLiveRoomState } from "../lib/utils";

interface RoomGridProps {
  rooms: Room[];
  onRoomSelect: (room: Room) => void;
}

export default function RoomGrid({ rooms, onRoomSelect }: RoomGridProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Get unique room types
  const roomTypes = Array.from(new Set(rooms.map(r => r.type)));

  // Filter rooms
  const filteredRooms = rooms.filter(room => {
    // Determine effective status using exactly the same logic as the RoomCard visual display
    const liveState = getLiveRoomState(room);
    const effectiveStatus = liveState.status;

    const matchStatus = statusFilter === "all" || effectiveStatus === statusFilter;
    const matchType = typeFilter === "all" || room.type === typeFilter;
    return matchStatus && matchType;
  });

  // Group rooms by floor
  const floors = Array.from({ length: 4 }, (_, i) => i + 1).sort(
    (a, b) => b - a,
  ); // Floor 4 down to 1

  return (
    <div className="space-y-4 sm:space-y-8 pb-8 sm:pb-12">
      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap">
          <Filter className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span>Bộ lọc:</span>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="available">Phòng trống</option>
            <option value="occupied">Đang ở</option>
            <option value="reserved">Đã đặt</option>
            <option value="maintenance">Bảo trì</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="all">Tất cả loại phòng</option>
            {roomTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      {floors.map((floor) => {
        const floorRooms = filteredRooms.filter((r) => r.floor === floor);
        if (floorRooms.length === 0) return null;
        
        return (
          <div
            key={floor}
            className="bg-white dark:bg-slate-900 p-3 sm:p-6 rounded-xl sm:rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800"
          >
            <h2 className="text-lg sm:text-xl font-semibold font-sans tracking-tight text-slate-800 dark:text-slate-100 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
              Tầng {floor}
              <span className="text-xs sm:text-sm font-normal text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                {floorRooms.length} phòng
              </span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {floorRooms.map((room) => (
                <RoomCard key={room.id} room={room} onClick={onRoomSelect} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
