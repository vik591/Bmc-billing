import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { repairBillsAPI, settingsAPI } from '../lib/apiservice';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Download, Share2, Printer } from 'lucide-react';

export const RepairInvoicePage = () => {
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
      const billsResponse = await repairBillsAPI.getAll();
      const foundBill = billsResponse.data.find((b) => b.id === id);
      const settingsResponse = await settingsAPI.get();
      setBill(foundBill);
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
      pdf.save(`Repair-Invoice-${bill.invoice_number}.pdf`);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      toast.error('Failed to generate PDF');
    }
  };

  const handleShareWhatsApp = () => {
    const message = `Repair Invoice: ${bill.invoice_number}\nDevice: ${bill.device_model}\nCharges: ₹${bill.repair_charges}\nStatus: ${bill.delivery_status}\nFrom: ${settings.shop_name}\nContact: ${settings.contact_number}`;
    const whatsappUrl = `https://wa.me/${bill.customer_phone}?text=${encodeURIComponent(message)}`;
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
      <div ref={invoiceRef} className="max-w-4xl mx-auto bg-white shadow-lg p-12" data-testid="repair-invoice-content">
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
            <h2 className="text-2xl font-bold text-gray-900">REPAIR ORDER</h2>
            <p className="text-gray-600 mt-2">#{bill.invoice_number}</p>
            <p className="text-sm text-gray-500">{new Date(bill.created_at).toLocaleDateString()}</p>
            <span
              className={`inline-block mt-2 px-3 py-1 rounded text-sm font-medium ${
                bill.delivery_status === 'Completed'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {bill.delivery_status}
            </span>
          </div>
        </div>

        {/* Customer Details */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Customer Details:</h3>
            <p className="text-gray-900 font-medium text-lg">{bill.customer_name}</p>
            <p className="text-gray-600">{bill.customer_phone}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Device Details:</h3>
            <p className="text-gray-900 font-medium text-lg">{bill.device_model}</p>
            {bill.imei_number && <p className="text-gray-600 text-sm">IMEI: {bill.imei_number}</p>}
          </div>
        </div>

        {/* Problem Description */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Problem Description:</h3>
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-gray-900">{bill.problem_description}</p>
          </div>
        </div>

        {/* Payment Details */}
        <div className="flex justify-end">
          <div className="w-80">
            <div className="flex justify-between py-3 text-gray-700 text-lg">
              <span>Repair Charges:</span>
              <span className="font-semibold">₹{bill.repair_charges.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-3 text-gray-700">
              <span>Advance Paid:</span>
              <span className="text-green-600 font-semibold">₹{bill.advance_paid.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-3 border-t-2 border-gray-200 text-xl font-bold text-gray-900">
              <span>Pending Amount:</span>
              <span className="text-yellow-600">₹{bill.pending_amount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-2"><strong>Terms & Conditions:</strong></p>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Warranty as per manufacturer policy</li>
            <li>• Parts replaced will carry 30 days warranty</li>
            <li>• Data backup is customer's responsibility</li>
          </ul>
          <p className="text-center text-sm text-gray-600 mt-6">Thank you for your business!</p>
          {settings.upi_id && (
            <p className="text-center text-sm text-gray-600 mt-2">UPI: {settings.upi_id}</p>
          )}
        </div>
      </div>
    </div>
  );
};
