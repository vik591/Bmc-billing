import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { Loader2, Smartphone } from 'lucide-react';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'staff',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        toast.success('Login successful!');
        navigate('/dashboard');
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" data-testid="login-page">
      {/* Left side - Hero */}
      <div
        className="hidden lg:flex lg:w-1/2 bg-cover bg-center relative"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1687690476946-8e031df21449?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzN8MHwxfHNlYXJjaHwyfHxtb2Rlcm4lMjBtb2JpbGUlMjBwaG9uZSUyMHNob3AlMjBpbnRlcmlvciUyMGRhcmt8ZW58MHx8fHwxNzcxNjk5MjQ2fDA&ixlib=rb-4.1.0&q=85)',
        }}
      >
        <div className="absolute inset-0 bg-black/70" />
        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          <Smartphone className="w-16 h-16 text-[#D4AF37] mb-6" />
          <h1 className="text-5xl font-heading font-bold mb-4">
            Bharti Mobile <br />
            <span className="gold-text-gradient">Collection</span>
          </h1>
          <p className="text-xl text-zinc-300">
            Premium billing system for mobile accessories and repair shop
          </p>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#09090b]">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-3xl font-heading font-bold mb-2" data-testid="login-title">
              Welcome Back
            </h2>
            <p className="text-zinc-400">Sign in to access your dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" data-testid="login-form">
            <div>
              <Label htmlFor="email" className="text-zinc-300">Email</Label>
              <Input
                id="email"
                type="email"
                data-testid="email-input"
                placeholder="admin@bmc.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-2 bg-zinc-950 border-zinc-800 text-white focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] placeholder:text-zinc-600"
                required
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-zinc-300">Password</Label>
              <Input
                id="password"
                type="password"
                data-testid="password-input"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="mt-2 bg-zinc-950 border-zinc-800 text-white focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] placeholder:text-zinc-600"
                required
              />
            </div>

            <Button
              type="submit"
              data-testid="login-submit-button"
              disabled={loading}
              className="w-full bg-[#D4AF37] text-black hover:bg-[#b5952f] font-semibold shadow-[0_0_15px_rgba(212,175,55,0.3)] transition-all active:scale-95 py-6 text-base"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg">
            <p className="text-xs text-zinc-500 text-center mb-2">Demo Credentials</p>
            <p className="text-sm text-zinc-400 font-mono text-center">
              Email: admin@bmc.com<br />
              Password: admin123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};