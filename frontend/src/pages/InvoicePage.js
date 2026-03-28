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

      console.log("BILL DATA:", billResponse.data);

      setBill(billResponse.data);
      setSettings(settingsResponse.data);
    } catch (error) {
      console.error("Invoice load error:", error);
      toast.error('Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => window.print();

  const handleDownloadPDF = async () => {
    try {
      const element = invoiceRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice-${bill?.invoice_number || "bill"}.pdf`);

      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate PDF');
    }
  };

  const handleShareWhatsApp = () => {
    const message = `Invoice: ${bill?.invoice_number || ""}\nTotal: ₹${bill?.total || 0}\nFrom: ${settings?.shop_name || ""}\nContact: ${settings?.contact_number || ""}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (!bill || !settings) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>No invoice data found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">

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

      {/* Invoice */}
<div ref={invoiceRef} className="max-w-4xl mx-auto bg-white shadow-lg p-10 text-black">

  {/* HEADER */}
  <div className="flex justify-between items-center border-b pb-4 mb-6">
    <div>
      <h1 className="text-2xl font-bold">{settings.shop_name}</h1>
      <p className="text-sm">{settings.contact_number}</p>
      <p className="text-sm">{settings.address}</p>
    </div>

    <div className="text-right">
      <h2 className="text-xl font-bold">INVOICE</h2>
      <p><b>Invoice #:</b> {bill.invoice_number}</p>
      <p><b>Date:</b> {new Date(bill.created_at).toLocaleDateString()}</p>
    </div>
  </div>

  {/* CUSTOMER */}
  <div className="mb-6">
    <h3 className="font-semibold mb-1">Bill To:</h3>
    <p>{bill.customer_name || "Walk-in Customer"}</p>
    <p>{bill.customer_phone}</p>
  </div>

  {/* TABLE */}
  <table className="w-full border border-gray-300 mb-6">
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
          <td className="border p-2">{item.product_name}</td>
          <td className="border p-2 text-center">{item.quantity}</td>
          <td className="border p-2 text-right">₹{item.price}</td>
          <td className="border p-2 text-right">₹{item.total}</td>
        </tr>
      ))}
    </tbody>
  </table>

  {/* TOTALS */}
  <div className="flex justify-end">
    <div className="w-72 border p-4">
      <div className="flex justify-between mb-1">
        <span>Subtotal:</span>
        <span>₹{bill.subtotal}</span>
      </div>

      {bill.gst_amount > 0 && (
        <div className="flex justify-between mb-1">
          <span>GST:</span>
          <span>₹{bill.gst_amount}</span>
        </div>
      )}

      {bill.discount_amount > 0 && (
        <div className="flex justify-between mb-1 text-red-600">
          <span>Discount:</span>
          <span>-₹{bill.discount_amount}</span>
        </div>
      )}

      <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
        <span>Total:</span>
        <span>₹{bill.total}</span>
      </div>

      <div className="mt-2 text-sm">
        Payment: {bill.payment_mode}
      </div>
    </div>
  </div>

  {/* FOOTER */}
  <div className="mt-8 border-t pt-4 text-center text-sm">
    <p>Thank you for shopping with us 🙏</p>

    <p className="mt-2">
      <b>Terms:</b> No return after 3 days | Warranty as per product
    </p>

    {settings.upi_id && (
      <p className="mt-2">UPI: {settings.upi_id}</p>
    )}
  </div>

</div>
      