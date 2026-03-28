import React, { useState, useEffect } from 'react';
import { productsAPI, productBillsAPI } from '../lib/apiService';

export const ProductBillingPage = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [cart, setCart] = useState([]);

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
      console.log(err);
      alert("Bill Failed ❌");
    }
  };

  return (
    <div className="p-6">

      <h1 className="text-xl mb-4">Mobile Billing (IMEI)</h1>

      <input
        placeholder="Search product"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          searchProducts(e.target.value);
        }}
        className="border p-2 w-full mb-4"
      />

      {results.map(p => (
        <div key={p.id} onClick={() => addToCart(p)}>
          {p.name} ₹{p.price}
        </div>
      ))}

      {cart.map((i, index) => (
        <div key={index} className="border p-3 mb-3">

          <h2>{i.product_name}</h2>

          <input
            value={i.quantity}
            onChange={(e) => {
              const val = Number(e.target.value);
              setCart(cart.map(item =>
                item.product_id === i.product_id
                  ? { ...item, quantity: val, total: val * item.price }
                  : item
              ));
            }}
          />

          <input
            value={i.price}
            onChange={(e) => {
              const val = Number(e.target.value);
              setCart(cart.map(item =>
                item.product_id === i.product_id
                  ? { ...item, price: val, total: val * item.quantity }
                  : item
              ));
            }}
          />

          <input
            placeholder="IMEI 1"
            value={i.imei1}
            onChange={(e) => {
              setCart(cart.map(item =>
                item.product_id === i.product_id
                  ? { ...item, imei1: e.target.value }
                  : item
              ));
            }}
          />

          <input
            placeholder="IMEI 2"
            value={i.imei2}
            onChange={(e) => {
              setCart(cart.map(item =>
                item.product_id === i.product_id
                  ? { ...item, imei2: e.target.value }
                  : item
              ));
            }}
          />

          <div>₹{i.total}</div>

        </div>
      ))}

      <h2>Total: ₹{total}</h2>

      <button onClick={generate}>
        Generate Bill
      </button>

    </div>
  );
};