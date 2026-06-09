import React, { useState, useEffect } from "react";
import { Room } from "../types";
import { formatCurrency, calculateTotalPrice, cn } from "../lib/utils";
import { format, addDays, set, startOfDay } from "date-fns";
import toast from "react-hot-toast";
import { X, Clock, User, CreditCard, Users } from "lucide-react";

interface MultiBookingModalProps {
  rooms: Room[];
  onClose: () => void;
  onUpdateRooms: (rooms: Room[]) => void;
  initialGuestName?: string;
}

export default function MultiBookingModal({
  rooms,
  onClose,
  onUpdateRooms,
  initialGuestName,
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
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [checkIn, setCheckIn] = useState(
    format(defaultCheckIn, "yyyy-MM-dd'T'HH:mm"),
  );
  const [checkOut, setCheckOut] = useState(
    format(defaultCheckOut, "yyyy-MM-dd'T'HH:mm"),
  );
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<{
    guestName: string;
    roomIds: string[];
    totalDeposit: number;
    checkIn: string;
    checkOut: string;
  } | null>(null);

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const selectableRooms = rooms.filter((r) => r.status !== "maintenance");

  const existingGroups = (() => {
    const groups: Record<
      string,
      {
        guestName: string;
        roomIds: string[];
        totalDeposit: number;
        checkIn: string;
        checkOut: string;
      }
    > = {};

    rooms.forEach((room) => {
      if (room.status === "reserved" && room.guestName) {
        const key = `${room.guestName}_${room.checkInTime}_${room.checkOutTime}`;
        if (!groups[key]) {
          groups[key] = {
            guestName: room.guestName,
            roomIds: [],
            totalDeposit: 0,
            checkIn: room.checkInTime || "",
            checkOut: room.checkOutTime || "",
          };
        }
        groups[key].roomIds.push(room.id);
        // Only add up if it wasn't already added (we don't have total deposit per group reliably without dividing, but deposit is per room now)
        // Wait, deposit in room is PER ROOM. So total is sum of deposits
        groups[key].totalDeposit += room.deposit || 0;
      }

      if (room.reservations) {
        room.reservations.forEach((res) => {
          const key = `${res.guestName}_${res.checkInTime}_${res.checkOutTime}`;
          if (!groups[key]) {
            groups[key] = {
              guestName: res.guestName,
              roomIds: [],
              totalDeposit: 0,
              checkIn: res.checkInTime,
              checkOut: res.checkOutTime,
            };
          }
          if (!groups[key].roomIds.includes(room.id)) {
            groups[key].roomIds.push(room.id);
            groups[key].totalDeposit += res.deposit || 0;
          }
        });
      }
    });

    return Object.values(groups).sort(
      (a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime(),
    );
  })();

  const selectGroupByIndex = (idxStr: string) => {
    if (idxStr === "") {
      setSelectedGroup(null);
      setGuestName("");
      setTotalDeposit(0);
      setSelectedRoomIds([]);
      setCheckIn(format(defaultCheckIn, "yyyy-MM-dd'T'HH:mm"));
      setCheckOut(format(defaultCheckOut, "yyyy-MM-dd'T'HH:mm"));
      return;
    }
    const group = existingGroups[Number(idxStr)];
    if (group) {
      setSelectedGroup(group);
      setGuestName(group.guestName);
      setTotalDeposit(group.totalDeposit);
      setSelectedRoomIds(group.roomIds);
      if (group.checkIn) {
        setCheckIn(format(new Date(group.checkIn), "yyyy-MM-dd'T'HH:mm"));
      }
      if (group.checkOut) {
        setCheckOut(format(new Date(group.checkOut), "yyyy-MM-dd'T'HH:mm"));
      }
      setError(null);
    }
  };

  useEffect(() => {
    if (initialGuestName && existingGroups.length > 0 && !selectedGroup) {
      const idx = existingGroups.findIndex(g => g.guestName === initialGuestName);
      if (idx !== -1) {
        selectGroupByIndex(idx.toString());
      }
    }
  }, [initialGuestName, existingGroups.length]); 

  const handleSelectGroup = (e: React.ChangeEvent<HTMLSelectElement>) => {
    selectGroupByIndex(e.target.value);
  };

  const validateDatesAndOverlaps = () => {
    setError(null);
    if (!guestName) {
      setError("Vui lòng nhập tên khách hàng");
      return false;
    }
    if (selectedRoomIds.length === 0) {
      setError("Vui lòng chọn ít nhất 1 phòng");
      return false;
    }

    const inDate = new Date(checkIn);
    const outDate = new Date(checkOut);
    if (inDate >= outDate) {
      setError("Thời gian Check-in phải trước Check-out.");
      return false;
    }

    const conflictMessages: string[] = [];

    selectedRoomIds.forEach((id) => {
      const room = rooms.find((r) => r.id === id);
      if (!room) return;

      let overlapReason: string | null = null;

      const overlappingRes = room.reservations?.find((res) => {
        // Skip overlap check for reservations belonging to this exact group
        // This allows updating an existing reservation
        if (
          selectedGroup &&
          res.guestName.toLowerCase() === selectedGroup.guestName.toLowerCase() &&
          res.checkInTime === selectedGroup.checkIn &&
          res.checkOutTime === selectedGroup.checkOut
        ) {
          return false;
        }

        const resIn = new Date(res.checkInTime);
        const resOut = new Date(res.checkOutTime);
        return inDate < resOut && resIn < outDate;
      });

      if (overlappingRes) {
        overlapReason = `khách đặt trước: '${overlappingRes.guestName}'`;
      }

      if (!overlapReason && room.status === "maintenance") {
        overlapReason = `đang bảo trì`;
      }

      if (
        !overlapReason &&
        (room.status === "occupied" || room.status === "reserved")
      ) {
        // If it's already reserved for THIS group, it's not a conflict for checking in/updating
        if (
          !(
            selectedGroup &&
            room.status === "reserved" &&
            room.guestName?.toLowerCase() === selectedGroup.guestName.toLowerCase() &&
            room.checkInTime === selectedGroup.checkIn &&
            room.checkOutTime === selectedGroup.checkOut
          )
        ) {
          const mainIn = new Date(room.checkInTime || "");
          const mainOut = new Date(room.checkOutTime || "");
          if (inDate < mainOut && mainIn < outDate) {
            overlapReason = `khách hiện tại: '${room.guestName || "Khách vãng lai"}'`;
          }
        }
      }

      if (overlapReason) {
        conflictMessages.push(`Phòng ${room.id} (${overlapReason})`);
      }
    });

    if (conflictMessages.length > 0) {
      toast.error(`Có xung đột lịch: ${conflictMessages.join("; ")}`, { duration: 4000 });
      setError(`Vui lòng điều chỉnh thời gian. ${conflictMessages.join("; ")}`);
      return false;
    }

    return true;
  };

  const handleCancelGroup = () => {
    if (!selectedGroup) return;

    const isEditingGroup = !!selectedGroup;

    const updatedRooms = rooms.map((room) => {
      let newStatus = room.status;
      let newGuestName = room.guestName;
      let newDeposit = room.deposit;
      let newCheckInTime = room.checkInTime;
      let newCheckOutTime = room.checkOutTime;

      if (
        isEditingGroup &&
        room.status === "reserved" &&
        room.guestName?.toLowerCase() === selectedGroup.guestName.toLowerCase() &&
        room.checkInTime === selectedGroup.checkIn &&
        room.checkOutTime === selectedGroup.checkOut
      ) {
        newStatus = "available";
        newGuestName = undefined;
        newDeposit = undefined;
        newCheckInTime = undefined;
        newCheckOutTime = undefined;
      }

      const filteredReservations = isEditingGroup
        ? (room.reservations || []).filter(
            (r) =>
              !(
                r.guestName.toLowerCase() === selectedGroup.guestName.toLowerCase() &&
                r.checkInTime === selectedGroup.checkIn &&
                r.checkOutTime === selectedGroup.checkOut
              )
          )
        : room.reservations || [];

      return {
        ...room,
        status: newStatus,
        guestName: newGuestName,
        deposit: newDeposit,
        checkInTime: newCheckInTime,
        checkOutTime: newCheckOutTime,
        reservations: filteredReservations,
      };
    });

    onUpdateRooms(updatedRooms);
    onClose();
  };

  const handleReserve = () => {
    if (!validateDatesAndOverlaps()) return;

    const depositPerRoom =
      selectedRoomIds.length > 0 ? totalDeposit / selectedRoomIds.length : 0;

    const isEditingGroup = !!selectedGroup;

    const updatedRooms = rooms.map((room) => {
      let newStatus = room.status;
      let newGuestName = room.guestName;
      let newDeposit = room.deposit;
      let newCheckInTime = room.checkInTime;
      let newCheckOutTime = room.checkOutTime;

      if (
        isEditingGroup &&
        room.status === "reserved" &&
        room.guestName?.toLowerCase() === selectedGroup.guestName.toLowerCase() &&
        room.checkInTime === selectedGroup.checkIn &&
        room.checkOutTime === selectedGroup.checkOut
      ) {
        newStatus = "available";
        newGuestName = undefined;
        newDeposit = 0;
        newCheckInTime = undefined;
        newCheckOutTime = undefined;
      }

      const filteredReservations = isEditingGroup
        ? (room.reservations || []).filter(
            (r) =>
              !(
                r.guestName.toLowerCase() === selectedGroup.guestName.toLowerCase() &&
                r.checkInTime === selectedGroup.checkIn &&
                r.checkOutTime === selectedGroup.checkOut
              )
          )
        : room.reservations || [];

      if (!selectedRoomIds.includes(room.id)) {
        return {
          ...room,
          status: newStatus,
          guestName: newGuestName,
          deposit: newDeposit,
          checkInTime: newCheckInTime,
          checkOutTime: newCheckOutTime,
          reservations: filteredReservations,
        };
      }

      // We are updating or creating reservations
      if (newStatus === "available") {
        return {
          ...room,
          status: "reserved" as const,
          guestName,
          deposit: depositPerRoom,
          checkInTime: new Date(checkIn).toISOString(),
          checkOutTime: new Date(checkOut).toISOString(),
          reservations: filteredReservations,
        };
      } else {
        return {
          ...room,
          reservations: [
            ...filteredReservations,
            {
              id: `R${Date.now()}_${room.id}`,
              guestName,
              deposit: depositPerRoom,
              checkInTime: new Date(checkIn).toISOString(),
              checkOutTime: new Date(checkOut).toISOString(),
            },
          ],
        };
      }
    });

    onUpdateRooms(updatedRooms);
    onClose();
  };

  const handleCheckIn = () => {
    if (!validateDatesAndOverlaps()) return;

    const checkInDate = startOfDay(new Date(checkIn));
    const today = startOfDay(new Date());
    if (checkInDate > today) {
      toast.error("Không thể nhận phòng cho ngày trong tương lai! Vui lòng chọn 'Đặt trước'.");
      return;
    }

    const notAvailableRooms = selectedRoomIds.filter((id) => {
      const room = rooms.find((r) => r.id === id);
      if (!room) return true;
      if (room.status === "available") return false;
      if (
        selectedGroup &&
        room.status === "reserved" &&
        room.guestName?.toLowerCase() === selectedGroup.guestName.toLowerCase() &&
        room.checkInTime === selectedGroup.checkIn &&
        room.checkOutTime === selectedGroup.checkOut
      ) {
        return false;
      }

      // If it's a future reservation, we can check them in NOW if room is available
      return true;
    });

    if (notAvailableRooms.length > 0) {
      setError(
        `Không thể nhận phòng. Các phòng sau không khả dụng (đang có khách khác): ${notAvailableRooms.join(
          ", ",
        )}`,
      );
      return;
    }

    const depositPerRoom =
      selectedRoomIds.length > 0 ? totalDeposit / selectedRoomIds.length : 0;

    const isEditingGroup = !!selectedGroup;

    const updatedRooms = rooms.map((room) => {
      let newStatus = room.status;
      let newGuestName = room.guestName;
      let newDeposit = room.deposit;
      let newCheckInTime = room.checkInTime;
      let newCheckOutTime = room.checkOutTime;

      // Remove current group from future reservations and main status
      if (
        isEditingGroup &&
        room.status === "reserved" &&
        room.guestName?.toLowerCase() === selectedGroup.guestName.toLowerCase() &&
        room.checkInTime === selectedGroup.checkIn &&
        room.checkOutTime === selectedGroup.checkOut
      ) {
            newStatus = "available";
            newGuestName = undefined;
            newDeposit = 0;
            newCheckInTime = undefined;
            newCheckOutTime = undefined;
      }
      
      const filteredReservations = isEditingGroup
        ? (room.reservations || []).filter(
            (r) =>
              !(
                r.guestName.toLowerCase() === selectedGroup.guestName.toLowerCase() &&
                r.checkInTime === selectedGroup.checkIn &&
                r.checkOutTime === selectedGroup.checkOut
              )
          )
        : room.reservations || [];

      if (!selectedRoomIds.includes(room.id)) {
        return {
          ...room,
          status: newStatus,
          guestName: newGuestName,
          deposit: newDeposit,
          checkInTime: newCheckInTime,
          checkOutTime: newCheckOutTime,
          reservations: filteredReservations,
        };
      }

      return {
        ...room,
        status: "occupied" as const,
        guestName,
        deposit: depositPerRoom,
        checkInTime: new Date(checkIn).toISOString(),
        checkOutTime: new Date(checkOut).toISOString(),
        reservations: filteredReservations,
      };
    });

    onUpdateRooms(updatedRooms);
    onClose();
  };

  const toggleRoom = (id: string) => {
    setSelectedRoomIds((prev) =>
      prev.includes(id) ? prev.filter((rId) => rId !== id) : [...prev, id],
    );
  };

  const totalExpectedPrice = selectedRoomIds.reduce((total, id) => {
    const room = selectableRooms.find((r) => r.id === id);
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

  if (showConfirmCancel) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="font-semibold text-rose-600 flex items-center gap-2">
              Xác nhận hủy
            </h3>
            <button
              onClick={() => setShowConfirmCancel(false)}
              className="p-1 hover:bg-slate-200 rounded-lg text-slate-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-5 text-sm text-slate-700">
            Bạn có chắc chắn muốn hủy toàn bộ đặt phòng của đoàn này không?
          </div>
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3 justify-end items-center">
            <button
              onClick={() => setShowConfirmCancel(false)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-200/50 text-sm font-medium rounded-lg transition-colors mr-auto"
            >
              Quay lại
            </button>
            <button
              onClick={() => {
                setShowConfirmCancel(false);
                handleCancelGroup();
              }}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              Đồng ý hủy
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 flex justify-between items-center border-b border-slate-100 bg-slate-50">
          <h2 className="text-xl font-semibold text-slate-800">
            Đặt nhiều phòng / Check-in đoàn
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

          {existingGroups.length > 0 && (
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-2">
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                Chọn đoàn đã đặt trước (Tùy chọn)
              </label>
              <select
                value={selectedGroup ? existingGroups.findIndex(g => g.guestName === selectedGroup.guestName && g.checkIn === selectedGroup.checkIn) : ""}
                onChange={handleSelectGroup}
                className="w-full border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none border bg-white"
              >
                <option value="">-- Chọn khách/đoàn đã đặt trước --</option>
                {existingGroups.map((group, idx) => (
                  <option key={idx} value={idx}>
                    {group.guestName} ({group.roomIds.length} phòng) - Từ{" "}
                    {format(new Date(group.checkIn), "dd/MM HH:mm")}
                  </option>
                ))}
              </select>
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
                type="text"
                value={totalDeposit === 0 ? "" : new Intl.NumberFormat("vi-VN").format(totalDeposit)}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, "");
                  setTotalDeposit(raw ? parseInt(raw, 10) : 0);
                }}
                placeholder="VD: 500.000"
                className="w-full border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none border bg-white"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-end mb-3">
              <label className="block text-sm font-medium text-slate-700">
                Chọn phòng ({selectedRoomIds.length} đã chọn)
              </label>
              <button
                onClick={() =>
                  setSelectedRoomIds(
                    selectedRoomIds.length === selectableRooms.length
                      ? []
                      : selectableRooms.map((r) => r.id),
                  )
                }
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {selectedRoomIds.length === selectableRooms.length
                  ? "Bỏ chọn tất cả"
                  : "Chọn tất cả"}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 max-h-48 overflow-y-auto p-1">
              {selectableRooms.map((room) => {
                const isSelected = selectedRoomIds.includes(room.id);
                // Muted/gray styling if room is occupied/reserved
                const statusLabels: Record<string, string> = {
                  available: "Trống",
                  occupied: "Đang ở",
                  reserved: "Đã đặt",
                };
                return (
                  <button
                    key={room.id}
                    onClick={() => toggleRoom(room.id)}
                    className={cn(
                      "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer relative",
                      isSelected
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-white text-slate-600 hover:border-blue-300",
                    )}
                  >
                    <span className="font-bold text-lg">{room.id}</span>
                    <span className="text-xs font-medium opacity-70">
                      {room.type}
                    </span>
                    {room.status !== "available" && (
                      <span className="text-[10px] mt-1 text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                        {statusLabels[room.status]}
                      </span>
                    )}
                  </button>
                );
              })}
              {selectableRooms.length === 0 && (
                <div className="col-span-full py-6 text-center text-slate-500 text-sm">
                  Không còn phòng
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
          {selectedGroup && (
            <button
              onClick={() => setShowConfirmCancel(true)}
              className="px-4 py-2.5 text-rose-600 hover:bg-rose-50 text-sm font-medium rounded-lg transition-colors border border-rose-200"
            >
              Hủy cả đoàn
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-slate-600 hover:bg-slate-200/50 text-sm font-medium rounded-lg transition-colors mr-auto"
          >
            Hủy lệnh
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
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            Đoàn nhận phòng
          </button>
        </div>
      </div>
    </div>
  );
}

