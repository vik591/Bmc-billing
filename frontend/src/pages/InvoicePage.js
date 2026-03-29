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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [billRes, settingsRes] = await Promise.all([
        productBillsAPI.getById(id),
        settingsAPI.get(),
      ]);

      setBill(billRes.data);
      setSettings(settingsRes.data);
    } catch (err) {
      toast.error('Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => window.print();

  // ✅ FINAL PDF FIX
  const handleDownloadPDF = async () => {
    try {
      const element = invoiceRef.current;

      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        windowWidth: element.scrollWidth,
      });

      const imgData = canvas.toDataURL("image/jpeg", 1.0);

      const pdf = new jsPDF("p", "mm", "a4");

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight);

      // 🔥 FILE NAME FIX
      const name = (bill.customer_name || "customer")
        .toLowerCase()
        .replace(/\s+/g, "_");

      const invoice = bill.invoice_number.replace("INV", "BMC");

      pdf.save(`${name}_${invoice}.pdf`);

      toast.success("PDF saved");
    } catch (err) {
      console.log(err);
      toast.error("PDF failed");
    }
  };

  const handleShareWhatsApp = () => {
    const url = `${window.location.origin}/invoice/${bill.id}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(url)}`);
  };

  if (loading) return <div className="p-10">Loading...</div>;
  if (!bill) return <div className="p-10">No data</div>;

  return (
    <div className="bg-gray-100 p-4">

      {/* BUTTONS */}
      <div className="max-w-4xl mx-auto mb-4 flex gap-2">
        <Button onClick={handlePrint}><Printer className="w-4 mr-2"/>Print</Button>
        <Button onClick={handleDownloadPDF}><Download className="w-4 mr-2"/>PDF</Button>
        <Button onClick={handleShareWhatsApp}><Share2 className="w-4 mr-2"/>WhatsApp</Button>
      </div>

      {/* INVOICE */}
      <div
        ref={invoiceRef}
        className="bg-white text-black p-6 shadow"
        style={{ width: "100%", maxWidth: "210mm", margin: "auto" }}
      >

        {/* HEADER */}
        <div className="flex justify-between border-b pb-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-wide">
              Bharti Mobile Collection
            </h1>
            <p>8982132343 / 9993448128</p>
            <p className="text-xs">
              Shop No. 17, Ultimate Plaza - 1,<br/>
              Mandakini Square, Kolar Road,<br/>
              Bhopal (M.P)
            </p>
          </div>

          <div className="text-right">
            <h2 className="text-xl font-bold">INVOICE</h2>
            <p>No: {bill.invoice_number.replace("INV", "BMC")}</p>
            <p>{new Date(bill.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        {/* CUSTOMER */}
        <div className="mb-4">
          <h3 className="font-semibold">Bill To:</h3>
          <p>{bill.customer_name || "Walk-in Customer"}</p>
          <p>{bill.customer_phone}</p>
        </div>

        {/* TABLE */}
        <table className="w-full border mb-4 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2 text-left">Item</th>
              <th className="border p-2 text-center">Qty</th>
              <th className="border p-2 text-right">Price</th>
              <th className="border p-2 text-right">Total</th>
            </tr>
          </thead>

          <tbody>
            {bill.items?.map((item, i) => (
              <tr key={i}>
                <td className="border p-2">
                  {item.product_name}

                  {/* ✅ IMEI SHOW */}
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
          <div className="border p-4 w-64">
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
              <div className="flex justify-between text-red-500">
                <span>Discount</span>
                <span>-₹{bill.discount_amount}</span>
              </div>
            )}

            <div className="border-t mt-2 pt-2 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>₹{bill.total}</span>
            </div>

            <p className="text-sm mt-2">Payment: {bill.payment_mode}</p>
          </div>
        </div>

        {/* SIGNATURE */}
        <div className="mt-10 flex justify-between">
          <div className="text-center">
            <div className="border-t w-40 mx-auto mb-1"></div>
            <p className="text-xs">Customer Signature</p>
          </div>

          <div className="text-center">
            <div className="border-t w-40 mx-auto mb-1"></div>
            <p className="text-xs font-semibold">For Bharti Mobile Collection</p>
          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-6 text-[11px]">
          <p className="text-center font-semibold mb-2">
            Thank you for shopping 🙏
          </p>

          <p className="font-semibold">Terms & Conditions:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>Goods once sold will not be taken back or exchanged.</li>
            <li>No warranty on physical damage.</li>
            <li>Please keep invoice safe for warranty claims.</li>
            <li>Warranty as per brand/service center policy.</li>
            <li>All disputes subject to Bhopal jurisdiction.</li>
          </ul>
        </div>

      </div>
    </div>
  );
};