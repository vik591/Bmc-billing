import React, { useState, useEffect } from 'react';
import { settingsAPI, usersAPI } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { Settings as SettingsIcon, Upload, Users, Trash2 } from 'lucide-react';

export const SettingsPage = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [settingsForm, setSettingsForm] = useState({
    shop_name: '',
    contact_number: '',
    address: '',
    gst_number: '',
    upi_id: '',
  });

  useEffect(() => {
    fetchSettings();
    if (user?.role === 'admin') {
      fetchUsers();
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      const response = await settingsAPI.get();
      setSettings(response.data);
      setSettingsForm({
        shop_name: response.data.shop_name,
        contact_number: response.data.contact_number,
        address: response.data.address || '',
        gst_number: response.data.gst_number || '',
        upi_id: response.data.upi_id || '',
      });
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await usersAPI.getAll();
      setUsers(response.data);
    } catch (error) {
      toast.error('Failed to load users');
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await settingsAPI.update(settingsForm);
      toast.success('Settings updated successfully');
      fetchSettings();
    } catch (error) {
      toast.error('Failed to update settings');
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        await settingsAPI.update({ logo_base64: reader.result });
        toast.success('Logo uploaded successfully');
        fetchSettings();
      } catch (error) {
        toast.error('Failed to upload logo');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await usersAPI.delete(userId);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  return (
    <div className="p-4 md:p-8 lg:p-12" data-testid="settings-page">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-heading font-bold mb-2 flex items-center gap-3" data-testid="page-title">
          <SettingsIcon className="w-10 h-10 text-[#D4AF37]" />
          Settings
        </h1>
        <p className="text-zinc-400">Manage shop settings and configuration</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Shop Details */}
          <Card className="p-8 bg-zinc-900/50 border border-zinc-800/50">
            <h2 className="text-2xl font-heading font-semibold mb-6">Shop Details</h2>
            <form onSubmit={handleSaveSettings} className="space-y-6" data-testid="settings-form">
              <div>
                <Label className="text-zinc-300 mb-2">Shop Name</Label>
                <Input
                  data-testid="shop-name-input"
                  value={settingsForm.shop_name}
                  onChange={(e) => setSettingsForm({ ...settingsForm, shop_name: e.target.value })}
                  className="bg-zinc-950 border-zinc-800 text-white"
                  required
                />
              </div>
              <div>
                <Label className="text-zinc-300 mb-2">Contact Number</Label>
                <Input
                  data-testid="contact-number-input"
                  value={settingsForm.contact_number}
                  onChange={(e) => setSettingsForm({ ...settingsForm, contact_number: e.target.value })}
                  className="bg-zinc-950 border-zinc-800 text-white"
                  required
                />
              </div>
              <div>
                <Label className="text-zinc-300 mb-2">Address</Label>
                <Textarea
                  data-testid="address-input"
                  value={settingsForm.address}
                  onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                  className="bg-zinc-950 border-zinc-800 text-white min-h-20"
                />
              </div>
              <div>
                <Label className="text-zinc-300 mb-2">GST Number (Optional)</Label>
                <Input
                  data-testid="gst-number-input"
                  value={settingsForm.gst_number}
                  onChange={(e) => setSettingsForm({ ...settingsForm, gst_number: e.target.value })}
                  className="bg-zinc-950 border-zinc-800 text-white"
                />
              </div>
              <div>
                <Label className="text-zinc-300 mb-2">UPI ID (Optional)</Label>
                <Input
                  data-testid="upi-id-input"
                  value={settingsForm.upi_id}
                  onChange={(e) => setSettingsForm({ ...settingsForm, upi_id: e.target.value })}
                  className="bg-zinc-950 border-zinc-800 text-white"
                  placeholder="yourname@upi"
                />
              </div>
              <Button
                type="submit"
                data-testid="save-settings-button"
                className="w-full bg-[#D4AF37] text-black hover:bg-[#b5952f] font-semibold shadow-[0_0_15px_rgba(212,175,55,0.3)] py-6 text-lg"
              >
                Save Settings
              </Button>
            </form>
          </Card>

          {/* User Management */}
          {user?.role === 'admin' && (
            <Card className="p-8 bg-zinc-900/50 border border-zinc-800/50">
              <h2 className="text-2xl font-heading font-semibold mb-6 flex items-center gap-3">
                <Users className="w-6 h-6 text-[#D4AF37]" />
                User Management
              </h2>
              <div className="space-y-3">
                {users.map((u) => (
                  <div
                    key={u.id}
                    data-testid={`user-item-${u.id}`}
                    className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-lg border border-zinc-700/50"
                  >
                    <div>
                      <p className="font-medium">{u.name}</p>
                      <p className="text-sm text-zinc-500">{u.email} • {u.role}</p>
                    </div>
                    {u.id !== user.id && (
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        data-testid={`delete-user-${u.id}`}
                        className="p-2 hover:bg-zinc-700 rounded text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Logo Upload */}
        <div>
          <Card className="p-6 bg-gradient-to-br from-zinc-900 to-black border border-[#D4AF37]/50 sticky top-6">
            <h3 className="text-xl font-heading font-semibold mb-4">Shop Logo</h3>
            <div className="mb-4">
              {settings?.logo_base64 ? (
                <img
                  src={settings.logo_base64}
                  alt="Shop Logo"
                  className="w-full h-48 object-contain bg-zinc-800/30 rounded-lg p-4"
                />
              ) : (
                <div className="w-full h-48 bg-zinc-800/30 rounded-lg flex items-center justify-center">
                  <Upload className="w-12 h-12 text-zinc-600" />
                </div>
              )}
            </div>
            <Input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              data-testid="logo-upload-input"
              className="bg-zinc-950 border-zinc-800"
            />
            <p className="text-xs text-zinc-500 mt-2">Upload your shop logo (PNG, JPG)</p>
          </Card>
        </div>
      </div>
    </div>
  );
};