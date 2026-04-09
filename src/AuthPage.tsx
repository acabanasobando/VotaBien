import { motion, AnimatePresence } from 'motion/react';
import { LogIn, Loader2, AlertCircle, Mail, Lock, ArrowRight, CheckCircle2, UserPlus, KeyRound } from 'lucide-react';
import { cn } from './lib/utils';
import { 
  signInWithGoogle, 
  auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail 
} from './firebase';
import { useState } from 'react';

interface AuthPageProps {
  onLogin: (email: string) => void;
}

type AuthMode = 'options' | 'login' | 'register' | 'forgot-password';

export default function AuthPage({ onLogin }: AuthPageProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<AuthMode>('options');
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

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError(null);
    try {
      if (mode === 'login') {
        const result = await signInWithEmailAndPassword(auth, email, password);
        if (result.user.email) onLogin(result.user.email);
      } else if (mode === 'register') {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        if (result.user.email) onLogin(result.user.email);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Correo o contraseña incorrectos.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Este correo ya está registrado.');
      } else if (err.code === 'auth/weak-password') {
        setError('La contraseña debe tener al menos 6 caracteres.');
      } else {
        setError('Error al autenticar. Por favor, intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess('Se ha enviado un correo para restablecer tu contraseña.');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found') {
        setError('No existe una cuenta con este correo.');
      } else {
        setError('Error al enviar el correo de recuperación.');
      }
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
            {mode === 'options' && 'Elige tu método de acceso preferido.'}
            {mode === 'login' && 'Ingresa tus credenciales para acceder.'}
            {mode === 'register' && 'Crea una cuenta nueva para comenzar.'}
            {mode === 'forgot-password' && 'Ingresa tu correo para recuperar tu contraseña.'}
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

          {success && (
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
            {mode === 'options' ? (
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

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setMode('login')}
                    className="w-full bg-surface-hover text-on-surface font-bold py-4 rounded-xl flex items-center justify-center gap-2 border border-white/10 transition-all hover:bg-white/5 active:scale-95"
                  >
                    <LogIn className="w-4 h-4 text-primary" />
                    <span>Ingresar</span>
                  </button>
                  <button
                    onClick={() => setMode('register')}
                    className="w-full bg-surface-hover text-on-surface font-bold py-4 rounded-xl flex items-center justify-center gap-2 border border-white/10 transition-all hover:bg-white/5 active:scale-95"
                  >
                    <UserPlus className="w-4 h-4 text-primary" />
                    <span>Registrar</span>
                  </button>
                </div>
              </motion.div>
            ) : mode === 'login' || mode === 'register' ? (
              <motion.form
                key="auth-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleEmailAuth}
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
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
                  <input
                    type="password"
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-surface border border-white/10 rounded-xl py-4 pl-12 pr-4 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    required
                  />
                </div>
                
                {mode === 'login' && (
                  <button 
                    type="button" 
                    onClick={() => setMode('forgot-password')}
                    className="text-xs text-primary hover:underline font-bold text-right w-full"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-on-primary font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      <span>{mode === 'login' ? 'Ingresar' : 'Registrar'}</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
                
                <div className="flex justify-between items-center px-2">
                  <button type="button" onClick={() => setMode('options')} className="text-on-surface-variant text-sm hover:text-on-surface">Volver</button>
                  <button 
                    type="button" 
                    onClick={() => setMode(mode === 'login' ? 'register' : 'login')} 
                    className="text-primary text-sm font-bold hover:underline"
                  >
                    {mode === 'login' ? 'Crear cuenta' : 'Ya tengo cuenta'}
                  </button>
                </div>
              </motion.form>
            ) : (
              <motion.form
                key="forgot-password-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleForgotPassword}
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
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      <span>Recuperar Contraseña</span>
                      <KeyRound className="w-5 h-5" />
                    </>
                  )}
                </button>
                <button type="button" onClick={() => setMode('login')} className="w-full text-on-surface-variant text-sm hover:text-on-surface">Volver al ingreso</button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
