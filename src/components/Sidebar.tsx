import {
  LayoutDashboard,
  Receipt,
  Users,
  Building,
  Menu,
  CalendarDays,
} from "lucide-react";
import { cn } from "../lib/utils";

interface SidebarProps {
  currentView: "dashboard" | "revenue" | "schedule" | "guests";
  onChangeView: (view: "dashboard" | "revenue" | "schedule" | "guests") => void;
}

export default function Sidebar({ currentView, onChangeView }: SidebarProps) {
  return (
    <aside className="flex flex-col w-64 bg-[#004b93] text-blue-100 h-full min-h-screen">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-[#003a73]">
        <div className="bg-blue-500 p-2 rounded-lg">
          <Building className="w-5 h-5 text-white" />
        </div>
        <span className="font-semibold text-base text-white font-sans tracking-tight leading-tight">
          Infinity Hill<br/>Manager
        </span>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        <button
          onClick={() => onChangeView("dashboard")}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium",
            currentView === "dashboard"
              ? "bg-[#003a73] text-white"
              : "hover:bg-[#003a73]/70 hover:text-white",
          )}
        >
          <LayoutDashboard className="w-4 h-4" />
          Sơ đồ phòng
        </button>
        <button
          onClick={() => onChangeView("schedule")}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium",
            currentView === "schedule"
              ? "bg-[#003a73] text-white"
              : "hover:bg-[#003a73]/70 hover:text-white",
          )}
        >
          <CalendarDays className="w-4 h-4" />
          Hiện trạng đặt phòng
        </button>
        <button
          onClick={() => onChangeView("guests")}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium",
            currentView === "guests"
              ? "bg-[#003a73] text-white"
              : "hover:bg-[#003a73]/70 hover:text-white",
          )}
        >
          <Users className="w-4 h-4" />
          Xem theo khách đặt
        </button>
        <button
          onClick={() => onChangeView("revenue")}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium",
            currentView === "revenue"
              ? "bg-[#003a73] text-white"
              : "hover:bg-[#003a73]/70 hover:text-white",
          )}
        >
          <Receipt className="w-4 h-4" />
          Báo cáo doanh thu
        </button>
      </nav>
    </aside>
  );
}
