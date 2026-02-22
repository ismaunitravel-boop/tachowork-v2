import Sidebar from './Sidebar';

export default function Layout({ activeModule, onNavigate, children }) {
  return (
    <div className="app-layout">
      <Sidebar activeModule={activeModule} onNavigate={onNavigate} />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
