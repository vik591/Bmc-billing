import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { productBillsAPI, settingsAPI } from '../lib/apiService';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Download, Share2, Printer } from 'lucide-react';

export const InvoicePage = () => {
  const { id } = useParams();
  const invoiceRef = useRef();

  const [bill, setBill] = useState(null);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [billRes, settingsRes] = await Promise.all([
        productBillsAPI.getById(id),
        settingsAPI.get(),
      ]);

      setBill(billRes.data);
      setSettings(settingsRes.data);
    } catch {
      toast.error("Failed to load invoice");
    }
  };

  const handlePrint = () => window.print();

  // 🔥 CLEAN DOWNLOAD (CHROME PERFECT)
  const handleDownloadPDF = async () => {
    const canvas = await html2canvas(invoiceRef.current, {
      scale: 2,
      backgroundColor: "#ffffff"
    });

    const imgData = canvas.toDataURL("image/jpeg", 1.0);
    const pdf = new jsPDF("p", "mm", "a4");

    const width = 210;
    const height = (canvas.height * width) / canvas.width;

    pdf.addImage(imgData, "JPEG", 0, 0, width, height);

    const name = bill.customer_name || "customer";
    const inv = bill.invoice_number || "bill";

    pdf.save(`${name}_${inv}.pdf`);
  };

  const handleShareWhatsApp = () => {
    const msg = `Invoice ${bill.invoice_number}\nTotal ₹${bill.total}\nBharti Mobile Collection`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`);
  };

  if (!bill) return <div className="p-10">Loading...</div>;

  return (
    <div className="bg-gray-100 p-6 min-h-screen">

      {/* ACTION BUTTONS */}
      <div className="max-w-4xl mx-auto mb-4 flex gap-3">
        <Button onClick={handlePrint}><Printer className="w-4 mr-2"/>Print</Button>
        <Button onClick={handleDownloadPDF}><Download className="w-4 mr-2"/>PDF</Button>
        <Button onClick={handleShareWhatsApp}><Share2 className="w-4 mr-2"/>WhatsApp</Button>
      </div>

      {/* INVOICE */}
      <div ref={invoiceRef} className="max-w-4xl mx-auto bg-white p-10 shadow text-black">

        {/* HEADER */}
        <div className="flex justify-between border-b pb-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Bharti Mobile Collection</h1>
            <p>8982132343 / 9993448128</p>
            <p className="text-sm">
              Shop No. 17, Ultimate Plaza - 1,<br/>
              Mandakini Square, Kolar Road,<br/>
              Bhopal (M.P)
            </p>
          </div>

          <div className="text-right">
            <h2 className="text-xl font-bold">INVOICE</h2>
            <p>No: {bill.invoice_number}</p>
            <p>Date: {new Date(bill.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        {/* CUSTOMER */}
        <div className="mb-6">
          <p className="font-semibold">Bill To:</p>
          <p>{bill.customer_name || "Customer"}</p>
          <p>{bill.customer_phone}</p>
        </div>

        {/* TABLE */}
        <table className="w-full border mb-6">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2 text-left">Item</th>
              <th className="border p-2 text-center">Qty</th>
              <th className="border p-2 text-right">Price</th>
              <th className="border p-2 text-right">Total</th>
            </tr>
          </thead>

          <tbody>
            {bill.items.map((item, i) => (
              <tr key={i}>
                <td className="border p-2">
                  {item.product_name}

                  {/* IMEI */}
                  {(item.imei1 || item.imei2) && (
                    <div className="text-xs text-gray-500 mt-1">
                      {item.imei1 && <div>IMEI1: {item.imei1}</div>}
                      {item.imei2 && <div>IMEI2: {item.imei2}</div>}
                    </div>
                  )}
                </td>

                <td className="border p-2 text-center">{item.quantity}</td>
                <td className="border p-2 text-right">₹{item.price}</td>
                <td className="border p-2 text-right">₹{item.total}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* TOTAL */}
        <div className="flex justify-end">
          <div className="w-64 border p-4">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{bill.subtotal}</span>
            </div>

            {bill.gst_amount > 0 && (
              <div className="flex justify-between">
                <span>GST</span>
                <span>₹{bill.gst_amount}</span>
              </div>
            )}

            {bill.discount_amount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Discount</span>
                <span>-₹{bill.discount_amount}</span>
              </div>
            )}

            <div className="flex justify-between font-bold text-lg border-t mt-2 pt-2">
              <span>Total</span>
              <span>₹{bill.total}</span>
            </div>

            <p className="text-sm mt-2">Payment: {bill.payment_mode}</p>
          </div>
        </div>

        {/* SIGNATURES */}
        <div className="mt-12 flex justify-between">
          <div className="text-center">
            <div className="border-t w-40 mx-auto mb-2"></div>
            <p className="text-sm">Customer Signature</p>
          </div>

          <div className="text-center">
            <div className="border-t w-40 mx-auto mb-2"></div>
            <p className="text-sm font-semibold">For Bharti Mobile Collection</p>
            <p className="text-xs">Authorized Signatory</p>
          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-8 text-xs border-t pt-4">
          <p className="text-center font-semibold">
            Thank you for your business 🙏
          </p>
        </div>

      </div>
    </div>
  );
};