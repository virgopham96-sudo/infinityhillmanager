import {
  LayoutDashboard,
  Receipt,
  Users,
  Building,
  Menu,
  CalendarDays,
  Download,
  Upload,
  LogOut,
  HelpCircle,
} from "lucide-react";
import { cn } from "../lib/utils";
import { useStore } from "../store";
import toast from "react-hot-toast";

interface SidebarProps {
  currentView: "dashboard" | "revenue" | "schedule" | "guests" | "guide";
  onChangeView: (view: "dashboard" | "revenue" | "schedule" | "guests" | "guide") => void;
  onLogout?: () => void;
}

export default function Sidebar({ currentView, onChangeView, onLogout }: SidebarProps) {
  const { rooms, bookings, restoreData } = useStore();

  const handleBackup = () => {
    const data = {
      rooms,
      bookings
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `infinity_hill_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRestore = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (event) => {
        let toastId = "";
        try {
          const data = JSON.parse(event.target?.result as string);
          if (data.rooms && data.bookings) {
            if (window.confirm("Thao tác này sẽ xóa sạch dữ liệu hiện tại để ghi đè dữ liệu từ bản sao lưu. Bạn có chắc chắn muốn khôi phục?")) {
              toastId = toast.loading("Đang khôi phục dữ liệu lên cloud...");
              await restoreData(data.rooms, data.bookings);
              toast.success("Khôi phục dữ liệu thành công!", { id: toastId });
            }
          } else {
            toast.error("File sao lưu không hợp lệ! Vui lòng chọn đúng file JSON sao lưu của hệ thống.");
          }
        } catch (error: any) {
          console.error("Restore Error: ", error);
          if (toastId) {
            toast.error("Khôi phục thất bại: " + (error?.message || "Lỗi đường truyền cloud. Vui lòng kiểm tra lại."), { id: toastId });
          } else {
            toast.error("Lỗi khi đọc file sao lưu: " + (error?.message || "File không đúng định dạng."));
          }
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <aside className="flex flex-col w-64 bg-[#004b93] dark:bg-slate-950 text-blue-100 dark:text-slate-300 h-full min-h-screen border-r border-transparent dark:border-slate-800">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-[#003a73] dark:border-slate-800">
        <div className="flex items-center justify-center p-1 bg-white dark:bg-slate-800 rounded-lg w-10 h-10">
          <img src="https://i.postimg.cc/Jzvpt8tt/Logo-Infinity-Only-tac-nen.png" alt="Logo" className="w-full h-full object-contain drop-shadow-sm" />
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
              ? "bg-[#003a73] dark:bg-slate-800 text-white"
              : "hover:bg-[#003a73]/70 dark:hover:bg-slate-800 hover:text-white",
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
              ? "bg-[#003a73] dark:bg-slate-800 text-white"
              : "hover:bg-[#003a73]/70 dark:hover:bg-slate-800 hover:text-white",
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
              ? "bg-[#003a73] dark:bg-slate-800 text-white"
              : "hover:bg-[#003a73]/70 dark:hover:bg-slate-800 hover:text-white",
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
              ? "bg-[#003a73] dark:bg-slate-800 text-white"
              : "hover:bg-[#003a73]/70 dark:hover:bg-slate-800 hover:text-white",
          )}
        >
          <Receipt className="w-4 h-4" />
          Báo cáo doanh thu
        </button>
      </nav>

      <div className="px-4 pb-6 mt-auto">
        <div className="border-t border-[#003a73] dark:border-slate-800 pt-4 space-y-2">
          <button
            onClick={() => onChangeView("guide")}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium",
              currentView === "guide"
                ? "bg-[#003a73] dark:bg-slate-800 text-white"
                : "hover:bg-[#003a73]/70 dark:hover:bg-slate-800 hover:text-white"
            )}
          >
            <HelpCircle className="w-4 h-4" />
            Hướng dẫn sử dụng
          </button>
          <button
            onClick={handleBackup}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium hover:bg-[#003a73]/70 dark:hover:bg-slate-800 hover:text-white"
          >
            <Download className="w-4 h-4" />
            Sao lưu dữ liệu
          </button>
          <button
            onClick={handleRestore}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium hover:bg-[#003a73]/70 dark:hover:bg-slate-800 hover:text-white"
          >
            <Upload className="w-4 h-4" />
            Phục hồi dữ liệu
          </button>
          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 mt-4 rounded-lg transition-colors text-sm font-medium text-rose-300 hover:bg-rose-900/30 hover:text-rose-200 border border-transparent hover:border-rose-900/50"
            >
              <LogOut className="w-4 h-4" />
              Đăng xuất
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
