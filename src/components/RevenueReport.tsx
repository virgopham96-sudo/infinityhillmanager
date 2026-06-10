import { useState, useMemo } from "react";
import { BookingRecord } from "../types";
import { formatCurrency } from "../lib/utils";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
  startOfYear,
  endOfYear,
  isWithinInterval,
  subMonths,
  subDays,
  subYears,
} from "date-fns";
import { vi } from "date-fns/locale";
import * as xlsx from "xlsx";
import {
  Calendar,
  TrendingUp,
  Users,
  ArrowRight,
  Receipt,
  Trash2,
  Download,
  Edit,
} from "lucide-react";

interface RevenueReportProps {
  bookings: BookingRecord[];
  onRemoveBooking?: (id: string) => void;
  onUpdateBooking?: (booking: BookingRecord) => void;
}

const MINIBAR_ITEMS = [
  { id: "mi_coc", name: "Mì cốc Hảo Hảo", price: 20000 },
  { id: "bim_bim", name: "Bim bim", price: 15000 },
  { id: "snack_khoai_tay", name: "Snack khoai tây", price: 50000 },
  { id: "mit_say", name: "Mít sấy", price: 70000 },
  { id: "bo_kho", name: "Bò khô", price: 100000 },
  { id: "nuoc_loc", name: "Nước lọc", price: 10000 },
  { id: "red_bull", name: "Bò húc (Red Bull)", price: 20000 },
  { id: "bia_halong", name: "Bia Hạ Long Bạc", price: 25000 },
  { id: "oreo", name: "Bánh Oreo", price: 20000 },
];

