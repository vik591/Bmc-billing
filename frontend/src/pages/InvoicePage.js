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
      const [billResponse, settingsResponse] = await Promise.all([
        productBillsAPI.getById(id),
        settingsAPI.get(),
      ]);

      setBill(billResponse.data);
      setSettings(settingsResponse.data);
    } catch (error) {
      toast.error('Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => window.print();

  // 🔥 FINAL PDF FUNCTION (APP + WEB WORKING)
  const handleDownloadPDF = async () => {
    try {
      const element = invoiceRef.current;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/jpeg", 1.0);

      const pdf = new jsPDF("p", "mm", "a4");

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight);

      const fileName = `${bill.customer_name || "customer"}_${bill.invoice_number || "bill"}.pdf`;

      // 👉 OPEN IN EXTERNAL VIEWER (APP FIX)
      const blob = pdf.output("blob");
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("PDF opened — download from viewer");

    } catch (error) {
      console.log(error);
      toast.error("PDF failed");
    }
  };

  const handleShareWhatsApp = () => {
    const message = `Invoice ${bill.invoice_number}\nTotal ₹${bill.total}\nBharti Mobile Collection`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`);
  };

  if (loading) {
    return <div className="p-10">Loading...</div>;
  }

  if (!bill || !settings) {
    return <div className="p-10">No invoice found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      {/* Buttons */}
      <div className="max-w-4xl mx-auto mb-6 flex gap-3">
        <Button onClick={handlePrint}>
          <Printer className="w-4 h-4 mr-2" /> Print
        </Button>

        <Button onClick={handleDownloadPDF}>
          <Download className="w-4 h-4 mr-2" /> PDF
        </Button>

        <Button onClick={handleShareWhatsApp}>
          <Share2 className="w-4 h-4 mr-2" /> WhatsApp
        </Button>
      </div>

      {/* INVOICE */}
      <div
        ref={invoiceRef}
        className="max-w-4xl mx-auto bg-white shadow-lg p-10 text-black"
      >

        {/* HEADER */}
        <div className="flex justify-between border-b pb-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Bharti Mobile Collection</h1>
            <p>Contact: 8982132343 / 9993448128</p>
            <p>
              Shop No. 17, Ultimate Plaza - 1,<br />
              Mandakini Square, Kolar Road,<br />
              Bhopal (M.P)
            </p>
          </div>

          <div className="text-right">
            <h2 className="text-xl font-bold">INVOICE</h2>
            <p><b>No:</b> {bill.invoice_number}</p>
            <p><b>Date:</b> {new Date(bill.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        {/* CUSTOMER */}
        <div className="mb-6">
          <h3 className="font-semibold">Bill To:</h3>
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
            {bill.items?.map((item, i) => (
              <tr key={i}>
                <td className="border p-2">
                  {item.product_name}

                  {/* 🔥 IMEI SHOW */}
                  {(item.imei1 || item.imei2) && (
                    <div className="text-xs text-gray-600 mt-1">
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

        {/* FOOTER */}
        <div className="mt-8 border-t pt-4 text-sm">
          <p className="text-center font-semibold">
            Thank you for shopping with Bharti Mobile Collection 🙏
          </p>

          <div className="mt-4 text-xs">
            <p className="font-semibold mb-1">Terms & Conditions:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Goods once sold will not be taken back or exchanged.</li>
              <li>No warranty on physical damage.</li>
              <li>Please keep invoice safe for warranty claims.</li>
              <li>Warranty as per brand/service center policy.</li>
              <li>All disputes subject to Bhopal jurisdiction.</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
};