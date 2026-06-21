import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Receipt,
  Users,
  CalendarDays,
  LogOut,
  HelpCircle,
  Search,
  Settings,
} from "lucide-react";
import { cn } from "../lib/utils";
import { motion } from "motion/react";

interface SidebarProps {
  currentView: "dashboard" | "revenue" | "schedule" | "guests" | "guide" | "check" | "settings";
  onChangeView: (view: "dashboard" | "revenue" | "schedule" | "guests" | "guide" | "check" | "settings") => void;
  onLogout?: () => void;
}

export default function Sidebar({ currentView, onChangeView, onLogout }: SidebarProps) {
  // Reactive hotel name from localStorage settings
  const [hotelName, setHotelName] = useState(() => localStorage.getItem("hotelName") || "Infinity Hill");

  useEffect(() => {
    const handleUpdate = () => {
      setHotelName(localStorage.getItem("hotelName") || "Infinity Hill");
    };
    window.addEventListener("hotel-name-updated", handleUpdate);
    return () => window.removeEventListener("hotel-name-updated", handleUpdate);
  }, []);

  const getNavItemClassName = (viewKey: string) => cn(
    "relative w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all active:scale-[0.97] outline-none select-none z-10 cursor-pointer border-l-4 border-transparent",
    currentView === viewKey
      ? "text-white font-semibold bg-[#003a73] dark:bg-slate-800 md:bg-transparent border-l-amber-400 dark:border-l-blue-500 shadow-md md:shadow-none"
      : "text-blue-100/80 hover:text-white md:hover:bg-white/5 dark:text-slate-400 dark:hover:text-slate-200 dark:md:hover:bg-slate-800/50"
  );

  return (
    <aside className="flex flex-col w-64 bg-[#004b93] dark:bg-slate-950 text-blue-100 dark:text-slate-300 h-full min-h-screen border-r border-transparent dark:border-slate-800">
      
      {/* Sidebar Header Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-[#003a73] dark:border-slate-800">
        <div className="flex items-center justify-center p-1 bg-white dark:bg-slate-800 rounded-lg w-10 h-10 overflow-hidden shadow-sm shrink-0">
          <img src="https://lh3.googleusercontent.com/pw/AP1GczMk0hS3jdTwzJkHeGWSWRjqaUS5YYGFB5KbMDMeFlBdpving26XUlJjNeBV5Hgu1LMFBhJva188u3oI3ki789nXcjxoVTfjk5LDpRs7y0gszs7daOP8=s512" alt="Logo" className="w-full h-full object-contain drop-shadow-sm rounded-lg" />
        </div>
        <span className="font-semibold text-base text-white font-sans tracking-tight leading-tight select-none">
          {hotelName}<br/>Manager
        </span>
      </div>

      {/* Main Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1 bg-[#004b93] dark:bg-slate-950">
        
        {/* Rooms / Dashboard */}
        <button
          onClick={() => onChangeView("dashboard")}
          className={getNavItemClassName("dashboard")}
        >
          {currentView === "dashboard" && (
            <motion.div
              layoutId="active-sidebar-pill"
              className="absolute inset-0 bg-[#003a73] dark:bg-slate-800 rounded-lg -z-10 shadow-sm border-l-4 border-amber-400 dark:border-blue-500 hidden md:block"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
          <LayoutDashboard className="w-4.5 h-4.5 shrink-0" />
          Sơ đồ phòng
        </button>

        {/* Schedule Timeline */}
        <button
          onClick={() => onChangeView("schedule")}
          className={getNavItemClassName("schedule")}
        >
          {currentView === "schedule" && (
            <motion.div
              layoutId="active-sidebar-pill"
              className="absolute inset-0 bg-[#003a73] dark:bg-slate-800 rounded-lg -z-10 shadow-sm border-l-4 border-amber-400 dark:border-blue-500 hidden md:block"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
          <CalendarDays className="w-4.5 h-4.5 shrink-0" />
          Hiện trạng đặt phòng
        </button>

        {/* Check availability */}
        <button
          onClick={() => onChangeView("check")}
          className={getNavItemClassName("check")}
        >
          {currentView === "check" && (
            <motion.div
              layoutId="active-sidebar-pill"
              className="absolute inset-0 bg-[#003a73] dark:bg-slate-800 rounded-lg -z-10 shadow-sm border-l-4 border-amber-400 dark:border-blue-500 hidden md:block"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
          <Search className="w-4.5 h-4.5 shrink-0" />
          Kiểm tra phòng trống
        </button>

        {/* View by Guest */}
        <button
          onClick={() => onChangeView("guests")}
          className={getNavItemClassName("guests")}
        >
          {currentView === "guests" && (
            <motion.div
              layoutId="active-sidebar-pill"
              className="absolute inset-0 bg-[#003a73] dark:bg-slate-800 rounded-lg -z-10 shadow-sm border-l-4 border-amber-400 dark:border-blue-500 hidden md:block"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
          <Users className="w-4.5 h-4.5 shrink-0" />
          Xem theo khách đặt
        </button>

        {/* Revenue Reports */}
        <button
          onClick={() => onChangeView("revenue")}
          className={getNavItemClassName("revenue")}
        >
          {currentView === "revenue" && (
            <motion.div
              layoutId="active-sidebar-pill"
              className="absolute inset-0 bg-[#003a73] dark:bg-slate-800 rounded-lg -z-10 shadow-sm border-l-4 border-amber-400 dark:border-blue-500 hidden md:block"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
          <Receipt className="w-4.5 h-4.5 shrink-0" />
          Báo cáo doanh thu
        </button>

        {/* Settings view */}
        <button
          onClick={() => onChangeView("settings")}
          className={getNavItemClassName("settings")}
        >
          {currentView === "settings" && (
            <motion.div
              layoutId="active-sidebar-pill"
              className="absolute inset-0 bg-[#003a73] dark:bg-slate-800 rounded-lg -z-10 shadow-sm border-l-4 border-amber-400 dark:border-blue-500 hidden md:block"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
          <Settings className="w-4.5 h-4.5 shrink-0" />
          Cấu hình & Cài đặt
        </button>
      </nav>

      {/* Footer Area */}
      <div className="px-4 pb-6 mt-auto">
        <div className="border-t border-[#003a73] dark:border-slate-800 pt-4 space-y-1.5 bg-[#004b93] dark:bg-slate-950">
          
          {/* User Guide */}
          <button
            onClick={() => onChangeView("guide")}
            className={getNavItemClassName("guide")}
          >
            {currentView === "guide" && (
              <motion.div
                layoutId="active-sidebar-pill"
                className="absolute inset-0 bg-[#003a73] dark:bg-slate-800 rounded-lg -z-10 shadow-sm border-l-4 border-amber-400 dark:border-blue-500 hidden md:block"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <HelpCircle className="w-4.5 h-4.5 shrink-0" />
            Hướng dẫn sử dụng
          </button>

          {/* Logout button */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 mt-3 rounded-lg text-sm font-medium text-rose-300 hover:bg-rose-950/40 hover:text-rose-200 border border-transparent hover:border-rose-900/30 transition-all cursor-pointer active:scale-[0.98]"
            >
              <LogOut className="w-4.5 h-4.5 shrink-0 text-rose-400" />
              Đăng xuất
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
