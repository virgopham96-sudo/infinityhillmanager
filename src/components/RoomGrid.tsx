import { Room } from '../types';
import RoomCard from './RoomCard';

interface RoomGridProps {
  rooms: Room[];
  onRoomSelect: (room: Room) => void;
}

export default function RoomGrid({ rooms, onRoomSelect }: RoomGridProps) {
  // Group rooms by floor
  const floors = Array.from({ length: 4 }, (_, i) => i + 1).sort((a, b) => b - a); // Floor 4 down to 1

  return (
    <div className="space-y-8 pb-12">
      {floors.map(floor => {
        const floorRooms = rooms.filter(r => r.floor === floor);
        return (
          <div key={floor} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-semibold font-sans tracking-tight text-slate-800 mb-6 flex items-center gap-3">
              Tầng {floor}
              <span className="text-sm font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                {floorRooms.length} phòng
              </span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8 gap-4">
              {floorRooms.map(room => (
                <RoomCard key={room.id} room={room} onClick={onRoomSelect} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
