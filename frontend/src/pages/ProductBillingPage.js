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
          imei1: "",
          imei2: ""
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

  const updateIMEI = (productId, field, value) => {
    setCart(cart.map(i =>
      i.product_id === productId
        ? { ...i, [field]: value }
        : i
    ));
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

      window.open(`${window.location.origin}/invoice/${response.data.id}`, '_blank');

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
    <div className="h-full flex flex-col">
      <div className="p-4 md:p-6 border-b border-zinc-800/50 bg-zinc-900/30">
        <h1 className="text-3xl font-bold">Product Billing</h1>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 md:p-6">

        {/* LEFT */}
        <div className="lg:col-span-7 space-y-4">

          <Card className="p-6">
            <Input
              placeholder="Search product"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                searchProducts(e.target.value);
              }}
            />

            {searchResults.map((p) => (
              <div key={p.id} onClick={() => addToCart(p)}>
                {p.name} ₹{p.price}
              </div>
            ))}
          </Card>

          <Card className="p-6">
            {cart.map((item) => (
              <div key={item.product_id} className="mb-4">

                <p>{item.product_name}</p>

                <Input value={item.quantity} />
                <Input value={item.price} />

                {/* IMEI */}
                <Input
                  placeholder="IMEI 1"
                  value={item.imei1}
                  onChange={(e) => updateIMEI(item.product_id, "imei1", e.target.value)}
                />
                <Input
                  placeholder="IMEI 2"
                  value={item.imei2}
                  onChange={(e) => updateIMEI(item.product_id, "imei2", e.target.value)}
                />

              </div>
            ))}
          </Card>

        </div>

        {/* RIGHT */}
        <div className="lg:col-span-5 space-y-4">

          <Card className="p-6">
            <Input
              placeholder="Customer Name"
              value={billData.customerName}
              onChange={(e) => setBillData({ ...billData, customerName: e.target.value })}
            />

            <Input
              placeholder="Phone"
              value={billData.customerPhone}
              onChange={(e) => setBillData({ ...billData, customerPhone: e.target.value })}
            />
          </Card>

          <Card className="p-6">
            <p>Total: ₹{totals.total}</p>

            <Button onClick={handleGenerateBill}>
              Generate Bill
            </Button>
          </Card>

        </div>

      </div>

      {showScanner && (
        <BarcodeScanner
          onScanSuccess={handleScanSuccess}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
};