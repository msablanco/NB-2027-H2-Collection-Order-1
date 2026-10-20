import React, { useState } from 'react';
import { 
  X, 
  Store, 
  Grid3X3, 
  Layers, 
  ShoppingBag, 
  Smartphone, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import { AppView } from '../types';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
  setView: (view: AppView) => void;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({ isOpen, onClose, setView }) => {
  const [activeStep, setActiveStep] = useState<number>(0);

  if (!isOpen) return null;

  const steps = [
    {
      id: 'curated_looks',
      badge: 'Destacado',
      badgeColor: 'bg-[#CF0A2C] text-white',
      title: 'Looks New Balance',
      subtitle: 'Conjuntos completos de indumentaria y calzado',
      icon: Store,
      color: 'from-red-500/10 to-orange-500/10 text-[#CF0A2C]',
      description: 'Explorá los sets de indumentaria y calzado combinados con armonía de color oficial New Balance para potenciar tu surtido comercial.',
      points: [
        {
          title: '1. Filtros por Color y Categoría',
          desc: 'Filtrá looks por código de color oficial New Balance, por disciplina (Lifestyle, Running, Tennis) o por género.'
        },
        {
          title: '2. Armonía de color 100% coordinada',
          desc: 'Visualizá el conjunto completo (top, bottom y zapatillas) con sus códigos de artículo oficiales.'
        },
        {
          title: '3. Ficha detallada de prendas',
          desc: 'Revisá el código SKU, curva de talles, precio público y total mayorista de cada prenda que compone el set.'
        },
        {
          title: '4. Agregá el look completo o prendas sueltas',
          desc: 'Sumá todo el conjunto al pedido con un solo clic o agregá prendas individuales con el botón "+ Sumar".'
        }
      ],
      actionText: 'Explorar Looks',
      actionView: AppView.APPAREL_EXHIBITION
    },
    {
      id: 'catalog',
      badge: 'Exploración',
      badgeColor: 'bg-neutral-800 text-white',
      title: 'Catálogo Completo y Filtros',
      subtitle: 'Buscá y filtrá calzado e indumentaria New Balance',
      icon: Grid3X3,
      color: 'from-blue-500/10 to-indigo-500/10 text-blue-600',
      description: 'Accedé a toda la colección organizada por división técnica, géneros y disciplinas deportivas.',
      points: [
        {
          title: 'Pestañas de Género',
          desc: 'Filtrá rápidamente en la barra superior por Masculino, Femenino, Unisex o Infantil.'
        },
        {
          title: 'División Calzado vs Indumentaria',
          desc: 'Seleccioná la solapa de Calzado o Indumentaria para ver stock, colores y especificaciones técnicas.'
        },
        {
          title: 'Superficie y Deporte',
          desc: 'Filtrá por Running, Lifestyle, Tennis, Training o Skateboarding con portadas dinámicas.'
        },
        {
          title: 'Buscador Inteligente',
          desc: 'Escribí el modelo (ej: "574", "1080", "Fresh Foam"), código de color o SKU para hallarlo al instante.'
        }
      ],
      actionText: 'Explorar Catálogo',
      actionView: AppView.PRODUCTS
    },
    {
      id: 'wall',
      badge: 'Visual Merchandising',
      badgeColor: 'bg-emerald-700 text-white',
      title: 'Pared 3D de Calzado',
      subtitle: 'Planificación de exhibición por bimestres de lanzamiento',
      icon: Layers,
      color: 'from-emerald-500/10 to-teal-500/10 text-emerald-600',
      description: 'Visualizá la pared completa de zapatillas tal como se exhibe en una tienda oficial New Balance.',
      points: [
        {
          title: 'Distribución por Bimestres',
          desc: 'Agrupación por fechas comerciales: Jul/Ago, Sept/Oct y Nov/Dic para programar tus entregas.'
        },
        {
          title: 'Pared de Favoritos',
          desc: 'Cambiá a la pared de tus favoritos para armar tu propia selección curada de tienda.'
        },
        {
          title: 'Fichas con Vista Rápida',
          desc: 'Hacé clic en cualquier zapatilla para ver fotos en alta resolución, tecnologías de suela y precio.'
        }
      ],
      actionText: 'Ver Pared de Calzado',
      actionView: AppView.INTERACTIVE_WALL
    },
    {
      id: 'mobile',
      badge: 'En tu celular',
      badgeColor: 'bg-purple-700 text-white',
      title: 'Navegación Móvil Adaptada',
      subtitle: 'Diseñado para usarse cómodamente desde tu teléfono',
      icon: Smartphone,
      color: 'from-purple-500/10 to-pink-500/10 text-purple-600',
      description: 'La app detecta automáticamente cuando ingresás desde un celular y adapta la interfaz para una experiencia táctil fluida.',
      points: [
        {
          title: 'Barra inferior fija',
          desc: 'Acceso directo a Catálogo, Looks, Pared 3D, Favoritos y Carrito siempre al alcance de tu pulgar.'
        },
        {
          title: 'Selector en formato Drawer',
          desc: 'Al explorar productos desde el celular, se abre un menú inferior deslizable fácil de tocar.'
        },
        {
          title: 'Barra flotante de compra',
          desc: 'En cada conjunto tenés el botón de compra siempre a mano con el precio total del look.'
        }
      ],
      actionText: 'Ir a Looks',
      actionView: AppView.APPAREL_EXHIBITION
    }
  ];

  const current = steps[activeStep];
  const StepIcon = current.icon;

  const handleAction = () => {
    setView(current.actionView);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
      <div 
        className="bg-white rounded-2xl sm:rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-gray-150 flex flex-col max-h-[92vh] animate-scale-in"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="relative bg-gradient-to-r from-stone-900 via-neutral-900 to-black text-white px-5 sm:px-7 py-4 sm:py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#CF0A2C] flex items-center justify-center text-white shadow-md shadow-red-950/40">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg text-white tracking-tight">
                  ¿Cómo funciona la app?
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-stone-800 text-gray-300 border border-stone-700">
                  Guía Rápida
                </span>
              </div>
              <p className="text-gray-400 text-xs">
                Tutorial paso a paso para aprovechar al máximo las herramientas
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
            aria-label="Cerrar guía"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Selector Tabs */}
        <div className="bg-stone-50 border-b border-gray-200 px-3 sm:px-6 py-2 overflow-x-auto hide-scrollbar flex items-center gap-1.5 sm:gap-2">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isSelected = activeStep === idx;
            return (
              <button
                key={step.id}
                onClick={() => setActiveStep(idx)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#CF0A2C]' : ''}`} />
                <span>{step.title.split(':')[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="p-5 sm:p-7 overflow-y-auto flex-1 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider ${current.badgeColor}`}>
                {current.badge}
              </span>
              <h4 className="text-lg sm:text-xl font-black text-gray-950 mt-1.5 tracking-tight">
                {current.title}
              </h4>
              <p className="text-gray-500 text-xs sm:text-sm font-medium mt-0.5">
                {current.subtitle}
              </p>
            </div>

            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${current.color} flex items-center justify-center shrink-0 border border-gray-100`}>
              <StepIcon className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-stone-50 rounded-xl p-3.5 border border-stone-200/80 text-xs sm:text-sm text-gray-700 leading-relaxed">
            {current.description}
          </div>

          {/* Points list */}
          <div className="space-y-2.5 pt-1">
            {current.points.map((pt, i) => (
              <div key={i} className="flex items-start gap-3 p-2.5 rounded-xl bg-white border border-gray-150 hover:border-gray-300 transition-colors">
                <div className="w-5 h-5 rounded-full bg-red-50 text-[#CF0A2C] flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h5 className="text-xs sm:text-sm font-bold text-gray-900">
                    {pt.title}
                  </h5>
                  <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                    {pt.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-gray-200 px-5 sm:px-7 py-3.5 bg-gray-50/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span>Paso {activeStep + 1} de {steps.length}</span>
            <div className="flex gap-1 ml-2">
              {steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveStep(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    activeStep === i ? 'w-5 bg-[#CF0A2C]' : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Ir al paso ${i + 1}`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {activeStep < steps.length - 1 ? (
              <button
                onClick={() => setActiveStep(prev => prev + 1)}
                className="w-full sm:w-auto px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl text-xs font-bold transition-all text-center"
              >
                Siguiente paso
              </button>
            ) : null}

            <button
              onClick={handleAction}
              className="w-full sm:w-auto px-5 py-2.5 bg-[#CF0A2C] hover:bg-[#B00824] active:bg-[#96061e] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <span>{current.actionText}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
