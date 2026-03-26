import React, { useEffect, useState } from 'react';
import { dashboardAPI, productsAPI, repairBillsAPI } from '../lib/api';
import { Card } from '../components/ui/card';
import { toast } from 'sonner';
import { IndianRupee, TrendingUp, Package, AlertCircle, Wrench, ShoppingBag } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await dashboardAPI.getStats();
      setStats(response.data);
    } catch (error) {
      toast.error('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statsCards = [
    {
      title: "Today's Sales",
      value: `₹${stats?.today_sales?.toLocaleString('en-IN') || 0}`,
      icon: ShoppingBag,
      color: 'text-[#D4AF37]',
      bg: 'bg-[#D4AF37]/10',
    },
    {
      title: 'Monthly Sales',
      value: `₹${stats?.monthly_sales?.toLocaleString('en-IN') || 0}`,
      icon: TrendingUp,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
    },
    {
      title: 'Products Sold',
      value: stats?.total_products_sold || 0,
      icon: Package,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      title: 'Pending Payments',
      value: `₹${stats?.pending_payments?.toLocaleString('en-IN') || 0}`,
      icon: AlertCircle,
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10',
    },
    {
      title: 'Repairs In Progress',
      value: stats?.repair_orders_in_progress || 0,
      icon: Wrench,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
    {
      title: 'Low Stock Alert',
      value: stats?.low_stock_products || 0,
      icon: AlertCircle,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
    },
  ];

  return (
    <div className="p-4 md:p-8 lg:p-12" data-testid="dashboard-page">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-heading font-bold mb-2" data-testid="dashboard-title">
          Dashboard
        </h1>
        <p className="text-zinc-400">Overview of your shop performance</p>
      </div>

      {/* Stats Grid - Bento Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {statsCards.map((stat, index) => (
          <Card
            key={index}
            data-testid={`stat-card-${index}`}
            className="p-6 bg-zinc-900/50 backdrop-blur-md border border-zinc-800/50 hover:border-[#D4AF37]/30 transition-all duration-300 hover:-translate-y-1"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
            <p className="text-sm text-zinc-500 mb-1">{stat.title}</p>
            <p className="text-3xl font-heading font-bold" data-testid={`stat-value-${index}`}>
              {stat.value}
            </p>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 bg-gradient-to-br from-zinc-900 to-black border border-[#D4AF37]/50 shadow-[0_0_20px_rgba(212,175,55,0.1)]">
          <h3 className="text-xl font-heading font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <a
              href="/product-billing"
              data-testid="quick-action-product-billing"
              className="block p-4 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors border border-zinc-700/50"
            >
              <p className="font-medium">New Product Bill</p>
              <p className="text-sm text-zinc-500">Create a new invoice for products</p>
            </a>
            <a
              href="/repair-billing"
              data-testid="quick-action-repair-billing"
              className="block p-4 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors border border-zinc-700/50"
            >
              <p className="font-medium">New Repair Bill</p>
              <p className="text-sm text-zinc-500">Create a repair order</p>
            </a>
            <a
              href="/inventory"
              data-testid="quick-action-inventory"
              className="block p-4 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors border border-zinc-700/50"
            >
              <p className="font-medium">Add Stock</p>
              <p className="text-sm text-zinc-500">Update inventory</p>
            </a>
          </div>
        </Card>

        <Card className="p-6 bg-zinc-900/50 border border-zinc-800/50">
          <h3 className="text-xl font-heading font-semibold mb-4">Sales Overview</h3>
          <div className="h-64">
            {stats && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-4xl font-heading font-bold gold-text-gradient mb-2">
                    ₹{stats.monthly_sales.toLocaleString('en-IN')}
                  </p>
                  <p className="text-zinc-500">This Month's Revenue</p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};