export default function RevenueReport({
  bookings,
  onRemoveBooking,
  onUpdateBooking,
}: RevenueReportProps) {
  const [periodType, setPeriodType] = useState<"day" | "month" | "year">(
    "month",
  );
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [deleteBookingId, setDeleteBookingId] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  
  const [editingBooking, setEditingBooking] = useState<BookingRecord | null>(null);
  const [editRoomPrice, setEditRoomPrice] = useState(0);
  const [editDeposit, setEditDeposit] = useState(0);
  const [editMinibar, setEditMinibar] = useState<Record<string, number>>({});
  const [editCompensation, setEditCompensation] = useState(0);
  const [editNotes, setEditNotes] = useState("");

  const editMinibarTotal = MINIBAR_ITEMS.reduce(
    (sum, item) => sum + item.price * (editMinibar[item.id] || 0),
    0
  );
  const editTotalPrice = editRoomPrice + editMinibarTotal + editCompensation - editDeposit;

  const completedBookings = useMemo(() => {
    let start, end;
    if (periodType === "day") {
      start = startOfDay(selectedDate);
      end = endOfDay(selectedDate);
    } else if (periodType === "month") {
      start = startOfMonth(selectedDate);
      end = endOfMonth(selectedDate);
    } else {
      start = startOfYear(selectedDate);
      end = endOfYear(selectedDate);
    }

    return bookings
      .filter((b) => b.status === "completed")
      .filter((b) => isWithinInterval(parseISO(b.checkOut), { start, end }))
      .sort(
        (a, b) =>
          new Date(b.checkOut).getTime() - new Date(a.checkOut).getTime(),
      );
  }, [bookings, selectedDate, periodType]);

  const totalRevenue = completedBookings.reduce(
    (sum, b) => sum + b.totalPrice,
    0,
  );
  const totalGuests = new Set(completedBookings.map((b) => b.guestName)).size;

  const previousPeriodBookings = useMemo(() => {
    let prevDate;
    if (periodType === "day") {
      prevDate = subDays(selectedDate, 1);
    } else if (periodType === "month") {
      prevDate = subMonths(selectedDate, 1);
    } else {
      prevDate = subYears(selectedDate, 1);
    }

    let start, end;
    if (periodType === "day") {
      start = startOfDay(prevDate);
      end = endOfDay(prevDate);
    } else if (periodType === "month") {
      start = startOfMonth(prevDate);
      end = endOfMonth(prevDate);
    } else {
      start = startOfYear(prevDate);
      end = endOfYear(prevDate);
    }

    return bookings
      .filter((b) => b.status === "completed")
      .filter((b) => isWithinInterval(parseISO(b.checkOut), { start, end }));
  }, [bookings, selectedDate, periodType]);

  const prevTotalRevenue = previousPeriodBookings.reduce(
    (sum, b) => sum + b.totalPrice,
    0,
  );

  const growthRate =
    prevTotalRevenue === 0
      ? 100
      : ((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100;

  const periodLabel =
    periodType === "day"
      ? "ngày trước"
      : periodType === "month"
        ? "tháng trước"
        : "năm trước";
  const periodCurrentLabel =
    periodType === "day" ? "ngày" : periodType === "month" ? "tháng" : "năm";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 font-sans tracking-tight">
            Báo cáo doanh thu
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Tổng hợp doanh thu và các giao dịch trong {periodCurrentLabel}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={periodType}
            onChange={(e) =>
              setPeriodType(e.target.value as "day" | "month" | "year")
            }
            className="border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none border bg-white dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="day">Theo ngày</option>
            <option value="month">Theo tháng</option>
            <option value="year">Theo năm</option>
          </select>
          <Calendar className="w-5 h-5 text-slate-400 dark:text-slate-500 ml-1 hidden sm:block" />
          {periodType === "day" && (
            <input
              type="date"
              value={format(selectedDate, "yyyy-MM-dd")}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none border bg-white dark:bg-slate-800 dark:text-slate-200 flex-1"
            />
          )}
          {periodType === "month" && (
            <input
              type="month"
              value={format(selectedDate, "yyyy-MM")}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none border bg-white dark:bg-slate-800 dark:text-slate-200 flex-1"
            />
          )}
          {periodType === "year" && (
            <input
              type="number"
              min="2000"
              max="2100"
              value={selectedDate.getFullYear()}
              onChange={(e) => {
                const val = e.target.value;
                if (val && parseInt(val) >= 2000 && parseInt(val) <= 2100) {
                  const newDate = new Date(selectedDate);
                  newDate.setFullYear(parseInt(val));
                  setSelectedDate(newDate);
                }
              }}
              className="border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none border bg-white dark:bg-slate-800 dark:text-slate-200 w-24 flex-1 text-center"
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-xl">
              <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Tổng doanh thu
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                {formatCurrency(totalRevenue)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm mt-4 pt-4 border-t border-slate-50 dark:border-slate-800">
            <span
              className={`font-semibold ${growthRate >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}
            >
              {growthRate >= 0 ? "+" : ""}
              {growthRate.toFixed(1)}%
            </span>
            <span className="text-slate-500 dark:text-slate-400">so với {periodLabel}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Lượt khách đã trả phòng
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                {completedBookings.length}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm mt-4 pt-4 border-t border-slate-50 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400">
              Gồm{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {totalGuests}
              </span>{" "}
              khách hàng duy nhất
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">Lịch sử giao dịch</h3>
          <button
            onClick={() => {
              const exportData = completedBookings.map((b) => ({
                Phòng: b.roomId,
                "Khách hàng": b.guestName,
                "Thời gian nhận phòng": format(parseISO(b.checkIn), "dd/MM/yyyy HH:mm"),
                "Thời gian trả phòng": format(parseISO(b.checkOut), "dd/MM/yyyy HH:mm"),
                "Doanh thu (VNĐ)": b.totalPrice,
              }));
              const worksheet = xlsx.utils.json_to_sheet(exportData);
              const workbook = xlsx.utils.book_new();
              xlsx.utils.book_append_sheet(workbook, worksheet, "DoanhThu");
              xlsx.writeFile(workbook, `Doanh_Thu_${format(new Date(), "yyyy_MM_dd")}.xlsx`);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Xuất Excel
          </button>
        </div>

        {completedBookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase text-xs font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4">Phòng</th>
                  <th className="px-6 py-4">Khách hàng</th>
                  <th className="px-6 py-4">Thời gian</th>
                  <th className="px-6 py-4 text-right">Doanh thu</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {completedBookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {booking.roomId}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => {
                          setEditingBooking(booking);
                          setEditRoomPrice(booking.checkoutDetails?.roomPrice || booking.totalPrice);
                          setEditDeposit(booking.checkoutDetails?.deposit || 0);
                          setEditMinibar(booking.checkoutDetails?.minibar || {});
                          setEditCompensation(booking.checkoutDetails?.compensation || 0);
                          setEditNotes(booking.notes || "");
                        }}
                        className="text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors text-left"
                      >
                        {booking.guestName}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        {format(parseISO(booking.checkIn), "dd/MM/yyyy", {
                          locale: vi,
                        })}
                        <ArrowRight className="w-3 h-3 text-slate-300 dark:text-slate-600" />
                        {format(parseISO(booking.checkOut), "dd/MM/yyyy", {
                          locale: vi,
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(booking.totalPrice)}
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingBooking(booking);
                          setEditRoomPrice(booking.checkoutDetails?.roomPrice || booking.totalPrice);
                          setEditDeposit(booking.checkoutDetails?.deposit || 0);
                          setEditMinibar(booking.checkoutDetails?.minibar || {});
                          setEditCompensation(booking.checkoutDetails?.compensation || 0);
                          setEditNotes(booking.notes || "");
                        }}
                        className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        title="Chỉnh sửa doanh thu"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setDeleteBookingId(booking.id);
                          setDeletePassword("");
                          setDeleteError("");
                        }}
                        className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                        title="Xóa lịch sử"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <Receipt className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p>
              Không có giao dịch nào được hoàn tất trong {periodCurrentLabel}{" "}
              này.
            </p>
          </div>
        )}
      </div>

      {deleteBookingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-sm overflow-hidden p-6 border border-transparent dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">
              Xác nhận xóa
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Vui lòng nhập mật khẩu để xóa lịch sử giao dịch này.
            </p>
            {deleteError && (
              <p className="text-sm text-rose-600 dark:text-rose-400 mb-3 font-medium bg-rose-50 dark:bg-rose-900/30 p-2 rounded-md border border-rose-100 dark:border-rose-800/50">
                {deleteError}
              </p>
            )}
            <input
              type="password"
              className="w-full border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none border bg-white dark:bg-slate-800 dark:text-slate-100 mb-4"
              placeholder="Nhập mật khẩu..."
              value={deletePassword}
              onChange={(e) => {
                setDeletePassword(e.target.value);
                setDeleteError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (deletePassword === "12345678@") {
                    onRemoveBooking?.(deleteBookingId);
                    setDeleteBookingId(null);
                  } else {
                    setDeleteError("Mật khẩu không chính xác!");
                  }
                }
              }}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteBookingId(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (deletePassword === "12345678@") {
                    onRemoveBooking?.(deleteBookingId);
                    setDeleteBookingId(null);
                  } else {
                    setDeleteError("Mật khẩu không chính xác!");
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
      {editingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-lg overflow-hidden p-6 max-h-[90vh] flex flex-col border border-transparent dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 shrink-0">
              Chi tiết thanh toán phòng {editingBooking.roomId}
            </h3>
            
            <div className="space-y-4 mb-6 overflow-y-auto flex-1 pr-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tiền phòng (VNĐ)
                  </label>
                  <input
                    type="text"
                    value={editRoomPrice === 0 ? "" : new Intl.NumberFormat("vi-VN").format(editRoomPrice)}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, "");
                      setEditRoomPrice(raw ? parseInt(raw, 10) : 0);
                    }}
                    className="w-full border-slate-300 dark:border-slate-700 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none border bg-white dark:bg-slate-800 dark:text-slate-100 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Trừ tiền cọc (VNĐ)
                  </label>
                  <input
                    type="text"
                    value={editDeposit === 0 ? "" : new Intl.NumberFormat("vi-VN").format(editDeposit)}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, "");
                      setEditDeposit(raw ? parseInt(raw, 10) : 0);
                    }}
                    className="w-full border-slate-300 dark:border-slate-700 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none border bg-white dark:bg-slate-800 dark:text-slate-100 shadow-sm"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <label className="block text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2">
                  Minibar & Dịch vụ
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[150px] overflow-y-auto pr-1">
                  {MINIBAR_ITEMS.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                          {item.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {new Intl.NumberFormat("vi-VN").format(item.price)} đ
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            setEditMinibar((prev) => ({
                              ...prev,
                              [item.id]: Math.max(0, (prev[item.id] || 0) - 1),
                            }))
                          }
                          className="w-6 h-6 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                        >
                          -
                        </button>
                        <span className="text-sm font-medium w-4 text-center dark:text-slate-200">
                          {editMinibar[item.id] || 0}
                        </span>
                        <button
                          onClick={() =>
                            setEditMinibar((prev) => ({
                              ...prev,
                              [item.id]: (prev[item.id] || 0) + 1,
                            }))
                          }
                          className="w-6 h-6 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Giá trị đền bù (VNĐ)
                </label>
                <input
                  type="text"
                  value={editCompensation === 0 ? "" : new Intl.NumberFormat("vi-VN").format(editCompensation)}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, "");
                    setEditCompensation(raw ? parseInt(raw, 10) : 0);
                  }}
                  placeholder="Nhập số tiền đền bù nếu có..."
                  className="w-full border-slate-300 dark:border-slate-700 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none border bg-white dark:bg-slate-800 dark:text-slate-100 shadow-sm"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Ghi chú
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none border bg-white dark:bg-slate-800 dark:text-slate-100 min-h-[60px]"
                  placeholder="Thêm ghi chú (tùy chọn)"
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg border border-blue-100 dark:border-blue-800/50 mt-4 flex items-center justify-between">
                <span className="font-medium text-blue-900 dark:text-blue-200">Tổng thu thực tế:</span>
                <span className="text-lg font-bold text-blue-700 dark:text-blue-300">
                  {new Intl.NumberFormat("vi-VN").format(Math.max(0, editTotalPrice))} đ
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 shrink-0 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setEditingBooking(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (onUpdateBooking && editingBooking) {
                    onUpdateBooking({
                      ...editingBooking,
                      totalPrice: Math.max(0, editTotalPrice),
                      notes: editNotes,
                      checkoutDetails: {
                        roomPrice: editRoomPrice,
                        deposit: editDeposit,
                        minibar: editMinibar,
                        compensation: editCompensation
                      }
                    });
                  }
                  setEditingBooking(null);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
