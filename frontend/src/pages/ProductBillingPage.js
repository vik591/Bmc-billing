import React, { useState, useEffect } from 'react';
import { productsAPI, productBillsAPI } from '../lib/apiService';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card } from '../components/ui/card';
import { toast } from 'sonner';
import { Search, Plus, Minus, Trash2, Scan, X } from 'lucide-react';
import { BarcodeScanner } from '../components/BarcodeScanner';

export const ProductBillingPage = () => {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [cart, setCart] = useState([]);
  const [showScanner, setShowScanner] = useState(false);

  const [billData, setBillData] = useState({
    gstRate: 0,
    discountType: 'amount',
    discountValue: 0,
    paymentMode: 'Cash',
    customerName: '',
    customerPhone: '',
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productsAPI.getAll();
      setProducts(response.data);
    } catch (error) {
      toast.error('Failed to load products');
    }
  };

  const searchProducts = async (query) => {
    if (!query) {
      setSearchResults([]);
      return;
    }
    try {
      const response = await productsAPI.search(query);
      setSearchResults(response.data);
    } catch (error) {
      toast.error('Search failed');
    }
  };

  const addToCart = (product) => {
    const existingItem = cart.find((item) => item.product_id === product.id);
    if (existingItem) {
      updateQuantity(product.id, existingItem.quantity + 1);
    } else {
      setCart([
        ...cart,
        {
          product_id: product.id,
          product_name: product.name,
          quantity: 1,
          price: product.price,
          total: product.price,
        },
      ]);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    setCart(
      cart.map((item) =>
        item.product_id === productId
          ? { ...item, quantity: newQuantity, total: item.price * newQuantity }
          : item
      )
    );
  };

  const updatePrice = (productId, newPrice) => {
    if (newPrice < 0) return;
    setCart(
      cart.map((item) =>
        item.product_id === productId
          ? { ...item, price: newPrice, total: newPrice * item.quantity }
          : item
      )
    );
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter((item) => item.product_id !== productId));
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
    const gstAmount = (subtotal * billData.gstRate) / 100;
    
    let discountAmount = 0;
    if (billData.discountType === 'amount') {
      discountAmount = billData.discountValue;
    } else {
      discountAmount = (subtotal * billData.discountValue) / 100;
    }

    const total = subtotal + gstAmount - discountAmount;

    return { subtotal, gstAmount, discountAmount, total };
  };

const handleGenerateBill = async () => {
  if (cart.length === 0) {
    toast.error('Add items to cart first');
    return;
  }

  const { subtotal, gstAmount, discountAmount, total } = calculateTotals();

  try {
    const response = await productBillsAPI.create({
      items: cart.map(i => ({
        product_id: i.product_id,
        product_name: i.product_name,
        quantity: i.quantity,
        price: i.price,
        total: i.total,
        imei1: i.imei1 || "",
        imei2: i.imei2 || ""
      })),
      subtotal,
      gst_rate: billData.gstRate,
      gst_amount: gstAmount,
      discount_type: billData.discountType,
      discount_value: billData.discountValue,
      discount_amount: discountAmount,
      total,
      payment_mode: billData.paymentMode,
      customer_name: billData.customerName || null,
      customer_phone: billData.customerPhone || null,
    });

    toast.success(`Bill created: ${response.data.invoice_number}`);

    // 🔥 FIXED INVOICE OPEN
    window.open(`${window.location.origin}/invoice/${response.data.id}`, '_blank');

    // reset
    setCart([]);
    setBillData({
      gstRate: 0,
      discountType: 'amount',
      discountValue: 0,
      paymentMode: 'Cash',
      customerName: '',
      customerPhone: '',
    });

  } catch (error) {
    console.log(error);
    toast.error('Failed to create bill');
  }
};

  const handleScanSuccess = (barcode) => {
    searchProducts(barcode);
    setShowScanner(false);
  };

  const totals = calculateTotals();

  return (
    <div className="h-full flex flex-col" data-testid="product-billing-page">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-zinc-800/50 bg-zinc-900/30">
        <h1 className="text-3xl md:text-4xl font-heading font-bold" data-testid="page-title">
          Product Billing
        </h1>
        <p className="text-zinc-400 mt-1">Create invoice for mobile accessories and products</p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 md:p-6 overflow-hidden">
        {/* Left: Product Selection */}
        <div className="lg:col-span-7 flex flex-col space-y-4 overflow-y-auto">
          <Card className="p-6 bg-zinc-900/50 border border-zinc-800/50">
            <Label className="text-zinc-300 mb-3 block">Search Products</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <Input
                  data-testid="product-search-input"
                  placeholder="Search by name, category, or barcode..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    searchProducts(e.target.value);
                  }}
                  className="pl-10 bg-zinc-950 border-zinc-800 text-white focus:border-[#D4AF37]"
                  autoFocus
                />
              </div>
              <Button
                onClick={() => setShowScanner(true)}
                data-testid="barcode-scan-button"
                className="bg-zinc-800 hover:bg-zinc-700"
              >
                <Scan className="w-5 h-5" />
              </Button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
                {searchResults.map((product) => (
                  <button
                    key={product.id}
                    data-testid={`search-result-${product.id}`}
                    onClick={() => addToCart(product)}
                    className="w-full p-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-md text-left transition-colors border border-zinc-700/50"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-zinc-500">{product.category}</p>
                      </div>
                      <p className="font-heading font-bold text-[#D4AF37]">₹{product.price}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>

          {/* Cart Items */}
          <Card className="flex-1 p-6 bg-zinc-900/50 border border-zinc-800/50 overflow-y-auto">
            <h3 className="text-xl font-heading font-semibold mb-4">Cart Items</h3>
            {cart.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-zinc-500">
                <p>No items in cart. Search and add products.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.product_id}
                    data-testid={`cart-item-${item.product_id}`}
                    className="p-4 bg-zinc-800/30 rounded-md border border-zinc-700/50"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <p className="font-medium">{item.product_name}</p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product_id)}
                        data-testid={`remove-item-${item.product_id}`}
                        className="text-red-500 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs text-zinc-500 mb-1">Quantity</Label>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                            data-testid={`decrease-qty-${item.product_id}`}
                            className="p-1 bg-zinc-700 hover:bg-zinc-600 rounded"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="font-mono font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                            data-testid={`increase-qty-${item.product_id}`}
                            className="p-1 bg-zinc-700 hover:bg-zinc-600 rounded"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-xs text-zinc-500 mb-1">Price</Label>
                        <Input
                          type="number"
                          value={item.price}
                          onChange={(e) => updatePrice(item.product_id, parseFloat(e.target.value) || 0)}
                          data-testid={`price-input-${item.product_id}`}
                          className="h-8 text-sm bg-zinc-950 border-zinc-700"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-xs text-zinc-500 mb-1">Total</Label>
                        <p className="text-lg font-heading font-bold text-[#D4AF37] mt-1">
                          ₹{item.total.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right: Bill Summary */}
        <div className="lg:col-span-5 flex flex-col space-y-4 overflow-y-auto">
          <Card className="p-6 bg-gradient-to-br from-zinc-900 to-black border border-[#D4AF37]/50">
            <h3 className="text-xl font-heading font-semibold mb-4">Customer Details</h3>
            <div className="space-y-4">
              <div>
                <Label className="text-zinc-300 mb-2">Customer Name (Optional)</Label>
                <Input
                  data-testid="customer-name-input"
                  placeholder="Enter customer name"
                  value={billData.customerName}
                  onChange={(e) => setBillData({ ...billData, customerName: e.target.value })}
                  className="bg-zinc-950 border-zinc-800 text-white"
                />
              </div>
              <div>
                <Label className="text-zinc-300 mb-2">Phone Number (Optional)</Label>
                <Input
                  data-testid="customer-phone-input"
                  placeholder="Enter phone number"
                  value={billData.customerPhone}
                  onChange={(e) => setBillData({ ...billData, customerPhone: e.target.value })}
                  className="bg-zinc-950 border-zinc-800 text-white"
                />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-zinc-900/50 border border-zinc-800/50">
            <h3 className="text-xl font-heading font-semibold mb-4">Bill Settings</h3>
            <div className="space-y-4">
              <div>
                <Label className="text-zinc-300 mb-2">GST (%)</Label>
                <Select
                  value={billData.gstRate.toString()}
                  onValueChange={(value) => setBillData({ ...billData, gstRate: parseFloat(value) })}
                >
                  <SelectTrigger data-testid="gst-select" className="bg-zinc-950 border-zinc-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0%</SelectItem>
                    <SelectItem value="5">5%</SelectItem>
                    <SelectItem value="12">12%</SelectItem>
                    <SelectItem value="18">18%</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-zinc-300 mb-2">Discount Type</Label>
                <Select
                  value={billData.discountType}
                  onValueChange={(value) => setBillData({ ...billData, discountType: value })}
                >
                  <SelectTrigger data-testid="discount-type-select" className="bg-zinc-950 border-zinc-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="amount">Amount (₹)</SelectItem>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-zinc-300 mb-2">
                  Discount {billData.discountType === 'percentage' ? '(%)' : '(₹)'}
                </Label>
                <Input
                  type="number"
                  data-testid="discount-value-input"
                  value={billData.discountValue}
                  onChange={(e) => setBillData({ ...billData, discountValue: parseFloat(e.target.value) || 0 })}
                  className="bg-zinc-950 border-zinc-800 text-white"
                />
              </div>

              <div>
                <Label className="text-zinc-300 mb-2">Payment Mode</Label>
                <Select
                  value={billData.paymentMode}
                  onValueChange={(value) => setBillData({ ...billData, paymentMode: value })}
                >
                  <SelectTrigger data-testid="payment-mode-select" className="bg-zinc-950 border-zinc-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="Card">Card</SelectItem>
                    <SelectItem value="EMI">EMI</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-zinc-900 to-black border border-[#D4AF37]/50">
            <h3 className="text-xl font-heading font-semibold mb-4">Bill Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-zinc-400">
                <span>Subtotal</span>
                <span className="font-mono">₹{totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>GST ({billData.gstRate}%)</span>
                <span className="font-mono">₹{totals.gstAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Discount</span>
                <span className="font-mono text-red-400">-₹{totals.discountAmount.toFixed(2)}</span>
              </div>
              <div className="h-px bg-zinc-700 my-2" />
              <div className="flex justify-between items-center">
                <span className="text-xl font-heading font-semibold">Total</span>
                <span className="text-3xl font-heading font-bold text-[#D4AF37]" data-testid="bill-total">
                  ₹{totals.total.toFixed(2)}

{/* 🔥 IMEI INPUTS */}
<div className="mt-3 space-y-2">
  <Input
    placeholder="IMEI 1"
    value={item.imei1 || ""}
    onChange={(e) =>
      setCart(cart.map(i =>
        i.product_id === item.product_id
          ? { ...i, imei1: e.target.value }
          : i
      ))
    }
    className="bg-zinc-950 border-zinc-700 text-white"
  />

  <Input
    placeholder="IMEI 2"
    value={item.imei2 || ""}
    onChange={(e) =>
      setCart(cart.map(i =>
        i.product_id === item.product_id
          ? { ...i, imei2: e.target.value }
          : i
      ))
    }
    className="bg-zinc-950 border-zinc-700 text-white"
  />
</div>
                </span>
              </div>
            </div>

            <Button
              onClick={handleGenerateBill}
              data-testid="generate-bill-button"
              disabled={cart.length === 0}
              className="w-full mt-6 bg-[#D4AF37] text-black hover:bg-[#b5952f] font-semibold shadow-[0_0_15px_rgba(212,175,55,0.3)] py-6 text-lg"
            >
              Generate Bill
            </Button>
          </Card>
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-lg p-6 max-w-lg w-full border border-zinc-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-heading font-semibold">Scan Barcode</h3>
              <button 
                onClick={() => setShowScanner(false)}
                className="p-2 hover:bg-zinc-800 rounded-md transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <BarcodeScanner 
              onScanSuccess={handleScanSuccess} 
              onClose={() => setShowScanner(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
