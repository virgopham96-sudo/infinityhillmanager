import React, { useState, useEffect, useRef } from "react";
import { useStore } from "../store";
import { 
  Building, 
  Palette, 
  Database, 
  Download, 
  Upload, 
  RotateCcw, 
  Check, 
  Cloud, 
  Trash2, 
  Moon, 
  Sun,
  LayoutGrid,
  TrendingUp,
  Sliders,
  Sparkles
} from "lucide-react";
import { motion } from "motion/react";
import toast from "react-hot-toast";
import { 
  generateSqlBackup, 
  parseSqlBackup, 
  normalizeJsonBackup 
} from "../utils/backup";

export default function SettingsView() {
  const { rooms, bookings, restoreData } = useStore();
  
  // Hotel info state
  const [hotelName, setHotelName] = useState(() => localStorage.getItem("hotelName") || "Infinity Hill");
  const [hotelPhone, setHotelPhone] = useState(() => localStorage.getItem("hotelPhone") || "0987 654 321");
  const [hotelAddress, setHotelAddress] = useState(() => localStorage.getItem("hotelAddress") || "Lương Sơn, Hòa Bình");
  const [accentColor, setAccentColor] = useState(() => localStorage.getItem("hotelAccent") || "#004b93");

  // Theme support
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));

  // Drag and drop state
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Sync light/dark class with document root
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const handleSaveProfile = () => {
    localStorage.setItem("hotelName", hotelName);
    localStorage.setItem("hotelPhone", hotelPhone);
    localStorage.setItem("hotelAddress", hotelAddress);
    
    // Dispatch custom event to notify Sidebar and other components
    window.dispatchEvent(new Event("hotel-name-updated"));
    toast.success("Đã cập nhật thông tin khách sạn!");
  };

  const handleSaveAccent = (color: string) => {
    localStorage.setItem("hotelAccent", color);
    setAccentColor(color);
    window.dispatchEvent(new Event("hotel-accent-updated"));
    toast.success("Thay đổi màu sắc thương hiệu thành công!");
  };

  const handleToggleTheme = (mode: "light" | "dark") => {
    const root = document.documentElement;
    if (mode === "dark") {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
      toast.success("Đã đổi sang Chế độ tối");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
      toast.success("Đã đổi sang Chế độ sáng");
    }
  };

  const handleBackup = () => {
    const data = { rooms, bookings };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${hotelName.toLowerCase().replace(/\s+/g, "_")}_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Đã tạo file sao lưu JSON và tải xuống!");
  };

  const handleBackupSql = () => {
    const sqlContent = generateSqlBackup(rooms, bookings, hotelName);
    const blob = new Blob([sqlContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${hotelName.toLowerCase().replace(/\s+/g, "_")}_supabase_backup_${new Date().toISOString().slice(0, 10)}.sql`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Đã tạo file SQL Supabase và tải xuống thành công!");
  };

  const processBackupFile = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      let toastId = "";
      try {
        const text = event.target?.result as string;
        const trimmedText = text.trim();
        
        // Check if SQL format
        const isSql = file.name.endsWith(".sql") || 
                      trimmedText.startsWith("--") || 
                      trimmedText.toLowerCase().startsWith("create") || 
                      trimmedText.toLowerCase().startsWith("insert");

        if (isSql) {
          const parsed = parseSqlBackup(text);
          if (parsed.rooms.length > 0 || parsed.bookings.length > 0) {
            if (window.confirm(`Phát hiện file sao lưu SQL Supabase gồm ${parsed.rooms.length} phòng và ${parsed.bookings.length} lượt đặt. Bạn có thực sự muốn xóa dữ liệu hiện tại để thay thế bằng dữ liệu từ SQLite/Supabase này?`)) {
              toastId = toast.loading("Đang khôi phục từ SQL...");
              await restoreData(parsed.rooms, parsed.bookings);
              toast.success("Hoàn tất khôi phục dữ liệu từ SQL Supabase!", { id: toastId });
            }
          } else {
            toast.error("Không tìm thấy dữ liệu SQL hợp lệ (INSERT INTO rooms hoặc bookings)!");
          }
        } else {
          // JSON path
          const data = JSON.parse(text);
          const parsed = normalizeJsonBackup(data);
          
          if ((parsed.rooms && parsed.rooms.length > 0) || (parsed.bookings && parsed.bookings.length > 0)) {
            if (window.confirm("Thao tác này sẽ xóa sạch dữ liệu phòng và lịch đặt hiện tại để thay bằng bản sao lưu của bạn. Bạn chắc chắn chứ?")) {
              toastId = toast.loading("Đang khôi phục dữ liệu...");
              await restoreData(parsed.rooms || [], parsed.bookings || []);
              toast.success("Khôi phục dữ liệu hệ thống thành công!", { id: toastId });
            }
          } else {
            toast.error("Nội dung file JSON trống hoặc không khớp định dạng!");
          }
        }
      } catch (err: any) {
        if (toastId) {
          toast.error("Khôi phục thất bại: " + (err?.message || "Lỗi xử lý file."), { id: toastId });
        } else {
          toast.error("Không thể đọc file sao lưu. Vui lòng thử lại.");
        }
      }
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type === "application/json" || file.name.endsWith(".json") || file.name.endsWith(".sql"))) {
      await processBackupFile(file);
    } else {
      toast.error("Vui lòng chỉ thả tập tin định dạng .json hoặc .sql");
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processBackupFile(file);
    }
  };

  const colors = [
    { value: "#004b93", name: "Trầm ấm (Xanh lục quân)" },
    { value: "#0ea5e9", name: "Hiện đại (Ocean Blue)" },
    { value: "#10b981", name: "Thanh mát (Forest Gold)" },
    { value: "#6366f1", name: "Sáng tạo (Indigo Purple)" },
    { value: "#f59e0b", name: "Cổ điển (Royal Amber)" }
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Title block */}
      <div className="flex flex-col gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
          <Sliders className="w-5 h-5 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider font-mono">Bảng điều khiển</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
          Cài đặt & Cấu hình thiết bị
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Tùy chỉnh nhận diện thương hiệu khách sạn của bạn, thiết lập giao diện hiển thị tối ưu trên di động, quản lý sao lưu dữ liệu đám mây.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column - Settings form */}
        <div className="space-y-8 lg:col-span-7">
          
          {/* Card 1: Hotel Info */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-50 dark:border-slate-800 pb-3">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">Thông tin địa điểm</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">Tên và địa chỉ hiển thị trong báo cáo và tiêu đề ứng dụng</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Tên khách sạn / Resort
                </label>
                <input
                  type="text"
                  value={hotelName}
                  onChange={(e) => setHotelName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="Nhập tên resort, villa..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Điện thoại liên hệ
                  </label>
                  <input
                    type="text"
                    value={hotelPhone}
                    onChange={(e) => setHotelPhone(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="Hotline đặt phòng"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Địa chỉ
                  </label>
                  <input
                    type="text"
                    value={hotelAddress}
                    onChange={(e) => setHotelAddress(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="Địa chỉ chi nhánh"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveProfile}
                className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition-colors shadow-sm cursor-pointer"
              >
                Cập nhật cấu hình
              </button>
            </div>
          </div>

          {/* Card 2: Personalization & Themes */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-50 dark:border-slate-800 pb-3">
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">Nhận diện thương hiệu & Sắc màu</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">Tùy biến bộ màu nhấn chủ đạo và kiểu dáng hiển thị</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                  Giao diện hệ thống
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div
                    onClick={() => handleToggleTheme("light")}
                    className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                      !isDark 
                        ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 font-semibold" 
                        : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <Sun className="w-5 h-5 shrink-0" />
                    <span className="text-sm">Chế độ sáng</span>
                  </div>
                  <div
                    onClick={() => handleToggleTheme("dark")}
                    className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                      isDark 
                        ? "border-indigo-500 bg-indigo-950/20 text-indigo-400 font-semibold" 
                        : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <Moon className="w-5 h-5 shrink-0" />
                    <span className="text-sm">Chế độ tối (OLED)</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                  Màu nhấn logo & Thanh Sidebar
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {colors.map((c) => (
                    <div
                      key={c.value}
                      onClick={() => handleSaveAccent(c.value)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer gap-2 transition-all ${
                        accentColor === c.value
                          ? "border-slate-900 dark:border-slate-300 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium scale-[1.03]"
                          : "border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-500"
                      }`}
                    >
                      <span className="w-6 h-6 rounded-full shadow-inner" style={{ backgroundColor: c.value }}></span>
                      <span className="text-[10px] text-center truncate w-full">{c.name.split(" ")[0]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right column - Data & Analytics */}
        <div className="space-y-8 lg:col-span-5">
          
          {/* Card 3: Cloud Database & Backup Center */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-50 dark:border-slate-800 pb-3">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">Dữ liệu & Sao lưu đám mây</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">Sao lưu an toàn, phục hồi tức thì dữ liệu phòng ngủ</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Cloud Sync Status Indicator */}
              <div className="flex items-center justify-between p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                  <Cloud className="w-4 h-4 animate-bounce" />
                  <span className="text-xs font-semibold">Kết nối Firestore Cloud</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Đã đồng bộ
                </div>
              </div>

              {/* Download Backup */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleBackup}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer border border-transparent hover:border-slate-300 dark:hover:border-slate-600 uppercase tracking-wide"
                >
                  <Download className="w-4 h-4 text-indigo-500" />
                  Sao lưu dạng JSON (.json)
                </button>
                
                <button
                  type="button"
                  onClick={handleBackupSql}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-xl transition-all cursor-pointer border border-transparent hover:border-indigo-300 dark:hover:border-indigo-800 uppercase tracking-wide"
                >
                  <Database className="w-4 h-4 text-emerald-500" />
                  Sao lưu dạng SQL (.sql)
                </button>
              </div>

              {/* Custom File Upload Drag and Drop zone */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Phục hồi từ File sao lưu (JSON hoặc SQL)
                </label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                    isDragActive
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20"
                      : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950/30"
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileInputChange}
                    accept="application/json,.sql,text/plain"
                    className="hidden"
                  />
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full mb-3 shadow-inner">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Nhấp để chọn hoặc Kéo thả tập tin JSON/SQL vào đây
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">
                    Hỗ trợ cả file cấu trúc .json và file SQL backup (.sql) tương thích với SQLite / Supabase / PostgreSQL.
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Card 4: System info & quick metrics */}
          <div className="bg-gradient-to-br from-blue-900 to-[#003a73] text-white rounded-2xl shadow-md p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-200" />
              <span className="text-[10px] uppercase font-mono tracking-widest text-blue-200">Trạng thái vận hành</span>
            </div>
            
            <div className="space-y-3">
              <div className="text-sm font-semibold text-blue-100 font-sans">
                {hotelName} Manager
              </div>
              <p className="text-xs text-blue-200/80 leading-relaxed">
                Hệ thống đang phục vụ quản lý thời gian thực gồm <b>{rooms.length} phòng</b> trên hệ cơ sở dữ liệu đám mây đa nền tảng.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3">
              <div className="p-3 bg-white/5 backdrop-blur-md rounded-xl border border-white/10">
                <span className="block text-[10px] text-blue-200/60 uppercase font-semibold">Phòng đang mở</span>
                <span className="text-xl font-bold tracking-tight text-white">{rooms.length} phòng</span>
              </div>
              <div className="p-3 bg-white/5 backdrop-blur-md rounded-xl border border-white/10">
                <span className="block text-[10px] text-blue-200/60 uppercase font-semibold">Tổng số giao dịch</span>
                <span className="text-xl font-bold tracking-tight text-white">{bookings.length} lượt</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
