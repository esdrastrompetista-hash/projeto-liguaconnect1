import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Mail, Lock, Chrome, User, ArrowLeft } from 'lucide-react';

interface LoginPageProps {
  onLogin: (email: string, password: string) => void;
  onGoogleLogin: (data: { googleId: string; email: string; name: string; avatarUrl?: string }) => void;
  onRegister: (data: {
    name: string;
    email: string;
    password: string;
  }) => void;
}

export function LoginPage({ onLogin, onGoogleLogin, onRegister }: LoginPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        await onLogin(email, password);
      } else {
        await onRegister({ name, email, password });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao autenticar');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      // Simulate Google login - in production, use Google OAuth
      const mockGoogleData = {
        googleId: `google_${Date.now()}`,
        email: email || 'user@gmail.com',
        name: name || 'Google User',
        avatarUrl: undefined as string | undefined,
      };
      await onGoogleLogin(mockGoogleData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login com Google');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-fuchsia-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-3xl shadow-xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center"
            >
              <Globe className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold text-slate-900">
              {isLogin ? 'Welcome to' : 'Create Account'}
            </h1>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
              LinguaConnect
            </h2>
            <p className="text-slate-500 mt-2">
              {isLogin ? 'Sign in to continue' : 'Join our community'}
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center"
            >
              {error}
            </motion.div>
          )}

          {/* Google Login */}
          <Button
            variant="outline"
            className="w-full mb-4 h-12 border-slate-200 hover:bg-slate-50"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            <Chrome className="w-5 h-5 mr-2 text-red-500" />
            Continue with Google
          </Button>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <Separator className="flex-1" />
            <span className="text-slate-400 text-sm">OR</span>
            <Separator className="flex-1" />
          </div>

          {/* Form */}
          <AnimatePresence mode="wait">
            <motion.form
              key={isLogin ? 'login' : 'register'}
              initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-center block">Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 h-12"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-center block">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-center block">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-12"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white"
                disabled={isLoading}
              >
                {isLoading 
                  ? (isLogin ? 'Signing in...' : 'Creating account...') 
                  : (isLogin ? 'Sign in' : 'Create account')
                }
              </Button>
            </motion.form>
          </AnimatePresence>

          {/* Toggle */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-slate-500 hover:text-violet-600 transition-colors text-sm"
            >
              {isLogin ? (
                <>Need an account? <span className="text-violet-600 font-medium">Sign up</span></>
              ) : (
                <span className="flex items-center justify-center gap-1">
                  <ArrowLeft className="w-4 h-4" /> Already have an account? Sign in
                </span>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
