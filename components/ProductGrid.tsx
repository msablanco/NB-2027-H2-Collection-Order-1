import React, { useState, useEffect, useRef, useMemo } from 'react';
import { products } from '../data/products';
import ProductCard from './ProductCard';
import SurfaceFilterCards from './SurfaceFilterCards';
import SortAndFilterControls from './SortAndFilterControls';
import DivisionFilterTabs from './DivisionFilterTabs';
import { useFavorites } from '../context/FavoritesContext';
import { ShoppingBag } from 'lucide-react';
import { AppView, Product } from '../types';
import { CampaignLookEditorialCard } from './CampaignLookEditorialCard';
import { buildAllPresetLooks, PresetLook, getCampaignLookMapBySku } from './lookPresetsHelper';
import { RealisticLookMannequinMount } from './RealisticLookMannequinMount';

interface ProductGridProps {
  genderFilter: string | null;
  disciplineFilter: string | null;
  setDisciplineFilter: (filter: string | null) => void;
  divisionFilter?: string | null;
  setDivisionFilter?: (filter: string | null) => void;
  segmentationFilter?: string[];
  setSegmentationFilter?: (filter: string[]) => void;
  sortOption: string;
  setSortOption: (option: string) => void;
  clearFilters: () => void;
  searchQuery?: string;
  minPrice?: number | '';
  setMinPrice?: React.Dispatch<React.SetStateAction<number | ''>>;
  maxPrice?: number | '';
  setMaxPrice?: React.Dispatch<React.SetStateAction<number | ''>>;
  hideFavorites?: boolean;
  setHideFavorites?: React.Dispatch<React.SetStateAction<boolean>>;
  setView?: (view: AppView) => void;
  onOpenHelp?: () => void;
}

const INITIAL_BATCH_SIZE = 40;
const BATCH_INCREMENT = 40;

// Helper to map apparel/accessory color codes into cohesive color capsules when "Por Color" is active
function getColorCapsuleKey(product: Product): string {
  const code = (product.colorCode || '').toUpperCase().trim();
  if (!code) return 'ZZZ_NO_COLOR';
  // Group heather/solid pairs of the same color story so full outfits stay together
  if (code === 'BK' || code === 'BKH' || code === 'BM' || code === 'ACK') return 'CAPSULE_BK';
  if (code === 'CB6' || code === 'CB8') return 'CAPSULE_CB6';
  if (code === 'DIV' || code === 'DIN') return 'CAPSULE_DIV';
  if (code === 'BH0' || code === 'BG0' || code === 'GML' || code === 'GLE' || code === 'DGD' || code === 'CAS') return 'CAPSULE_GREY';
  if (code === 'TNV' || code === 'TN2' || code === 'BS6') return 'CAPSULE_NAVY';
  if (code === 'LUP' || code === 'LPK' || code === 'CXP') return 'CAPSULE_PINK';
  if (code === 'AAX' || code === 'CB9') return 'CAPSULE_CLOUD_BLUE';
  if (code === 'WT' || code === 'WM') return 'CAPSULE_WHITE';
  return `COLOR_${code}`;
}

