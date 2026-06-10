import { useState } from "react";
import { Room } from "../types";
import RoomCard from "./RoomCard";
import { Filter } from "lucide-react";
import { cn, getLiveRoomState } from "../lib/utils";

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

  const totalCount = rooms.length;
  const availableCount = rooms.filter(r => getLiveRoomState(r).status === "available").length;
  const occupiedCount = rooms.filter(r => getLiveRoomState(r).status === "occupied").length;
  const reservedCount = rooms.filter(r => getLiveRoomState(r).status === "reserved").length;
  const maintenanceCount = rooms.filter(r => getLiveRoomState(r).status === "maintenance").length;

  const statsList = [
    { id: "all", label: "Tất cả", count: totalCount, dotColor: "bg-blue-500", color: "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800/60", activeColor: "ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-800" },
    { id: "available", label: "Phòng trống", count: availableCount, dotColor: "bg-emerald-500", color: "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800/60", activeColor: "ring-2 ring-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800" },
    { id: "occupied", label: "Đang ở", count: occupiedCount, dotColor: "bg-rose-500", color: "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800/60", activeColor: "ring-2 ring-rose-500 bg-rose-50/50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800" },
    { id: "reserved", label: "Đã đặt trước", count: reservedCount, dotColor: "bg-amber-500", color: "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800/60", activeColor: "ring-2 ring-amber-500 bg-amber-50/50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800" },
    { id: "maintenance", label: "Bảo trì", count: maintenanceCount, dotColor: "bg-slate-400 dark:bg-slate-500", color: "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800/60", activeColor: "ring-2 ring-slate-400 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700" },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 pb-8 sm:pb-12">
      {/* Interactive Dynamic Live Status Filter Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {statsList.map((stat) => {
          const isActive = statusFilter === stat.id;
          return (
            <button
              key={stat.id}
              onClick={() => setStatusFilter(stat.id)}
              className={cn(
                "flex items-center justify-between p-4 rounded-xl border text-sm font-semibold transition-all duration-150 cursor-pointer shadow-sm relative overflow-hidden group",
                isActive ? stat.activeColor : stat.color,
                "hover:scale-[1.02] active:scale-95"
              )}
            >
              <div className="flex items-center gap-2">
                <span className={cn("w-2 h-2 rounded-full", stat.dotColor, stat.id !== "maintenance" && "animate-pulse")}></span>
                <span>{stat.label}</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 group-hover:bg-blue-100 group-hover:text-blue-800 dark:group-hover:bg-blue-900/40 dark:group-hover:text-blue-200 transition-colors">
                {stat.count}
              </span>
            </button>
          );
        })}
      </div>

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
