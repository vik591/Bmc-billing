import React, { useState } from 'react';
import { repairBillsAPI } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card } from '../components/ui/card';
import { toast } from 'sonner';
import { Wrench } from 'lucide-react';

export const RepairBillingPage = () => {
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    device_model: '',
    imei_number: '',
    problem_description: '',
    repair_charges: 0,
    advance_paid: 0,
    delivery_status: 'Pending',
  });

  const [recentBills, setRecentBills] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.customer_name || !formData.customer_phone || !formData.device_model) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const response = await repairBillsAPI.create(formData);
      toast.success(`Repair order created: ${response.data.invoice_number}`);
      
      // Open invoice
      window.open(`/repair-invoice/${response.data.id}`, '_blank');
      
      // Reset form
      setFormData({
        customer_name: '',
        customer_phone: '',
        device_model: '',
        imei_number: '',
        problem_description: '',
        repair_charges: 0,
        advance_paid: 0,
        delivery_status: 'Pending',
      });
    } catch (error) {
      toast.error('Failed to create repair order');
    }
  };

  const pendingAmount = formData.repair_charges - formData.advance_paid;

  return (
    <div className="p-4 md:p-8 lg:p-12" data-testid="repair-billing-page">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-heading font-bold mb-2 flex items-center gap-3" data-testid="page-title">
          <Wrench className="w-10 h-10 text-[#D4AF37]" />
          Repair Billing
        </h1>
        <p className="text-zinc-400">Create repair orders for mobile devices</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-8 bg-zinc-900/50 border border-zinc-800/50">
            <form onSubmit={handleSubmit} className="space-y-6" data-testid="repair-form">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-zinc-300 mb-2">Customer Name *</Label>
                  <Input
                    data-testid="customer-name-input"
                    placeholder="Enter customer name"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    className="bg-zinc-950 border-zinc-800 text-white"
                    required
                  />
                </div>
                <div>
                  <Label className="text-zinc-300 mb-2">Phone Number *</Label>
                  <Input
                    data-testid="customer-phone-input"
                    placeholder="Enter phone number"
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                    className="bg-zinc-950 border-zinc-800 text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-zinc-300 mb-2">Device Model *</Label>
                  <Input
                    data-testid="device-model-input"
                    placeholder="e.g., iPhone 13 Pro"
                    value={formData.device_model}
                    onChange={(e) => setFormData({ ...formData, device_model: e.target.value })}
                    className="bg-zinc-950 border-zinc-800 text-white"
                    required
                  />
                </div>
                <div>
                  <Label className="text-zinc-300 mb-2">IMEI Number</Label>
                  <Input
                    data-testid="imei-input"
                    placeholder="Enter IMEI number"
                    value={formData.imei_number}
                    onChange={(e) => setFormData({ ...formData, imei_number: e.target.value })}
                    className="bg-zinc-950 border-zinc-800 text-white"
                  />
                </div>
              </div>

              <div>
                <Label className="text-zinc-300 mb-2">Problem Description *</Label>
                <Textarea
                  data-testid="problem-description-input"
                  placeholder="Describe the issue..."
                  value={formData.problem_description}
                  onChange={(e) => setFormData({ ...formData, problem_description: e.target.value })}
                  className="bg-zinc-950 border-zinc-800 text-white min-h-24"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-zinc-300 mb-2">Repair Charges (₹) *</Label>
                  <Input
                    type="number"
                    data-testid="repair-charges-input"
                    placeholder="0"
                    value={formData.repair_charges}
                    onChange={(e) => setFormData({ ...formData, repair_charges: parseFloat(e.target.value) || 0 })}
                    className="bg-zinc-950 border-zinc-800 text-white"
                    required
                  />
                </div>
                <div>
                  <Label className="text-zinc-300 mb-2">Advance Paid (₹)</Label>
                  <Input
                    type="number"
                    data-testid="advance-paid-input"
                    placeholder="0"
                    value={formData.advance_paid}
                    onChange={(e) => setFormData({ ...formData, advance_paid: parseFloat(e.target.value) || 0 })}
                    className="bg-zinc-950 border-zinc-800 text-white"
                  />
                </div>
              </div>

              <div>
                <Label className="text-zinc-300 mb-2">Delivery Status</Label>
                <Select
                  value={formData.delivery_status}
                  onValueChange={(value) => setFormData({ ...formData, delivery_status: value })}
                >
                  <SelectTrigger data-testid="delivery-status-select" className="bg-zinc-950 border-zinc-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                data-testid="submit-repair-button"
                className="w-full bg-[#D4AF37] text-black hover:bg-[#b5952f] font-semibold shadow-[0_0_15px_rgba(212,175,55,0.3)] py-6 text-lg"
              >
                Create Repair Order
              </Button>
            </form>
          </Card>
        </div>

        <div>
          <Card className="p-6 bg-gradient-to-br from-zinc-900 to-black border border-[#D4AF37]/50 sticky top-6">
            <h3 className="text-xl font-heading font-semibold mb-4">Summary</h3>
            <div className="space-y-4">
              <div className="p-4 bg-zinc-800/30 rounded-md">
                <p className="text-sm text-zinc-500 mb-1">Repair Charges</p>
                <p className="text-2xl font-heading font-bold text-[#D4AF37]">
                  ₹{formData.repair_charges.toFixed(2)}
                </p>
              </div>
              <div className="p-4 bg-zinc-800/30 rounded-md">
                <p className="text-sm text-zinc-500 mb-1">Advance Paid</p>
                <p className="text-xl font-heading font-semibold text-green-500">
                  ₹{formData.advance_paid.toFixed(2)}
                </p>
              </div>
              <div className="p-4 bg-zinc-800/30 rounded-md border-2 border-[#D4AF37]/30">
                <p className="text-sm text-zinc-500 mb-1">Pending Amount</p>
                <p className="text-2xl font-heading font-bold text-yellow-500" data-testid="pending-amount">
                  ₹{pendingAmount.toFixed(2)}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};