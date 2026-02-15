import { Outlet } from 'react-router-dom';

export default function TVLayout() {
  return (
    <div className="min-h-screen bg-black">
      <Outlet />
    </div>
  );
}
