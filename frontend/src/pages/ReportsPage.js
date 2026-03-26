import React, { useState, useEffect } from 'react';
import { reportsAPI } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { toast } from 'sonner';
import { FileText, Download, TrendingUp, ShoppingBag, Wrench, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export const ReportsPage = () => {
  const [period, setPeriod] = useState('monthly');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReport(period);
  }, [period]);

  const fetchReport = async (selectedPeriod) => {
    setLoading(true);
    try {
      const response = await reportsAPI.getSales(selectedPeriod);
      setReportData(response.data);
    } catch (error) {
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    toast.success('Export feature coming soon!');
  };

  const chartData = reportData
    ? [
        { name: 'Product Sales', value: reportData.total_sales },
        { name: 'Repair Revenue', value: reportData.total_repairs },
        { name: 'Profit', value: reportData.profit },
      ]
    : [];

  return (
    <div className="p-4 md:p-8 lg:p-12" data-testid="reports-page">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-2 flex items-center gap-3" data-testid="page-title">
            <FileText className="w-10 h-10 text-[#D4AF37]" />
            Reports & Analytics
          </h1>
          <p className="text-zinc-400">Track your business performance</p>
        </div>
        <Button
          onClick={exportToExcel}
          data-testid="export-button"
          className="bg-zinc-800 hover:bg-zinc-700"
        >
          <Download className="w-4 h-4 mr-2" />
          Export to Excel
        </Button>
      </div>

      {/* Period Selector */}
      <Card className="p-6 mb-6 bg-zinc-900/50 border border-zinc-800/50">
        <div className="flex gap-3">
          <Button
            onClick={() => setPeriod('daily')}
            data-testid="period-daily"
            className={period === 'daily' ? 'bg-[#D4AF37] text-black' : 'bg-zinc-800'}
          >
            Daily
          </Button>
          <Button
            onClick={() => setPeriod('weekly')}
            data-testid="period-weekly"
            className={period === 'weekly' ? 'bg-[#D4AF37] text-black' : 'bg-zinc-800'}
          >
            Weekly
          </Button>
          <Button
            onClick={() => setPeriod('monthly')}
            data-testid="period-monthly"
            className={period === 'monthly' ? 'bg-[#D4AF37] text-black' : 'bg-zinc-800'}
          >
            Monthly
          </Button>
        </div>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-zinc-400">Loading report...</p>
          </div>
        </div>
      ) : reportData ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="p-6 bg-zinc-900/50 border border-zinc-800/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 rounded-lg bg-[#D4AF37]/10">
                  <ShoppingBag className="w-6 h-6 text-[#D4AF37]" />
                </div>
              </div>
              <p className="text-sm text-zinc-500 mb-1">Product Sales</p>
              <p className="text-3xl font-heading font-bold" data-testid="product-sales-value">
                ₹{reportData.total_sales.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-zinc-600 mt-1">{reportData.product_bills_count} bills</p>
            </Card>

            <Card className="p-6 bg-zinc-900/50 border border-zinc-800/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <Wrench className="w-6 h-6 text-blue-500" />
                </div>
              </div>
              <p className="text-sm text-zinc-500 mb-1">Repair Revenue</p>
              <p className="text-3xl font-heading font-bold" data-testid="repair-revenue-value">
                ₹{reportData.total_repairs.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-zinc-600 mt-1">{reportData.repair_bills_count} repairs</p>
            </Card>

            <Card className="p-6 bg-zinc-900/50 border border-zinc-800/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <TrendingUp className="w-6 h-6 text-green-500" />
                </div>
              </div>
              <p className="text-sm text-zinc-500 mb-1">Total Revenue</p>
              <p className="text-3xl font-heading font-bold" data-testid="total-revenue-value">
                ₹{reportData.total_revenue.toLocaleString('en-IN')}
              </p>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-zinc-900 to-black border border-[#D4AF37]/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 rounded-lg bg-[#D4AF37]/10">
                  <DollarSign className="w-6 h-6 text-[#D4AF37]" />
                </div>
              </div>
              <p className="text-sm text-zinc-500 mb-1">Profit</p>
              <p className="text-3xl font-heading font-bold text-[#D4AF37]" data-testid="profit-value">
                ₹{reportData.profit.toLocaleString('en-IN')}
              </p>
            </Card>
          </div>

          {/* Chart */}
          <Card className="p-6 bg-zinc-900/50 border border-zinc-800/50">
            <h3 className="text-2xl font-heading font-semibold mb-6">Revenue Breakdown</h3>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="name" stroke="#a1a1aa" />
                  <YAxis stroke="#a1a1aa" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      border: '1px solid #27272a',
                      borderRadius: '8px',
                      color: '#fafafa',
                    }}
                    formatter={(value) => `₹${value.toLocaleString('en-IN')}`}
                  />
                  <Legend />
                  <Bar dataKey="value" fill="#D4AF37" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
};