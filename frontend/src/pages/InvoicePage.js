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

  // 🔥 MOBILE + PERFECT PDF
  const handleDownloadPDF = async () => {
    try {
      const element = invoiceRef.current;

      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");

      const pageWidth = 210;
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);

      // ✅ MOBILE FIX
      const blob = pdf.output("blob");
      const url = URL.createObjectURL(blob);

      window.open(url, "_blank");

      toast.success("PDF opened. Download from top menu");
    } catch (err) {
      console.log(err);
      toast.error("PDF failed");
    }
  };

  // ✅ WHATSAPP FIX
  const handleShareWhatsApp = () => {
    const link = `${window.location.origin}/invoice/${bill.id}`;

    const msg = `Invoice: ${bill.invoice_number}
Total: ₹${bill.total}
View Bill: ${link}`;

    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <p>Loading...</p>
      </div>
    );
  }

  if (!bill || !settings) return null;

  return (
    <div className="min-h-screen bg-gray-100 p-3 md:p-6">

      {/* ACTION BUTTONS */}
      <div className="max-w-[210mm] mx-auto mb-4 flex gap-3">
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
        id="invoice-content"
        className="max-w-[210mm] mx-auto bg-white p-6 text-sm text-black"
      >

        {/* HEADER */}
        <div className="flex justify-between border-b pb-4 mb-4">
          <div>
            <h1 className="text-xl font-bold">{settings.shop_name}</h1>
            <p>{settings.contact_number}</p>
            <p className="text-xs">{settings.address}</p>
          </div>

          <div className="text-right">
            <h2 className="text-lg font-bold">INVOICE</h2>
            <p><b>No:</b> {bill.invoice_number}</p>
            <p><b>Date:</b> {new Date(bill.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        {/* CUSTOMER */}
        <div className="mb-4">
          <p className="font-semibold">Bill To:</p>
          <p>{bill.customer_name || "Walk-in Customer"}</p>
          <p>{bill.customer_phone}</p>
        </div>

        {/* TABLE */}
        <table className="w-full border mb-4 text-xs">
          <thead>
            <tr className="bg-gray-100">
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
                    <div className="text-[10px] text-gray-600 mt-1">
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
          <div className="w-60 border p-3 text-xs">
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

            <div className="flex justify-between font-bold border-t mt-2 pt-2 text-sm">
              <span>Total</span>
              <span>₹{bill.total}</span>
            </div>

            <p className="mt-1">Payment: {bill.payment_mode}</p>
          </div>
        </div>

        {/* SIGN */}
        <div className="mt-10 flex justify-between text-xs">
          <div className="text-center">
            <div className="border-t w-32 mb-1"></div>
            Customer Signature
          </div>

          <div className="text-center">
            <div className="border-t w-32 mb-1"></div>
            Authorized Sign
          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-6 text-[10px]">
          <p className="text-center font-semibold">
            Thank you for shopping 🙏
          </p>

          <ul className="mt-2 list-disc pl-4 space-y-1">
            <li>No return / exchange</li>
            <li>No warranty on physical damage</li>
            <li>Keep invoice safe</li>
          </ul>

          {settings.upi_id && (
            <p className="text-center mt-2">UPI: {settings.upi_id}</p>
          )}
        </div>

      </div>
    </div>
  );
};