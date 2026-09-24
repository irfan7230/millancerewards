import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Role } from '@/types';
import { useAuthStore } from '@/stores/authStore';
import { DEMO_ACCOUNTS } from '@/services/auth.service';
import { useToast } from '@/stores/uiStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<Role>('user');
  const [showPassword, setShowPassword] = useState(false);
  const { login, status } = useAuthStore();
  const toast = useToast();
  const navigate = useNavigate();

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Pre-fill demo account when role changes
  useEffect(() => {
    setValue('email', DEMO_ACCOUNTS[selectedRole].email);
    setValue('password', 'demo');
  }, [selectedRole, setValue]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(selectedRole, data);
      const roleHome: Record<Role, string> = {
        super_admin: '/admin/dashboard',
        franchise: '/franchise/dashboard',
        user: '/user/dashboard',
      };
      toast.success('Welcome back!', `Signed in as ${DEMO_ACCOUNTS[selectedRole].name}`);
      navigate(roleHome[selectedRole]);
    } catch {
      toast.error('Login failed', 'Please check your credentials and try again.');
    }
  };

  const tabs: { id: Role; label: string }[] = [
    { id: 'user', label: 'Member' },
    { id: 'franchise', label: 'Franchise' },
    { id: 'super_admin', label: 'Admin' },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row font-sans selection:bg-slate-900 selection:text-white">
      
      {/* Left Side - Clean Branding */}
      <div className="hidden md:flex md:w-1/2 bg-slate-50 flex-col justify-between p-12 lg:p-24 border-r border-slate-100 relative overflow-hidden">
        {/* Logo + branding copy grouped so the gap between them is controlled
            directly (mt-8) rather than stretched by justify-between. */}
        <div className="relative z-10">
          <Link to="/" className="inline-block">
            <img src="/images/stitch/logo.png" alt="Millance" className="h-24 lg:h-28 w-auto" />
          </Link>

          <div className="max-w-md mt-8 lg:mt-10">
            <h2 className="text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
              Systematic savings.<br />Premium rewards.
            </h2>
            <p className="text-lg text-slate-500 font-medium leading-relaxed">
              Log in to access your vault, manage your groups, and view your upcoming draw entries in a completely transparent ecosystem.
            </p>
          </div>
        </div>
        
        <div className="relative z-10 text-sm font-semibold text-slate-400">
          &copy; {new Date().getFullYear()} Millance. All rights reserved.
        </div>

        {/* Minimalist decorative background elements */}
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-slate-200/50 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
        <div className="absolute top-1/4 -right-32 w-96 h-96 bg-indigo-100/50 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 md:px-16 lg:px-32 relative">
        
        {/* Mobile Logo */}
        <div className="md:hidden mb-10">
          <Link to="/">
            <img src="/images/stitch/logo.png" alt="Millance" className="h-24 w-auto" />
          </Link>
        </div>

        <div className="max-w-md w-full mx-auto md:mx-0">
          
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Welcome back</h1>
          <p className="text-sm text-slate-500 font-medium">Please enter your details to sign in.</p>

          {/* Role Tabs — large top margin creates clear vertical space below the
              subtitle; bottom margin separates the tabs from the form fields. */}
          <div className="flex items-center gap-8 mt-16 mb-12 border-b border-slate-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedRole(tab.id)}
                className={cn(
                  "pb-3 text-sm font-bold transition-all relative",
                  selectedRole === tab.id 
                    ? "text-slate-900" 
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                {tab.label}
                {selectedRole === tab.id && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-slate-900 rounded-t-full shadow-[0_-2px_8px_rgba(0,0,0,0.15)]" />
                )}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">Email Address</label>
              <input
                {...register('email')}
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                className={cn(
                  "w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all",
                  errors.email && "border-red-300 focus:ring-red-500"
                )}
              />
              {errors.email && (
                <p className="text-xs font-semibold text-red-500 mt-1.5">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">Password</label>
                <a href="#" className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors">Forgot?</a>
              </div>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className={cn(
                    "w-full pl-4 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all",
                    errors.password && "border-red-300 focus:ring-red-500"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs font-semibold text-red-500 mt-1.5">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              loading={status === 'loading'}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="w-full mt-2 h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-lg shadow-slate-900/20 hover:shadow-xl hover:shadow-slate-900/30 transition-all"
            >
              Sign In
            </Button>

          </form>

        </div>
      </div>
    </div>
  );
}
