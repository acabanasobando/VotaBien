import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  TrendingUp, 
  GraduationCap, 
  HeartPulse, 
  ShieldCheck, 
  Gavel, 
  Truck, 
  Leaf,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Loader2,
  ChevronRight,
  BarChart3,
  ArrowLeft,
  Star,
  MapPin
} from 'lucide-react';
import { evaluateGovernment } from './services/geminiService';
import { GovernmentEvaluation, PillarEvaluation, PillarType } from './types';
import { cn } from './lib/utils';
import AuthPage from './AuthPage';
import { auth, logout } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Key } from 'lucide-react';

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

const PILLAR_ICONS: Record<string, any> = {
  'Economía': TrendingUp,
  'Educación': GraduationCap,
  'Salud': HeartPulse,
  'Seguridad': ShieldCheck,
  'Gobierno': Gavel,
  'Infraestructura': Truck,
  'Medio Ambiente': Leaf,
};

const MEXICAN_STATES = [
  "Aguascalientes", "Baja California", "Baja California Sur", "Campeche", "Chiapas", "Chihuahua", 
  "Ciudad de México", "Coahuila", "Colima", "Durango", "Estado de México", "Guanajuato", "Guerrero", 
  "Hidalgo", "Jalisco", "Michoacán", "Morelos", "Nayarit", "Nuevo León", "Oaxaca", "Puebla", 
  "Querétaro", "Quintana Roo", "San Luis Potosí", "Sinaloa", "Sonora", "Tabasco", "Tamaulipas", 
  "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas"
];

export default function App() {
  const [user, setUser] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [state, setState] = useState('');
  const [administration, setAdministration] = useState('');
  const [duration, setDuration] = useState<number>(6);
  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<GovernmentEvaluation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPillar, setSelectedPillar] = useState<PillarType | null>(null);
  const [userRatings, setUserRatings] = useState<Record<string, number>>({});

  useEffect(() => {
    // Check for custom email session first
    const savedUser = localStorage.getItem('vota_bien_user');
    if (savedUser) {
      setUser(savedUser);
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser?.email) {
        setUser(firebaseUser.email);
        localStorage.setItem('vota_bien_user', firebaseUser.email);
      } else if (!localStorage.getItem('vota_bien_user')) {
        setUser(null);
      }
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = (email: string) => {
    setUser(email);
    localStorage.setItem('vota_bien_user', email);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      localStorage.removeItem('vota_bien_user');
      setEvaluation(null);
      setUserRatings({});
    } catch (err) {
      console.error("Error logging out", err);
    }
  };

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state) return;

    setLoading(true);
    setError(null);
    try {
      const result = await evaluateGovernment(state, administration || 'Actual', duration);
      setEvaluation(result);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Hubo un error al procesar la evaluación. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage onLogin={handleLogin} />;
  }

  const handleUserRating = (pillar: string, rating: number) => {
    setUserRatings(prev => ({ ...prev, [pillar]: rating }));
  };

  const getStatusColor = (classification: string) => {
    switch (classification) {
      case 'Bueno': return 'text-status-good';
      case 'Regular': return 'text-status-regular';
      case 'Malo': return 'text-status-bad';
      default: return 'text-on-surface';
    }
  };

  const getStatusBg = (classification: string) => {
    switch (classification) {
      case 'Bueno': return 'bg-status-good/10 border-status-good/20';
      case 'Regular': return 'bg-status-regular/10 border-status-regular/20';
      case 'Malo': return 'bg-status-bad/10 border-status-bad/20';
      default: return 'bg-surface border-white/5';
    }
  };

  const currentPillarData = evaluation?.pillars.find(p => p.pillar === selectedPillar);

  const userAverageScore = Object.values(userRatings).length > 0 
    ? Object.values(userRatings).reduce((a, b) => a + b, 0) / Object.values(userRatings).length 
    : null;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-6 sticky top-0 z-50 glass">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-black font-headline tracking-tight text-primary">VotaBien México</h1>
        </div>
        <div className="flex items-center gap-4">
          {window.aistudio && (
            <button 
              onClick={() => window.aistudio?.openSelectKey()}
              className="flex items-center gap-2 px-3 py-1.5 bg-surface-hover border border-white/10 rounded-lg text-xs font-bold text-on-surface hover:bg-white/5 transition-all"
              title="Configurar clave de API para búsqueda en tiempo real"
            >
              <Key className="w-3.5 h-3.5 text-primary" />
              <span className="hidden sm:inline">Configurar IA</span>
            </button>
          )}
          <div className="hidden md:flex flex-col items-end">
            <span className="text-xs font-medium text-on-surface">{user}</span>
            <button 
              onClick={handleLogout}
              className="text-[10px] text-primary hover:underline font-bold uppercase tracking-wider"
            >
              Cerrar Sesión
            </button>
          </div>
          <button 
            onClick={() => { setEvaluation(null); setState(''); setAdministration(''); setSelectedPillar(null); }}
            className="text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors"
          >
            Nueva Consulta
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12">
        <AnimatePresence mode="wait">
          {!evaluation && !loading ? (
            <motion.div 
              key="search"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12 text-center"
            >
              <div className="space-y-4">
                <h2 className="text-5xl md:text-6xl font-black font-headline tracking-tighter leading-none">
                  Evaluación <span className="text-primary">Estatal</span> México
                </h2>
                <p className="text-xl text-on-surface-variant max-w-2xl mx-auto">
                  Analiza el desempeño de los gobiernos estatales en México con datos objetivos y comparables.
                </p>
              </div>

              <form onSubmit={handleEvaluate} className="max-w-xl mx-auto space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 text-left">
                    <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">Estado de México</label>
                    <select 
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full h-14 bg-surface border border-white/10 rounded-xl px-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none"
                      required
                    >
                      <option value="" disabled>Selecciona un estado</option>
                      {MEXICAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2 text-left">
                    <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">Administración / Periodo</label>
                    <input 
                      type="text" 
                      value={administration}
                      onChange={(e) => setAdministration(e.target.value)}
                      placeholder="Ej. Actual, 2018-2024..."
                      className="w-full h-14 bg-surface border border-white/10 rounded-xl px-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-3 text-left">
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">Ciclo de Gestión (Duración)</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setDuration(3)}
                      className={cn(
                        "h-14 rounded-xl border font-bold transition-all flex items-center justify-center gap-2",
                        duration === 3 
                          ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" 
                          : "bg-surface border-white/10 text-on-surface-variant hover:border-white/20"
                      )}
                    >
                      Trienio (3 años)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDuration(6)}
                      className={cn(
                        "h-14 rounded-xl border font-bold transition-all flex items-center justify-center gap-2",
                        duration === 6 
                          ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" 
                          : "bg-surface border-white/10 text-on-surface-variant hover:border-white/20"
                      )}
                    >
                      Sexenio (6 años)
                    </button>
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <Search className="w-5 h-5" />
                  Iniciar Evaluación Estatal
                </button>
              </form>

              {error && (
                <div className="p-6 bg-status-bad/10 border border-status-bad/20 rounded-2xl text-status-bad text-sm space-y-4">
                  <div className="flex items-center gap-2 justify-center">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-bold">Error de Análisis</span>
                  </div>
                  <p>{error}</p>
                  {(error.includes("403") || error.includes("permisos")) && window.aistudio && (
                    <button 
                      onClick={() => window.aistudio?.openSelectKey()}
                      className="px-6 py-3 bg-status-bad text-white font-bold rounded-xl hover:bg-status-bad/90 transition-all flex items-center gap-2 mx-auto shadow-lg shadow-status-bad/20"
                    >
                      <Key className="w-4 h-4" />
                      Configurar Clave de IA
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          ) : loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-24 space-y-8"
            >
              <div className="relative">
                <Loader2 className="w-16 h-16 text-primary animate-spin" />
                <div className="absolute inset-0 blur-2xl bg-primary/20 animate-pulse" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold font-headline">Analizando Estado...</h3>
                <p className="text-on-surface-variant animate-pulse">Consultando indicadores de {state}...</p>
              </div>
            </motion.div>
          ) : evaluation && !selectedPillar ? (
            <motion.div 
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-12"
            >
              {/* Summary Header */}
              <section className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 p-8 rounded-2xl glass">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-xs">
                    <MapPin className="w-4 h-4" />
                    México • {evaluation.state}
                  </div>
                  <h2 className="text-4xl font-black font-headline tracking-tighter">
                    {evaluation.state}
                  </h2>
                  <p className="text-on-surface-variant font-medium">
                    Gestión: {evaluation.administration} {evaluation.periodDuration && `(${evaluation.periodDuration} años)`}
                  </p>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className={cn("text-5xl font-black font-headline", getStatusColor(evaluation.classification))}>
                      {evaluation.averageScore.toFixed(1)}
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mt-1">Promedio IA</div>
                  </div>
                  
                  {userAverageScore !== null && (
                    <>
                      <div className="h-12 w-px bg-white/10" />
                      <div className="text-center">
                        <div className="text-5xl font-black font-headline text-primary">
                          {userAverageScore.toFixed(1)}
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mt-1">Tu Promedio</div>
                      </div>
                    </>
                  )}

                  <div className="h-12 w-px bg-white/10" />
                  <div className={cn("px-6 py-3 rounded-full border font-black uppercase tracking-tighter text-sm", getStatusBg(evaluation.classification), getStatusColor(evaluation.classification))}>
                    {evaluation.classification}
                  </div>
                </div>
              </section>

              {/* Pillars Grid */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {evaluation.pillars.map((p, idx) => {
                  const Icon = PILLAR_ICONS[p.pillar] || HelpCircle;
                  const scoreColor = p.score >= 7.5 ? 'text-status-good' : p.score >= 4.6 ? 'text-status-regular' : 'text-status-bad';
                  const scoreBg = p.score >= 7.5 ? 'bg-status-good' : p.score >= 4.6 ? 'bg-status-regular' : 'bg-status-bad';
                  const userRating = userRatings[p.pillar];

                  return (
                    <motion.div 
                      key={p.pillar}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="pillar-card group cursor-pointer"
                      onClick={() => setSelectedPillar(p.pillar)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-surface-hover flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                          <h4 className="font-bold font-headline text-lg">{p.pillar}</h4>
                        </div>
                        <div className="text-right">
                          <span className={cn("text-2xl font-black font-headline", scoreColor)}>
                            {p.score}
                          </span>
                          {userRating !== undefined && (
                            <div className="flex items-center gap-1 justify-end text-[10px] text-primary font-bold">
                              <Star className="w-3 h-3 fill-primary" />
                              Tu: {userRating}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-4">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${p.score * 10}%` }}
                          className={cn("h-full rounded-full", scoreBg)}
                        />
                      </div>
                      <p className="text-sm text-on-surface-variant leading-relaxed line-clamp-2">
                        {p.justification}
                      </p>
                      <div className="mt-4 flex items-center justify-between text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>Ver detalles</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </motion.div>
                  );
                })}
              </section>

              {/* Comparison Summary */}
              {userAverageScore !== null && (
                <section className="p-8 rounded-2xl bg-primary/5 border border-primary/10 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-2xl font-black font-headline tracking-tight">Resumen Comparativo</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <span className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">Análisis Técnico (IA)</span>
                        <span className={cn("text-3xl font-black font-headline", getStatusColor(evaluation.classification))}>
                          {evaluation.averageScore.toFixed(1)}
                        </span>
                      </div>
                      <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className={cn("h-full", evaluation.averageScore >= 7.5 ? 'bg-status-good' : evaluation.averageScore >= 4.6 ? 'bg-status-regular' : 'bg-status-bad')} style={{ width: `${evaluation.averageScore * 10}%` }} />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <span className="text-sm font-bold text-primary uppercase tracking-widest">Percepción Ciudadana (Tú)</span>
                        <span className="text-3xl font-black font-headline text-primary">
                          {userAverageScore.toFixed(1)}
                        </span>
                      </div>
                      <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${userAverageScore * 10}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5 text-sm text-on-surface-variant italic">
                    {Math.abs(evaluation.averageScore - userAverageScore) > 2 
                      ? "Existe una discrepancia significativa entre los datos técnicos y tu percepción personal. Esto puede deberse a factores cualitativos no capturados por los indicadores macroeconómicos."
                      : "Tu percepción personal está alineada con los indicadores técnicos analizados por la IA."}
                  </div>
                </section>
              )}

              {/* Final Evaluation */}
              <section className="p-8 rounded-2xl bg-surface border border-white/5 space-y-4">
                <h3 className="text-xl font-bold font-headline flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-primary" />
                  Conclusión del Analista
                </h3>
                <div className="prose prose-invert max-w-none text-on-surface-variant leading-relaxed">
                  {evaluation.finalEvaluation}
                </div>
              </section>
            </motion.div>
          ) : evaluation && selectedPillar && currentPillarData && (
            <motion.div 
              key="pillar-detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <button 
                onClick={() => setSelectedPillar(null)}
                className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors font-bold"
              >
                <ArrowLeft className="w-5 h-5" />
                Volver al resumen
              </button>

              <section className="p-8 rounded-2xl glass space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                      {(() => {
                        const Icon = PILLAR_ICONS[selectedPillar] || HelpCircle;
                        return <Icon className="w-8 h-8 text-primary" />;
                      })()}
                    </div>
                    <div>
                      <h2 className="text-3xl font-black font-headline tracking-tight">{selectedPillar}</h2>
                      <p className="text-on-surface-variant font-medium">Análisis detallado para {evaluation.state}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-5xl font-black font-headline text-primary">{currentPillarData.score}</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mt-1">Calificación IA</div>
                  </div>
                </div>

                <div className="p-6 bg-surface rounded-xl border border-white/5">
                  <h4 className="font-bold mb-2 text-sm uppercase tracking-widest text-on-surface-variant">Justificación Técnica</h4>
                  <p className="text-on-surface-variant leading-relaxed">{currentPillarData.justification}</p>
                </div>

                {/* User Rating Section */}
                <div className="p-6 bg-primary/5 rounded-xl border border-primary/10 space-y-4">
                  <h4 className="font-bold text-sm uppercase tracking-widest text-primary">Tu Calificación</h4>
                  <div className="flex items-center gap-4">
                    <input 
                      type="range" 
                      min="0" 
                      max="10" 
                      step="0.5"
                      value={userRatings[selectedPillar] || 5}
                      onChange={(e) => handleUserRating(selectedPillar, parseFloat(e.target.value))}
                      className="flex-1 accent-primary"
                    />
                    <span className="text-2xl font-black font-headline text-primary w-12 text-center">
                      {userRatings[selectedPillar] || '-'}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant">Desliza para calificar según tu percepción personal.</p>
                </div>

                {/* Sub-indicators for pillars that have them */}
                {['Economía', 'Educación', 'Salud', 'Seguridad', 'Gobierno', 'Infraestructura', 'Medio Ambiente'].includes(selectedPillar || '') && currentPillarData.subIndicators && (
                  <div className="space-y-4">
                    <h4 className="font-bold text-sm uppercase tracking-widest text-on-surface-variant">Indicadores Secundarios</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentPillarData.subIndicators.map(sub => (
                        <div key={sub.name} className="p-4 bg-surface rounded-xl border border-white/5 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-sm">{sub.name}</span>
                            <span className="font-black text-primary">{sub.score}</span>
                          </div>
                          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${sub.score * 10}%` }} />
                          </div>
                          <p className="text-[11px] text-on-surface-variant leading-tight">{sub.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 text-center space-y-4">
        <div className="flex items-center justify-center gap-2 text-on-surface-variant">
          <BarChart3 className="w-4 h-4" />
          <span className="text-sm font-bold uppercase tracking-widest">VotaBien México</span>
        </div>
        <p className="text-xs text-on-surface-variant/60 max-w-md mx-auto px-6">
          Análisis estatal especializado para la República Mexicana. Datos basados en indicadores oficiales.
        </p>
      </footer>
    </div>
  );
}
