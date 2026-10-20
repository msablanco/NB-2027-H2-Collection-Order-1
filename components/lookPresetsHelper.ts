import { Product } from '../types';

export interface ColorInfo {
  name: string;
  spanishName: string;
  hex: string;
  family: string;
}

export interface PresetLook {
  id: string;
  driver: string;
  category?: string;
  categories?: string[];
  gender: string;
  colorCode: string;
  title: string;
  description: string;
  layer?: Product;
  top: Product;
  bottom: Product;
  footwear: Product;
  colorInfo: ColorInfo;
  totalPublicPrice: number;
  isLayered?: boolean;
  marketingBadge?: string;
  isCampaignLook?: boolean;
  campaignCode?: string;
  photoWithLayer?: string;
  photoSoloRemera?: string;
}

export const DRIVER_METADATA: Record<string, { title: string; subtitle: string; bgGradient: string; name?: string; badge?: string; badgeBg?: string; themeColor?: string }> = {
  'RC': { title: 'RC RUNNING', name: 'RC Running', subtitle: 'Alto rendimiento y velocidad para corredores', bgGradient: 'from-stone-900 to-black', badge: 'RUNNING', badgeBg: 'bg-red-50 text-red-800 border-red-200', themeColor: '#CF0A2C' },
  'Daily Run': { title: 'DAILY RUN', name: 'Daily Run', subtitle: 'Confort diario y versatilidad para entrenamiento', bgGradient: 'from-slate-900 to-stone-900', badge: 'RUNNING', badgeBg: 'bg-blue-50 text-blue-800 border-blue-200', themeColor: '#1E3A8A' },
  'Trackside': { title: 'TRACKSIDE', name: 'Trackside', subtitle: 'Estética athleisure y herencia deportiva', bgGradient: 'from-zinc-900 to-black', badge: 'LIFESTYLE', badgeBg: 'bg-stone-100 text-stone-800 border-stone-300', themeColor: '#111111' },
  'Athletics': { title: 'ATHLETICS', name: 'Athletics', subtitle: 'Línea icónica de entrenamiento New Balance', bgGradient: 'from-stone-900 to-neutral-800', badge: 'ATHLETICS', badgeBg: 'bg-amber-50 text-amber-900 border-amber-200', themeColor: '#991B1B' },
  'Athletics Crafted': { title: 'ATHLETICS CRAFTED', name: 'Athletics Crafted', subtitle: 'Detalles premium y siluetas contemporáneas', bgGradient: 'from-neutral-900 to-zinc-900', badge: 'CRAFTED', badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200', themeColor: '#2C4C3E' },
  'AC TRAINING': { title: 'ATHLETICS TRAINING', name: 'AC Training', subtitle: 'Funcionalidad y transpirabilidad técnica', bgGradient: 'from-stone-900 to-stone-800', badge: 'TRAINING', badgeBg: 'bg-purple-50 text-purple-800 border-purple-200', themeColor: '#6B1D2F' },
  'Bodywear Everyday :NB ESSENTIAL': { title: 'BODYWEAR ESSENTIAL', name: 'Bodywear Essential', subtitle: 'Primera piel y compresión activa', bgGradient: 'from-neutral-900 to-stone-900', badge: 'BODYWEAR', badgeBg: 'bg-pink-50 text-pink-800 border-pink-200', themeColor: '#BE185D' },
  'AC Bodywear Multisport': { title: 'AC BODYWEAR', name: 'AC Bodywear', subtitle: 'Soporte y libertad de movimiento multisport', bgGradient: 'from-zinc-900 to-slate-900', badge: 'BODYWEAR', badgeBg: 'bg-rose-50 text-rose-800 border-rose-200', themeColor: '#9F1239' },
  'Multi Sport (NB Sport)': { title: 'NB SPORT MULTISPORT', name: 'Multi Sport', subtitle: 'Equipamiento dinámico para alto desempeño', bgGradient: 'from-stone-900 to-stone-800', badge: 'MULTISPORT', badgeBg: 'bg-slate-100 text-slate-800 border-slate-300', themeColor: '#334155' },
  'Tennis': { title: 'TENNIS & COURT', name: 'Tennis & Court', subtitle: 'Rendimiento y elegancia en la pista', bgGradient: 'from-slate-900 to-stone-900', badge: 'TENNIS', badgeBg: 'bg-teal-50 text-teal-800 border-teal-200', themeColor: '#0F766E' }
};

export const COLOR_INFO_MAP: Record<string, ColorInfo> = {
  'BK': { name: 'Black', spanishName: 'Negro', hex: '#111111', family: 'black' },
  'BH0': { name: 'Boylston Grey Heather', spanishName: 'Gris Boylston Jaspeado', hex: '#6B7280', family: 'grey' },
  'CB6': { name: 'Cambridge Burgundy', spanishName: 'Borgoña Cambridge', hex: '#6B1D2F', family: 'burgundy' },
  'CB8': { name: 'Cambridge Burgundy Heather', spanishName: 'Borgoña Jaspeado', hex: '#581825', family: 'burgundy' },
  'CXP': { name: 'Crystal Pink', spanishName: 'Rosa Cristal', hex: '#F9A8D4', family: 'pink' },
  'LIN': { name: 'Linen', spanishName: 'Lino Natural', hex: '#E5D5C5', family: 'bone' },
  'DIV': { name: 'Dark Ivy', spanishName: 'Verde Ivy Oscuro', hex: '#2C4C3E', family: 'green' },
  'DIN': { name: 'Dark Ivy Heather', spanishName: 'Verde Ivy Jaspeado', hex: '#264236', family: 'green' },
  'WT': { name: 'White', spanishName: 'Blanco', hex: '#FFFFFF', family: 'bone' },
  'WM': { name: 'White Matte', spanishName: 'Blanco Mate', hex: '#F8FAFC', family: 'bone' },
  'LLA': { name: 'Lilac Air', spanishName: 'Lila Claro', hex: '#DDD6FE', family: 'pink' },
  'BB0': { name: 'Back Bay Blue', spanishName: 'Azul Back Bay', hex: '#1E3A8A', family: 'navy' },
  'LMR': { name: 'Light Mushroom', spanishName: 'Champiñón Claro', hex: '#D6C7B2', family: 'bone' },
  'DSO': { name: 'Dark Soil', spanishName: 'Tierra Oscura', hex: '#5A3825', family: 'burgundy' },
  'DNT': { name: 'Dark Night', spanishName: 'Noche Oscura', hex: '#0F172A', family: 'navy' },
  'BG0': { name: 'Boylston Grey', spanishName: 'Gris Boylston', hex: '#9CA3AF', family: 'grey' },
  'DGD': { name: 'Dark Glide', spanishName: 'Gris Oscuro Glide', hex: '#374151', family: 'grey' },
  'AGA': { name: 'Angora', spanishName: 'Angora Crema', hex: '#EFECE6', family: 'bone' },
  'GLE': { name: 'Glide', spanishName: 'Gris Glide', hex: '#4B5563', family: 'grey' },
  'GML': { name: 'Boylston Grey Melange', spanishName: 'Gris Boylston Melange', hex: '#4B5563', family: 'grey' },
  'BM': { name: 'Black / Angora', spanishName: 'Negro con Angora', hex: '#1C1917', family: 'black' },
  'ACK': { name: 'Blacktop', spanishName: 'Asfalto Negro', hex: '#1E293B', family: 'black' },
  'BS6': { name: 'Bay State / Team Navy', spanishName: 'Azul Marino Bay State', hex: '#172554', family: 'navy' },
  'ABG': { name: 'Stucco', spanishName: 'Estuco', hex: '#D1D5DB', family: 'bone' },
  'LUP': { name: 'Lucent Pink', spanishName: 'Rosa Lucent', hex: '#F472B6', family: 'pink' },
  'LPK': { name: 'Lucent Pink Light', spanishName: 'Rosa Lucent Claro', hex: '#FBCFE8', family: 'pink' },
  'TN2': { name: 'Team Navy Heather', spanishName: 'Azul Marino Jaspeado', hex: '#1E3A5F', family: 'navy' },
  'TNV': { name: 'Team Navy', spanishName: 'Azul Marino Oficial', hex: '#0A192F', family: 'navy' },
  'AAX': { name: 'Cloud Blue', spanishName: 'Azul Nube', hex: '#93C5FD', family: 'blue' },
  'CB9': { name: 'Cloud Blue Heather', spanishName: 'Azul Nube Jaspeado', hex: '#7DD3FC', family: 'blue' },
  'IOX': { name: 'Iron Oxide', spanishName: 'Óxido de Hierro', hex: '#991B1B', family: 'burgundy' },
  'BKH': { name: 'Black Heather', spanishName: 'Negro Jaspeado', hex: '#262626', family: 'black' },
  'CAS': { name: 'Castlerock', spanishName: 'Gris Castlerock', hex: '#64748B', family: 'grey' },
  'KLP': { name: 'Kelp', spanishName: 'Verde Kelp', hex: '#3F6212', family: 'green' },
  'SST': { name: 'Sea Salt', spanishName: 'Sal Marina', hex: '#F1F5F9', family: 'bone' },
  'PEX': { name: 'Pear Extract', spanishName: 'Extracto de Pera', hex: '#84CC16', family: 'green' },
  'ERE': { name: 'Electric Red', spanishName: 'Rojo Eléctrico', hex: '#DC2626', family: 'red' },
  'MLT': { name: 'Linen Multi', spanishName: 'Lino Multicolor', hex: '#E2E8F0', family: 'bone' }
};

export const COLOR_MAP: Record<string, ColorInfo> = COLOR_INFO_MAP;

export function getColorDisplayName(code: string): string {
  return COLOR_INFO_MAP[code]?.spanishName || COLOR_INFO_MAP[code]?.name || code;
}

export function getColorFormattedLabel(code: string): string {
  const info = COLOR_INFO_MAP[code];
  if (!info) return code;
  return `${info.spanishName} (${code})`;
}

export function buildAllPresetLooks(products: Product[]): PresetLook[] {
  const footwearList = products.filter(p => (p.division || '').toUpperCase() === 'CALZADO');
  const apparelList = products.filter(p => (p.division || '').toUpperCase() === 'INDUMENTARIA');

  const fallbackProduct: Product = products[0];

  const findProductBySku = (sku?: string) => products.find(p => p.sku === sku);

  // 1. Official Campaign Looks (All 12 with their exact photography)
  const campaignConfigs = [
    {
      id: 'camp-look-1',
      isCampaignLook: true,
      campaignCode: 'Look 1',
      driver: 'RC',
      gender: 'FEMENINO',
      colorCode: 'CB6',
      title: 'Look 1 Campaña — RC Running Womens (CB6 / AGA)',
      description: 'Look 1 oficial de campaña H2-2027. Campera ultraligera RC Essential Packable en Borgoña Cambridge y crema, musculosa tejida RC Jacquard Graphic Tank en Angora y short RC Essential 3" con calzado Rebel Run v6.',
      layerSku: 'WJ71E177_CB6',
      topSku: 'WT71L5HM_AGA',
      bottomSku: 'WB61J868_CB6',
      footwearSku: 'WFCX2YO',
      marketingBadge: 'CAMPAÑA OFICIAL · LOOK 1',
      category: 'RUNNING',
      categories: ['RUNNING', 'PERFORMANCE'],
      photoWithLayer: '/src/assets/images/camp_look1_con_abrigo.jpg',
      photoSoloRemera: '/src/assets/images/camp_look1_solo_remera.jpg',
    },
    {
      id: 'camp-look-2',
      isCampaignLook: true,
      campaignCode: 'Look 2',
      driver: 'RC',
      gender: 'MASCULINO',
      colorCode: 'DIV',
      title: 'Look 2 Campaña — RC Running Mens (DIV / AGA)',
      description: 'Look 2 oficial de campaña H2-2027. Campera técnica RC Essential Packable en Verde Ivy Oscuro con chevron blanco y azul marino, remera RC Jacquard Graphic en Angora y short RC Essential 5" con calzado Rebel Run v6.',
      layerSku: 'MJ7122EQ_DIV',
      topSku: 'MT71I28M_AGA',
      bottomSku: 'MB6180TA_DIV',
      footwearSku: 'MFCX2BK',
      marketingBadge: 'CAMPAÑA OFICIAL · LOOK 2',
      category: 'RUNNING',
      categories: ['RUNNING', 'PERFORMANCE'],
      photoWithLayer: '/src/assets/images/camp_look2_con_abrigo.jpg',
      photoSoloRemera: '/src/assets/images/nb_look2_solo_remera_exact.jpg',
    },
    {
      id: 'camp-look-3',
      isCampaignLook: true,
      campaignCode: 'Look 3',
      driver: 'RC',
      gender: 'FEMENINO',
      colorCode: 'LUP',
      title: 'Look 3 Campaña — RC Running Womens (LUP / BG0)',
      description: 'Look 3 oficial de campaña H2-2027. Campera RC Essential Packable en Rosa Lucent, remera gráfica en azul marino y short RC Essential en gris Boylston.',
      layerSku: 'WJ71E177_LUP',
      topSku: 'WT72H7CQ_TN2',
      bottomSku: 'WB61J868_BG0',
      footwearSku: 'WFCX707',
      marketingBadge: 'CAMPAÑA OFICIAL · LOOK 3',
      category: 'RUNNING',
      categories: ['RUNNING', 'PERFORMANCE'],
      photoWithLayer: '/src/assets/images/camp_look3_con_abrigo.jpg',
      photoSoloRemera: '/src/assets/images/camp_look3_solo_remera.jpg',
    },
    {
      id: 'camp-look-4',
      isCampaignLook: true,
      campaignCode: 'Look 4',
      driver: 'RC',
      gender: 'MASCULINO',
      colorCode: 'BK',
      title: 'Look 4 Campaña — RC Running Mens (BK)',
      description: 'Look 4 oficial de campaña H2-2027. Remera RC Essential Graphic en negro jaspeado combinada con short RC Essential 5" en negro absoluto.',
      topSku: 'MT72Y28K_BKH',
      bottomSku: 'MB6180TA_BK',
      footwearSku: 'MFCX8HH',
      marketingBadge: 'CAMPAÑA OFICIAL · LOOK 4',
      category: 'RUNNING',
      categories: ['RUNNING', 'PERFORMANCE'],
      photoWithLayer: '/src/assets/images/camp_look4_exact.jpg',
      photoSoloRemera: '/src/assets/images/camp_look4_exact.jpg',
    },
    {
      id: 'camp-look-5',
      isCampaignLook: true,
      campaignCode: 'Look 5',
      driver: 'AC TRAINING',
      gender: 'FEMENINO',
      colorCode: 'BG0',
      title: 'Look 5 Campaña — AC Training Womens (BG0 / GLE)',
      description: 'Look 5 oficial de campaña H2-2027. Campera corta AC Cropped Woven en Gris Boylston con remera ajustada Trackside y short técnico.',
      layerSku: 'WJ72F8ZQ_BG0',
      topSku: 'WT72D069_GLE',
      bottomSku: 'WB71W5F7_BG0',
      footwearSku: 'WFCX2YO',
      marketingBadge: 'CAMPAÑA OFICIAL · LOOK 5',
      category: 'TRAINING',
      categories: ['TRAINING', 'PERFORMANCE'],
      photoWithLayer: '/src/assets/images/camp_look5_con_abrigo.jpg',
      photoSoloRemera: '/src/assets/images/nb_look5_solo_remera_exact.jpg',
    },
    {
      id: 'camp-look-6',
      isCampaignLook: true,
      campaignCode: 'Look 6',
      driver: 'AC TRAINING',
      gender: 'MASCULINO',
      colorCode: 'CB6',
      title: 'Look 6 Campaña — AC Training & Trackside Mens (BK / CB6)',
      description: 'Look 6 oficial de campaña H2-2027. Remera técnica Trackside NB Dry en Negro con emblema oval NB frontal combinada con short AC Woven 7" en Borgoña Cambridge, junto a zapatillas New Balance 738 (U73870C).',
      topSku: 'MT72U2H4_BK',
      bottomSku: 'MB72C77M_CB6',
      footwearSku: 'U73870C',
      marketingBadge: 'CAMPAÑA OFICIAL · LOOK 6',
      category: 'TRAINING',
      categories: ['TRAINING', 'LIFESTYLE', 'PERFORMANCE'],
      photoWithLayer: '/src/assets/images/camp_look6_exact.jpg',
      photoSoloRemera: '/src/assets/images/camp_look6_exact.jpg',
    },
    {
      id: 'camp-look-7',
      isCampaignLook: true,
      campaignCode: 'Look 7',
      driver: 'Trackside',
      gender: 'FEMENINO',
      colorCode: 'LIN',
      title: 'Look 7 Campaña — Trackside & Athletics Womens (BK / LIN)',
      description: 'Look 7 oficial de campaña H2-2027. Jersey manga larga Trackside Tricot en negro con pantalón cargo tejido Athletics en Lino.',
      topSku: 'WT72M4UG_BK',
      bottomSku: 'WB72U7TG_LIN',
      footwearSku: 'U7382V4',
      marketingBadge: 'CAMPAÑA OFICIAL · LOOK 7',
      category: 'LIFESTYLE',
      categories: ['LIFESTYLE', 'ATHLETICS'],
      photoWithLayer: '/src/assets/images/camp_look7_exact.jpg',
      photoSoloRemera: '/src/assets/images/camp_look7_exact.jpg',
    },
    {
      id: 'camp-look-8',
      isCampaignLook: true,
      campaignCode: 'Look 8',
      driver: 'Trackside',
      gender: 'MASCULINO',
      colorCode: 'GML',
      title: 'Look 8 Campaña — Trackside Mens (GML / AGA / BK)',
      description: 'Look 8 oficial de campaña H2-2027. Campera Trackside Woven en gris Boylston jaspeado con remera Boxy en Angora y pantalón Trackside en negro.',
      layerSku: 'MJ71W9Y3_GML',
      topSku: 'MT72D0G7_AGA',
      bottomSku: 'MB71J8EW_BK',
      footwearSku: 'MFCX2BK',
      marketingBadge: 'CAMPAÑA OFICIAL · LOOK 8',
      category: 'LIFESTYLE',
      categories: ['LIFESTYLE', 'ATHLETICS'],
      photoWithLayer: '/src/assets/images/camp_look8_con_abrigo.jpg',
      photoSoloRemera: '/src/assets/images/nb_look8_solo_remera_exact.jpg',
    },
    {
      id: 'camp-look-9',
      isCampaignLook: true,
      campaignCode: 'Look 9',
      driver: 'Athletics Crafted',
      gender: 'FEMENINO',
      colorCode: 'DIV',
      title: 'Look 9 Campaña — Athletics Crafted Womens (DSO / DIV)',
      description: 'Look 9 oficial de campaña H2-2027. Chomba de rugby a rayas Athletics en Tierra Oscura con pantalón cargo Athletics en Verde Ivy.',
      topSku: 'WT72M5S0_DSO',
      bottomSku: 'WB72U7TG_DIV',
      footwearSku: 'WFCX2YO',
      marketingBadge: 'CAMPAÑA OFICIAL · LOOK 9',
      category: 'LIFESTYLE',
      categories: ['LIFESTYLE', 'ATHLETICS'],
      photoWithLayer: '/src/assets/images/camp_look9_exact_1792181648755.jpg',
      photoSoloRemera: '/src/assets/images/nb_look9_solo_remera_exact.jpg',
    },
    {
      id: 'camp-look-10',
      isCampaignLook: true,
      campaignCode: 'Look 10',
      driver: 'Athletics Crafted',
      gender: 'MASCULINO',
      colorCode: 'DNT',
      title: 'Look 10 Campaña — Athletics Crafted Mens (DNT / CB6)',
      description: 'Look 10 oficial de campaña H2-2027. Chomba de rugby a rayas Athletics en Dark Night combinada con short AC Woven en Borgoña Cambridge y zapatillas NB 738.',
      topSku: 'MT72E5X4_DNT',
      bottomSku: 'MB72C77M_CB6',
      footwearSku: 'U73870C',
      marketingBadge: 'CAMPAÑA OFICIAL · LOOK 10',
      category: 'LIFESTYLE',
      categories: ['LIFESTYLE', 'ATHLETICS'],
      photoWithLayer: '/src/assets/images/camp_look10_exact.jpg',
      photoSoloRemera: '/src/assets/images/camp_look10_exact.jpg',
    },
    {
      id: 'camp-look-ac-her',
      isCampaignLook: true,
      campaignCode: 'AC - For Her',
      driver: 'AC Bodywear Multisport',
      gender: 'FEMENINO',
      colorCode: 'DIV',
      title: 'Look AC For Her — Bodywear & Trackside (DIV / LIN)',
      description: 'Look oficial AC For Her. Buzo polar Trackside 1/4 zip en tono Lino con calza AC Legging 25" en Verde Ivy y calzado New Balance 738.',
      topSku: 'WT7110BR_LIN',
      bottomSku: 'WB72790F_DIV',
      footwearSku: 'U7381Y4',
      marketingBadge: 'CAMPAÑA OFICIAL · AC FOR HER',
      category: 'TRAINING',
      categories: ['TRAINING', 'LIFESTYLE'],
      photoWithLayer: '/src/assets/images/camp_ac_for_her_exact.jpg',
      photoSoloRemera: '/src/assets/images/camp_ac_for_her_exact.jpg',
    },
    {
      id: 'camp-look-on-off-court',
      isCampaignLook: true,
      campaignCode: 'On & Off Court',
      driver: 'Trackside',
      gender: 'FEMENINO',
      colorCode: 'DNT',
      title: 'Look On & Off Court — Trackside & AC Bodywear (DNT / CB6)',
      description: 'Look oficial On & Off Court. Campera rompevientos Trackside en Dark Night con top deportivo AC Train en rojo y short ajustado en Borgoña Cambridge.',
      layerSku: 'WJ71X8BL_DNT',
      topSku: 'WB61Q0QK_ERE',
      bottomSku: 'WB72W0V2_CB6',
      footwearSku: 'WFCX707',
      marketingBadge: 'CAMPAÑA OFICIAL · ON & OFF COURT',
      category: 'TENNIS',
      categories: ['TENNIS', 'LIFESTYLE'],
      photoWithLayer: '/src/assets/images/camp_on_off_court_con_abrigo.jpg',
      photoSoloRemera: '/src/assets/images/camp_on_off_court_solo_remera.jpg',
    }
  ];

  const looks: PresetLook[] = [];

  for (const cfg of campaignConfigs) {
    const layer = findProductBySku(cfg.layerSku);
    const top = findProductBySku(cfg.topSku) || fallbackProduct;
    const bottom = findProductBySku(cfg.bottomSku) || fallbackProduct;
    const footwear = findProductBySku(cfg.footwearSku) || footwearList[0] || fallbackProduct;
    const colorInfo = COLOR_INFO_MAP[cfg.colorCode] || { name: cfg.colorCode, spanishName: cfg.colorCode, hex: '#CF0A2C', family: 'other' };

    const totalPublicPrice = (cfg.layerSku && layer ? (layer.price || 0) : 0) + (top.price || 0) + (bottom.price || 0) + (footwear.price || 0);

    looks.push({
      id: cfg.id,
      driver: cfg.driver,
      category: cfg.category,
      categories: cfg.categories,
      gender: cfg.gender,
      colorCode: cfg.colorCode,
      title: cfg.title,
      description: cfg.description,
      layer: cfg.layerSku ? layer : undefined,
      top,
      bottom,
      footwear,
      colorInfo,
      totalPublicPrice,
      isLayered: Boolean(cfg.layerSku && layer),
      marketingBadge: cfg.marketingBadge,
      isCampaignLook: true,
      campaignCode: cfg.campaignCode,
      photoWithLayer: cfg.photoWithLayer ? `${cfg.photoWithLayer}?v=22` : undefined,
      photoSoloRemera: cfg.photoSoloRemera ? `${cfg.photoSoloRemera}?v=22` : undefined,
    });
  }

  return looks;
}

export function getRealisticMannequinImageForLook(look: PresetLook): string {
  if (look.photoWithLayer) return look.photoWithLayer;
  if (look.photoSoloRemera) return look.photoSoloRemera;
  return '/src/assets/images/camp_look1_con_abrigo.jpg';
}

/**
 * Returns a map of SKU -> PresetLook for all products that are part of a Campaign Look
 */
export function getCampaignLookMapBySku(products: Product[]): Map<string, PresetLook> {
  const looks = buildAllPresetLooks(products);
  const map = new Map<string, PresetLook>();
  for (const look of looks) {
    if (look.footwear?.sku) map.set(look.footwear.sku, look);
    if (look.top?.sku) map.set(look.top.sku, look);
    if (look.bottom?.sku) map.set(look.bottom.sku, look);
    if (look.layer?.sku) map.set(look.layer.sku, look);
  }
  return map;
}

