import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, ShoppingBag, Wrench, Users, Package, CreditCard, FileText, Settings, LogOut, Menu, X } from 'lucide-react';
import { Button } from './ui/button';

export const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Product Billing', href: '/product-billing', icon: ShoppingBag },
    { name: 'Repair Billing', href: '/repair-billing', icon: Wrench },
    { name: 'Customers', href: '/customers', icon: Users },
    { name: 'Inventory', href: '/inventory', icon: Package },
    { name: 'EMI Tracking', href: '/emi', icon: CreditCard },
    { name: 'Reports', href: '/reports', icon: FileText },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-[#09090b] overflow-hidden">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-zinc-900/50 backdrop-blur-md border-r border-zinc-800/50
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-zinc-800/50">
            <h1 className="text-2xl font-heading font-bold gold-text-gradient" data-testid="app-logo">
              BMC
            </h1>
            <p className="text-xs text-zinc-500 mt-1">Bharti Mobile Collection</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  data-testid={`nav-${item.name.toLowerCase().replace(' ', '-')}`}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-md transition-all
                    ${isActive
                      ? 'bg-[#D4AF37] text-black font-semibold shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-zinc-800/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[#D4AF37] flex items-center justify-center text-black font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                <p className="text-xs text-zinc-500 truncate">{user?.role}</p>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              data-testid="logout-button"
              className="w-full bg-zinc-800 text-white border border-zinc-700 hover:bg-zinc-700 hover:border-zinc-600"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between p-4 border-b border-zinc-800/50 bg-zinc-900/50 backdrop-blur-md">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            data-testid="mobile-menu-button"
            className="p-2 rounded-md hover:bg-zinc-800"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <h1 className="text-xl font-heading font-bold gold-text-gradient">BMC</h1>
          <div className="w-10" />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};