export interface Room {
  id: string;
  name: string;
  users: number;
}
export interface RoomSnapshot {
  id: string;
  ts: string;
  text: string;
  note?: string;
}
