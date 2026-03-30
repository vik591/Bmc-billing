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

  // 🔥 FINAL PDF DOWNLOAD (APP + BROWSER FIXED)
  const handleDownloadPDF = async () => {
    try {
      const element = invoiceRef.current;

      await new Promise(res => setTimeout(res, 500));

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

      // ✅ Filename fix
      const name = bill.customer_name
        ? bill.customer_name.trim().toLowerCase().replace(/\s+/g, "_")
        : "customer";

      const invoice = bill.invoice_number
        ? bill.invoice_number.replace("INV", "BMC")
        : "bill";

      const fileName = `${name}_${invoice}.pdf`;

      // ✅ Force download (WORKS IN APP)
      const blob = pdf.output("blob");
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(url);

      toast.success("PDF downloaded ✅");

    } catch (error) {
      console.log(error);
      toast.error("PDF failed ❌");
    }
  };

  const handleShareWhatsApp = () => {
    const message = `Invoice ${bill.invoice_number}\nTotal ₹${bill.total}\nBharti Mobile Collection`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`);
  };

  if (loading) return <div className="p-10">Loading...</div>;
  if (!bill) return <div>No Data</div>;

  return (
    <div className="bg-gray-100 p-4 min-h-screen">

      {/* Buttons */}
      <div className="max-w-3xl mx-auto mb-4 flex gap-2">
        <Button onClick={handlePrint}><Printer className="w-4 mr-2"/>Print</Button>
        <Button onClick={handleDownloadPDF}><Download className="w-4 mr-2"/>PDF</Button>
        <Button onClick={handleShareWhatsApp}><Share2 className="w-4 mr-2"/>WhatsApp</Button>
      </div>

      {/* INVOICE */}
      <div
        ref={invoiceRef}
        className="bg-white max-w-3xl mx-auto p-6 text-black"
        style={{ width: "794px", minHeight: "1123px" }}
      >

        {/* HEADER */}
        <div className="flex justify-between border-b pb-4 mb-4">
          <div>
            <h1 className="text-xl font-bold">Bharti Mobile Collection</h1>
            <p>8982132343 / 9993448128</p>
            <p className="text-sm">
              Shop No. 17, Ultimate Plaza - 1,<br/>
              Mandakini Square, Kolar Road,<br/>
              Bhopal (M.P)
            </p>
          </div>

          <div className="text-right">
            <h2 className="font-bold">INVOICE</h2>
            <p>No: {bill.invoice_number.replace("INV", "BMC")}</p>
            <p>{new Date(bill.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        {/* CUSTOMER */}
        <div className="mb-4">
          <p className="font-semibold">Bill To:</p>
          <p>{bill.customer_name || "Customer"}</p>
          <p>{bill.customer_phone}</p>
        </div>

        {/* TABLE */}
        <table className="w-full border mb-4">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2 text-left">Item</th>
              <th className="border p-2">Qty</th>
              <th className="border p-2">Price</th>
              <th className="border p-2">Total</th>
            </tr>
          </thead>

          <tbody>
            {bill.items.map((item, i) => (
              <tr key={i}>
                <td className="border p-2">
                  {item.product_name}
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

        {/* TOTAL BOX */}
        <div className="flex justify-end">
          <div className="border p-4 w-64">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{bill.subtotal}</span>
            </div>

            <div className="flex justify-between">
              <span>GST</span>
              <span>₹{bill.gst_amount}</span>
            </div>

            {bill.discount_amount > 0 && (
              <div className="flex justify-between text-red-500">
                <span>Discount</span>
                <span>-₹{bill.discount_amount}</span>
              </div>
            )}

            <hr className="my-2"/>

            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>₹{bill.total}</span>
            </div>

            <p className="text-sm mt-1">Payment: {bill.payment_mode}</p>
          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-6 text-xs">
          <p className="text-center font-semibold mb-2">
            Thank you for shopping with Bharti Mobile Collection 🙏
          </p>

          <ul className="list-disc pl-5 space-y-1">
            <li>Goods once sold will not be taken back.</li>
            <li>No warranty on physical damage.</li>
            <li>Keep invoice safe for warranty.</li>
            <li>All disputes subject to Bhopal jurisdiction.</li>
          </ul>
        </div>

      </div>
    </div>
  );
};