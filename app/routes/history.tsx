import { Outlet } from "react-router";

export default function HistoryLayout() {
  return (
    <div className="space-y-6">
      <Outlet />
    </div>
  );
}
