import React, { useState } from 'react';
import { 
  BookOpen, 
  Layers, 
  Calendar, 
  Heart, 
  ShoppingCart, 
  Copy, 
  FileText, 
  LayoutGrid, 
  Filter, 
  ArrowLeft,
  ArrowRight,
  CheckCircle2, 
  Sparkles, 
  Store, 
  Smartphone, 
  Rocket, 
  Grid3X3,
  SlidersHorizontal,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { AppView } from '../types';

interface ManualViewProps {
  setView?: (view: AppView) => void;
}

export const ManualView: React.FC<ManualViewProps> = ({ setView }) => {
  const [activeTab, setActiveTab] = useState<
    'all' | 'basics' | 'looks' | 'modes' | 'cart' | 'wall' | 'mobile' | 'personal' | 'duplicate'
  >('all');

  const tabs = [
    { id: 'all', label: '📖 Todo el Manual', icon: BookOpen },
    { id: 'basics', label: '🔍 Catálogo y Filtros', icon: Filter },
    { id: 'looks', label: '✨ Looks y Maniquí', icon: Store },
    { id: 'modes', label: '👟 Reglas Modo Libre', icon: Layers },
    { id: 'cart', label: '📅 Distribución / Bimestre', icon: Calendar },
    { id: 'wall', label: '🎨 Pared Interactiva 3D', icon: LayoutGrid },
    { id: 'mobile', label: '📱 Experiencia Móvil', icon: Smartphone },
    { id: 'personal', label: '📝 Datos y Fiscales', icon: FileText },
    { id: 'duplicate', label: '🔄 Duplicar y Pedidos', icon: Copy }
  ] as const;

  return (
    <div className="bg-white p-5 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl shadow-xl max-w-5xl mx-auto border border-gray-150 animate-fade-in">
      
      {/* Encabezado Principal */}
      <div className="border-b border-gray-150 pb-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-4">
          <div className="p-3.5 bg-[#CF0A2C] text-white rounded-2xl shadow-lg shadow-red-200 shrink-0">
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                Manual de Uso y Guía Integral
              </h1>
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-red-50 text-[#CF0A2C] border border-red-200">
                Catálogo NB H2-2027
              </span>
            </div>
            <p className="text-gray-500 mt-1 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Guía unificada y consolidada con todas las herramientas de la plataforma: navegación, catálogo, looks de campaña con maniquí virtual, carga de pedidos en modo libre, distribución por bimestres, exhibición 3D y gestión de sucursales.
            </p>
          </div>
        </div>

        {setView && (
          <button
            onClick={() => setView(AppView.PRODUCTS)}
            className="self-start md:self-center px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer shadow-xs active:scale-98"
          >
            <ArrowLeft className="w-4 h-4 text-[#CF0A2C]" />
            <span>Volver al Catálogo</span>
          </button>
        )}
      </div>

      {/* Menú de Navegación del Manual (Pestañas) */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-8 bg-gray-50 p-2 rounded-2xl border border-gray-200/80">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                isActive 
                  ? 'bg-[#CF0A2C] text-white shadow-md shadow-red-200 font-extrabold scale-[1.02]' 
                  : 'text-gray-600 hover:text-gray-950 hover:bg-white border border-transparent hover:border-gray-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Contenido Dinámico Consolidado */}
      <div className="space-y-12">
        
        {/* SECCIÓN 1: NAVEGACIÓN, FILTROS Y LANZAMIENTOS */}
        {(activeTab === 'all' || activeTab === 'basics') && (
          <section className="bg-white border border-slate-200 p-6 sm:p-7 rounded-2xl space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-red-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-red-50 text-[#CF0A2C] rounded-xl">
                  <Filter className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900 tracking-tight">
                    1. Catálogo, Navegación y Filtros Inteligentes
                  </h2>
                  <p className="text-xs text-gray-500">
                    Búsqueda ágil, filtros por superficie, agrupación cromática y novedades de temporada.
                  </p>
                </div>
              </div>

              {setView && (
                <button
                  onClick={() => setView(AppView.PRODUCTS)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#CF0A2C] bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg border border-red-200 transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <span>Ir al Catálogo</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              <div className="bg-slate-50/70 p-4 rounded-xl space-y-2.5 border border-slate-200">
                <h3 className="text-xs font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-[#CF0A2C]">🎯</span> Navegación Dinámica y Segmentada
                </h3>
                <ul className="text-xs text-gray-650 space-y-2 pl-4 list-disc">
                  <li><strong>Buscador Inteligente:</strong> Podés escribir el modelo (ej: <em>"574"</em>, <em>"1080"</em>, <em>"Rebel"</em>), SKU exacto, código de color o disciplina para encontrar el artículo al instante.</li>
                  <li><strong>Pestañas de Género:</strong> Filtrá en la barra superior por <strong>Masculino</strong>, <strong>Femenino</strong>, <strong>Unisex</strong>, <strong>Infantil</strong> o <strong>Baby</strong>.</li>
                  <li><strong>División Técnica:</strong> Alterná entre <strong>Calzado</strong>, <strong>Indumentaria</strong> y <strong>Accesorios</strong> con conteos actualizados.</li>
                  <li><strong>Superficie y Deporte:</strong> Botones interactivos con portadas de campaña que cambian de acuerdo a la disciplina elegida (<em>Running</em>, <em>Lifestyle</em>, <em>Tennis</em>, <em>Training</em>, <em>Skateboarding</em>).</li>
                </ul>
              </div>

              <div className="bg-slate-50/70 p-4 rounded-xl space-y-2.5 border border-slate-200">
                <h3 className="text-xs font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-[#CF0A2C]">⚡</span> Opciones Avanzadas de Visualización
                </h3>
                <ul className="text-xs text-gray-650 space-y-2 pl-4 list-disc">
                  <li><strong>Switch «Por Modelo» vs «Por Color»:</strong>
                    <ul className="list-circle pl-4 mt-1 space-y-1 text-gray-600">
                      <li><strong>Por Modelo (Orden Catálogo):</strong> Mantiene agrupadas contiguamente todas las variantes de color de cada silueta respetando el orden oficial de la colección.</li>
                      <li><strong>Por Color (Cápsulas de Temporada):</strong> Agrupa las prendas y calzados por cápsula cromática coordinada (<em>Boylston Grey</em>, <em>Black</em>, <em>Cambridge Burgundy</em>, <em>Iron Oxide</em>, <em>Dark Ivy</em>), ideal para compras armonizadas.</li>
                    </ul>
                  </li>
                  <li><strong>🚀 Insignia de Lanzamiento:</strong> Los artículos identificados como novedades destacadas de temporada lucen el badge oficial de lanzamiento para diferenciarse a simple vista.</li>
                  <li><strong>Modo Mosaico Compacto:</strong> Reduce el tamaño de las tarjetas para examinar más productos en pantalla.</li>
                  <li><strong>Ocultar Favoritos:</strong> Permite filtrar rápidamente para revisar solo los calzados que aún no hayan sido analizados.</li>
                </ul>
              </div>

            </div>

            {/* Favoritos, Comentarios y Estrellas */}
            <div className="bg-sky-50/70 border border-sky-150 p-4 sm:p-5 rounded-xl space-y-2.5">
              <h3 className="text-xs font-bold text-sky-950 flex items-center gap-2">
                <span className="text-sky-600">💖</span> Interacciones Enriquecidas: Favoritos, Notas y Calificaciones
              </h3>
              <p className="text-xs text-sky-900 leading-relaxed">
                Cada tarjeta de producto permite marcar un calzado como <strong>Favorito</strong> (corazón), añadir <strong>Comentarios personalizados</strong> (ícono de globo para anotar sugerencias de distribución o local) y asignar una <strong>Valoración de 1 a 5 estrellas</strong>.
              </p>
              <div className="bg-white p-3 rounded-lg border border-sky-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-sky-900">
                <span className="font-bold flex items-center gap-1.5 shrink-0">
                  <span className="text-red-500">📄</span> ¡Planilla Unificada sin Notas Dispersas!
                </span>
                <span>Todas tus notas, comentarios y favoritos quedan centralizados directamente en la plataforma para exportarse en la planilla de pedido (Excel comercial y PDF), listos para respaldarse en Google Drive y enviarse por correo.</span>
              </div>
            </div>
          </section>
        )}

        {/* SECCIÓN 2: LOOKS Y MANIQUÍ VIRTUAL (CONSOLIDADO DE ¿CÓMO FUNCIONA?) */}
        {(activeTab === 'all' || activeTab === 'looks') && (
          <section className="bg-white border border-rose-200/80 p-6 sm:p-7 rounded-2xl space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-rose-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-50 text-[#CF0A2C] rounded-xl">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">
                      2. Looks New Balance & Maniquí Virtual Interactivo
                    </h2>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-[#CF0A2C] text-white">
                      Curaduría Oficial
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Conjuntos completos de indumentaria y calzado coordinados por cápsulas cromáticas oficiales.
                  </p>
                </div>
              </div>

              {setView && (
                <button
                  onClick={() => setView(AppView.APPAREL_EXHIBITION)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#CF0A2C] hover:bg-[#B00824] px-3.5 py-1.5 rounded-lg shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <span>Explorar Looks</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Los <strong>Looks Oficiales New Balance</strong> reúnen la propuesta de indumentaria textil (top, bottom y capa de abrigo) coordinada con el calzado clave de cada disciplina para elevar el ticket promedio y facilitar una compra de conjunto atractiva para tus clientes.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              <div className="bg-gradient-to-br from-rose-50/40 to-orange-50/30 p-4 rounded-xl border border-rose-150 space-y-3">
                <h3 className="text-xs font-bold text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#CF0A2C]" />
                  <span>Beneficios de la Curaduría de Looks</span>
                </h3>
                <ul className="text-xs text-gray-650 space-y-2 pl-4 list-disc">
                  <li><strong>Armonía de Color 100% Coordinada:</strong> Las prendas están diseñadas bajo los mismos pantones de temporada (ej: cápsula <em>RC Running</em>, <em>Athletics Crafted</em>, <em>Trackside</em> o <em>AC Bodywear Multisport</em>).</li>
                  <li><strong>Fichas Técnicas Detalladas:</strong> Cada conjunto desglosa el código SKU de cada prenda, su curva de talles disponible, precio de venta al público sugerido y precio mayorista.</li>
                  <li><strong>Compra Flexible:</strong> Podés sumar el <strong>look completo en un solo clic</strong> o seleccionar prendas individuales mediante el botón <strong>"+ Sumar"</strong>.</li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-slate-50 to-stone-50 p-4 rounded-xl border border-gray-200 space-y-3">
                <h3 className="text-xs font-bold text-gray-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#CF0A2C]" />
                  <span>Maniquí Virtual y Vínculo en el Catálogo</span>
                </h3>
                <ul className="text-xs text-gray-650 space-y-2 pl-4 list-disc">
                  <li><strong>Acceso Directo desde el Catálogo:</strong> Cada producto que integra un look oficial luce un badge distintivo: <em>"Look de Campaña"</em>. Al hacer clic, se abre directamente el modal interactivo con el look completo montado.</li>
                  <li><strong>Alternador de Abrigo:</strong> Podés alternar en el maniquí la visualización con abrigo (buzo/campera) o solo remera para evaluar la caída de ambas prendas.</li>
                  <li><strong>Prendas Interactivas Clicables:</strong> Al tocar cualquier prenda sobre el maniquí o en el despiece inferior, se abren sus detalles y se selecciona automáticamente en el selector.</li>
                  <li><strong>Intercalado Inteligente:</strong> Los looks se presentan intercalados dentro de su disciplina correspondiente (Running, Training, Tennis, Lifestyle), ubicándose estratégicamente junto al calzado que lo compone y al inicio del textil correspondiente.</li>
                </ul>
              </div>

            </div>
          </section>
        )}

        {/* SECCIÓN 3: MODOS DE PEDIDO (MODO LIBRE) */}
        {(activeTab === 'all' || activeTab === 'modes') && (
          <section className="bg-white border border-slate-200 p-6 sm:p-7 rounded-2xl space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-orange-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900 tracking-tight">
                    3. Carga de Pedido: Reglas del Modo Libre
                  </h2>
                  <p className="text-xs text-gray-500">
                    Carga manual personalizada por talles con validación de reglas comerciales oficiales.
                  </p>
                </div>
              </div>

              {setView && (
                <button
                  onClick={() => setView(AppView.PRODUCTS)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg border border-orange-200 transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <span>Ir a Cargar Pedido</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              La carga del pedido se efectúa a través de la grilla de talles en <strong>Modo Libre</strong>. Esto brinda libertad total para indicar manualmente la cantidad exacta que precisás por cada talle físico del calzado o prenda:
            </p>

            <div className="border border-orange-200 bg-orange-50/30 p-5 rounded-2xl space-y-3">
              <div className="flex items-center gap-2">
                <span className="bg-orange-600 text-white px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
                  Reglas Comerciales Obligatorias
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="bg-white p-3.5 rounded-xl border border-orange-200/80 shadow-2xs">
                  <span className="text-xs font-black text-orange-950 block">1. Mínimo de 12 Unidades</span>
                  <p className="text-xs text-gray-600 mt-1">
                    Cada calzado o artículo seleccionado debe sumar un mínimo absoluto de <strong>12 pares/unidades</strong>.
                  </p>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-orange-200/80 shadow-2xs">
                  <span className="text-xs font-black text-orange-950 block">2. Múltiplos de 6</span>
                  <p className="text-xs text-gray-600 mt-1">
                    El total acumulado entre todos los talles debe ser <strong>múltiplo de 6</strong> (12, 18, 24, 30, 36, etc.).
                  </p>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-orange-200/80 shadow-2xs">
                  <span className="text-xs font-black text-orange-950 block">3. Edición Segura</span>
                  <p className="text-xs text-gray-600 mt-1">
                    Si modificás un artículo ya cargado, el botón <strong>"ACTUALIZAR COMPRA"</strong> valida que mantengas los mínimos antes de guardar.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SECCIÓN 4: CARRITO Y PLANIFICACIÓN DE ENTREGAS POR BIMESTRE */}
        {(activeTab === 'all' || activeTab === 'cart') && (
          <section className="bg-white border border-slate-200 p-6 sm:p-7 rounded-2xl space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-emerald-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900 tracking-tight">
                    4. El Carrito: Planificación de Entregas por Bimestre
                  </h2>
                  <p className="text-xs text-gray-500">
                    Distribución estacional de stock y tablero de control presupuestario en tiempo real.
                  </p>
                </div>
              </div>

              {setView && (
                <button
                  onClick={() => setView(AppView.CART)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <span>Ver Mi Carrito</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              El portal te permite estructurar la distribución de los calzados seleccionados a lo largo de los períodos oficiales planificados para la temporada, facilitando coordinar la recepción en tienda con tu flujo de fondos:
            </p>

            {/* Períodos de Entrega Mensuales */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              <div className="bg-indigo-50/40 border border-indigo-200/80 p-3 rounded-xl text-center">
                <span className="text-xl block mb-1">❄️</span>
                <span className="text-xs font-black text-indigo-950 block">Julio</span>
                <span className="text-[9px] text-indigo-600 block mt-1 tracking-wider uppercase font-bold">Col. AG</span>
              </div>
              <div className="bg-indigo-50/40 border border-indigo-200/80 p-3 rounded-xl text-center">
                <span className="text-xl block mb-1">❄️</span>
                <span className="text-xs font-black text-indigo-950 block">Agosto</span>
                <span className="text-[9px] text-indigo-600 block mt-1 tracking-wider uppercase font-bold">Col. AG</span>
              </div>
              <div className="bg-emerald-50/50 border border-emerald-200/80 p-3 rounded-xl text-center">
                <span className="text-xl block mb-1">🌱</span>
                <span className="text-xs font-black text-emerald-950 block">Septiembre</span>
                <span className="text-[9px] text-emerald-600 block mt-1 tracking-wider uppercase font-bold">Col. AH</span>
              </div>
              <div className="bg-emerald-50/50 border border-emerald-200/80 p-3 rounded-xl text-center">
                <span className="text-xl block mb-1">🌱</span>
                <span className="text-xs font-black text-emerald-950 block">Octubre</span>
                <span className="text-[9px] text-emerald-600 block mt-1 tracking-wider uppercase font-bold">Col. AH</span>
              </div>
              <div className="bg-amber-50/60 border border-amber-200/80 p-3 rounded-xl text-center">
                <span className="text-xl block mb-1">☀️</span>
                <span className="text-xs font-black text-amber-950 block">Noviembre</span>
                <span className="text-[9px] text-amber-600 block mt-1 tracking-wider uppercase font-bold">Col. AI</span>
              </div>
              <div className="bg-amber-50/60 border border-amber-200/80 p-3 rounded-xl text-center">
                <span className="text-xl block mb-1">☀️</span>
                <span className="text-xs font-black text-amber-950 block">Diciembre</span>
                <span className="text-[9px] text-amber-600 block mt-1 tracking-wider uppercase font-bold">Col. AI</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
              <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-200">
                <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  <span className="text-red-500">🛡️</span> Reglas de Validación de Períodos
                </h4>
                <p className="text-xs text-gray-650 leading-relaxed">
                  Para resguardar el equilibrio en la distribución, el fraccionamiento mensual respeta las reglas comerciales: en calzado con modalidad libre, cada mes que reciba unidades debe sumar un <strong>mínimo de 12 unidades</strong> y ser <strong>múltiplo de 6</strong>. Si un período queda en 0 unidades, se considera exento de error.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-200">
                <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  <span className="text-[#CF0A2C]">📦</span> Un Pedido Dedicado por Período de Entrega
                </h4>
                <p className="text-xs text-gray-650 leading-relaxed">
                  Al confirmar la compra en el Checkout, el sistema genera automáticamente <strong>un número de pedido correlativo por período de entrega y división</strong> (ej: <code>NB272C0001</code> para Calzado y <code>NB272I0001</code> para Indumentaria y Accesorios), facilitando la gestión logística y el seguimiento de despachos por fecha.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* SECCIÓN 5: PARED INTERACTIVA 3D */}
        {(activeTab === 'all' || activeTab === 'wall') && (
          <section className="bg-white border border-slate-200 p-6 sm:p-7 rounded-2xl space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-indigo-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <LayoutGrid className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900 tracking-tight">
                    5. Pared Interactiva 3D: Simulación de Exhibición
                  </h2>
                  <p className="text-xs text-gray-500">
                    Visual Merchandising virtual para emular la estantería física de tu tienda.
                  </p>
                </div>
              </div>

              {setView && (
                <button
                  onClick={() => setView(AppView.INTERACTIVE_WALL)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-200 transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <span>Abrir Pared 3D</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Esta herramienta permite proyectar la exhibición de calzado tal como se verá en la pared de tu local, experimentando con combinaciones cromáticas y siluetas para un impacto visual superior:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
                <span className="text-xs font-bold text-indigo-950 block">⚡ Modo Autocompletado</span>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Completa la estantería automáticamente con los modelos cargados en tu carrito para simular el resultado de tu compra real.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
                <span className="text-xs font-bold text-indigo-950 block">📅 Filtro por Bimestre</span>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Filtrá por Jul/Ago, Sept/Oct o Nov/Dic para previsualizar exactamente qué productos exhibirás en tu local en cada momento del año.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
                <span className="text-xs font-bold text-indigo-950 block">💖 Pared de Favoritos</span>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Alterná a la pared de tus calzados favoritos para confeccionar una selección curada antes de definir cantidades.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* SECCIÓN 6: EXPERIENCIA MÓVIL (CONSOLIDADO DE ¿CÓMO FUNCIONA?) */}
        {(activeTab === 'all' || activeTab === 'mobile') && (
          <section className="bg-white border border-purple-200/80 p-6 sm:p-7 rounded-2xl space-y-6 shadow-xs">
            <div className="flex items-center gap-2.5 border-b pb-4 border-purple-100">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight">
                  6. Experiencia Móvil Adaptada
                </h2>
                <p className="text-xs text-gray-500">
                  Interfaz 100% responsiva diseñada para operar cómodamente desde cualquier celular o tablet.
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              La plataforma detecta automáticamente cuando ingresás desde un teléfono móvil y adapta controles, menús y botones para una navegación táctil ágil:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-purple-50/30 p-4 rounded-xl border border-purple-150 space-y-2">
                <span className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                  <span className="text-purple-600">📱</span> Barra Inferior Fija
                </span>
                <p className="text-xs text-gray-650 leading-relaxed">
                  Menú táctil permanente al alcance del pulgar con accesos rápidos a <strong>Catálogo</strong>, <strong>Looks</strong>, <strong>Pared 3D</strong>, <strong>Favoritos</strong> y <strong>Carrito</strong> con badges de notificación.
                </p>
              </div>

              <div className="bg-purple-50/30 p-4 rounded-xl border border-purple-150 space-y-2">
                <span className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                  <span className="text-purple-600">📑</span> Selectores en Drawer
                </span>
                <p className="text-xs text-gray-650 leading-relaxed">
                  Al configurar talles o filtros desde el móvil, se despliega una bandeja inferior deslizable para cargar datos fácilmente sin zoom manual ni scroll excesivo.
                </p>
              </div>

              <div className="bg-purple-50/30 p-4 rounded-xl border border-purple-150 space-y-2">
                <span className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                  <span className="text-purple-600">🛒</span> Barra Flotante de Compra
                </span>
                <p className="text-xs text-gray-650 leading-relaxed">
                  Al visualizar conjuntos de indumentaria, disponés de una barra flotante inferior fija con el totalizador del set y el botón de compra siempre visible.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* SECCIÓN 7: REGISTRO DE DATOS PERSONALES Y FISCALES */}
        {(activeTab === 'all' || activeTab === 'personal') && (
          <section className="bg-white border border-slate-200 p-6 sm:p-7 rounded-2xl space-y-6 shadow-xs">
            <div className="flex items-center gap-2.5 border-b pb-4 border-red-100">
              <div className="p-2 bg-red-50 text-[#CF0A2C] rounded-xl">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight">
                  7. Registro de Datos Comerciales, Fiscales y Envío
                </h2>
                <p className="text-xs text-gray-500">
                  Formulario unificado con validación de CUIT, autoguardado logístico y confirmación por correo.
                </p>
              </div>
            </div>
            
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Al concretar tu compra en el Carrito, el sistema solicita completar el formulario comercial y fiscal indispensable para facturar y coordinar el despacho seguro de tu mercadería:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-200">
                <h3 className="text-xs font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-[#CF0A2C]">📋</span> Identificación y Datos Fiscales
                </h3>
                <ul className="text-xs text-gray-650 space-y-2 pl-4 list-disc">
                  <li><strong>CUIT / CUIL Automatizado:</strong> Fraccionado en 3 campos dinámicos (XX - XXXXXXXX - X) con salto automático de foco al tipear. Valida exactamente 11 dígitos numéricos sin letras.</li>
                  <li><strong>Razón Social:</strong> Denominación legal de la firma bajo la cual se emitirá la facturación oficial.</li>
                  <li><strong>Dirección de Entrega:</strong> Domicilio exacto donde la logística de Grupo Dass programará los envíos físicos.</li>
                </ul>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-200">
                <h3 className="text-xs font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-[#CF0A2C]">👤</span> Contacto y Confirmación Automática
                </h3>
                <ul className="text-xs text-gray-650 space-y-2 pl-4 list-disc">
                  <li><strong>Nombre del Solicitante:</strong> Responsable que confecciona la planificación en el portal.</li>
                  <li><strong>Email y Teléfono Directos:</strong> Al confirmar la compra, el sistema despacha automáticamente un correo con la confirmación de recepción y los archivos adjuntos (Excel comercial y ficha PDF).</li>
                </ul>
              </div>

            </div>

            <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-xl text-xs flex items-start gap-3">
              <span className="text-xl shrink-0 -mt-0.5">💾</span>
              <div>
                <span className="font-bold text-amber-950 block mb-1">Tecnología de Autoguardado Logístico</span>
                Para ahorrarte tareas repetitivas en tus compras futuras, <strong>la plataforma recordará los datos cargados en tu dispositivo</strong>. Al iniciar un nuevo pedido o duplicar uno anterior, todos los campos de contacto y fiscales se completarán automáticamente; solo restará confirmar la dirección de entrega de la sucursal.
              </div>
            </div>
          </section>
        )}

        {/* SECCIÓN 8: HISTORIAL Y DUPLICADO DE PEDIDO */}
        {(activeTab === 'all' || activeTab === 'duplicate') && (
          <section className="bg-white border border-slate-200 p-6 sm:p-7 rounded-2xl space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-purple-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                  <Copy className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900 tracking-tight">
                    8. Historial, Control y Beneficio de Duplicación para Sucursales
                  </h2>
                  <p className="text-xs text-gray-500">
                    Replicá órdenes confirmadas para diferentes tiendas o sucursales con ajustes rápidos.
                  </p>
                </div>
              </div>

              {setView && (
                <button
                  onClick={() => setView(AppView.ORDERS)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg border border-purple-200 transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <span>Buscar Pedidos Anteriores</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              ¿Administrás múltiples locales? ¿Emitís pedidos similares para distintas sucursales con ajustes menores? La función de duplicación agiliza este proceso al máximo:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <h3 className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                  <span>🏛️</span> Segmentación por Sucursales
                </h3>
                <p className="text-xs text-gray-650 leading-relaxed">
                  Creá el pedido consolidado para tu tienda principal, registralo y luego duplicálo para las sucursales secundarias modificando únicamente los volúmenes o agregando artículos puntuales.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <h3 className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                  <span>🔄</span> ¿Cómo Funciona la Duplicación?
                </h3>
                <ol className="text-xs text-gray-650 space-y-1.5 pl-4 list-decimal">
                  <li>Ingresá al <strong>Buscador de Pedidos</strong> y seleccioná <strong>"Duplicar Pedido"</strong> en la orden deseada.</li>
                  <li>El sistema reinspira tu carrito activo cargando los mismos productos, curvas y desgloses de talles del pedido anterior.</li>
                  <li>Tenés control total para agregar/quitar artículos o cambiar unidades.</li>
                  <li>Al avanzar a Checkout, tus datos fiscales estarán precargados: solo restará indicar la <strong>dirección de entrega de la sucursal específica</strong>.</li>
                </ol>
              </div>
            </div>
          </section>
        )}

      </div>

      {/* Advertencia Importante de Almacenamiento Local de Datos de Usuario */}
      <div className="mt-12 bg-amber-50/80 border border-amber-250 text-amber-950 p-5 sm:p-6 rounded-2xl flex items-start gap-4 shadow-xs">
        <span className="text-2xl mt-0.5 shrink-0">⚠️</span>
        <div className="text-xs space-y-3 font-medium leading-relaxed">
          <span className="font-extrabold text-sm text-amber-950 block">
            Información Importante sobre el Resguardo de tus Datos
          </span>
          
          <p>
            Toda la información y personalizaciones que generás en este portal (<strong>carritos en proceso, distribución planificada por períodos e historial local de pedidos</strong>) se almacenan de forma local y segura en este dispositivo a través de la memoria de tu navegador.
          </p>

          <div className="space-y-1">
            <span className="font-bold text-amber-950 block">📌 Seguridad y Confirmación de tus Compras:</span>
            <p>
              Una vez que confirmás un pedido y <strong>recibís la copia oficial por correo electrónico, tu pedido ya está procesado y registrado con éxito</strong>. Borrar la caché o historial de navegación no altera el pedido ya enviado, aunque sí impedirá que lo busques localmente para la función de Duplicar Pedido.
            </p>
          </div>

          <div className="space-y-1">
            <span className="font-bold text-amber-950 block">🧹 Limpieza Operativa de Favoritos:</span>
            <p>
              Por conveniencia operativa, <strong>las notas, favoritos y comentarios se resetean automáticamente una vez confirmada la compra</strong>, permitiendo iniciar la planificación de una nueva solicitud con el catálogo limpio.
            </p>
          </div>

          <div className="bg-white/80 p-3 rounded-xl border border-amber-300/60 text-amber-900">
            <strong>💡 Recomendación:</strong> Para conservar indefinidamente el beneficio de duplicar pedidos pasados para tus diferentes sucursales, <strong>te sugerimos no borrar los datos temporales del navegador web</strong>.
          </div>
        </div>
      </div>

      {/* Botón Inferior para Volver al Catálogo */}
      {setView && (
        <div className="mt-8 text-center border-t border-gray-150 pt-6">
          <button
            onClick={() => setView(AppView.PRODUCTS)}
            className="px-6 py-2.5 bg-[#CF0A2C] hover:bg-[#B00824] active:bg-[#96061e] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md inline-flex items-center gap-2 cursor-pointer active:scale-98"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Catálogo New Balance</span>
          </button>
        </div>
      )}

    </div>
  );
};

export default ManualView;
