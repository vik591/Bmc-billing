import React, { useState, useEffect } from 'react';
import { customersApiService } from '../lib/apiService';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { Users, Search, Phone, Mail, IndianRupee } from 'lucide-react';

export const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await customersApiService.getAll();
      setCustomers(response.data);
    } catch (error) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery)
  );

  return (
    <div className="p-4 md:p-8 lg:p-12" data-testid="customers-page">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-heading font-bold mb-2 flex items-center gap-3" data-testid="page-title">
          <Users className="w-10 h-10 text-[#D4AF37]" />
          Customers
        </h1>
        <p className="text-zinc-400">Manage your customer database</p>
      </div>

      <Card className="p-6 mb-6 bg-zinc-900/50 border border-zinc-800/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <Input
            data-testid="customer-search-input"
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-zinc-950 border-zinc-800"
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((customer) => (
          <Card
            key={customer.id}
            data-testid={`customer-card-${customer.id}`}
            className="p-6 bg-zinc-900/50 border border-zinc-800/50 hover:border-[#D4AF37]/30 transition-all duration-300 hover:-translate-y-1"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                <span className="text-xl font-bold text-[#D4AF37]">
                  {customer.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm text-zinc-500">
                {new Date(customer.last_visit).toLocaleDateString()}
              </span>
            </div>
            
            <h3 className="text-xl font-heading font-semibold mb-3">{customer.name}</h3>
            
            <div className="space-y-2 text-sm text-zinc-400">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>{customer.phone}</span>
              </div>
              {customer.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>{customer.email}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <IndianRupee className="w-4 h-4" />
                <span className="font-semibold text-[#D4AF37]">
                  Total Purchases: ₹{customer.total_purchases.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredCustomers.length === 0 && (
        <Card className="p-12 bg-zinc-900/50 border border-zinc-800/50 text-center">
          <Users className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-500 text-lg">No customers found</p>
        </Card>
      )}
    </div>
  );
};