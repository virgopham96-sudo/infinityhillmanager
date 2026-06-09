import { useState, useEffect } from "react";
import { Room } from "../types";
import { formatCurrency, calculateTotalPrice, cn } from "../lib/utils";
import { format, addDays, set } from "date-fns";
import { X, Clock, User, CreditCard, CheckSquare, Square } from "lucide-react";

interface MultiBookingModalProps {
  rooms: Room[];
  onClose: () => void;
  onUpdateRooms: (rooms: Room[]) => void;
}

export default function MultiBookingModal({
  rooms,
  onClose,
  onUpdateRooms,
}: MultiBookingModalProps) {
  const defaultCheckIn = set(new Date(), {
    hours: 14,
    minutes: 0,
    seconds: 0,
    milliseconds: 0,
  });
  const defaultCheckOut = addDays(
    set(new Date(), { hours: 12, minutes: 0, seconds: 0, milliseconds: 0 }),
    1,
  );

  const [guestName, setGuestName] = useState("");
  const [totalDeposit, setTotalDeposit] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [checkIn, setCheckIn] = useState(
    format(defaultCheckIn, "yyyy-MM-dd'T'HH:mm"),
  );
  const [checkOut, setCheckOut] = useState(
    format(defaultCheckOut, "yyyy-MM-dd'T'HH:mm"),
  );
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const availableRooms = rooms.filter((r) => r.status === "available");

  const handleReserve = () => {
    setError(null);
    if (!guestName) {
      setError("Vui lòng nhập tên khách hàng");
      return;
    }
    if (selectedRoomIds.length === 0) {
      setError("Vui lòng chọn ít nhất 1 phòng");
      return;
    }

    const inDate = new Date(checkIn);
    const outDate = new Date(checkOut);
    if (inDate >= outDate) {
      setError("Thời gian Check-in phải trước Check-out.");
      return;
    }

    const conflictingRooms = selectedRoomIds.filter((id) => {
      const room = rooms.find((r) => r.id === id);
      return room?.reservations?.some((res) => {
        const resIn = new Date(res.checkInTime);
        const resOut = new Date(res.checkOutTime);
        return inDate < resOut && resIn < outDate;
      });
    });

    if (conflictingRooms.length > 0) {
      setError(
        `Các phòng sau bị trùng lịch đặt trước: ${conflictingRooms.join(", ")}`,
      );
      return;
    }

    const depositPerRoom =
      selectedRoomIds.length > 0 ? totalDeposit / selectedRoomIds.length : 0;

    const updatedRooms = availableRooms
      .filter((r) => selectedRoomIds.includes(r.id))
      .map((room) => ({
        ...room,
        status: "reserved" as const,
        guestName,
        deposit: depositPerRoom,
        checkInTime: new Date(checkIn).toISOString(),
        checkOutTime: new Date(checkOut).toISOString(),
      }));

    onUpdateRooms(updatedRooms);
    onClose();
  };

  const handleCheckIn = () => {
    setError(null);
    if (!guestName) {
      setError("Vui lòng nhập tên khách hàng");
      return;
    }
    if (selectedRoomIds.length === 0) {
      setError("Vui lòng chọn ít nhất 1 phòng");
      return;
    }

    const inDate = new Date(checkIn);
    const outDate = new Date(checkOut);
    if (inDate >= outDate) {
      setError("Thời gian Check-in phải trước Check-out.");
      return;
    }

    const conflictingRooms = selectedRoomIds.filter((id) => {
      const room = rooms.find((r) => r.id === id);
      return room?.reservations?.some((res) => {
        const resIn = new Date(res.checkInTime);
        const resOut = new Date(res.checkOutTime);
        return inDate < resOut && resIn < outDate;
      });
    });

    if (conflictingRooms.length > 0) {
      setError(
        `Các phòng sau bị trùng lịch đặt trước: ${conflictingRooms.join(", ")}`,
      );
      return;
    }

    const depositPerRoom =
      selectedRoomIds.length > 0 ? totalDeposit / selectedRoomIds.length : 0;

    const updatedRooms = availableRooms
      .filter((r) => selectedRoomIds.includes(r.id))
      .map((room) => ({
        ...room,
        status: "occupied" as const,
        guestName,
        deposit: depositPerRoom,
        checkInTime: new Date(checkIn).toISOString(),
        checkOutTime: new Date(checkOut).toISOString(),
      }));

    onUpdateRooms(updatedRooms);
    onClose();
  };

  const toggleRoom = (id: string) => {
    setSelectedRoomIds((prev) =>
      prev.includes(id) ? prev.filter((rId) => rId !== id) : [...prev, id],
    );
  };

  const totalExpectedPrice = selectedRoomIds.reduce((total, id) => {
    const room = availableRooms.find((r) => r.id === id);
    if (!room) return total;
    return (
      total +
      calculateTotalPrice(
        checkIn,
        checkOut,
        room.weekdayPrice,
        room.weekendPrice,
      )
    );
  }, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 flex justify-between items-center border-b border-slate-100 bg-slate-50">
          <h2 className="text-xl font-semibold text-slate-800">
            Đặt nhiều phòng
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
          {error && (
            <div className="bg-rose-50 text-rose-600 p-3 rounded-lg text-sm border border-rose-100 flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="text-rose-400 hover:text-rose-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                Tên đoàn / Khách hàng đại diện
              </label>
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Nhập tên khách hàng"
                className="w-full border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none border bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  Từ ngày (Check-in)
                </label>
                <input
                  type="datetime-local"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none border bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  Đến ngày (Check-out)
                </label>
                <input
                  type="datetime-local"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none border bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-slate-400" />
                Tổng tiền cọc trả trước (VNĐ)
              </label>
              <input
                type="number"
                value={totalDeposit}
                min="0"
                step="10000"
                onChange={(e) => setTotalDeposit(Number(e.target.value))}
                placeholder="Nhập tổng số tiền khách cọc"
                className="w-full border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none border bg-white"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-end mb-3">
              <label className="block text-sm font-medium text-slate-700">
                Chọn phòng trống ({selectedRoomIds.length} đã chọn)
              </label>
              <button
                onClick={() =>
                  setSelectedRoomIds(
                    selectedRoomIds.length === availableRooms.length
                      ? []
                      : availableRooms.map((r) => r.id),
                  )
                }
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {selectedRoomIds.length === availableRooms.length
                  ? "Bỏ chọn tất cả"
                  : "Chọn tất cả"}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 max-h-48 overflow-y-auto p-1">
              {availableRooms.map((room) => {
                const isSelected = selectedRoomIds.includes(room.id);
                return (
                  <button
                    key={room.id}
                    onClick={() => toggleRoom(room.id)}
                    className={cn(
                      "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer",
                      isSelected
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-white text-slate-600 hover:border-blue-300",
                    )}
                  >
                    <span className="font-bold text-lg">{room.id}</span>
                    <span className="text-xs font-medium opacity-70">
                      {room.type}
                    </span>
                  </button>
                );
              })}
              {availableRooms.length === 0 && (
                <div className="col-span-full py-6 text-center text-slate-500 text-sm">
                  Không còn phòng trống
                </div>
              )}
            </div>
          </div>

          <div className="mt-auto p-4 bg-emerald-50 rounded-lg border border-emerald-100 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-emerald-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Tổng tiền dự kiến ({selectedRoomIds.length} phòng):
              </span>
              <span className="font-bold text-emerald-700 text-lg">
                {formatCurrency(totalExpectedPrice)}
              </span>
            </div>
            {totalDeposit > 0 && (
              <div className="flex items-center justify-between text-amber-600 border-t border-emerald-200/50 pt-2 mt-1">
                <span className="text-sm font-medium">Đã cọc:</span>
                <span className="font-semibold text-base">
                  -{formatCurrency(totalDeposit)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between text-emerald-900 border-t border-emerald-200/50 pt-2 mt-1">
              <span className="text-sm font-medium">Còn lại (ước tính):</span>
              <span className="font-bold text-xl">
                {formatCurrency(Math.max(0, totalExpectedPrice - totalDeposit))}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3 justify-end items-center">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-slate-600 hover:bg-slate-200/50 text-sm font-medium rounded-lg transition-colors mr-auto"
          >
            Hủy
          </button>

          <button
            onClick={handleReserve}
            disabled={selectedRoomIds.length === 0}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            Lưu đặt trước
          </button>
          <button
            onClick={handleCheckIn}
            disabled={selectedRoomIds.length === 0}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            Đoàn nhận phòng
          </button>
        </div>
      </div>
    </div>
  );
}