const ProductGrid: React.FC<ProductGridProps> = ({ 
  genderFilter, 
  disciplineFilter, 
  setDisciplineFilter, 
  divisionFilter = null,
  setDivisionFilter,
  segmentationFilter = [],
  setSegmentationFilter,
  sortOption, 
  setSortOption, 
  clearFilters,
  searchQuery = '',
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  hideFavorites,
  setHideFavorites,
  setView,
  onOpenHelp
}) => {
  const [showFilters, setShowFilters] = useState(true);
  const [isFilterHovered, setIsFilterHovered] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');
  const [catalogGrouping, setCatalogGrouping] = useState<'color' | 'model'>('model');
  const [visibleCount, setVisibleCount] = useState<number>(INITIAL_BATCH_SIZE);
  const [showCampaignLooks, setShowCampaignLooks] = useState<boolean>(true);
  const [selectedMannequinLook, setSelectedMannequinLook] = useState<PresetLook | null>(null);
  const campaignLookMap = useMemo(() => getCampaignLookMapBySku(products), []);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { isFavorite } = useFavorites();

  const cancelClose = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      if (currentScrollY > lastScrollY && currentScrollY > 120) {
        setShowFilters(false);
      } else if (currentScrollY < lastScrollY) {
        setShowFilters(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Reveal filter bar whenever cursor moves into the top header & filter zone
  useEffect(() => {
    const handleWindowMouseMove = (e: MouseEvent) => {
      const scrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      if (scrollY > 100) {
        const headerH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) || 120;
        const activeZoneBottom = headerH + 115;
        
        if (e.clientY <= activeZoneBottom) {
          cancelClose();
          setIsFilterHovered(true);
        } else if (e.clientY > activeZoneBottom + 25 && !showFilters) {
          if (!hoverTimeoutRef.current) {
            hoverTimeoutRef.current = setTimeout(() => {
              setIsFilterHovered(false);
              hoverTimeoutRef.current = null;
            }, 300);
          }
        }
      } else {
        cancelClose();
        setIsFilterHovered(false);
      }
    };

    window.addEventListener('mousemove', handleWindowMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      cancelClose();
    };
  }, [showFilters]);

  // Reset visible batch when filters or sort change
  useEffect(() => {
    setVisibleCount(INITIAL_BATCH_SIZE);
  }, [genderFilter, disciplineFilter, divisionFilter, segmentationFilter, sortOption, searchQuery, minPrice, maxPrice, hideFavorites, catalogGrouping]);

  const hiddenProductCodes = ['1459214', '1459217', '1459225'];

  // Calculate live counts per division based on current active gender and search
  const divisionCounts = React.useMemo(() => {
    const counts = {
      TOTAL: 0,
      CALZADO: 0,
      INDUMENTARIA: 0,
      ACCESORIOS: 0
    };

    products.forEach(p => {
      if (p.productCode && hiddenProductCodes.includes(p.productCode)) return;
      const genderMatch = !genderFilter || (p.gender || '').toUpperCase() === genderFilter.toUpperCase();
      let searchMatch = true;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        searchMatch = 
          (p.name || '').toLowerCase().includes(q) ||
          (p.model || '').toLowerCase().includes(q) ||
          (p.colorCode || '').toLowerCase().includes(q) ||
          (p.productCode || '').toLowerCase().includes(q) ||
          (p.sku || '').toLowerCase().includes(q);
      }

      if (genderMatch && searchMatch) {
        counts.TOTAL++;
        const div = (p.division || 'CALZADO').toUpperCase().trim();
        if (div === 'CALZADO') counts.CALZADO++;
        else if (div === 'INDUMENTARIA') counts.INDUMENTARIA++;
        else if (div === 'ACCESORIOS') counts.ACCESORIOS++;
        else {
          (counts as any)[div] = ((counts as any)[div] || 0) + 1;
        }
      }
    });

    return counts;
  }, [genderFilter, searchQuery]);

  const filteredProducts = products.filter(product => {
    if (product.productCode && hiddenProductCodes.includes(product.productCode)) return false;
    const genderMatch = !genderFilter || (product.gender || '').toUpperCase() === genderFilter.toUpperCase();
    const disciplineMatch = !disciplineFilter || (product.category || '').toUpperCase() === disciplineFilter.toUpperCase();
    const divisionMatch = !divisionFilter || (product.division && product.division.toUpperCase().trim() === divisionFilter.toUpperCase().trim());
    
    let searchMatch = true;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      searchMatch = 
        (product.name || '').toLowerCase().includes(q) ||
        (product.model || '').toLowerCase().includes(q) ||
        (product.colorCode || '').toLowerCase().includes(q) ||
        (product.productCode || '').toLowerCase().includes(q) ||
        (product.sku || '').toLowerCase().includes(q);
    }
    
    if (hideFavorites && isFavorite(product.id)) {
        return false;
    }

    if (minPrice !== undefined && minPrice !== '' && product.price < Number(minPrice)) {
       return false;
    }
    
    if (maxPrice !== undefined && maxPrice !== '' && product.price > Number(maxPrice)) {
       return false;
    }

    if (sortOption === 'launch-first' && !product.marketingLaunch) {
       return false;
    }

    if (segmentationFilter && segmentationFilter.length > 0) {
      const prodSeg = (product.segmentation || '').toUpperCase().trim();
      const match = segmentationFilter.some(s => s.toUpperCase().trim() === prodSeg);
      if (!match) return false;
    }

    return genderMatch && disciplineMatch && searchMatch && divisionMatch;
  });

  const availableSegmentations = React.useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.segmentation && p.segmentation.trim()) {
        set.add(p.segmentation.trim());
      }
    });
    return Array.from(set).sort();
  }, []);

  const canShowLooks = !divisionFilter || divisionFilter.toUpperCase().trim() === 'INDUMENTARIA';

  // Pre-compute minimum Orden (displayOrder) per (Disciplina, Division, Driver), per Model, and per Color Capsule
  const { minOrderByDiscDivDriver, minOrderByModel, minOrderByColor } = React.useMemo(() => {
    const drvMap = new Map<string, number>();
    const modMap = new Map<string, number>();
    const colMap = new Map<string, number>();
    for (const p of products) {
      const div = (p.division || 'CALZADO').toUpperCase().trim();
      const cat = (p.category || 'OTROS').toUpperCase().trim();
      const ord = p.displayOrder || p.generalOrder || 999999;
      const drv = (div === 'INDUMENTARIA' || div === 'ACCESORIOS') ? (p.driver || '').toUpperCase().trim() : '';
      const drvKey = `${cat}__${div}__${drv}`;
      const curDrv = drvMap.get(drvKey);
      if (curDrv === undefined || ord < curDrv) {
        drvMap.set(drvKey, ord);
      }

      const mod = (p.model || p.name || '').toUpperCase().trim();
      const modKey = `${drvKey}__${mod}`;
      const curMod = modMap.get(modKey);
      if (curMod === undefined || ord < curMod) {
        modMap.set(modKey, ord);
      }

      const gender = (p.gender || '').toUpperCase().trim();
      const capsule = getColorCapsuleKey(p);
      const colKey = `${drvKey}__${gender}__${capsule}`;
      const curCol = colMap.get(colKey);
      if (curCol === undefined || ord < curCol) {
        colMap.set(colKey, ord);
      }
    }
    return { minOrderByDiscDivDriver: drvMap, minOrderByModel: modMap, minOrderByColor: colMap };
  }, []);

  const sortedAndFilteredProducts = [...filteredProducts].sort((a, b) => {
    switch (sortOption) {
      case 'launch-first': {
        const aVal = a.marketingLaunch ? 1 : 0;
        const bVal = b.marketingLaunch ? 1 : 0;
        if (aVal !== bVal) {
          return bVal - aVal;
        }
        return a.generalOrder - b.generalOrder;
      }
      case 'price-desc':
        return b.wholesalePrice - a.wholesalePrice;
      case 'price-asc':
        return a.wholesalePrice - b.wholesalePrice;
      case 'name':
      case 'name-asc':
        return a.name.localeCompare(b.name);
      default: {
        // 1. Disciplina (Column B): Running -> Training -> Tennis -> Lifestyle -> Numeric -> Kids Lifestyle -> Performance -> Kids
        const disciplinePriority: Record<string, number> = {
          'RUNNING': 1,
          'TRAINING': 2,
          'TENNIS': 3,
          'LIFESTYLE': 4,
          'NUMERIC': 5,
          'KIDS LIFESTYLE': 6,
          'PERFORMANCE': 7,
          'KIDS': 8,
        };
        const catA = (a.category || 'OTROS').toUpperCase().trim();
        const catB = (b.category || 'OTROS').toUpperCase().trim();
        if (catA !== catB) {
          const prioCatA = disciplinePriority[catA] || 99;
          const prioCatB = disciplinePriority[catB] || 99;
          if (prioCatA !== prioCatB) {
            return prioCatA - prioCatB;
          }
          return catA.localeCompare(catB);
        }

        // 2. Division within the Disciplina: CALZADO -> INDUMENTARIA -> ACCESORIOS
        const divisionPriority: Record<string, number> = {
          'CALZADO': 1,
          'INDUMENTARIA': 2,
          'ACCESORIOS': 3,
        };
        const divA = (a.division || 'CALZADO').toUpperCase().trim();
        const divB = (b.division || 'CALZADO').toUpperCase().trim();
        const prioDivA = divisionPriority[divA] || 99;
        const prioDivB = divisionPriority[divB] || 99;
        if (prioDivA !== prioDivB) {
          return prioDivA - prioDivB;
        }

        // 3. Driver (Column AL - grouped within Indumentaria & Accesorios of each Disciplina)
        const drvA = (divA === 'INDUMENTARIA' || divA === 'ACCESORIOS') ? (a.driver || '').toUpperCase().trim() : '';
        const drvB = (divB === 'INDUMENTARIA' || divB === 'ACCESORIOS') ? (b.driver || '').toUpperCase().trim() : '';
        if (drvA !== drvB) {
          const minDrvA = minOrderByDiscDivDriver.get(`${catA}__${divA}__${drvA}`) ?? 999999;
          const minDrvB = minOrderByDiscDivDriver.get(`${catB}__${divB}__${drvB}`) ?? 999999;
          if (minDrvA !== minDrvB) {
            return minDrvA - minDrvB;
          }
          return drvA.localeCompare(drvB);
        }

        // 4. Switch "Por Color" vs "Por Modelo"
        if (catalogGrouping === 'color') {
          // Group products of the same Color Capsule together within the Driver & Gender
          if (divA === 'INDUMENTARIA' || divA === 'ACCESORIOS') {
            const genA = (a.gender || '').toUpperCase().trim();
            const genB = (b.gender || '').toUpperCase().trim();
            if (genA !== genB) {
              const genPrio: Record<string, number> = { 'MASCULINO': 1, 'FEMENINO': 2, 'UNISEX': 3, 'NIÑOS': 4 };
              return (genPrio[genA] || 99) - (genPrio[genB] || 99);
            }
            const capA = getColorCapsuleKey(a);
            const capB = getColorCapsuleKey(b);
            if (capA !== capB) {
              const minColA = minOrderByColor.get(`${catA}__${divA}__${drvA}__${genA}__${capA}`) ?? 999999;
              const minColB = minOrderByColor.get(`${catB}__${divB}__${drvB}__${genB}__${capB}`) ?? 999999;
              if (minColA !== minColB) {
                return minColA - minColB;
              }
              return capA.localeCompare(capB);
            }
          }
        } else if (catalogGrouping === 'model') {
          // Group variants of the same Model together, ordered by the Model's first Orden Catalogo (Column AO)
          const modelA = (a.model || a.name || '').toUpperCase().trim();
          const modelB = (b.model || b.name || '').toUpperCase().trim();
          if (modelA !== modelB) {
            const minModA = minOrderByModel.get(`${catA}__${divA}__${drvA}__${modelA}`) ?? 999999;
            const minModB = minOrderByModel.get(`${catB}__${divB}__${drvB}__${modelB}`) ?? 999999;
            if (minModA !== minModB) {
              return minModA - minModB;
            }
            return modelA.localeCompare(modelB);
          }
          // Within the same shoe/apparel model, keep gender together if Calzado
          if (divA === 'CALZADO') {
            const genA = (a.gender || '').toUpperCase().trim();
            const genB = (b.gender || '').toUpperCase().trim();
            if (genA !== genB) {
              const genPrio: Record<string, number> = { 'MASCULINO': 1, 'FEMENINO': 2, 'UNISEX': 3, 'NIÑOS': 4 };
              return (genPrio[genA] || 99) - (genPrio[genB] || 99);
            }
          }
        }

        // 5. Orden Catalogo (Column AO displayOrder, then CSV row generalOrder)
        if (a.displayOrder !== b.displayOrder) {
          return a.displayOrder - b.displayOrder;
        }
        return a.generalOrder - b.generalOrder;
      }
    }
  });

  const getSubdivisionKey = (p: Product) => {
    const cat = (p.category || 'OTROS').toUpperCase().trim();
    const div = (p.division || 'CALZADO').toUpperCase().trim();
    const driver = (div === 'INDUMENTARIA' || div === 'ACCESORIOS') ? (p.driver || '').trim() : '';
    return `${cat}__${div}__${driver}`;
  };

  // Pre-calculate count of products per discipline in current filtered dataset
  const disciplineCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    sortedAndFilteredProducts.forEach(p => {
      const cat = (p.category || 'OTROS').toUpperCase().trim();
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [sortedAndFilteredProducts]);

  // Pre-calculate count of products per subdivision (discipline + division + driver)
  const subdivisionCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    sortedAndFilteredProducts.forEach(p => {
      const key = getSubdivisionKey(p);
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [sortedAndFilteredProducts]);

  // Candidate looks for editorial interposition in the product grid (only on main screen or Indumentaria filter)
  const campaignLooksToDisplay = useMemo(() => {
    if (!showCampaignLooks || !canShowLooks) return [];
    const all = buildAllPresetLooks(products);
    let filtered = all;

    if (genderFilter) {
      const gf = genderFilter.toUpperCase().trim();
      filtered = filtered.filter(l => (l.gender || '').toUpperCase().trim() === gf);
    }

    if (disciplineFilter) {
      const df = disciplineFilter.toUpperCase().trim();
      filtered = filtered.filter(l => (l.category || '').toUpperCase().trim() === df);
    }

    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(l => 
        l.title.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q) ||
        l.colorCode.toLowerCase().includes(q) ||
        (l.campaignCode && l.campaignCode.toLowerCase().includes(q)) ||
        l.top.sku.toLowerCase().includes(q) ||
        l.top.name.toLowerCase().includes(q) ||
        l.bottom.sku.toLowerCase().includes(q) ||
        l.bottom.name.toLowerCase().includes(q) ||
        (l.layer && (l.layer.sku.toLowerCase().includes(q) || l.layer.name.toLowerCase().includes(q))) ||
        (l.footwear && (l.footwear.sku.toLowerCase().includes(q) || l.footwear.name.toLowerCase().includes(q)))
      );
    }

    return [...filtered];
  }, [genderFilter, disciplineFilter, searchQuery, showCampaignLooks, canShowLooks]);

  const currentMannequinLookIndex = selectedMannequinLook
    ? campaignLooksToDisplay.findIndex(l => l.id === selectedMannequinLook.id)
    : -1;

  const handlePrevMannequinLook = () => {
    if (campaignLooksToDisplay.length === 0 || currentMannequinLookIndex === -1) return;
    const prevIdx = (currentMannequinLookIndex - 1 + campaignLooksToDisplay.length) % campaignLooksToDisplay.length;
    setSelectedMannequinLook(campaignLooksToDisplay[prevIdx]);
  };

  const handleNextMannequinLook = () => {
    if (campaignLooksToDisplay.length === 0 || currentMannequinLookIndex === -1) return;
    const nextIdx = (currentMannequinLookIndex + 1) % campaignLooksToDisplay.length;
    setSelectedMannequinLook(campaignLooksToDisplay[nextIdx]);
  };

  // Progressive scroll observer
  useEffect(() => {
    if (visibleCount >= sortedAndFilteredProducts.length) return;
    const node = loadMoreRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setVisibleCount(sortedAndFilteredProducts.length);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount(prev => Math.min(prev + BATCH_INCREMENT, sortedAndFilteredProducts.length));
        }
      },
      { rootMargin: '600px 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [visibleCount, sortedAndFilteredProducts.length]);

  const displayedProducts = sortedAndFilteredProducts.slice(0, visibleCount);

  // Option 3 Merchandising Placement:
  // 1. In Calzado: place right after key footwear families that compose looks (Rebel Run V6 in Running, 738 in Lifestyle)
  // 2. In Indumentaria: place inside the Driver that gives them birth (RC in Running, AC Training & AC Bodywear in Training, Tennis in Tennis, Athletics Crafted & Trackside in Lifestyle)
  const editorialLooksToInsert = useMemo(() => {
    const map = new Map<number, PresetLook>();
    if (!canShowLooks || campaignLooksToDisplay.length === 0 || sortedAndFilteredProducts.length === 0) {
      return map;
    }

    const lookById = new Map<string, PresetLook>();
    for (const l of campaignLooksToDisplay) {
      lookById.set(l.id, l);
    }

    const placedLookIds = new Set<string>();

    const placeLook = (lookId: string, targetIdx: number) => {
      if (placedLookIds.has(lookId)) return;
      const look = lookById.get(lookId);
      if (!look) return;
      if (targetIdx < 0 || targetIdx >= sortedAndFilteredProducts.length) return;
      
      let actualIdx = targetIdx;
      while (map.has(actualIdx) && actualIdx < sortedAndFilteredProducts.length - 1) {
        actualIdx++;
      }
      map.set(actualIdx, look);
      placedLookIds.add(lookId);
    };

    // A. Contextual Placement for RUNNING
    // 1. RUNNING Calzado: Right after the Rebel Run V6 footwear family finishes
    let lastRebelIdx = -1;
    sortedAndFilteredProducts.forEach((p, idx) => {
      if ((p.division || '').toUpperCase() === 'CALZADO' && 
          (p.category || '').toUpperCase() === 'RUNNING' && 
          (p.model || '').toLowerCase().includes('rebel run')) {
        lastRebelIdx = idx;
      }
    });
    if (lastRebelIdx !== -1) {
      placeLook('camp-look-1', lastRebelIdx);
    }

    // 2. RUNNING Indumentaria: Inside Driver 'Rc'
    const rcIndices: number[] = [];
    sortedAndFilteredProducts.forEach((p, idx) => {
      if ((p.division || '').toUpperCase() === 'INDUMENTARIA' && 
          (p.category || '').toUpperCase() === 'RUNNING' && 
          (p.driver || '').toLowerCase() === 'rc') {
        rcIndices.push(idx);
      }
    });
    if (rcIndices.length > 0) {
      if (!placedLookIds.has('camp-look-1')) {
        placeLook('camp-look-1', rcIndices[Math.min(7, rcIndices.length - 1)]);
      }
      placeLook('camp-look-2', rcIndices[Math.min(15, rcIndices.length - 1)]);
      placeLook('camp-look-3', rcIndices[Math.min(27, rcIndices.length - 1)]);
      placeLook('camp-look-4', rcIndices[Math.min(42, rcIndices.length - 1)]);
    }

    // B. Contextual Placement for TRAINING
    // 3. TRAINING Indumentaria: Inside Driver 'Ac Training'
    const acTrainIndices: number[] = [];
    sortedAndFilteredProducts.forEach((p, idx) => {
      if ((p.division || '').toUpperCase() === 'INDUMENTARIA' && 
          (p.category || '').toUpperCase() === 'TRAINING' && 
          (p.driver || '').toLowerCase() === 'ac training') {
        acTrainIndices.push(idx);
      }
    });
    if (acTrainIndices.length > 0) {
      placeLook('camp-look-5', acTrainIndices[Math.min(7, acTrainIndices.length - 1)]);
      placeLook('camp-look-6', acTrainIndices[Math.min(18, acTrainIndices.length - 1)]);
    }

    // 4. TRAINING Indumentaria: Inside Driver 'Ac Bodywear Multisport'
    const acBodyIndices: number[] = [];
    sortedAndFilteredProducts.forEach((p, idx) => {
      if ((p.division || '').toUpperCase() === 'INDUMENTARIA' && 
          (p.category || '').toUpperCase() === 'TRAINING' && 
          (p.driver || '').toLowerCase() === 'ac bodywear multisport') {
        acBodyIndices.push(idx);
      }
    });
    if (acBodyIndices.length > 0) {
      placeLook('camp-look-ac-her', acBodyIndices[Math.min(5, acBodyIndices.length - 1)]);
    }

    // C. Contextual Placement for TENNIS
    // 5. TENNIS: After last Tennis shoe or inside Tennis apparel
    let lastTennisShoeIdx = -1;
    const tennisApparelIndices: number[] = [];
    sortedAndFilteredProducts.forEach((p, idx) => {
      const isTennis = (p.category || '').toUpperCase() === 'TENNIS';
      if (isTennis && (p.division || '').toUpperCase() === 'CALZADO') lastTennisShoeIdx = idx;
      if (isTennis && (p.division || '').toUpperCase() === 'INDUMENTARIA') tennisApparelIndices.push(idx);
    });
    if (lastTennisShoeIdx !== -1) {
      placeLook('camp-look-on-off-court', lastTennisShoeIdx);
    } else if (tennisApparelIndices.length > 0) {
      placeLook('camp-look-on-off-court', tennisApparelIndices[Math.min(5, tennisApparelIndices.length - 1)]);
    }

    // D. Contextual Placement for LIFESTYLE
    // 6. LIFESTYLE Calzado: After last 738 shoe finishes
    let last738Idx = -1;
    sortedAndFilteredProducts.forEach((p, idx) => {
      if ((p.division || '').toUpperCase() === 'CALZADO' && 
          (p.category || '').toUpperCase() === 'LIFESTYLE' && 
          ((p.model || '').includes('738') || (p.sku || '').startsWith('U738'))) {
        last738Idx = idx;
      }
    });
    if (last738Idx !== -1) {
      placeLook('camp-look-7', last738Idx);
    }

    // 7. LIFESTYLE Indumentaria: Inside Driver 'Athletics Crafted'
    const athCraftIndices: number[] = [];
    sortedAndFilteredProducts.forEach((p, idx) => {
      if ((p.division || '').toUpperCase() === 'INDUMENTARIA' && 
          (p.category || '').toUpperCase() === 'LIFESTYLE' && 
          (p.driver || '').toLowerCase() === 'athletics crafted') {
        athCraftIndices.push(idx);
      }
    });
    if (athCraftIndices.length > 0) {
      placeLook('camp-look-9', athCraftIndices[Math.min(4, athCraftIndices.length - 1)]);
      placeLook('camp-look-10', athCraftIndices[Math.min(10, athCraftIndices.length - 1)]);
    }

    // 8. LIFESTYLE Indumentaria: Inside Driver 'Trackside'
    const tracksideIndices: number[] = [];
    sortedAndFilteredProducts.forEach((p, idx) => {
      if ((p.division || '').toUpperCase() === 'INDUMENTARIA' && 
          (p.category || '').toUpperCase() === 'LIFESTYLE' && 
          (p.driver || '').toLowerCase() === 'trackside') {
        tracksideIndices.push(idx);
      }
    });
    if (tracksideIndices.length > 0) {
      if (!placedLookIds.has('camp-look-7')) {
        placeLook('camp-look-7', tracksideIndices[Math.min(5, tracksideIndices.length - 1)]);
      }
      placeLook('camp-look-8', tracksideIndices[Math.min(18, tracksideIndices.length - 1)]);
    }

    // E. Dynamic fallback: if any look in campaignLooksToDisplay remains unplaced (e.g. strict search/filters),
    // interleave it inside its corresponding discipline so no look is ever missed
    const unplacedLooks = campaignLooksToDisplay.filter(l => !placedLookIds.has(l.id));
    if (unplacedLooks.length > 0) {
      const indicesByDiscipline = new Map<string, number[]>();
      sortedAndFilteredProducts.forEach((p, idx) => {
        const cat = (p.category || 'OTROS').toUpperCase().trim();
        if (!indicesByDiscipline.has(cat)) indicesByDiscipline.set(cat, []);
        indicesByDiscipline.get(cat)!.push(idx);
      });

      for (const look of unplacedLooks) {
        const cat = (look.category || 'OTROS').toUpperCase().trim();
        const prodIndices = indicesByDiscipline.get(cat);
        if (!prodIndices || prodIndices.length === 0) continue;
        for (let off = 7; off < prodIndices.length; off += 8) {
          const candIdx = prodIndices[off];
          if (!map.has(candIdx)) {
            placeLook(look.id, candIdx);
            break;
          }
        }
        if (!placedLookIds.has(look.id) && prodIndices.length > 0) {
          placeLook(look.id, prodIndices[prodIndices.length - 1]);
        }
      }
    }

    return map;
  }, [sortedAndFilteredProducts, campaignLooksToDisplay, canShowLooks]);

  const isToolbarVisible = showFilters || isFilterHovered;

  return (
    <div>
      <div 
        ref={toolbarRef}
        onMouseEnter={() => {
          cancelClose();
          setIsFilterHovered(true);
        }}
        onMouseLeave={() => {
          if (!showFilters) {
            cancelClose();
            hoverTimeoutRef.current = setTimeout(() => {
              setIsFilterHovered(false);
              hoverTimeoutRef.current = null;
            }, 300);
          }
        }}
        style={{ top: 'var(--header-height, 118px)' }}
        className={`sticky z-40 bg-white -mx-4 px-4 sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12 xl:-mx-16 xl:px-16 pb-2 pt-1.5 shadow-xs mb-2 sm:mb-3 border-b border-gray-200 transition-all duration-300 ease-out ${
          isToolbarVisible 
            ? 'translate-y-0 opacity-100 pointer-events-auto shadow-md md:shadow-xs' 
            : '-translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <DivisionFilterTabs 
          activeDivision={divisionFilter} 
          setDivision={setDivisionFilter || (() => {})} 
          counts={divisionCounts} 
        />
        <SurfaceFilterCards activeFilter={disciplineFilter} setFilter={setDisciplineFilter} divisionFilter={divisionFilter} />
        <SortAndFilterControls
          count={sortedAndFilteredProducts.length}
          sortOption={sortOption}
          setSortOption={setSortOption}
          clearFilters={clearFilters}
          minPrice={minPrice}
          setMinPrice={setMinPrice}
          maxPrice={maxPrice}
          setMaxPrice={setMaxPrice}
          hideFavorites={hideFavorites}
          setHideFavorites={setHideFavorites}
          viewMode={viewMode}
          setViewMode={setViewMode}
          segmentationFilter={segmentationFilter}
          setSegmentationFilter={setSegmentationFilter}
          availableSegmentations={availableSegmentations}
          catalogGrouping={catalogGrouping}
          setCatalogGrouping={setCatalogGrouping}
          showCampaignLooks={canShowLooks ? showCampaignLooks : false}
          setShowCampaignLooks={canShowLooks ? setShowCampaignLooks : undefined}
        />
      </div>

      {sortedAndFilteredProducts.length > 0 ? (
        <>
          <div className={`grid ${viewMode === 'compact' ? 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2 sm:gap-3' : 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5 sm:gap-4 lg:gap-5'}`}>
            {displayedProducts.map((product, index) => {
              const currentCategory = (product.category || 'OTROS').toUpperCase().trim();
              const currentDiv = (product.division || 'CALZADO').toUpperCase().trim();
              const currentDriver = (currentDiv === 'INDUMENTARIA' || currentDiv === 'ACCESORIOS') ? (product.driver || '').trim() : '';
              const currentSubKey = getSubdivisionKey(product);

              const prevProduct = index > 0 ? displayedProducts[index - 1] : null;
              const prevCategory = prevProduct ? (prevProduct.category || 'OTROS').toUpperCase().trim() : null;
              const prevSubKey = prevProduct ? getSubdivisionKey(prevProduct) : null;

              // Major discipline header: appears on the general view when category changes or at start
              const isDisciplineChange = !disciplineFilter && sortOption === 'default' && (index === 0 || currentCategory !== prevCategory);
              
              // Subdivision header: appears in both general view and discipline filter view when division/driver changes or at start
              const isSubdivisionChange = sortOption === 'default' && (index === 0 || currentSubKey !== prevSubKey);

              return (
                <React.Fragment key={`${product.id}-${index}`}>
                  {isDisciplineChange && (
                    <div 
                      key={`sep-cat-${currentCategory}-${index}`}
                      className={`col-span-full ${index === 0 ? 'pt-2 pb-2 sm:pt-3 sm:pb-3' : 'pt-10 pb-3 sm:pt-14 sm:pb-4'}`}
                    >
                      <div className="flex items-center gap-3 sm:gap-5">
                        <div className="h-px bg-gray-200/90 flex-1" />
                        <div className="flex items-baseline gap-2 sm:gap-3 px-1 sm:px-2 select-none">
                          <span className="text-xs sm:text-sm md:text-base font-bold tracking-wider uppercase text-gray-950">
                            {currentCategory}
                          </span>
                          {disciplineCounts[currentCategory] !== undefined && (
                            <span className="text-[11px] sm:text-xs font-medium text-gray-500 tracking-normal">
                              ({disciplineCounts[currentCategory]} {disciplineCounts[currentCategory] === 1 ? 'modelo' : 'modelos'})
                            </span>
                          )}
                        </div>
                        <div className="h-px bg-gray-200/90 flex-1" />
                      </div>
                    </div>
                  )}

                  {isSubdivisionChange && (
                    <div 
                      key={`sep-sub-${currentSubKey}-${index}`}
                      className={`col-span-full ${isDisciplineChange ? 'pt-1 pb-3 sm:pb-3.5' : (index === 0 ? 'pt-1 pb-3 sm:pb-3.5' : 'pt-7 pb-3 sm:pt-9 sm:pb-3.5')}`}
                    >
                      <div className="flex items-center gap-2 sm:gap-3 px-0.5 sm:px-1 select-none flex-wrap sm:flex-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase shadow-2xs ${
                            currentDiv === 'CALZADO'
                              ? 'bg-slate-900 text-white'
                              : currentDiv === 'INDUMENTARIA'
                              ? 'bg-[#CF0A2C] text-white'
                              : 'bg-amber-700 text-white'
                          }`}>
                            {currentDiv}
                          </span>
                          {currentDriver && (
                            <span className="text-xs sm:text-sm font-bold text-gray-900 tracking-wide uppercase">
                              {currentDriver}
                            </span>
                          )}
                          {subdivisionCounts[currentSubKey] !== undefined && (
                            <span className="text-[11px] sm:text-xs font-medium text-gray-400 tracking-normal">
                              ({subdivisionCounts[currentSubKey]} {subdivisionCounts[currentSubKey] === 1 ? 'modelo' : 'modelos'})
                            </span>
                          )}
                        </div>
                        <div className="hidden sm:block h-px bg-gray-200/80 flex-1 ml-2" />
                      </div>
                    </div>
                  )}

                  <ProductCard 
                    product={product} 
                    viewMode={viewMode} 
                    campaignLook={campaignLookMap.get(product.sku)}
                    onOpenMannequinModal={(l) => setSelectedMannequinLook(l)}
                  />

                  {showCampaignLooks && canShowLooks &&
                    editorialLooksToInsert.has(index) && (
                    <CampaignLookEditorialCard 
                      key={`editorial-look-${editorialLooksToInsert.get(index)!.id}`}
                      look={editorialLooksToInsert.get(index)!}
                      onOpenMannequinModal={(l) => setSelectedMannequinLook(l)}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
          {visibleCount < sortedAndFilteredProducts.length && (
            <div ref={loadMoreRef} className="py-8 flex justify-center">
              <button
                type="button"
                onClick={() => setVisibleCount(prev => Math.min(prev + BATCH_INCREMENT, sortedAndFilteredProducts.length))}
                className="px-7 py-3 bg-white/95 hover:bg-white text-gray-900 text-xs font-bold uppercase tracking-wider rounded-full shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-200"
              >
                Mostrando {displayedProducts.length} de {sortedAndFilteredProducts.length} productos — Cargar más
              </button>
            </div>
          )}
        </>
      ) : divisionFilter === 'ACCESORIOS' ? (
        <div className="text-center py-12 px-6 bg-white rounded-2xl shadow-sm border border-gray-200 max-w-lg mx-auto my-8">
            <div className="w-16 h-16 rounded-full bg-red-50 text-[#CF0A2C] flex items-center justify-center mx-auto mb-4 shadow-2xs">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-2">Accesorios</h2>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              No hay productos cargados en esta categoría actualmente.
            </p>
            <button 
              onClick={() => setDivisionFilter && setDivisionFilter(null)}
              className="px-5 py-2.5 bg-[#CF0A2C] hover:bg-[#B00824] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Ver todos los productos ({products.length})
            </button>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-700">No se encontraron productos</h2>
            <p className="text-gray-500 mt-2">Intenta ajustar los filtros o revisa más tarde.</p>
        </div>
      )}

      {/* Full-Screen Realistic Mannequin Studio Modal */}
      {selectedMannequinLook && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto"
          onClick={() => setSelectedMannequinLook(null)}
        >
          <div 
            className="relative w-full max-w-6xl my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <RealisticLookMannequinMount 
              look={selectedMannequinLook} 
              onClose={() => setSelectedMannequinLook(null)}
              onPrevLook={campaignLooksToDisplay.length > 1 ? handlePrevMannequinLook : undefined}
              onNextLook={campaignLooksToDisplay.length > 1 ? handleNextMannequinLook : undefined}
              currentIndex={currentMannequinLookIndex !== -1 ? currentMannequinLookIndex + 1 : undefined}
              totalLooks={campaignLooksToDisplay.length}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductGrid;