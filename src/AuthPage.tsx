import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, 
  Lock, 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  CheckCircle2,
  BarChart3
} from 'lucide-react';
import { 
  auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail 
} from './firebase';

interface AuthPageProps {
  onLogin: (email: string) => void;
}

type AuthMode = 'login' | 'register' | 'forgot';

export default function AuthPage({ onLogin }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === 'login') {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        onLogin(userCredential.user.email || email);
      } else if (mode === 'register') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        onLogin(userCredential.user.email || email);
      } else if (mode === 'forgot') {
        await sendPasswordResetEmail(auth, email);
        setMessage('Se ha enviado un correo para restablecer tu contraseña. Revisa tu bandeja de entrada.');
        setTimeout(() => setMode('login'), 5000);
      }
    } catch (err: any) {
      console.error(err);
      let msg = 'Ocurrió un error inesperado.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'Credenciales incorrectas.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'Este correo ya está registrado.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'La contraseña debe tener al menos 6 caracteres.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Formato de correo inválido.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8"
      >
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4">
            <BarChart3 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-black font-headline tracking-tight text-on-surface">VotaBien México</h1>
          <p className="text-on-surface-variant">
            {mode === 'login' && 'Inicia sesión para acceder al análisis estatal'}
            {mode === 'register' && 'Crea una cuenta para comenzar'}
            {mode === 'forgot' && 'Restablece tu contraseña'}
          </p>
        </div>

        <div className="bg-surface-variant/30 border border-white/5 rounded-3xl p-8 backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-14 bg-surface border border-white/10 rounded-xl pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="tu@correo.com"
                  required
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
                  <input 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-14 bg-surface border border-white/10 rounded-xl pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            )}

            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 p-4 bg-error/10 border border-error/20 rounded-xl text-error text-sm"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </motion.div>
              )}
              {message && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 p-4 bg-primary/10 border border-primary/20 rounded-xl text-primary text-sm"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  {message}
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {mode === 'login' && 'Entrar'}
                  {mode === 'register' && 'Registrarse'}
                  {mode === 'forgot' && 'Enviar Correo'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center space-y-4">
            {mode === 'login' ? (
              <>
                <button 
                  onClick={() => setMode('register')}
                  className="text-sm text-on-surface-variant hover:text-primary transition-colors"
                >
                  ¿No tienes cuenta? <span className="font-bold">Regístrate</span>
                </button>
                <br />
                <button 
                  onClick={() => setMode('forgot')}
                  className="text-xs text-on-surface-variant/60 hover:text-on-surface transition-colors"
                >
                  Olvidé mi contraseña
                </button>
              </>
            ) : (
              <button 
                onClick={() => setMode('login')}
                className="text-sm text-on-surface-variant hover:text-primary transition-colors"
              >
                Volver al <span className="font-bold">Inicio de Sesión</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
