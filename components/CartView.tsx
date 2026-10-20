import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { useReviews } from '../context/ReviewsContext';
import { products } from '../data/products';
import { AppView } from '../types';
import { TrashIcon } from './icons/TrashIcon';
import { generatePDF as generatePDFUtil, generateExcel as generateExcelUtil } from '../utils/exportUtils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as ExcelJS from 'exceljs';
import { InteractivePieChart, InteractiveBarChart } from './CartCharts';
import { getProxiedUrl } from './mediaHelper';
import { getCachedImage } from './TransparentImage';
import MultiSelectDropdown from './MultiSelectDropdown';
import { Activity, Users, Sparkles, Layers, ShoppingBag, Calendar } from 'lucide-react';
import { getProductCurveInfo, buildCurveSizeBreakdown } from '../utils/sizeCurveHelper';

interface CartViewProps {
  setView: (view: AppView) => void;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7f50', '#8dd1e1', '#a4de6c', '#d0ed57'];

const CartView: React.FC<CartViewProps> = ({ setView }) => {
  const { cartItems, removeFromCart, updateQuantity, totalPrice, updateDeliveryPlan } = useCart();
  const { favorites, isFavorite } = useFavorites();
  const { getReview } = useReviews();

  const exportItems = React.useMemo(() => {
    const items = [...cartItems];
    favorites.forEach(favId => {
      if (!items.some(item => item.id === favId)) {
        const product = products.find(p => p.id === favId);
        if (product) {
          items.push({
            ...product,
            quantity: 0,
            price: product.price,
            sizeBreakdown: {},
            wholesalePrice: product.wholesalePrice
          } as any);
        }
      }
    });
    return items;
  }, [cartItems, favorites]);
  const generatePDF = () => generatePDFUtil(exportItems, isFavorite, getReview);
  const generateExcel = () => generateExcelUtil(exportItems, isFavorite, getReview);

  const getValidationErrors = () => {
    const errors: string[] = [];
    cartItems.forEach(item => {
        const curveInfo = getProductCurveInfo(item);
        // Ensure at least some units are assigned
        const totalAllocated = (item.deliveryPlan || []).reduce((acc, p) => acc + (Object.values(p.sizeBreakdown) as number[]).reduce((a: number, b: any) => a + Number(b), 0), 0);
        if (totalAllocated === 0) {
            errors.push(`El producto ${item.name} no tiene unidades asignadas en ningún periodo.`);
        }

        // 2. Disallowed periods validation
        const prod = products.find(p => (item.sku && p.sku === item.sku) || (!item.sku && p.id === item.id));
        const periodsToCheck = prod?.allowedPeriods && prod.allowedPeriods.length > 0
          ? prod.allowedPeriods
          : item.allowedPeriods && item.allowedPeriods.length > 0
          ? item.allowedPeriods
          : ['Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        (item.deliveryPlan || []).forEach(plan => {
          const totalInPeriod = (Object.values(plan.sizeBreakdown || {}) as number[]).reduce((a, b) => a + Number(b), 0);
          if (totalInPeriod > 0 && !periodsToCheck.includes(plan.period)) {
            errors.push(`El producto ${item.name} no está disponible para el período ${plan.period}. Períodos autorizados: ${periodsToCheck.join(', ')}.`);
          }
        });

        // 3. Periods valid (only enforce min 12 / multiple of 6 for Modo Libre footwear without fixed curve)
        if (!curveInfo.hasFixedCurve) {
            for (const period of periodsToCheck) {
                const planItem = item.deliveryPlan?.find(p => p.period === period);
                const currentPlanSizes = planItem?.sizeBreakdown || {};
                const totalPeriod = (Object.values(currentPlanSizes) as number[]).reduce((a: number, b: any) => a + Number(b), 0);
                if (totalPeriod > 0 && (totalPeriod < 12 || totalPeriod % 6 !== 0)) {
                    errors.push(`El producto ${item.name} en el periodo ${period} debe tener un mínimo de 12 unidades y ser múltiplo de 6.`);
                }
            }
        }
    });

    return errors;
  };

  const [validationError, setValidationError] = React.useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = React.useState<string>('ALL');

  const handleCheckout = () => {
    const errors = getValidationErrors();
    if (errors.length > 0) {
        setValidationError(errors[0]); // Show first error
    } else {
        setValidationError(null);
        setView(AppView.CHECKOUT);
    }
  };

  const [selectedDivisions, setSelectedDivisions] = React.useState<string[]>([]);
  const [selectedGenders, setSelectedGenders] = React.useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([]);
  const [selectedLaunches, setSelectedLaunches] = React.useState<string[]>([]);
  const [selectedSegmentations, setSelectedSegmentations] = React.useState<string[]>([]);
  const [selectedPeriodsFilter, setSelectedPeriodsFilter] = React.useState<string[]>([]);
  const [selectedModel, setSelectedModel] = React.useState<string | null>(null);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getItemDivision = (item: any): string => {
    if (item.division && typeof item.division === 'string' && item.division.trim()) {
      return item.division.trim().toUpperCase();
    }
    const prod = products.find(
      p =>
        (item.sku && p.sku === item.sku) ||
        (item.id && p.id === item.id) ||
        (item.productCode && p.productCode && p.productCode === item.productCode)
    );
    return (prod?.division || 'CALZADO').trim().toUpperCase();
  };

  const getItemSegmentation = (item: any): string => {
    if (item.segmentation && typeof item.segmentation === 'string' && item.segmentation.trim()) {
      return item.segmentation.trim();
    }
    const prod = products.find(
      p =>
        (item.sku && p.sku === item.sku) ||
        (item.id && p.id === item.id) ||
        (item.productCode && p.productCode && p.productCode === item.productCode)
    );
    return (prod?.segmentation || '').trim();
  };

