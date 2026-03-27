import React, { useState, useEffect } from 'react';
import { productsAPI, purchasesAPI } from '../lib/apiservice';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, AlertTriangle, Package } from 'lucide-react';

export const InventoryPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddPurchase, setShowAddPurchase] = useState(false);
  const [editProduct, setEditProduct] = useState(null);

  const [productForm, setProductForm] = useState({
    name: '',
    category: '',
    price: 0,
    cost_price: 0,
    stock: 0,
    low_stock_threshold: 5,
    barcode: '',
  });

  const [purchaseForm, setPurchaseForm] = useState({
    product_id: '',
    quantity: 0,
    cost_price: 0,
    supplier_name: '',
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productsAPI.getAll();
      setProducts(response.data);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      await productsAPI.create(productForm);
      toast.success('Product added successfully');
      setShowAddProduct(false);
      setProductForm({
        name: '',
        category: '',
        price: 0,
        cost_price: 0,
        stock: 0,
        low_stock_threshold: 5,
        barcode: '',
      });
      fetchProducts();
    } catch (error) {
      toast.error('Failed to add product');
    }
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    try {
      await productsAPI.update(editProduct.id, productForm);
      toast.success('Product updated successfully');
      setEditProduct(null);
      setProductForm({
        name: '',
        category: '',
        price: 0,
        cost_price: 0,
        stock: 0,
        low_stock_threshold: 5,
        barcode: '',
      });
      fetchProducts();
    } catch (error) {
      toast.error('Failed to update product');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await productsAPI.delete(id);
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const handleAddPurchase = async (e) => {
    e.preventDefault();
    try {
      await purchasesAPI.create(purchaseForm);
      toast.success('Purchase added and stock updated');
      setShowAddPurchase(false);
      setPurchaseForm({
        product_id: '',
        quantity: 0,
        cost_price: 0,
        supplier_name: '',
      });
      fetchProducts();
    } catch (error) {
      toast.error('Failed to add purchase');
    }
  };

  const lowStockProducts = products.filter((p) => p.stock <= p.low_stock_threshold);

  return (
    <div className="p-4 md:p-8 lg:p-12" data-testid="inventory-page">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-2" data-testid="page-title">
            Inventory Management
          </h1>
          <p className="text-zinc-400">Manage products and stock levels</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
            <DialogTrigger asChild>
              <Button data-testid="add-product-button" className="bg-[#D4AF37] text-black hover:bg-[#b5952f]">
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800 max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-heading">Add New Product</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddProduct} className="space-y-4">
                <div>
                  <Label>Product Name</Label>
                  <Input
                    data-testid="product-name-input"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="bg-zinc-950 border-zinc-800"
                    required
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Input
                    data-testid="product-category-input"
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="bg-zinc-950 border-zinc-800"
                    required
                  />
                </div>
                <div>
                  <Label>Barcode (Optional)</Label>
                  <Input
                    data-testid="product-barcode-input"
                    value={productForm.barcode}
                    onChange={(e) => setProductForm({ ...productForm, barcode: e.target.value })}
                    className="bg-zinc-950 border-zinc-800"
                    placeholder="Scan or enter barcode"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Selling Price (₹)</Label>
                    <Input
                      type="number"
                      data-testid="product-price-input"
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: parseFloat(e.target.value) })}
                      className="bg-zinc-950 border-zinc-800"
                      required
                    />
                  </div>
                  <div>
                    <Label>Cost Price (₹)</Label>
                    <Input
                      type="number"
                      data-testid="product-cost-input"
                      value={productForm.cost_price}
                      onChange={(e) => setProductForm({ ...productForm, cost_price: parseFloat(e.target.value) })}
                      className="bg-zinc-950 border-zinc-800"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Stock Quantity</Label>
                    <Input
                      type="number"
                      data-testid="product-stock-input"
                      value={productForm.stock}
                      onChange={(e) => setProductForm({ ...productForm, stock: parseInt(e.target.value) })}
                      className="bg-zinc-950 border-zinc-800"
                      required
                    />
                  </div>
                  <div>
                    <Label>Low Stock Alert</Label>
                    <Input
                      type="number"
                      data-testid="product-threshold-input"
                      value={productForm.low_stock_threshold}
                      onChange={(e) => setProductForm({ ...productForm, low_stock_threshold: parseInt(e.target.value) })}
                      className="bg-zinc-950 border-zinc-800"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-[#D4AF37] text-black hover:bg-[#b5952f]">
                  Add Product
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={showAddPurchase} onOpenChange={setShowAddPurchase}>
            <DialogTrigger asChild>
              <Button data-testid="add-purchase-button" className="bg-zinc-800 hover:bg-zinc-700">
                <Package className="w-4 h-4 mr-2" />
                Add Purchase
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800">
              <DialogHeader>
                <DialogTitle className="text-2xl font-heading">Add Purchase Entry</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddPurchase} className="space-y-4">
                <div>
                  <Label>Select Product</Label>
                  <select
                    data-testid="purchase-product-select"
                    value={purchaseForm.product_id}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, product_id: e.target.value })}
                    className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded-md text-white"
                    required
                  >
                    <option value="">Select a product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.category})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    data-testid="purchase-quantity-input"
                    value={purchaseForm.quantity}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, quantity: parseInt(e.target.value) })}
                    className="bg-zinc-950 border-zinc-800"
                    required
                  />
                </div>
                <div>
                  <Label>Cost Price per Unit (₹)</Label>
                  <Input
                    type="number"
                    data-testid="purchase-cost-input"
                    value={purchaseForm.cost_price}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, cost_price: parseFloat(e.target.value) })}
                    className="bg-zinc-950 border-zinc-800"
                    required
                  />
                </div>
                <div>
                  <Label>Supplier Name (Optional)</Label>
                  <Input
                    data-testid="purchase-supplier-input"
                    value={purchaseForm.supplier_name}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, supplier_name: e.target.value })}
                    className="bg-zinc-950 border-zinc-800"
                  />
                </div>
                <Button type="submit" className="w-full bg-[#D4AF37] text-black hover:bg-[#b5952f]">
                  Add Purchase
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <Card className="p-6 mb-6 bg-red-900/20 border border-red-900/50" data-testid="low-stock-alert">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <h3 className="text-xl font-heading font-semibold text-red-500">Low Stock Alert</h3>
          </div>
          <p className="text-zinc-400 mb-3">{lowStockProducts.length} products are running low on stock</p>
          <div className="flex flex-wrap gap-2">
            {lowStockProducts.map((product) => (
              <span
                key={product.id}
                className="px-3 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded text-sm"
              >
                {product.name} ({product.stock} left)
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Products Table */}
      <Card className="p-6 bg-zinc-900/50 border border-zinc-800/50">
        <div className="overflow-x-auto">
          <table className="w-full" data-testid="products-table">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left p-3 font-heading font-semibold">Product</th>
                <th className="text-left p-3 font-heading font-semibold">Category</th>
                <th className="text-right p-3 font-heading font-semibold">Stock</th>
                <th className="text-right p-3 font-heading font-semibold">Price</th>
                <th className="text-right p-3 font-heading font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr
                  key={product.id}
                  data-testid={`product-row-${product.id}`}
                  className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors"
                >
                  <td className="p-3">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      {product.barcode && (
                        <p className="text-xs text-zinc-500 font-mono">{product.barcode}</p>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-zinc-400">{product.category}</td>
                  <td className="p-3 text-right">
                    <span
                      className={`px-2 py-1 rounded text-sm font-semibold ${
                        product.stock <= product.low_stock_threshold
                          ? 'bg-red-500/10 text-red-500'
                          : 'bg-green-500/10 text-green-500'
                      }`}
                    >
                      {product.stock}
                    </span>
                  </td>
                  <td className="p-3 text-right font-heading font-bold text-[#D4AF37]">
                    ₹{product.price}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditProduct(product);
                          setProductForm(product);
                        }}
                        data-testid={`edit-product-${product.id}`}
                        className="p-2 hover:bg-zinc-700 rounded transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        data-testid={`delete-product-${product.id}`}
                        className="p-2 hover:bg-zinc-700 rounded transition-colors text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
