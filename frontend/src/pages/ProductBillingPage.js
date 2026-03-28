import React, { useState, useEffect } from 'react';
import { productsAPI, productBillsAPI } from '../lib/apiService';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { BarcodeScanner } from '../components/BarcodeScanner';

export const ProductBillingPage = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [cart, setCart] = useState([]);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanTarget, setScanTarget] = useState(null);

  useEffect(() => {
    productsAPI.getAll().then(res => setProducts(res.data));
  }, []);

  const searchProducts = async (q) => {
    if (!q) return setResults([]);
    const res = await productsAPI.search(q);
    setResults(res.data);
  };

  const addToCart = (p) => {
    setCart([...cart, {
      product_id: p.id,
      product_name: p.name,
      quantity: 1,
      price: p.price,
      total: p.price,
      imei1: '',
      imei2: ''
    }]);
    setResults([]);
    setSearch('');
  };

  const update = (id, field, value) => {
    setCart(cart.map(i =>
      i.product_id === id
        ? {
            ...i,
            [field]: value,
            total:
              field === 'price'
                ? value * i.quantity
                : field === 'quantity'
                ? i.price * value
                : i.total
          }
        : i
    ));
  };

  const handleScan = (data) => {
    if (!scanTarget) return;
    update(scanTarget.id, scanTarget.field, data);
    setScannerOpen(false);
  };

  const total = cart.reduce((s, i) => s + i.total, 0);

  const generate = async () => {
    try {
      const res = await productBillsAPI.create({
        items: cart.map(i => ({
          product_id: i.product_id,
          product_name: i.product_name,
          quantity: i.quantity,
          price: i.price,
          total: i.total,
          imei1: i.imei1 || "",
          imei2: i.imei2 || ""
        })),
        subtotal: total,
        gst_rate: 0,
        gst_amount: 0,
        discount_type: "amount",
        discount_value: 0,
        discount_amount: 0,
        total: total,
        payment_mode: "Cash",
        customer_name: "",
        customer_phone: ""
      });

      alert("Bill Generated ✅");
      window.open(`/invoice/${res.data.id}`, "_blank");
      setCart([]);

    } catch (err) {
      console.log("ERROR:", err.response?.data || err.message);
      alert("Bill Failed ❌");
    }
  };

  return (
    <div className="p-6">

      <h1 className="text-2xl mb-4">Mobile Billing (IMEI)</h1>

      {/* SEARCH */}
      <Input
        placeholder="Search product"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          searchProducts(e.target.value);
        }}
      />

      {results.map(p => (
        <div
          key={p.id}
          onClick={() => addToCart(p)}
          className="cursor-pointer"
        >
          {p.name} ₹{p.price}
        </div>
      ))}

      {/* CART */}
      {cart.map((i, index) => (
        <Card key={index} className="p-3 mt-3">

          <h2>{i.product_name}</h2>

          <div className="flex gap-2">
            <Input
              value={i.quantity}
              onChange={(e) =>
                update(i.product_id, 'quantity', Number(e.target.value))
              }
            />
            <Input
              value={i.price}
              onChange={(e) =>
                update(i.product_id, 'price', Number(e.target.value))
              }
            />
          </div>

          {/* IMEI 1 */}
          <div className="flex gap-2 mt-2">
            <Input
              placeholder="IMEI 1"
              value={i.imei1}
              onChange={(e) =>
                update(i.product_id, 'imei1', e.target.value)
              }
            />
            <Button
              onClick={() => {
                setScanTarget({ id: i.product_id, field: 'imei1' });
                setScannerOpen(true);
              }}
            >
              Scan
            </Button>
          </div>

          {/* IMEI 2 */}
          <div className="flex gap-2 mt-2">
            <Input
              placeholder="IMEI 2"
              value={i.imei2}
              onChange={(e) =>
                update(i.product_id, 'imei2', e.target.value)
              }
            />
            <Button
              onClick={() => {
                setScanTarget({ id: i.product_id, field: 'imei2' });
                setScannerOpen(true);
              }}
            >
              Scan
            </Button>
          </div>

          <p className="mt-2 font-bold">₹{i.total}</p>
        </Card>
      ))}

      <h2 className="mt-4">Total: ₹{total}</h2>

      <Button onClick={generate} className="mt-4">
        Generate Bill
      </Button>

      {/* SCANNER */}
      {scannerOpen && (
        <BarcodeScanner
          onScanSuccess={handleScan}
          onClose={() => setScannerOpen(false)}
        />
      )}

    </div>
  );
};