import React, { useState, useEffect } from 'react';
import { emiAPI } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { toast } from 'sonner';
import { CreditCard, Plus, Calendar, IndianRupee } from 'lucide-react';

export const EMIPage = () => {
  const [emis, setEmis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddEMI, setShowAddEMI] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedEMI, setSelectedEMI] = useState(null);

  const [emiForm, setEmiForm] = useState({
    customer_name: '',
    customer_phone: '',
    total_amount: 0,
    down_payment: 0,
    installment_amount: 0,
    total_installments: 0,
  });

  const [paymentAmount, setPaymentAmount] = useState(0);

  useEffect(() => {
    fetchEMIs();
  }, []);

  const fetchEMIs = async () => {
    try {
      const response = await emiAPI.getAll();
      setEmis(response.data);
    } catch (error) {
      toast.error('Failed to load EMI records');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEMI = async (e) => {
    e.preventDefault();
    try {
      await emiAPI.create(emiForm);
      toast.success('EMI record created successfully');
      setShowAddEMI(false);
      setEmiForm({
        customer_name: '',
        customer_phone: '',
        total_amount: 0,
        down_payment: 0,
        installment_amount: 0,
        total_installments: 0,
      });
      fetchEMIs();
    } catch (error) {
      toast.error('Failed to create EMI record');
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    try {
      await emiAPI.addPayment({
        emi_id: selectedEMI.id,
        amount: paymentAmount,
      });
      toast.success('Payment recorded successfully');
      setShowPayment(false);
      setSelectedEMI(null);
      setPaymentAmount(0);
      fetchEMIs();
    } catch (error) {
      toast.error('Failed to record payment');
    }
  };

  return (
    <div className="p-4 md:p-8 lg:p-12" data-testid="emi-page">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-2 flex items-center gap-3" data-testid="page-title">
            <CreditCard className="w-10 h-10 text-[#D4AF37]" />
            EMI Tracking
          </h1>
          <p className="text-zinc-400">Manage customer installment payments</p>
        </div>
        <Dialog open={showAddEMI} onOpenChange={setShowAddEMI}>
          <DialogTrigger asChild>
            <Button data-testid="add-emi-button" className="bg-[#D4AF37] text-black hover:bg-[#b5952f]">
              <Plus className="w-4 h-4 mr-2" />
              Add EMI
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-zinc-800">
            <DialogHeader>
              <DialogTitle className="text-2xl font-heading">Create EMI Record</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddEMI} className="space-y-4">
              <div>
                <Label>Customer Name</Label>
                <Input
                  data-testid="emi-customer-name-input"
                  value={emiForm.customer_name}
                  onChange={(e) => setEmiForm({ ...emiForm, customer_name: e.target.value })}
                  className="bg-zinc-950 border-zinc-800"
                  required
                />
              </div>
              <div>
                <Label>Phone Number</Label>
                <Input
                  data-testid="emi-customer-phone-input"
                  value={emiForm.customer_phone}
                  onChange={(e) => setEmiForm({ ...emiForm, customer_phone: e.target.value })}
                  className="bg-zinc-950 border-zinc-800"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Total Amount (₹)</Label>
                  <Input
                    type="number"
                    data-testid="emi-total-amount-input"
                    value={emiForm.total_amount}
                    onChange={(e) => setEmiForm({ ...emiForm, total_amount: parseFloat(e.target.value) })}
                    className="bg-zinc-950 border-zinc-800"
                    required
                  />
                </div>
                <div>
                  <Label>Down Payment (₹)</Label>
                  <Input
                    type="number"
                    data-testid="emi-down-payment-input"
                    value={emiForm.down_payment}
                    onChange={(e) => setEmiForm({ ...emiForm, down_payment: parseFloat(e.target.value) })}
                    className="bg-zinc-950 border-zinc-800"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Installment Amount (₹)</Label>
                  <Input
                    type="number"
                    data-testid="emi-installment-amount-input"
                    value={emiForm.installment_amount}
                    onChange={(e) => setEmiForm({ ...emiForm, installment_amount: parseFloat(e.target.value) })}
                    className="bg-zinc-950 border-zinc-800"
                    required
                  />
                </div>
                <div>
                  <Label>Total Installments</Label>
                  <Input
                    type="number"
                    data-testid="emi-total-installments-input"
                    value={emiForm.total_installments}
                    onChange={(e) => setEmiForm({ ...emiForm, total_installments: parseInt(e.target.value) })}
                    className="bg-zinc-950 border-zinc-800"
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full bg-[#D4AF37] text-black hover:bg-[#b5952f]">
                Create EMI
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {emis.map((emi) => (
          <Card
            key={emi.id}
            data-testid={`emi-card-${emi.id}`}
            className="p-6 bg-zinc-900/50 border border-zinc-800/50 hover:border-[#D4AF37]/30 transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-heading font-semibold">{emi.customer_name}</h3>
                <p className="text-sm text-zinc-500">{emi.customer_phone}</p>
              </div>
              <span
                className={`px-3 py-1 rounded text-sm font-medium ${
                  emi.paid_installments >= emi.total_installments
                    ? 'bg-green-500/10 text-green-500'
                    : 'bg-yellow-500/10 text-yellow-500'
                }`}
              >
                {emi.paid_installments}/{emi.total_installments}
              </span>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Total Amount</span>
                <span className="font-semibold">₹{emi.total_amount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Pending Amount</span>
                <span className="font-semibold text-yellow-500">₹{emi.pending_amount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Installment</span>
                <span className="font-semibold text-[#D4AF37]">₹{emi.installment_amount.toLocaleString('en-IN')}</span>
              </div>
              {emi.next_due_date && (
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Next Due</span>
                  <span className="font-semibold flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(emi.next_due_date).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {emi.paid_installments < emi.total_installments && (
              <Button
                onClick={() => {
                  setSelectedEMI(emi);
                  setPaymentAmount(emi.installment_amount);
                  setShowPayment(true);
                }}
                data-testid={`record-payment-${emi.id}`}
                className="w-full bg-[#D4AF37] text-black hover:bg-[#b5952f]"
              >
                Record Payment
              </Button>
            )}
          </Card>
        ))}
      </div>

      {emis.length === 0 && (
        <Card className="p-12 bg-zinc-900/50 border border-zinc-800/50 text-center">
          <CreditCard className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-500 text-lg">No EMI records found</p>
        </Card>
      )}

      {/* Payment Dialog */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-2xl font-heading">Record Payment</DialogTitle>
          </DialogHeader>
          {selectedEMI && (
            <form onSubmit={handleAddPayment} className="space-y-4">
              <div className="p-4 bg-zinc-800/30 rounded-lg">
                <p className="text-sm text-zinc-500 mb-1">Customer</p>
                <p className="font-semibold">{selectedEMI.customer_name}</p>
              </div>
              <div>
                <Label>Payment Amount (₹)</Label>
                <Input
                  type="number"
                  data-testid="payment-amount-input"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value))}
                  className="bg-zinc-950 border-zinc-800"
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-[#D4AF37] text-black hover:bg-[#b5952f]">
                Confirm Payment
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};