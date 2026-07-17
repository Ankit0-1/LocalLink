import { Outlet } from 'react-router-dom';

export function RootLayout() {
  return (
    <main>
      <h1>LocalLink</h1>
      <Outlet />
    </main>
  );
}
