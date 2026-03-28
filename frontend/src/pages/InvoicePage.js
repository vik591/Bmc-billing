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
      <div ref={invoiceRef} className="max-w-4xl mx-auto bg-white p-10 shadow">

        {/* Header */}
        <div className="flex justify-between mb-6 border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold">{settings?.shop_name}</h1>
            <p>{settings?.contact_number}</p>
          </div>

          <div className="text-right">
            <h2 className="text-xl font-bold">INVOICE</h2>
            <p>#{bill?.invoice_number}</p>
          </div>
        </div>

        {/* Items */}
        <table className="w-full mb-6">
          <thead>
            <tr>
              <th className="text-left">Item</th>
              <th className="text-right">Qty</th>
              <th className="text-right">Price</th>
              <th className="text-right">Total</th>
            </tr>
          </thead>

          <tbody>
            {bill?.items?.length > 0 ? (
              bill.items.map((item, i) => (
                <tr key={i}>
                  <td>{item?.product_name}</td>
                  <td className="text-right">{item?.quantity}</td>
                  <td className="text-right">₹{item?.price || 0}</td>
                  <td className="text-right">₹{item?.total || 0}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="text-center">
                  No items
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Total */}
        <div className="text-right">
          <h2 className="text-xl font-bold">
            Total: ₹{bill?.total || 0}
          </h2>
        </div>

      </div>
    </div>
  );
};