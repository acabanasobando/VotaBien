import { motion, AnimatePresence } from 'motion/react';
import { LogIn, Loader2, AlertCircle, Mail, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { cn } from './lib/utils';
import { signInWithGoogle } from './firebase';
import { useState } from 'react';

interface AuthPageProps {
  onLogin: (email: string) => void;
}

export default function AuthPage({ onLogin }: AuthPageProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'options' | 'email' | 'code'>('options');
  const [success, setSuccess] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await signInWithGoogle();
      if (user?.email) {
        onLogin(user.email);
      }
    } catch (err) {
      setError('Error al iniciar sesión con Google. Por favor, intenta de nuevo.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("El servidor no respondió con el formato esperado. Intenta de nuevo.");
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error al enviar el código.');

      setSuccess('Código enviado. Revisa tu consola (simulación).');
      setStep('code');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar el código.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("El servidor no respondió con el formato esperado. Intenta de nuevo.");
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Código incorrecto.');

      onLogin(email);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al verificar el código.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-surface-container border border-white/5 rounded-3xl p-8 shadow-2xl"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4">
            <LogIn className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-on-surface mb-2">Acceso a VotaBien</h1>
          <p className="text-on-surface-variant">
            {step === 'options' && 'Elige tu método de acceso preferido.'}
            {step === 'email' && 'Ingresa tu correo para recibir un código.'}
            {step === 'code' && `Ingresa el código enviado a ${email}`}
          </p>
        </div>

        <div className="space-y-6">
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex items-center gap-2 text-status-bad text-sm bg-status-bad/10 p-3 rounded-xl border border-status-bad/20"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {success && step === 'code' && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex items-center gap-2 text-status-good text-sm bg-status-good/10 p-3 rounded-xl border border-status-good/20"
            >
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{success}</span>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {step === 'options' ? (
              <motion.div
                key="options"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className={cn(
                    "w-full bg-white text-black font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all hover:bg-gray-100 active:scale-95 disabled:opacity-50 shadow-lg",
                    loading && "cursor-not-allowed"
                  )}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span>Continuar con Google</span>
                </button>

                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-surface-container px-2 text-on-surface-variant">O también</span></div>
                </div>

                <button
                  onClick={() => setStep('email')}
                  className="w-full bg-surface-hover text-on-surface font-bold py-4 rounded-xl flex items-center justify-center gap-3 border border-white/10 transition-all hover:bg-white/5 active:scale-95"
                >
                  <Mail className="w-5 h-5 text-primary" />
                  <span>Acceso por Correo</span>
                </button>
              </motion.div>
            ) : step === 'email' ? (
              <motion.form
                key="email-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleSendCode}
                className="space-y-4"
              >
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
                  <input
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-surface border border-white/10 rounded-xl py-4 pl-12 pr-4 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-on-primary font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>Enviar Código</span><ArrowRight className="w-5 h-5" /></>}
                </button>
                <button type="button" onClick={() => setStep('options')} className="w-full text-on-surface-variant text-sm hover:text-on-surface">Volver</button>
              </motion.form>
            ) : (
              <motion.form
                key="code-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleVerifyCode}
                className="space-y-4"
              >
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="0000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-surface border border-white/10 rounded-xl py-4 pl-12 pr-4 text-on-surface text-center text-2xl tracking-[1em] focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-on-primary font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>Acceder</span><ArrowRight className="w-5 h-5" /></>}
                </button>
                <button type="button" onClick={() => setStep('email')} className="w-full text-on-surface-variant text-sm hover:text-on-surface">Cambiar correo</button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