  const availableDivisions = React.useMemo(() => {
    const divs = new Set<string>(['CALZADO', 'INDUMENTARIA']);
    cartItems.forEach(item => {
      const div = getItemDivision(item);
      if (div) divs.add(div);
    });
    products.forEach(p => {
      if (p.division && p.division.trim()) divs.add(p.division.trim().toUpperCase());
    });
    const order = ['CALZADO', 'INDUMENTARIA', 'ACCESORIOS'];
    const sorted = Array.from(divs).sort((a, b) => {
      const idxA = order.indexOf(a);
      const idxB = order.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
    return sorted.map(div => ({
      value: div,
      label: div === 'CALZADO' ? '👟 Calzado' : div === 'INDUMENTARIA' ? '👕 Indumentaria' : div === 'ACCESORIOS' ? '🎒 Accesorios' : div,
    }));
  }, [cartItems]);

  const availableDisciplines = React.useMemo(() => {
    const categories = new Set<string>();
    cartItems.forEach(item => {
      if (item.category) categories.add(item.category.trim());
    });
    if (categories.size === 0) {
      products.forEach(p => {
        if (p.category) categories.add(p.category.trim());
      });
    }
    return Array.from(categories).sort();
  }, [cartItems]);

  const availableGenders = React.useMemo(() => {
    const genders = new Set<string>();
    cartItems.forEach(item => {
      if (item.gender) genders.add(item.gender.trim());
    });
    if (genders.size === 0) {
      products.forEach(p => {
        if (p.gender) genders.add(p.gender.trim());
      });
    }
    return Array.from(genders).sort();
  }, [cartItems]);

  const availableSegmentations = React.useMemo(() => {
    const segs = new Set<string>();
    cartItems.forEach(item => {
      const seg = getItemSegmentation(item);
      if (seg) segs.add(seg);
    });
    if (segs.size === 0) {
      products.forEach(p => {
        if (p.segmentation && p.segmentation.trim()) segs.add(p.segmentation.trim());
      });
    }
    return Array.from(segs).sort();
  }, [cartItems]);

  const launchOptions = [
    { label: '🚀 Solo Lanzamientos (Sí)', value: 'SI' },
    { label: '📦 Línea Regular / Otros (No)', value: 'NO' },
  ];

  const availablePeriodOptions = [
    { label: 'Julio', value: 'Julio' },
    { label: 'Agosto', value: 'Agosto' },
    { label: 'Septiembre', value: 'Septiembre' },
    { label: 'Octubre', value: 'Octubre' },
    { label: 'Noviembre', value: 'Noviembre' },
    { label: 'Diciembre', value: 'Diciembre' },
  ];

  const baseFilteredCartItems = React.useMemo(() => {
    return cartItems.filter(item => {
      if (item.quantity <= 0) return false;

      // Multi-select Division
      if (selectedDivisions.length > 0) {
        const itemDiv = getItemDivision(item);
        if (!selectedDivisions.some(d => d.toUpperCase().trim() === itemDiv)) return false;
      }
      
      // Multi-select Gender
      if (selectedGenders.length > 0) {
        const itemGen = item.gender.toUpperCase();
        if (!selectedGenders.some(g => g.toUpperCase() === itemGen)) return false;
      }

      // Multi-select Category / Discipline
      if (selectedCategories.length > 0) {
        const itemCat = (item.category || 'Otros').toUpperCase();
        if (!selectedCategories.some(c => c.toUpperCase() === itemCat)) return false;
      }

      // Multi-select Launch
      if (selectedLaunches.length > 0) {
        const isLaunch = Boolean(item.marketingLaunch) || String(item.marketingLaunch).toLowerCase() === 'si';
        const matchLaunch = (selectedLaunches.includes('SI') && isLaunch) || (selectedLaunches.includes('NO') && !isLaunch);
        if (!matchLaunch) return false;
      }

      // Multi-select Segmentation
      if (selectedSegmentations.length > 0) {
        const seg = getItemSegmentation(item).toUpperCase();
        if (!selectedSegmentations.some(s => s.toUpperCase().trim() === seg)) return false;
      }

      // Multi-select Delivery Period
      if (selectedPeriodsFilter.length > 0) {
        const prod = products.find(p => (item.sku && p.sku === item.sku) || (!item.sku && p.id === item.id));
        const itemPlan = item.deliveryPlan || [];
        const hasUnitsInPeriod = itemPlan.some(p => 
          selectedPeriodsFilter.includes(p.period) && 
          Object.values(p.sizeBreakdown || {}).some(u => Number(u) > 0)
        );
        const itemPeriods = prod?.allowedPeriods || item.allowedPeriods || [];
        const isPeriodAllowed = itemPeriods.some(p => selectedPeriodsFilter.includes(p));
        if (!hasUnitsInPeriod && !isPeriodAllowed) return false;
      }

      return true;
    });
  }, [cartItems, selectedDivisions, selectedGenders, selectedCategories, selectedLaunches, selectedSegmentations, selectedPeriodsFilter]);

  const filteredCartItems = React.useMemo(() => {
    return baseFilteredCartItems.filter(item => {
      const model = item.name.replace(/zapatillas? fila\s*/i, '').trim() || item.name;
      if (selectedModel && model !== selectedModel) return false;
      return true;
    });
  }, [baseFilteredCartItems, selectedModel]);

  const kpiData = React.useMemo(() => {
    let totalUnidades = 0;
    let totalPrecioPublico = 0;
    let totalImporte = 0;
    let totalSkus = 0;
    filteredCartItems.forEach(item => {
      let units = 0;
      if (selectedPeriod === 'ALL') {
        units = item.deliveryPlan && item.deliveryPlan.length > 0
          ? item.deliveryPlan.reduce((acc, p) => acc + Object.values(p.sizeBreakdown).reduce((a: number, b: any) => a + Number(b), 0), 0)
          : item.quantity * item.unitsPerCurve;
      } else {
        const planItem = item.deliveryPlan?.find(p => p.period === selectedPeriod);
        units = planItem ? (Object.values(planItem.sizeBreakdown) as number[]).reduce((sum, u) => Number(sum) + Number(u), 0) : 0;
      }

      if (units > 0) {
        totalSkus += 1;
        totalUnidades += units;
        totalPrecioPublico += (units * item.price);
        totalImporte += (units * item.wholesalePrice);
      }
    });
    return {
      totalUnidades,
      totalSkus,
      totalImporte,
      precioPromedioVenta: totalUnidades > 0 ? totalPrecioPublico / totalUnidades : 0
    };
  }, [filteredCartItems, selectedPeriod]);

  const genderData = React.useMemo(() => {
    const data: Record<string, number> = {};
    cartItems.forEach(item => {
      if (selectedDivisions.length > 0 && !selectedDivisions.some(d => d.toUpperCase().trim() === getItemDivision(item))) return;
      if (selectedCategories.length > 0 && !selectedCategories.some(c => c.toUpperCase() === (item.category || 'Otros').toUpperCase())) return;
      const model = item.name.replace(/zapatillas? fila\s*/i, '').trim() || item.name;
      if (selectedModel && model !== selectedModel) return;
      if (selectedLaunches.length > 0) {
        const isLaunch = Boolean(item.marketingLaunch) || String(item.marketingLaunch).toLowerCase() === 'si';
        const matchLaunch = (selectedLaunches.includes('SI') && isLaunch) || (selectedLaunches.includes('NO') && !isLaunch);
        if (!matchLaunch) return;
      }
      if (selectedSegmentations.length > 0) {
        const seg = getItemSegmentation(item).toUpperCase();
        if (!selectedSegmentations.some(s => s.toUpperCase().trim() === seg)) return;
      }
      
      let units = 0;
      if (selectedPeriod === 'ALL') {
        units = item.deliveryPlan && item.deliveryPlan.length > 0
          ? item.deliveryPlan.reduce((acc, p) => acc + Object.values(p.sizeBreakdown).reduce((a: number, b: any) => a + Number(b), 0), 0)
          : item.quantity * item.unitsPerCurve;
      } else {
        const planItem = item.deliveryPlan?.find(p => p.period === selectedPeriod);
        units = planItem ? (Object.values(planItem.sizeBreakdown) as number[]).reduce((sum, u) => Number(sum) + Number(u), 0) : 0;
      }

      if (units > 0) {
        data[item.gender] = (data[item.gender] || 0) + units;
      }
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [cartItems, selectedDivisions, selectedCategories, selectedModel, selectedPeriod, selectedLaunches, selectedSegmentations]);

  const categoryData = React.useMemo(() => {
    const data: Record<string, number> = {};
    cartItems.forEach(item => {
      if (selectedDivisions.length > 0 && !selectedDivisions.some(d => d.toUpperCase().trim() === getItemDivision(item))) return;
      if (selectedGenders.length > 0 && !selectedGenders.some(g => g.toUpperCase() === item.gender.toUpperCase())) return;
      const model = item.name.replace(/zapatillas? fila\s*/i, '').trim() || item.name;
      if (selectedModel && model !== selectedModel) return;
      if (selectedLaunches.length > 0) {
        const isLaunch = Boolean(item.marketingLaunch) || String(item.marketingLaunch).toLowerCase() === 'si';
        const matchLaunch = (selectedLaunches.includes('SI') && isLaunch) || (selectedLaunches.includes('NO') && !isLaunch);
        if (!matchLaunch) return;
      }
      if (selectedSegmentations.length > 0) {
        const seg = getItemSegmentation(item).toUpperCase();
        if (!selectedSegmentations.some(s => s.toUpperCase().trim() === seg)) return;
      }
      
      let units = 0;
      if (selectedPeriod === 'ALL') {
        units = item.deliveryPlan && item.deliveryPlan.length > 0
          ? item.deliveryPlan.reduce((acc, p) => acc + Object.values(p.sizeBreakdown).reduce((a: number, b: any) => a + Number(b), 0), 0)
          : item.quantity * item.unitsPerCurve;
      } else {
        const planItem = item.deliveryPlan?.find(p => p.period === selectedPeriod);
        units = planItem ? (Object.values(planItem.sizeBreakdown) as number[]).reduce((sum, u) => Number(sum) + Number(u), 0) : 0;
      }

      if (units > 0) {
        data[item.category] = (data[item.category] || 0) + units;
      }
    });
    return Object.entries(data).map(([name, value]) => ({ name: name || 'Otros', value }));
  }, [cartItems, selectedDivisions, selectedGenders, selectedModel, selectedPeriod, selectedLaunches, selectedSegmentations]);

  const investmentByCategoryData = React.useMemo(() => {
    const data: Record<string, number> = {};
    cartItems.forEach(item => {
      if (selectedDivisions.length > 0 && !selectedDivisions.some(d => d.toUpperCase().trim() === getItemDivision(item))) return;
      if (selectedGenders.length > 0 && !selectedGenders.some(g => g.toUpperCase() === item.gender.toUpperCase())) return;
      const category = item.category || 'Otros';
      if (selectedCategories.length > 0 && !selectedCategories.some(c => c.toUpperCase() === category.toUpperCase())) return;
      const model = item.name.replace(/zapatillas? fila\s*/i, '').trim() || item.name;
      if (selectedModel && model !== selectedModel) return;
      if (selectedLaunches.length > 0) {
        const isLaunch = Boolean(item.marketingLaunch) || String(item.marketingLaunch).toLowerCase() === 'si';
        const matchLaunch = (selectedLaunches.includes('SI') && isLaunch) || (selectedLaunches.includes('NO') && !isLaunch);
        if (!matchLaunch) return;
      }
      if (selectedSegmentations.length > 0) {
        const seg = getItemSegmentation(item).toUpperCase();
        if (!selectedSegmentations.some(s => s.toUpperCase().trim() === seg)) return;
      }
      
      let units = 0;
      if (selectedPeriod === 'ALL') {
        units = item.deliveryPlan && item.deliveryPlan.length > 0
          ? item.deliveryPlan.reduce((acc, p) => acc + Object.values(p.sizeBreakdown).reduce((a: number, b: any) => a + Number(b), 0), 0)
          : item.quantity * item.unitsPerCurve;
      } else {
        const planItem = item.deliveryPlan?.find(p => p.period === selectedPeriod);
        units = planItem ? (Object.values(planItem.sizeBreakdown) as number[]).reduce((sum, u) => Number(sum) + Number(u), 0) : 0;
      }

      if (units > 0) {
        data[category] = (data[category] || 0) + (units * item.wholesalePrice);
      }
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [cartItems, selectedDivisions, selectedGenders, selectedCategories, selectedModel, selectedPeriod, selectedLaunches, selectedSegmentations]);

  const topProductsData = React.useMemo(() => {
    const data: Record<string, { model: string, units: number }> = {};
    filteredCartItems.forEach(item => {
      const model = item.name.replace(/zapatillas? fila\s*/i, '').trim() || item.name;
      
      let units = 0;
      if (selectedPeriod === 'ALL') {
        units = item.deliveryPlan && item.deliveryPlan.length > 0
          ? item.deliveryPlan.reduce((acc, p) => acc + Object.values(p.sizeBreakdown).reduce((a: number, b: any) => a + Number(b), 0), 0)
          : item.quantity * item.unitsPerCurve;
      } else {
        const planItem = item.deliveryPlan?.find(p => p.period === selectedPeriod);
        units = planItem ? (Object.values(planItem.sizeBreakdown) as number[]).reduce((sum, u) => Number(sum) + Number(u), 0) : 0;
      }

      if (units > 0) {
        if (!data[model]) {
          data[model] = { model, units: 0 };
        }
        data[model].units += units;
      }
    });
    return Object.values(data)
      .sort((a, b) => b.units - a.units)
      .slice(0, 10);
  }, [filteredCartItems, selectedPeriod]);

  if (exportItems.length === 0) {
    return (
      <div className="text-center bg-white p-12 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Tu carrito está vacío</h2>
        <p className="text-gray-600 mb-6">Parece que todavía no has agregado ningún producto ni tienes favoritos.</p>
        <button
          onClick={() => setView(AppView.PRODUCTS)}
          className="bg-[#CF0A2C] text-white font-bold py-3 px-6 rounded-lg hover:bg-[#B00824] transition-colors duration-300"
        >
          Volver a la tienda
        </button>
      </div>
    );
  }

  if (cartItems.length === 0 && exportItems.length > 0) {
    return (
      <div className="text-center bg-white p-12 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Tu carrito está vacío</h2>
        <p className="text-gray-600 mb-6">Pero tienes productos favoritos seleccionados. Puedes descargar el listado o volver a la tienda para asignar cantidades.</p>
        <div className="flex justify-center gap-4 mt-6">
            <button
            onClick={() => setView(AppView.PRODUCTS)}
            className="bg-gray-200 text-gray-800 font-bold py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors duration-300"
            >
            Volver a la tienda
            </button>
            <button
            onClick={() => generatePDF()}
            className="bg-red-50 text-red-700 border border-red-200 font-semibold py-3 px-6 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
            >
            Descargar PDF
            </button>
            <button
            onClick={() => generateExcel()}
            className="bg-green-50 text-green-700 border border-green-200 font-semibold py-3 px-6 rounded-lg hover:bg-green-100 transition-colors flex items-center justify-center gap-2"
            >
            Descargar Excel
            </button>
        </div>
      </div>
    );
  }

  const hasActiveFilters = Boolean(
    selectedDivisions.length > 0 ||
    selectedGenders.length > 0 ||
    selectedCategories.length > 0 ||
    selectedLaunches.length > 0 ||
    selectedSegmentations.length > 0 ||
    selectedPeriodsFilter.length > 0 ||
    selectedModel
  );

  const handleClearFilters = () => {
    setSelectedDivisions([]);
    setSelectedGenders([]);
    setSelectedCategories([]);
    setSelectedLaunches([]);
    setSelectedSegmentations([]);
    setSelectedPeriodsFilter([]);
    setSelectedPeriod('ALL');
    setSelectedModel(null);
  };

  const checkDistributionAndExport = (exportFn: () => Promise<void>) => {
    const errors = getValidationErrors();
    if (errors.length > 0) {
        setValidationError("Distribución incompleta: " + errors[0] + (errors.length > 1 ? " y otros..." : ""));
        return;
    }
    setValidationError(null);
    exportFn();
  };

  return (
    <div className="bg-white p-4 sm:p-8 rounded-lg shadow-xl w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b pb-4">
        <h1 id="cart-view-title" className="text-3xl font-extrabold text-gray-800">Tu Pedido</h1>
        <div className="flex gap-3 mt-4 md:mt-0">
        </div>
      </div>

      {/* Filtros Principales del Carrito: División, Disciplina, Género, Lanzamiento y Segmentación con Multi-Selección */}
      <div className="mb-6 bg-[#f8fafc] border border-slate-200 p-4 rounded-xl shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-red-100 text-[#CF0A2C] rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                Filtros Multiselección
              </h3>
              <p className="text-xs text-gray-500">
                Seleccioná una o múltiples opciones por división, disciplina, género, lanzamiento y segmentación
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* División Multi-Select */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                División
              </label>
              <MultiSelectDropdown
                id="cart-filter-division"
                title="División"
                placeholder="Todas"
                options={availableDivisions}
                selectedValues={selectedDivisions}
                onChange={setSelectedDivisions}
                icon={<ShoppingBag className="w-3.5 h-3.5" />}
                minWidth="min-w-[155px]"
              />
            </div>

            {/* Disciplina Multi-Select */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                Disciplina
              </label>
              <MultiSelectDropdown
                id="cart-filter-discipline"
                title="Disciplina"
                placeholder="Todas"
                options={availableDisciplines}
                selectedValues={selectedCategories}
                onChange={setSelectedCategories}
                icon={<Activity className="w-3.5 h-3.5" />}
                minWidth="min-w-[150px]"
              />
            </div>

            {/* Género Multi-Select */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                Género
              </label>
              <MultiSelectDropdown
                id="cart-filter-gender"
                title="Género"
                placeholder="Todos"
                options={availableGenders}
                selectedValues={selectedGenders}
                onChange={setSelectedGenders}
                icon={<Users className="w-3.5 h-3.5" />}
                minWidth="min-w-[150px]"
              />
            </div>

            {/* Lanzamiento Multi-Select */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                Lanzamiento
              </label>
              <MultiSelectDropdown
                id="cart-filter-launch"
                title="Lanzamiento"
                placeholder="Todos"
                options={launchOptions}
                selectedValues={selectedLaunches}
                onChange={setSelectedLaunches}
                icon={<Sparkles className="w-3.5 h-3.5" />}
                minWidth="min-w-[165px]"
              />
            </div>

            {/* Segmentación Multi-Select */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                Segmentación
              </label>
              <MultiSelectDropdown
                id="cart-filter-segmentation"
                title="Segmentación"
                placeholder="Todas"
                options={availableSegmentations}
                selectedValues={selectedSegmentations}
                onChange={setSelectedSegmentations}
                icon={<Layers className="w-3.5 h-3.5" />}
                minWidth="min-w-[165px]"
              />
            </div>

            {/* Período Multi-Select */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                Período
              </label>
              <MultiSelectDropdown
                id="cart-filter-period"
                title="Período"
                placeholder="Todos"
                options={availablePeriodOptions}
                selectedValues={selectedPeriodsFilter}
                onChange={setSelectedPeriodsFilter}
                icon={<Calendar className="w-3.5 h-3.5" />}
                minWidth="min-w-[155px]"
              />
            </div>

            {/* Botón Limpiar siempre visible */}
            <div className="flex flex-col gap-1 justify-end self-end">
              <button
                id="cart-clear-filters-btn"
                onClick={handleClearFilters}
                disabled={!hasActiveFilters}
                className={`text-xs font-bold py-2 px-3 rounded-lg border transition-all shadow-2xs flex items-center gap-1.5 ${
                  hasActiveFilters
                    ? 'bg-red-50 text-[#CF0A2C] hover:bg-red-100 border-red-200 cursor-pointer'
                    : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60'
                }`}
                title="Limpiar todos los filtros del carrito"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Resumen de Filtros Activos con tags removibles */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-200/80">
            <span className="text-xs font-semibold text-gray-600">Filtros activos:</span>
            {selectedDivisions.map(div => (
              <span key={`div-${div}`} className="bg-amber-100 text-amber-900 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5 shadow-2xs">
                <span>División: {div}</span>
                <button
                  onClick={() => setSelectedDivisions(prev => prev.filter(d => d !== div))}
                  className="hover:text-black font-extrabold cursor-pointer ml-0.5"
                  title={`Quitar filtro ${div}`}
                >
                  ×
                </button>
              </span>
            ))}
            {selectedCategories.map(cat => (
              <span key={`cat-${cat}`} className="bg-red-100 text-[#CF0A2C] text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5 shadow-2xs">
                <span>Disciplina: {cat}</span>
                <button
                  onClick={() => setSelectedCategories(prev => prev.filter(c => c !== cat))}
                  className="hover:text-black font-extrabold cursor-pointer ml-0.5"
                  title={`Quitar filtro ${cat}`}
                >
                  ×
                </button>
              </span>
            ))}
            {selectedGenders.map(gen => (
              <span key={`gen-${gen}`} className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5 shadow-2xs">
                <span>Género: {gen}</span>
                <button
                  onClick={() => setSelectedGenders(prev => prev.filter(g => g !== gen))}
                  className="hover:text-black font-extrabold cursor-pointer ml-0.5"
                  title={`Quitar filtro ${gen}`}
                >
                  ×
                </button>
              </span>
            ))}
            {selectedLaunches.map(launch => (
              <span key={`launch-${launch}`} className="bg-purple-100 text-purple-800 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5 shadow-2xs">
                <span>{launch === 'SI' ? '🚀 Solo Lanzamientos (Sí)' : '📦 Línea Regular (No)'}</span>
                <button
                  onClick={() => setSelectedLaunches(prev => prev.filter(l => l !== launch))}
                  className="hover:text-black font-extrabold cursor-pointer ml-0.5"
                  title="Quitar filtro lanzamiento"
                >
                  ×
                </button>
              </span>
            ))}
            {selectedSegmentations.map(seg => (
              <span key={`seg-${seg}`} className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5 shadow-2xs">
                <span>Segmentación: {seg}</span>
                <button
                  onClick={() => setSelectedSegmentations(prev => prev.filter(s => s !== seg))}
                  className="hover:text-black font-extrabold cursor-pointer ml-0.5"
                  title={`Quitar filtro ${seg}`}
                >
                  ×
                </button>
              </span>
            ))}
            {selectedPeriodsFilter.map(period => (
              <span key={`period-${period}`} className="bg-sky-100 text-sky-850 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5 shadow-2xs">
                <span>Período: {period}</span>
                <button
                  onClick={() => setSelectedPeriodsFilter(prev => prev.filter(p => p !== period))}
                  className="hover:text-black font-extrabold cursor-pointer ml-0.5"
                  title={`Quitar filtro ${period}`}
                >
                  ×
                </button>
              </span>
            ))}
            {selectedModel && (
              <span className="bg-gray-200 text-gray-800 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5 shadow-2xs">
                <span>Modelo: {selectedModel}</span>
                <button
                  onClick={() => setSelectedModel(null)}
                  className="hover:text-black font-extrabold cursor-pointer ml-0.5"
                  title="Quitar filtro modelo"
                >
                  ×
                </button>
              </span>
            )}
            <button
              onClick={handleClearFilters}
              className="text-xs text-[#CF0A2C] hover:underline font-bold cursor-pointer ml-2"
            >
              Limpiar todo
            </button>
            <span className="text-xs text-gray-500 ml-auto font-medium">
              Mostrando {filteredCartItems.length} de {cartItems.filter(i => i.quantity > 0).length} ítems
            </span>
          </div>
        )}
      </div>

      {/* Selector de Período para Análisis */}
      <div className="mb-6 bg-slate-50 border border-slate-100 p-4 rounded-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
              <span className="text-[#CF0A2C]">📅</span>
              <span>Análisis por Período de Entrega</span>
              {selectedPeriod !== 'ALL' && (
                <span className="bg-red-50 text-[#CF0A2C] text-[10px] px-2 py-0.5 rounded-full font-bold border border-red-100">FILTRADO</span>
              )}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Seleccioná un período para recalcular instantáneamente los KPIs, montos de inversión y gráficos de la compra según la planificación de distribución.
            </p>
          </div>
          <div className="flex flex-wrap gap-1 bg-gray-200/60 p-1 rounded-lg self-start sm:self-center">
            {[
              { id: 'ALL', label: 'Todos' },
              { id: 'Julio', label: '❄️ Julio' },
              { id: 'Agosto', label: '❄️ Agosto' },
              { id: 'Septiembre', label: '🌱 Septiembre' },
              { id: 'Octubre', label: '🌱 Octubre' },
              { id: 'Noviembre', label: '☀️ Noviembre' },
              { id: 'Diciembre', label: '☀️ Diciembre' }
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPeriod(p.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  selectedPeriod === p.id 
                    ? 'bg-[#CF0A2C] text-white shadow-sm font-bold' 
                    : 'text-gray-600 hover:text-gray-950 hover:bg-white/50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-red-50 p-4 rounded-lg border border-red-100 flex flex-col items-center justify-center">
          <p className="text-sm text-[#CF0A2C] font-semibold mb-1">Total Unidades</p>
          <p className="text-2xl font-bold text-[#B00824]">{kpiData.totalUnidades}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-100 flex flex-col items-center justify-center">
          <p className="text-sm text-green-600 font-semibold mb-1">Importe Total</p>
          <p className="text-2xl font-bold text-green-800">${kpiData.totalImporte.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 flex flex-col items-center justify-center">
          <p className="text-sm text-purple-600 font-semibold mb-1">Precio Prom. Venta</p>
          <p className="text-2xl font-bold text-purple-800">${kpiData.precioPromedioVenta.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="bg-teal-50 p-4 rounded-lg border border-teal-100 flex flex-col items-center justify-center">
          <p className="text-sm text-teal-600 font-semibold mb-1">SKUs Totales</p>
          <p className="text-2xl font-bold text-teal-800">{kpiData.totalSkus}</p>
        </div>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 mb-8">
        <div className="flex justify-end mb-2 h-8">
          {hasActiveFilters && (
            <button 
              onClick={handleClearFilters}
              className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 py-1 px-4 rounded-full transition-colors z-10 font-medium cursor-pointer"
            >
              Limpiar Filtros
            </button>
          )}
        </div>
        <div className="flex flex-row flex-wrap md:flex-nowrap gap-6">
          <div className="w-full md:w-1/4">
            <h3 className="text-lg font-semibold text-gray-700 mb-2 text-center">Unidades por Género</h3>
            {(selectedCategories.length > 0 || selectedModel) && (
              <p className="text-xs text-center text-gray-500 mb-2">
                Filtrado por: {[selectedCategories.join(', '), selectedModel].filter(Boolean).join(' | ')}
              </p>
            )}
            <div className="h-60 cursor-pointer">
              <InteractivePieChart
                data={genderData}
                colors={COLORS}
                selectedItems={selectedGenders}
                onItemClick={(genName) => {
                  setSelectedGenders(prev =>
                    prev.includes(genName) ? prev.filter(g => g !== genName) : [...prev, genName]
                  );
                }}
                formatTooltip={(value) => `${value} uds`}
              />
            </div>
          </div>
          <div className="w-full md:w-1/4">
            <h3 className="text-lg font-semibold text-gray-700 mb-2 text-center">Unidades por Disciplina</h3>
            {(selectedGenders.length > 0 || selectedModel) && (
              <p className="text-xs text-center text-gray-500 mb-2">
                Filtrado por: {[selectedGenders.join(', '), selectedModel].filter(Boolean).join(' | ')}
              </p>
            )}
            <div className="h-60 cursor-pointer">
              <InteractivePieChart
                data={categoryData}
                colors={COLORS.slice(3).concat(COLORS.slice(0, 3))}
                selectedItems={selectedCategories}
                onItemClick={(catName) => {
                  setSelectedCategories(prev =>
                    prev.includes(catName) ? prev.filter(c => c !== catName) : [...prev, catName]
                  );
                }}
                formatTooltip={(value) => `${value} uds`}
              />
            </div>
          </div>
          <div className="w-full md:w-1/4">
            <h3 className="text-lg font-semibold text-gray-700 mb-2 text-center">Inversión por Disciplina</h3>
            {(selectedGenders.length > 0 || selectedModel) && (
              <p className="text-xs text-center text-gray-500 mb-2">
                Filtrado por: {[selectedGenders.join(', '), selectedModel].filter(Boolean).join(' | ')}
              </p>
            )}
            <div className="h-60 cursor-pointer">
              <InteractivePieChart
                data={investmentByCategoryData}
                colors={COLORS.slice(5).concat(COLORS.slice(0, 5))}
                selectedItems={selectedCategories}
                onItemClick={(catName) => {
                  setSelectedCategories(prev =>
                    prev.includes(catName) ? prev.filter(c => c !== catName) : [...prev, catName]
                  );
                }}
                formatTooltip={(value) => `$${value.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`}
              />
            </div>
          </div>
          <div className="w-full md:w-1/4">
            <h3 className="text-lg font-semibold text-gray-700 mb-2 text-center">Top 10 Productos</h3>
            {(selectedGenders.length > 0 || selectedCategories.length > 0) && (
              <p className="text-xs text-center text-gray-500 mb-2">
                Filtrado por: {[selectedGenders.join(', '), selectedCategories.join(', ')].filter(Boolean).join(' | ')}
              </p>
            )}
            <div className="h-60 cursor-pointer">
              <InteractiveBarChart
                data={topProductsData}
                colors={COLORS}
                selectedModel={selectedModel}
                onModelClick={(model) => {
                  setSelectedModel(model === selectedModel ? null : model);
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {filteredCartItems.map((item, index) => {
          const prod = products.find(
            p => (item.sku && p.sku === item.sku) || (!item.sku && item.id && p.id === item.id)
          );
          const itemDivision = (prod?.division || item.division || 'CALZADO').toUpperCase().trim();
          const itemGender = prod?.gender || item.gender || 'UNISEX';
          const effectiveSizeRange =
            itemDivision === 'INDUMENTARIA'
              ? (prod?.sizeRange && !/^\d/.test(prod.sizeRange) ? prod.sizeRange : 'S/XL')
              : (prod?.sizeRange || item.sizeRange || '35-45');
          const curveInfo = getProductCurveInfo({
            ...prod,
            ...item,
            sizeRange: effectiveSizeRange,
            sizes: prod?.sizes || item.sizes,
            curve: prod?.curve || item.curve,
            division: itemDivision,
            gender: itemGender,
          });
          const sizes = curveInfo.sizes;
          const displaySizeRange =
            itemDivision === 'INDUMENTARIA'
              ? 'S/XL'
              : (effectiveSizeRange || (curveInfo.sizes.length > 0 ? `${curveInfo.sizes[0]}-${curveInfo.sizes[curveInfo.sizes.length - 1]}` : '35-45'));
          const itemSku = item.sku || prod?.sku;
          const itemAllowedPeriods =
            prod?.allowedPeriods && prod.allowedPeriods.length > 0
              ? prod.allowedPeriods
              : item.allowedPeriods && item.allowedPeriods.length > 0
              ? item.allowedPeriods
              : ['Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
          const isApparelDivision = itemDivision === 'INDUMENTARIA';
          
          return (
          <div key={`${item.id}-${index}`} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
            <div className="flex items-center gap-4 w-full">
              <img src={getProxiedUrl(item.images?.[0] || '')} alt={item.name} className="w-24 h-24 object-cover rounded-md flex-shrink-0" referrerPolicy="no-referrer" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg text-gray-800">{item.name}</h3>
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1 text-xs text-gray-500">
                  {itemSku && (
                    <span className="font-medium text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">
                      SKU: {itemSku}
                    </span>
                  )}
                  <span className="font-medium text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">Modelo: {item.model}</span>
                  <span className="font-medium text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">{item.category}</span>
                  <span className="font-medium text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">{item.gender}</span>
                  <span className="font-semibold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                    Talles: {displaySizeRange} ({sizes.join(' · ')})
                  </span>
                  <span className="font-semibold text-indigo-800 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                    Curva: {curveInfo.curveLabel}{curveInfo.hasFixedCurve ? ` (${curveInfo.unitsPerCurve} u./curva)` : ''}
                  </span>
                  {item.marketingLaunch && (
                    <span className="font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded flex items-center" title="Lanzamiento">
                      🚀
                    </span>
                  )}
                  {item.segmentation && (
                    <span className="font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                      {item.segmentation}
                    </span>
                  )}
                  <span className={`font-semibold px-2 py-0.5 rounded text-xs flex items-center gap-1 ${
                    itemAllowedPeriods.length < 6 
                      ? 'text-amber-800 bg-amber-50 border border-amber-300 font-bold' 
                      : 'text-sky-850 bg-sky-50 border border-sky-200'
                  }`} title="Períodos de entrega autorizados en catálogo oficial">
                    📅 Entregas: {itemAllowedPeriods.length === 6 ? 'Todos los meses (Jul a Dic)' : itemAllowedPeriods.join(' · ')}
                  </span>
                  <span className="font-medium text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">Precio Púb: ${item.price.toLocaleString('es-AR')}</span>
                </div>
                {itemDivision !== 'CALZADO' && item.colorDescription && (
                  <p className="text-gray-500 text-sm mt-1">{item.colorDescription}</p>
                )}
                {curveInfo.hasFixedCurve && (
                  <div className="mt-1.5 inline-flex flex-wrap items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md text-[11px] text-slate-700">
                    <span className="font-bold text-slate-900">Composición de Curva ({curveInfo.curveLabel}):</span>
                    {sizes.map(sz => (
                      <span
                        key={sz}
                        className={`px-1.5 py-0.5 rounded font-mono font-semibold ${
                          (curveInfo.weights[sz] ?? 0) > 0
                            ? 'bg-white border border-slate-300 text-slate-900 shadow-2xs'
                            : 'bg-gray-100 text-gray-400 line-through'
                        }`}
                      >
                        {sz}: {curveInfo.weights[sz] ?? 0}
                      </span>
                    ))}
                    <span className="text-slate-500 font-medium">(= {curveInfo.unitsPerCurve} u.)</span>
                  </div>
                )}
                <div className="mt-2 text-sm text-gray-700">
                    <div className="flex flex-wrap justify-between items-center gap-2 mb-1.5">
                        <p className="font-semibold">Plan de Entrega por Talle ({displaySizeRange}):</p>
                        <p className="text-xs text-gray-500">
                            {isApparelDivision
                              ? `Carga exclusiva por curvas (${curveInfo.curveLabel}: ${curveInfo.unitsPerCurve} u. por curva)`
                              : curveInfo.hasFixedCurve
                              ? `Curva base: ${curveInfo.curveLabel} (${curveInfo.unitsPerCurve} u. por curva)`
                              : `Modalidad Libre (mín. 12 u. y múltiplo de 6 por período)`}
                        </p>
                    </div>
                    <div className="overflow-x-auto -mx-8 sm:mx-0 px-8 sm:px-0">
                        <table className="w-full text-xs min-w-[460px] border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-y border-slate-200">
                                    <th className="text-left py-1.5 px-2">Periodo</th>
                                    {sizes.map(size => {
                                      const weight = curveInfo.weights[size] ?? 0;
                                      const isEnabled = !curveInfo.hasFixedCurve || weight > 0;
                                      return (
                                        <th key={size} className={`text-center py-1.5 px-1 ${isEnabled ? 'text-gray-900' : 'text-gray-400'}`}>
                                          <div className="font-bold text-xs">{size}</div>
                                          {curveInfo.hasFixedCurve && (
                                            <div className="text-[10px] font-medium text-indigo-600">
                                              curva: {weight}
                                            </div>
                                          )}
                                        </th>
                                      );
                                    })}
                                    {curveInfo.hasFixedCurve && (
                                      <th className="text-center py-1.5 px-2 text-indigo-700 font-bold">Curvas</th>
                                    )}
                                    <th className="text-center py-1.5 px-2 font-bold">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {['Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map(period => {
                                    const isPeriodAllowed = itemAllowedPeriods.includes(period);
                                    if (!isPeriodAllowed) {
                                      return (
                                        <tr key={period} className="border-t bg-stone-50/70 text-stone-400">
                                          <td className="py-2 px-2 font-semibold text-stone-400 whitespace-nowrap line-through">{period}</td>
                                          <td colSpan={sizes.length + (curveInfo.hasFixedCurve ? 2 : 1)} className="py-2 px-3 text-center text-xs">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-200/80 font-bold text-[11px] text-stone-600">
                                              🔒 Período no disponible según catálogo oficial
                                            </span>
                                          </td>
                                        </tr>
                                      );
                                    }
                                    const planItem = item.deliveryPlan?.find(p => p.period === period);
                                    const rawPlanSizes = planItem?.sizeBreakdown || {};
                                    const hasValidCurrentSizes = sizes.some(sz => Number(rawPlanSizes[sz]) > 0);
                                    const legacyTotal: number = !hasValidCurrentSizes
                                      ? (Object.values(rawPlanSizes) as any[]).reduce((a: number, b: any) => a + (Number(b) || 0), 0)
                                      : 0;
                                    const currentPlanSizes: Record<string, number> =
                                      !hasValidCurrentSizes && legacyTotal > 0 && curveInfo.hasFixedCurve
                                        ? buildCurveSizeBreakdown(
                                            { sizeRange: effectiveSizeRange, sizes, curve: curveInfo.curveLabel, division: itemDivision, gender: itemGender },
                                            Math.max(1, Math.round(legacyTotal / (curveInfo.unitsPerCurve || 9)))
                                          )
                                        : rawPlanSizes;
                                    const totalPeriod = sizes.reduce((sum, sz) => sum + (Number(currentPlanSizes[sz]) || 0), 0);
                                    const currentCurvesCount =
                                      curveInfo.hasFixedCurve && curveInfo.unitsPerCurve > 0
                                        ? Math.round(totalPeriod / curveInfo.unitsPerCurve)
                                        : 0;

                                    const setCurveCount = (targetCurves: number) => {
                                      const safeCurves = Math.max(0, Math.floor(targetCurves) || 0);
                                      const currentPlan = item.deliveryPlan || [];
                                      const newPlan = currentPlan.filter(p => p.period !== period);
                                      const nextBreakdown: Record<string, number> = {};
                                      sizes.forEach(sz => {
                                        const w = curveInfo.weights[sz] ?? 0;
                                        nextBreakdown[sz] = w > 0 && safeCurves > 0 ? safeCurves * w : 0;
                                      });
                                      newPlan.push({
                                        period,
                                        sizeBreakdown: nextBreakdown,
                                      });
                                      updateDeliveryPlan(item.id, newPlan);
                                    };

                                    const applyCurveDelta = (deltaCurves: number) => {
                                      if (isApparelDivision) {
                                        setCurveCount(currentCurvesCount + deltaCurves);
                                        return;
                                      }
                                      const currentPlan = item.deliveryPlan || [];
                                      const newPlan = currentPlan.filter(p => p.period !== period);
                                      const nextBreakdown: Record<string, number> = { ...currentPlanSizes };
                                      sizes.forEach(sz => {
                                        const w = curveInfo.weights[sz] ?? 0;
                                        if (w > 0) {
                                          const currentVal = Number(nextBreakdown[sz]) || 0;
                                          nextBreakdown[sz] = Math.max(0, currentVal + deltaCurves * w);
                                        }
                                      });
                                      newPlan.push({
                                        period,
                                        sizeBreakdown: nextBreakdown,
                                      });
                                      updateDeliveryPlan(item.id, newPlan);
                                    };

                                    const isInvalidLibrePeriod =
                                      !curveInfo.hasFixedCurve && totalPeriod > 0 && (totalPeriod < 12 || totalPeriod % 6 !== 0);

                                    return (
                                        <tr 
                                            key={period} 
                                            className={`border-t transition-all ${
                                                selectedPeriod === period 
                                                    ? 'bg-red-50/70 border-l-[3px] border-[#CF0A2C] font-bold text-gray-950 shadow-sm' 
                                                    : 'hover:bg-gray-50/50'
                                            }`}
                                        >
                                            <td className="py-1.5 px-2 font-semibold whitespace-nowrap">{period}</td>
                                            {sizes.map(size => {
                                                const weight = curveInfo.weights[size] ?? 0;
                                                const isEnabled = !curveInfo.hasFixedCurve || weight > 0;
                                                const canManualEdit = isEnabled && !isApparelDivision;
                                                return (
                                                    <td key={size} className="p-1 min-w-[64px] text-center">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            readOnly={!canManualEdit}
                                                            disabled={!canManualEdit}
                                                            value={currentPlanSizes[size] ?? ''}
                                                            onChange={(e) => {
                                                                if (!canManualEdit) return;
                                                                const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                                                                const currentPlan = item.deliveryPlan || [];
                                                                const newPlan = currentPlan.filter(p => p.period !== period);
                                                                const updatedPlanItem = {
                                                                    period,
                                                                    sizeBreakdown: {
                                                                        ...currentPlanSizes,
                                                                        [size]: val
                                                                    }
                                                                };
                                                                newPlan.push(updatedPlanItem);
                                                                updateDeliveryPlan(item.id, newPlan);
                                                            }}
                                                            className={`w-16 text-center p-1 border rounded-md font-medium transition-colors ${
                                                              canManualEdit
                                                                ? 'bg-white border-gray-300 text-gray-900 focus:border-[#CF0A2C] focus:ring-1 focus:ring-[#CF0A2C] outline-none'
                                                                : isApparelDivision && isEnabled
                                                                ? 'bg-slate-50 border-slate-200 text-slate-800 font-semibold cursor-default select-none'
                                                                : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                                                            }`}
                                                            placeholder={isEnabled ? '0' : '-'}
                                                            title={isApparelDivision ? 'En Indumentaria la cantidad por talle se calcula automáticamente según la cantidad de curvas' : undefined}
                                                        />
                                                    </td>
                                                );
                                            })}
                                            {curveInfo.hasFixedCurve && (
                                              <td className="p-1 text-center whitespace-nowrap">
                                                <div className="inline-flex items-center gap-1 bg-indigo-50/80 border border-indigo-200 rounded-md px-1.5 py-0.5">
                                                  <button
                                                    type="button"
                                                    onClick={() => applyCurveDelta(-1)}
                                                    className="w-6 h-6 rounded bg-white hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 flex items-center justify-center cursor-pointer"
                                                    title={`Restar 1 curva (${curveInfo.curveLabel})`}
                                                  >
                                                    -
                                                  </button>
                                                  <input
                                                    type="number"
                                                    min="0"
                                                    value={currentCurvesCount > 0 ? currentCurvesCount : ''}
                                                    placeholder="0"
                                                    onChange={(e) => {
                                                      const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                                                      setCurveCount(val);
                                                    }}
                                                    className="w-12 text-center py-0.5 px-1 bg-white border border-indigo-200 rounded text-xs font-bold text-indigo-950 focus:border-[#CF0A2C] focus:ring-1 focus:ring-[#CF0A2C] outline-none"
                                                    title={`Ingresar cantidad de curvas (${curveInfo.curveLabel})`}
                                                  />
                                                  <button
                                                    type="button"
                                                    onClick={() => applyCurveDelta(1)}
                                                    className="w-6 h-6 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center cursor-pointer"
                                                    title={`Sumar 1 curva (${curveInfo.curveLabel})`}
                                                  >
                                                    +
                                                  </button>
                                                </div>
                                              </td>
                                            )}
                                            <td className={`text-center py-1 px-2 font-bold ${
                                                isInvalidLibrePeriod
                                                ? 'text-red-500' 
                                                : 'text-gray-800'
                                            }`}>
                                                {totalPeriod || 0}
                                                {isInvalidLibrePeriod && (
                                                    <div className="text-[9px] font-normal text-red-500 whitespace-nowrap">
                                                        {totalPeriod < 12 ? 'Mín. 12' : 'Múltiplo de 6'}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            
                        </table>
                    </div>
                    
                    {(() => {
                        const totalAllocated = (item.deliveryPlan || []).reduce((acc, p) => acc + Object.values(p.sizeBreakdown || {}).reduce((a: number, b: any) => a + (Number(b) || 0), 0), 0);
                        return (
                            <p className="text-xs mt-1.5 text-gray-600">Total asignado: <strong className="text-gray-900">{totalAllocated}</strong> unidades</p>
                        );
                    })()}

                </div>
                <p className="text-gray-700 font-medium mt-1">${item.wholesalePrice.toLocaleString('es-AR')} /unidad</p>
              </div>
            </div>
            <div className="flex flex-col items-stretch sm:items-end gap-2 w-full sm:w-auto">
                <div className="flex items-center justify-end">
                    {/* Cantidad dinámica basada en el plan */}
                    <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700 p-2 rounded-md hover:bg-red-50 transition-colors">
                        <TrashIcon />
                    </button>
                </div>
                <p className="font-semibold text-gray-800 text-right mt-2 sm:mt-0">
                    Subtotal: ${ (item.wholesalePrice * (item.deliveryPlan || []).reduce((acc, p) => acc + Object.values(p.sizeBreakdown).reduce((a: number, b: any) => a + Number(b), 0), 0)).toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2}) }
                </p>
            </div>
          </div>
          )
        })}
      </div>
      <div className="mt-8 text-right font-sans">
        {/* Llamador de distribución */}
        <div className="mb-6 p-4 bg-[#CF0A2C]/5 border border-[#CF0A2C]/20 rounded-xl text-left text-sm text-[#CF0A2C] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-[#CF0A2C]/10 text-[#CF0A2C] rounded-full animate-bounce flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
                    </svg>
                </div>
                <div>
                    <p className="font-bold text-gray-900">💡 ¿Querés ver cuántas unidades recibirás por periodo?</p>
                    <p className="text-xs text-gray-650 mt-0.5">
                        Utilizá el <strong className="font-medium text-[#CF0A2C]">Análisis por Período</strong> al inicio del carrito para recalcular instantáneamente los gráficos, KPIs y montos de inversión por bimestre de forma fácil y visual.
                    </p>
                </div>
            </div>
            <button 
                onClick={() => {
                    const titleEl = document.getElementById('cart-view-title');
                    if (titleEl) {
                        titleEl.scrollIntoView({ behavior: 'smooth' });
                    } else {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                }}
                className="text-xs font-bold text-white bg-[#CF0A2C] hover:bg-[#B00824] py-1.5 px-3 rounded-lg transition-colors shrink-0 flex items-center gap-1.5 self-end md:self-auto shadow-sm"
            >
                Analizar distribución arriba ⬆
            </button>
        </div>

        <div className="flex items-center justify-end gap-6">
            <p className="text-xl font-medium text-gray-700">Total Unidades: {cartItems.reduce((acc, item) => acc + (item.deliveryPlan || []).reduce((planAcc, p) => planAcc + Object.values(p.sizeBreakdown).reduce((a: number, b: any) => a + Number(b), 0), 0), 0)}</p>
            <p className="text-2xl font-bold text-gray-800">Total: ${totalPrice.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
        </div>
        <div className="mt-6 flex flex-col sm:flex-row justify-end gap-4">
            <button
            onClick={setView.bind(null, AppView.PRODUCTS)}
            className="bg-gray-200 text-gray-800 font-bold py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors duration-300"
            >
            Seguir Comprando
            </button>
            <button
            onClick={() => generatePDF()}
            className="bg-red-50 text-red-700 border border-red-200 font-semibold py-3 px-6 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
            >
            PDF
            </button>
            <button
            onClick={() => generateExcel()}
            className="bg-green-50 text-green-700 border border-green-200 font-semibold py-3 px-6 rounded-lg hover:bg-green-100 transition-colors flex items-center justify-center gap-2"
            >
            Excel
            </button>
            <button
            onClick={handleCheckout}
            className="bg-[#CF0A2C] text-white font-bold py-3 px-6 rounded-lg hover:bg-[#B00824] transition-colors duration-300"
            >
            Ingresar Datos
            </button>
        </div>
        {validationError && (
            <p className="text-red-500 text-sm mt-2 font-semibold">Error: {validationError}</p>
        )}
      </div>
    </div>
  );
};

export default CartView;