import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { productBillsAPI, settingsAPI } from '../lib/api';
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
    fetchData();
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

  const handlePrint = () => {
    window.print();
  };

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
      pdf.save(`Invoice-${bill.invoice_number}.pdf`);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      toast.error('Failed to generate PDF');
    }
  };

  const handleShareWhatsApp = () => {
    const message = `Invoice: ${bill.invoice_number}\nTotal: ₹${bill.total}\nFrom: ${settings.shop_name}\nContact: ${settings.contact_number}`;
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

  if (!bill || !settings) return null;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* Action Buttons */}
      <div className="max-w-4xl mx-auto mb-6 flex gap-3 no-print">
        <Button onClick={handlePrint} className="bg-zinc-800 hover:bg-zinc-700" data-testid="print-button">
          <Printer className="w-4 h-4 mr-2" />
          Print
        </Button>
        <Button onClick={handleDownloadPDF} className="bg-[#D4AF37] text-black hover:bg-[#b5952f]" data-testid="download-pdf-button">
          <Download className="w-4 h-4 mr-2" />
          Download PDF
        </Button>
        <Button onClick={handleShareWhatsApp} className="bg-green-600 hover:bg-green-700" data-testid="share-whatsapp-button">
          <Share2 className="w-4 h-4 mr-2" />
          Share on WhatsApp
        </Button>
      </div>

      {/* Invoice */}
      <div ref={invoiceRef} className="max-w-4xl mx-auto bg-white shadow-lg p-12" data-testid="invoice-content">
        {/* Header */}
        <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-gray-200">
          <div>
            {settings.logo_base64 && (
              <img src={settings.logo_base64} alt="Logo" className="h-16 mb-3" />
            )}
            <h1 className="text-3xl font-bold text-gray-900">{settings.shop_name}</h1>
            <p className="text-gray-600 mt-1">{settings.contact_number}</p>
            {settings.address && <p className="text-gray-600 text-sm">{settings.address}</p>}
            {settings.gst_number && <p className="text-gray-600 text-sm">GST: {settings.gst_number}</p>}
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold text-gray-900">INVOICE</h2>
            <p className="text-gray-600 mt-2">#{bill.invoice_number}</p>
            <p className="text-sm text-gray-500">{new Date(bill.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Customer Details */}
        {(bill.customer_name || bill.customer_phone) && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Bill To:</h3>
            {bill.customer_name && <p className="text-gray-900 font-medium">{bill.customer_name}</p>}
            {bill.customer_phone && <p className="text-gray-600">{bill.customer_phone}</p>}
          </div>
        )}

        {/* Items Table */}
        <table className="w-full mb-8">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-3 text-sm font-semibold text-gray-700">ITEM</th>
              <th className="text-right py-3 text-sm font-semibold text-gray-700">QTY</th>
              <th className="text-right py-3 text-sm font-semibold text-gray-700">PRICE</th>
              <th className="text-right py-3 text-sm font-semibold text-gray-700">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {bill.items.map((item, index) => (
              <tr key={index} className="border-b border-gray-100">
                <td className="py-3 text-gray-900">{item.product_name}</td>
                <td className="text-right py-3 text-gray-900">{item.quantity}</td>
                <td className="text-right py-3 text-gray-900">₹{item.price.toFixed(2)}</td>
                <td className="text-right py-3 text-gray-900">₹{item.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-80">
            <div className="flex justify-between py-2 text-gray-700">
              <span>Subtotal:</span>
              <span>₹{bill.subtotal.toFixed(2)}</span>
            </div>
            {bill.gst_amount > 0 && (
              <div className="flex justify-between py-2 text-gray-700">
                <span>GST ({bill.gst_rate}%):</span>
                <span>₹{bill.gst_amount.toFixed(2)}</span>
              </div>
            )}
            {bill.discount_amount > 0 && (
              <div className="flex justify-between py-2 text-gray-700">
                <span>Discount:</span>
                <span className="text-red-600">-₹{bill.discount_amount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between py-3 border-t-2 border-gray-200 text-xl font-bold text-gray-900">
              <span>Total:</span>
              <span>₹{bill.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 text-sm text-gray-600">
              <span>Payment Mode:</span>
              <span className="font-medium">{bill.payment_mode}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-200">
          <p className="text-center text-sm text-gray-600">Thank you for your business!</p>
          {settings.upi_id && (
            <p className="text-center text-sm text-gray-600 mt-2">UPI: {settings.upi_id}</p>
          )}
        </div>
      </div>
    </div>
  );
};
