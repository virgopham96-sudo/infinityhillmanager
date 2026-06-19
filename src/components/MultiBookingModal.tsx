import React, { useState, useEffect } from "react";
import { Room } from "../types";
import { formatCurrency, calculateTotalPrice, cn } from "../lib/utils";
import { format, addDays, set, startOfDay } from "date-fns";
import toast from "react-hot-toast";
import { X, Clock, User, CreditCard, Users, Edit3 } from "lucide-react";

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
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [checkIn, setCheckIn] = useState(
    format(defaultCheckIn, "yyyy-MM-dd'T'HH:mm"),
  );
  const [checkOut, setCheckOut] = useState(
    format(defaultCheckOut, "yyyy-MM-dd'T'HH:mm"),
  );
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
  const [customPrices, setCustomPrices] = useState<Record<string, number>>({});
  const [editingRoomPriceId, setEditingRoomPriceId] = useState<string | null>(null);
  const [tempCustomPrice, setTempCustomPrice] = useState<number>(0);
  const [contextMenuPos, setContextMenuPos] = useState<{x: number, y: number} | null>(null);
  const [isFlexibleTotal, setIsFlexibleTotal] = useState(false);
  const [flexibleTotal, setFlexibleTotal] = useState(0);

  const [selectedGroup, setSelectedGroup] = useState<{
    guestName: string;
    roomIds: string[];
    totalDeposit: number;
    notes: string;
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
        notes: string;
        checkIn: string;
        checkOut: string;
        customPrices: Record<string, number>;
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
            notes: room.notes || "",
            checkIn: room.checkInTime || "",
            checkOut: room.checkOutTime || "",
            customPrices: {},
          };
        }
        groups[key].roomIds.push(room.id);
        groups[key].totalDeposit += room.deposit || 0;
        if (room.isFlexiblePrice && room.flexiblePrice !== undefined) {
          groups[key].customPrices[room.id] = room.flexiblePrice;
        }
      }

      if (room.reservations) {
        room.reservations.forEach((res) => {
          const key = `${res.guestName}_${res.checkInTime}_${res.checkOutTime}`;
          if (!groups[key]) {
            groups[key] = {
              guestName: res.guestName,
              roomIds: [],
              totalDeposit: 0,
              notes: res.notes || "",
              checkIn: res.checkInTime,
              checkOut: res.checkOutTime,
              customPrices: {},
            };
          }
          if (!groups[key].roomIds.includes(room.id)) {
            groups[key].roomIds.push(room.id);
            groups[key].totalDeposit += res.deposit || 0;
            if (res.isFlexiblePrice && res.flexiblePrice !== undefined) {
              groups[key].customPrices[room.id] = res.flexiblePrice;
            }
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
      setNotes("");
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
      setNotes(group.notes);
      setSelectedRoomIds(group.roomIds);
      if (group.checkIn) {
        setCheckIn(format(new Date(group.checkIn), "yyyy-MM-dd'T'HH:mm"));
      }
      if (group.checkOut) {
        setCheckOut(format(new Date(group.checkOut), "yyyy-MM-dd'T'HH:mm"));
      }
      setCustomPrices(group.customPrices);
      
      if (Object.keys(group.customPrices).length > 0 && Object.keys(group.customPrices).length >= group.roomIds.length) {
        setIsFlexibleTotal(true);
        setFlexibleTotal(Object.values(group.customPrices).reduce((a, b) => a + b, 0));
      } else {
        setIsFlexibleTotal(false);
        setFlexibleTotal(0);
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

      let newIsFlexiblePrice = room.isFlexiblePrice;
      let newFlexiblePrice = room.flexiblePrice;

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
        newIsFlexiblePrice = undefined;
        newFlexiblePrice = undefined;
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
        isFlexiblePrice: newIsFlexiblePrice,
        flexiblePrice: newFlexiblePrice,
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

      let newIsFlexiblePrice = room.isFlexiblePrice;
      let newFlexiblePrice = room.flexiblePrice;

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
        newIsFlexiblePrice = undefined;
        newFlexiblePrice = undefined;
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
          isFlexiblePrice: newIsFlexiblePrice,
          flexiblePrice: newFlexiblePrice,
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
          notes,
          isFlexiblePrice: isFlexibleTotal || customPrices[room.id] !== undefined,
          flexiblePrice: isFlexibleTotal ? Math.round(flexibleTotal / selectedRoomIds.length) : customPrices[room.id],
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
              notes,
              isFlexiblePrice: isFlexibleTotal || customPrices[room.id] !== undefined,
              flexiblePrice: isFlexibleTotal ? Math.round(flexibleTotal / selectedRoomIds.length) : customPrices[room.id],
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
      if (room.status === "occupied" || room.status === "maintenance") return true;
      if (selectedGroup && selectedGroup.roomIds.includes(room.id)) return false;
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

      let newIsFlexiblePrice = room.isFlexiblePrice;
      let newFlexiblePrice = room.flexiblePrice;

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
            newIsFlexiblePrice = undefined;
            newFlexiblePrice = undefined;
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
        : [...(room.reservations || [])];

      const replacedMain = isEditingGroup &&
        room.status === "reserved" &&
        room.guestName?.toLowerCase() === selectedGroup.guestName.toLowerCase() &&
        room.checkInTime === selectedGroup.checkIn &&
        room.checkOutTime === selectedGroup.checkOut;

      if (!selectedRoomIds.includes(room.id)) {
        return {
          ...room,
          status: newStatus,
          guestName: newGuestName,
          deposit: newDeposit,
          checkInTime: newCheckInTime,
          checkOutTime: newCheckOutTime,
          isFlexiblePrice: newIsFlexiblePrice,
          flexiblePrice: newFlexiblePrice,
          reservations: filteredReservations,
        };
      }

      // If we are checking in THIS room but it had a different main reservation, 
      // we must save the old main reservation so it's not lost
      if (room.status === "reserved" && !replacedMain && room.guestName && room.checkInTime && room.checkOutTime) {
        filteredReservations.push({
          id: Date.now().toString() + Math.random().toString(),
          guestName: room.guestName,
          checkInTime: room.checkInTime,
          checkOutTime: room.checkOutTime,
          deposit: room.deposit,
          notes: room.notes,
          isFlexiblePrice: room.isFlexiblePrice,
          flexiblePrice: room.flexiblePrice
        });
      }

      return {
        ...room,
        status: "occupied" as const,
        guestName,
        deposit: depositPerRoom,
        notes,
        isFlexiblePrice: isFlexibleTotal || customPrices[room.id] !== undefined,
        flexiblePrice: isFlexibleTotal ? Math.round(flexibleTotal / selectedRoomIds.length) : customPrices[room.id],
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

  const handleContextMenu = (e: React.MouseEvent, roomId: string) => {
    e.preventDefault();
    setEditingRoomPriceId(roomId);
    
    const currentCustom = customPrices[roomId];
    if (currentCustom !== undefined) {
      setTempCustomPrice(currentCustom);
    } else {
      const room = rooms.find(r => r.id === roomId);
      if (room) {
        const defaultCalculatedPrice = calculateTotalPrice(checkIn, checkOut, room.weekdayPrice, room.weekendPrice);
        setTempCustomPrice(defaultCalculatedPrice);
      }
    }
    setContextMenuPos({ x: e.clientX, y: e.clientY });
  };

  const handleSaveCustomPrice = () => {
    if (editingRoomPriceId) {
      setCustomPrices(prev => ({
        ...prev,
        [editingRoomPriceId]: tempCustomPrice
      }));
    }
    setContextMenuPos(null);
    setEditingRoomPriceId(null);
  };

  const handleCancelCustomPrice = () => {
    setContextMenuPos(null);
    setEditingRoomPriceId(null);
  };

  const overrideCustomPrice = (roomId: string) => {
    setCustomPrices(prev => {
      const next = { ...prev };
      delete next[roomId];
      return next;
    });
  };

  const totalExpectedPrice = isFlexibleTotal ? flexibleTotal : selectedRoomIds.reduce((total, id) => {
    const room = selectableRooms.find((r) => r.id === id);
    if (!room) return total;
    if (customPrices[id] !== undefined) {
      return total + customPrices[id];
    }
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
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
            <h3 className="font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-2">
              Xác nhận hủy
            </h3>
            <button
              onClick={() => setShowConfirmCancel(false)}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700/50 rounded-lg text-slate-500 dark:text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-5 text-sm text-slate-700 dark:text-slate-300">
            Bạn có chắc chắn muốn hủy toàn bộ đặt phòng của đoàn này không?
          </div>
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex gap-3 justify-end items-center">
            <button
              onClick={() => setShowConfirmCancel(false)}
              className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 text-sm font-medium rounded-lg transition-colors mr-auto"
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
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 flex justify-between items-center border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
            Đặt nhiều phòng / Check-in đoàn
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
          {error && (
            <div className="bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 p-3 rounded-lg text-sm border border-rose-100 dark:border-rose-800 flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="text-rose-400 hover:text-rose-600 dark:text-rose-500 dark:hover:text-rose-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {existingGroups.length > 0 && (
            <div className="bg-blue-50/50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/50 mb-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                Chọn đoàn đã đặt trước (Tùy chọn)
              </label>
              <select
                value={selectedGroup ? existingGroups.findIndex(g => g.guestName === selectedGroup.guestName && g.checkIn === selectedGroup.checkIn) : ""}
                onChange={handleSelectGroup}
                className="w-full border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none border bg-white dark:bg-slate-800 dark:text-slate-100"
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
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                Tên đoàn / Khách hàng đại diện
              </label>
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Nhập tên khách hàng"
                className="w-full border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none border bg-white dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  Từ ngày (Check-in)
                </label>
                <input
                  type="datetime-local"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none border bg-white dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  Đến ngày (Check-out)
                </label>
                <input
                  type="datetime-local"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none border bg-white dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
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
                className="w-full border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none border bg-white dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
                <User className="w-4 h-4 text-transparent" />
                Ghi chú
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Nhập yêu cầu đặc biệt hoặc ghi chú thêm (nếu có)"
                className="w-full border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow outline-none border bg-white dark:bg-slate-800 dark:text-slate-100 min-h-[80px]"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-end mb-3">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
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
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
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
                    onContextMenu={(e) => {
                      if (isSelected) {
                        handleContextMenu(e, room.id);
                      } else {
                        e.preventDefault();
                        toast("Vui lòng chọn phòng trước khi sửa riêng giá", { icon: "ℹ️" });
                      }
                    }}
                    className={cn(
                      "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer relative",
                      isSelected
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-blue-300 dark:hover:border-blue-700",
                    )}
                  >
                    {isSelected && customPrices[room.id] !== undefined && (
                      <div className="absolute top-1.5 right-1.5 text-amber-500" title={`Giá tùy chỉnh: ${formatCurrency(customPrices[room.id])}`}>
                        <Edit3 className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <span className="font-bold text-lg">{room.id}</span>
                    <span className="text-xs font-medium opacity-70">
                      {room.type}
                    </span>
                    {room.status !== "available" && (
                      <span className="text-[10px] mt-1 text-slate-400 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-full">
                        {statusLabels[room.status]}
                      </span>
                    )}
                  </button>
                );
              })}
              {selectableRooms.length === 0 && (
                <div className="col-span-full py-6 text-center text-slate-500 dark:text-slate-400 text-sm">
                  Không còn phòng
                </div>
              )}
            </div>
          </div>

          <div className="mt-auto p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800/50 flex flex-col gap-2">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-emerald-200/50 dark:border-emerald-800/50">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isFlexibleTotal} 
                  onChange={(e) => setIsFlexibleTotal(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
                <span className="text-sm font-medium text-emerald-900 dark:text-emerald-100 cursor-pointer">Giá linh hoạt (Tổng tiền cả đoàn)</span>
              </label>
            </div>
            
            {isFlexibleTotal && (
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-emerald-900 dark:text-emerald-100 pl-6">Nhập tổng tiền:</span>
                <input 
                  type="text"
                  value={flexibleTotal === 0 ? "" : new Intl.NumberFormat("vi-VN").format(flexibleTotal)}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, "");
                    setFlexibleTotal(raw ? parseInt(raw, 10) : 0);
                  }}
                  placeholder="Nhập tổng tiền thực tế..."
                  className="w-1/2 md:w-1/3 border-slate-300 dark:border-slate-600 rounded-md p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none border bg-white dark:bg-slate-800 dark:text-slate-100 placeholder:text-slate-400 text-right font-bold text-emerald-700 dark:text-emerald-400"
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-emerald-900 dark:text-emerald-100 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Tổng tiền dự kiến ({selectedRoomIds.length} phòng):
              </span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400 text-lg">
                {formatCurrency(totalExpectedPrice)}
              </span>
            </div>
            {totalDeposit > 0 && (
              <div className="flex items-center justify-between text-amber-600 dark:text-amber-500 border-t border-emerald-200/50 dark:border-emerald-800/50 pt-2 mt-1">
                <span className="text-sm font-medium">Đã cọc:</span>
                <span className="font-semibold text-base">
                  -{formatCurrency(totalDeposit)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between text-emerald-900 dark:text-emerald-100 border-t border-emerald-200/50 dark:border-emerald-800/50 pt-2 mt-1">
              <span className="text-sm font-medium">Còn lại (ước tính):</span>
              <span className="font-bold text-xl">
                {formatCurrency(Math.max(0, totalExpectedPrice - totalDeposit))}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex gap-3 justify-end items-center">
          {selectedGroup && (
            <button
              onClick={() => setShowConfirmCancel(true)}
              className="px-4 py-2.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 text-sm font-medium rounded-lg transition-colors border border-rose-200 dark:border-rose-800/50"
            >
              Hủy cả đoàn
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 text-sm font-medium rounded-lg transition-colors mr-auto"
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

      {contextMenuPos && editingRoomPriceId && (
        <div 
          className="fixed z-[70] bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 w-64 overflow-hidden"
          style={{ 
            left: Math.min(contextMenuPos.x, window.innerWidth - 260), 
            top: Math.min(contextMenuPos.y, window.innerHeight - 150) 
          }}
        >
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
            <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-100">
              Sửa giá phòng {editingRoomPriceId}
            </h4>
            <button
              onClick={handleCancelCustomPrice}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4 flex flex-col gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Số tiền (VNĐ)
              </label>
              <input 
                type="text" 
                autoFocus
                value={tempCustomPrice === 0 ? "" : new Intl.NumberFormat("vi-VN").format(tempCustomPrice)}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, "");
                  setTempCustomPrice(raw ? parseInt(raw, 10) : 0);
                }}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
            {customPrices[editingRoomPriceId] !== undefined && (
              <button 
                onClick={() => {
                  overrideCustomPrice(editingRoomPriceId);
                  handleCancelCustomPrice();
                }}
                className="text-xs text-rose-600 dark:text-rose-400 hover:underline text-left mt-1"
              >
                Xóa giá tùy chỉnh (Dùng giá mặc định)
              </button>
            )}
            <div className="flex gap-2 justify-end mt-2">
              <button 
                onClick={handleCancelCustomPrice}
                className="px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md text-xs font-medium transition-colors"
              >
                Hủy
              </button>
              <button 
                onClick={handleSaveCustomPrice}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium transition-colors"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

