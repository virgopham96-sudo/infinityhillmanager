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
    { id: "all", label: "Tất cả", count: totalCount, dotColor: "bg-blue-500" },
    { id: "available", label: "Phòng trống", count: availableCount, dotColor: "bg-emerald-500" },
    { id: "occupied", label: "Đang ở", count: occupiedCount, dotColor: "bg-rose-500" },
    { id: "reserved", label: "Đã đặt", count: reservedCount, dotColor: "bg-amber-500" },
    { id: "maintenance", label: "Bảo trì", count: maintenanceCount, dotColor: "bg-slate-400" },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 pb-8 sm:pb-12">
      {/* Dynamic Filter panel combining Room Status pills & Room Type dropdown */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        {/* Left Side: Status Pill Buttons */}
        <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-1 flex items-center gap-1.5 flex-none select-none">
            <Filter className="w-4 h-4 text-slate-400" /> Trạng thái
          </span>
          <div className="flex flex-wrap gap-1.5">
            {statsList.map((stat) => {
              const isActive = statusFilter === stat.id;
              
              const badgeColors: Record<string, string> = {
                all: isActive 
                  ? "bg-blue-600 text-white" 
                  : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700",
                available: isActive 
                  ? "bg-emerald-600 text-white" 
                  : "bg-emerald-50 hover:bg-emerald-100/80 dark:bg-emerald-950/10 dark:hover:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 hover:border-emerald-200 dark:hover:border-emerald-900",
                occupied: isActive 
                  ? "bg-rose-600 text-white" 
                  : "bg-rose-50 hover:bg-rose-100/80 dark:bg-rose-950/10 dark:hover:bg-rose-950/20 text-rose-800 dark:text-rose-300 hover:border-rose-200 dark:hover:border-rose-900",
                reserved: isActive 
                  ? "bg-amber-500 text-white" 
                  : "bg-amber-50 hover:bg-amber-100/80 dark:bg-amber-950/10 dark:hover:bg-amber-950/20 text-amber-800 dark:text-amber-300 hover:border-amber-200 dark:hover:border-amber-900",
                maintenance: isActive 
                  ? "bg-slate-500 text-white" 
                  : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700"
              };

              return (
                <button
                  key={stat.id}
                  onClick={() => setStatusFilter(stat.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-transparent transition-all duration-150 cursor-pointer select-none",
                    badgeColors[stat.id]
                  )}
                >
                  <span className={cn("w-1.5 h-1.5 rounded-full flex-none", stat.dotColor)}></span>
                  <span>{stat.label}</span>
                  <span className={cn(
                    "ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold shadow-sm flex-none",
                    isActive ? "bg-white/20 text-white" : "bg-white/75 dark:bg-slate-900 text-slate-700 dark:text-slate-400 border border-slate-100 dark:border-slate-800"
                  )}>
                    {stat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Room Type Filter dropdown */}
        <div className="flex items-center gap-2 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-1 whitespace-nowrap select-none">Loại phòng</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full md:w-auto px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
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
