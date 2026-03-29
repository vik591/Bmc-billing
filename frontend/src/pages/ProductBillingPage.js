import React, { useState, useEffect } from 'react';
import { productsAPI, productBillsAPI } from '../lib/apiService';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { BarcodeScanner } from '../components/BarcodeScanner';

export const ProductBillingPage = () => {

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [cart, setCart] = useState([]);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash");

  const [gstRate, setGstRate] = useState(0);
  const [discountType, setDiscountType] = useState("amount");
  const [discountValue, setDiscountValue] = useState(0);

  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanTarget, setScanTarget] = useState(null);

  useEffect(() => {
    productsAPI.getAll().then(res => setProducts(res.data));
  }, []);

  const searchProducts = async (q) => {
    setSearch(q);
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
      imei1: "",
      imei2: ""
    }]);
    setResults([]);
    setSearch("");
  };

  const update = (id, field, value) => {
    setCart(cart.map(i =>
      i.product_id === id
        ? {
            ...i,
            [field]: value,
            total:
              field === "price"
                ? value * i.quantity
                : field === "quantity"
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

  const subtotal = cart.reduce((s, i) => s + i.total, 0);
  const gstAmount = (subtotal * gstRate) / 100;

  const discountAmount =
    discountType === "percentage"
      ? (subtotal * discountValue) / 100
      : discountValue;

  const finalTotal = subtotal + gstAmount - discountAmount;

  const generate = async () => {
    try {
      await productBillsAPI.create({
        items: cart,
        subtotal,
        gst_rate: gstRate,
        gst_amount: gstAmount,
        discount_type: discountType,
        discount_value: discountValue,
        discount_amount: discountAmount,
        total: finalTotal,
        payment_mode: paymentMode,
        customer_name: customerName || "Walk-in Customer",
        customer_phone: customerPhone || ""
      });

      alert("✅ Bill Generated");
      setCart([]);
    } catch (err) {
      alert("❌ Bill Failed");
    }
  };

  return (
    <div className="p-6 text-white">

      <h1 className="text-2xl mb-4">Mobile Billing (IMEI)</h1>

      {/* SEARCH */}
      <Input
        placeholder="Search product"
        value={search}
        onChange={(e) => searchProducts(e.target.value)}
      />

      {results.map(p => (
        <div key={p.id} onClick={() => addToCart(p)} className="p-2 border mt-1 cursor-pointer">
          {p.name} ₹{p.price}
        </div>
      ))}

      {/* CUSTOMER */}
      <div className="mt-4 space-y-2">
        <Input placeholder="Customer Name" value={customerName} onChange={(e)=>setCustomerName(e.target.value)} />
        <Input placeholder="Phone Number" value={customerPhone} onChange={(e)=>setCustomerPhone(e.target.value)} />

        <select className="border p-2 w-full bg-black" value={paymentMode} onChange={(e)=>setPaymentMode(e.target.value)}>
          <option>Cash</option>
          <option>UPI</option>
          <option>Card</option>
          <option>EMI</option>
        </select>
      </div>

      {/* CART */}
      {cart.map((i,index)=>(
        <div key={index} className="border p-3 mt-3 rounded">

          <h2>{i.product_name}</h2>

          <div className="flex gap-2 mt-2">
            <Input value={i.quantity} onChange={(e)=>update(i.product_id,"quantity",Number(e.target.value))}/>
            <Input value={i.price} onChange={(e)=>update(i.product_id,"price",Number(e.target.value))}/>
          </div>

          {/* IMEI */}
          <div className="flex gap-2 mt-2">
            <Input placeholder="IMEI 1" value={i.imei1} onChange={(e)=>update(i.product_id,"imei1",e.target.value)}/>
            <Button onClick={()=>{setScanTarget({id:i.product_id,field:"imei1"});setScannerOpen(true);}}>Scan</Button>
          </div>

          <div className="flex gap-2 mt-2">
            <Input placeholder="IMEI 2" value={i.imei2} onChange={(e)=>update(i.product_id,"imei2",e.target.value)}/>
            <Button onClick={()=>{setScanTarget({id:i.product_id,field:"imei2"});setScannerOpen(true);}}>Scan</Button>
          </div>

          <p className="mt-2">₹{i.total}</p>

        </div>
      ))}

      {/* GST + DISCOUNT */}
      <div className="mt-4 space-y-2">
        <Input type="number" placeholder="GST %" value={gstRate} onChange={(e)=>setGstRate(Number(e.target.value))}/>

        <select className="border p-2 w-full bg-black" value={discountType} onChange={(e)=>setDiscountType(e.target.value)}>
          <option value="amount">Discount ₹</option>
          <option value="percentage">Discount %</option>
        </select>

        <Input type="number" placeholder="Discount Value" value={discountValue} onChange={(e)=>setDiscountValue(Number(e.target.value))}/>
      </div>

      {/* TOTAL */}
      <div className="mt-4 text-lg">
        Total: ₹{finalTotal}
      </div>

      {/* BUTTON */}
      <Button className="mt-4 bg-yellow-500 text-black w-full" onClick={generate}>
        Generate Bill
      </Button>

      {/* SCANNER */}
      {scannerOpen && (
        <BarcodeScanner
          onScanSuccess={handleScan}
          onClose={()=>setScannerOpen(false)}
        />
      )}

    </div>
  );
};