import { PresetLook } from './lookPresetsHelper';

export type DuoThemeId = 
  | 'burgundy_trackside'
  | 'rugby_pink_bone'
  | 'ivy_green'
  | 'grey_melange'
  | 'cobalt_blue'
  | 'oyster_bone'
  | 'lifestyle'
  | 'running'
  | 'heritage';

export interface MannequinLookAssets {
  themeId: DuoThemeId;
  duoWindowImage: string;
  maleMannequinImage: string;
  femaleMannequinImage: string;
  badge: string;
  environmentTitle: string;
  environmentSubtitle: string;
  pedestalType: string;
  description: string;
}

export const THEME_MANNEQUIN_ASSETS: Record<DuoThemeId, MannequinLookAssets> = {
  burgundy_trackside: {
    themeId: 'burgundy_trackside',
    duoWindowImage: '/src/assets/images/nb_mannequins_burgundy_trackside_1792162395308.jpg',
    maleMannequinImage: '/src/assets/images/nb_mannequin_burgundy_male_1792162429107.jpg',
    femaleMannequinImage: '/src/assets/images/nb_mannequin_burgundy_female_1792162443799.jpg',
    badge: 'CÁPSULA TRACKSIDE BORGOÑA',
    environmentTitle: 'Maniquí Individual • Cápsula Trackside Borgoña & Bordo',
    environmentSubtitle: 'Rompeviento FZ con recortes borgoña, shorts coordinados, crop top técnico y calzado New Balance',
    pedestalType: 'Podio Arquitectónico Iluminado con Vidrio Reflectante',
    description: 'Montaje de alta fidelidad sobre maniquí atlético New Balance en conjunto Trackside borgoña.'
  },
  rugby_pink_bone: {
    themeId: 'rugby_pink_bone',
    duoWindowImage: '/src/assets/images/nb_mannequins_rugby_bone_pink_1792162412623.jpg',
    maleMannequinImage: '/src/assets/images/nb_mannequin_rugby_male_1792162458341.jpg',
    femaleMannequinImage: '/src/assets/images/nb_mannequin_bone_cream_single_1792168319096.jpg',
    badge: 'CÁPSULA RUGBY HERITAGE & ROSA PASTEL',
    environmentTitle: 'Maniquí Individual • Cápsula Polo Rugby & Tonos Hueso / Rosa',
    environmentSubtitle: 'Chomba Rugby a rayas anchas hueso/rosa, shorts relajados, calzas pastel y zapatillas retro 574s',
    pedestalType: 'Tarima de Madera Clara con Refuerzo de Acero Inoxidable',
    description: 'Exhibición visual boutique combinando polo rugby de archivo con paleta fresca de rosas pastel y tonos neutros hueso.'
  },
  ivy_green: {
    themeId: 'ivy_green',
    duoWindowImage: '/src/assets/images/nb_mannequins_ivy_green_window_1792162693069.jpg',
    maleMannequinImage: '/src/assets/images/retail_mannequin_male_1792107383556.jpg',
    femaleMannequinImage: '/src/assets/images/retail_mannequin_female_1792107396929.jpg',
    badge: 'CÁPSULA VERDE IVY & VARSITY TRACK',
    environmentTitle: 'Maniquí Individual • Cápsula Verde Bosque (DIV) & Herencia Varsity',
    environmentSubtitle: 'Chaqueta Varsity con monograma NB, cropped track jacket, calzas compresivas y siluetas 1906 / 574',
    pedestalType: 'Base de Hormigón Pulido y Tarima de Roble Natural',
    description: 'Composición deportiva universitaria en tonos verde bosque profundo con terminaciones de sastrería atlética.'
  },
  grey_melange: {
    themeId: 'grey_melange',
    duoWindowImage: '/src/assets/images/nb_mannequins_grey_melange_window_1792162705509.jpg',
    maleMannequinImage: '/src/assets/images/nb_mannequin_athletics_mens_grey_1792168289193.jpg',
    femaleMannequinImage: '/src/assets/images/nb_mannequin_athletics_black_womens_1792168271698.jpg',
    badge: 'CÁPSULA GRIS MELANGE HERITAGE',
    environmentTitle: 'Maniquí Individual • Cápsula French Terry Gris Melange (BH0)',
    environmentSubtitle: 'Hoodie estructurado gris melange, joggers relajados, cropped crewneck, biker shorts y 9060s',
    pedestalType: 'Bloques de Cemento Esculpido Iluminados desde el Suelo',
    description: 'Estética contemporánea urbana monocromo en escala de grises melange, reflejando el confort atemporal New Balance.'
  },
  cobalt_blue: {
    themeId: 'cobalt_blue',
    duoWindowImage: '/src/assets/images/nb_mannequins_burgundy_cobalt_real.jpg',
    maleMannequinImage: '/src/assets/images/nb_mannequin_cobalt_blue_single_1792168304619.jpg',
    femaleMannequinImage: '/src/assets/images/nb_mannequin_blue_female_1792157325313.jpg',
    badge: 'CÁPSULA COBALT BLUE',
    environmentTitle: 'Maniquí Individual • Gama Azul Cobalto & Trackside',
    environmentSubtitle: 'Rompeviento FZ con recortes navy/gris, crop top técnico, shorts y calzas de alta compresión',
    pedestalType: 'Plataforma de Cristal Iluminada con Perfil Metálico',
    description: 'Exhibición sobre maniquí deportivo en tarima de cristal iluminada, simulando caída anatómica de las prendas.'
  },
  oyster_bone: {
    themeId: 'oyster_bone',
    duoWindowImage: '/src/assets/images/nb_mannequins_bone_duo_window_1792157324099.jpg',
    maleMannequinImage: '/src/assets/images/nb_mannequin_bone_male_tee_1792157324017.jpg',
    femaleMannequinImage: '/src/assets/images/nb_mannequin_bone_female_tee_1792157322307.jpg',
    badge: 'MINIMAL LUXURY • CÁPSULA HUESO & CREMA',
    environmentTitle: 'Maniquí Individual • Gama Tonos Hueso (BG0) y Crema (WM)',
    environmentSubtitle: 'Remeras Heavyweight Oversized, shorts elásticos y joggers relaxed sobre podio de piedra natural',
    pedestalType: 'Podio Circular de Piedra Natural Iluminado',
    description: 'Estética contemporánea monocromática sobre maniquí de silueta escultórica, destacando el drapeado natural del algodón pesado.'
  },
  lifestyle: {
    themeId: 'lifestyle',
    duoWindowImage: '/src/assets/images/nb_dual_mannequins_lifestyle_1792110449370.jpg',
    maleMannequinImage: '/src/assets/images/athletics_black_mannequin_1792109815661.jpg',
    femaleMannequinImage: '/src/assets/images/nb_mannequin_athletics_black_womens_1792168271698.jpg',
    badge: 'URBAN LIFESTYLE',
    environmentTitle: 'Maniquí Individual • Core Black & Athleisure',
    environmentSubtitle: 'Hoodie French Terry con capucha estructurada, calza de tiro alto y zapatillas 550s / 9060s',
    pedestalType: 'Base de Madera Noble y Concreto Arquitectónico',
    description: 'Montaje premium sobre maniquí urbano, mostrando prendas de abrigo y conjuntos relaxed.'
  },
  running: {
    themeId: 'running',
    duoWindowImage: '/src/assets/images/nb_dual_mannequins_running_1792110450203.jpg',
    maleMannequinImage: '/src/assets/images/retail_mannequin_male_1792107383556.jpg',
    femaleMannequinImage: '/src/assets/images/nb_mannequin_blue_female_1792157325313.jpg',
    badge: 'PERFORMANCE CLUB • DAILY RUN & SPEED',
    environmentTitle: 'Maniquí Individual • Circuito de Competición',
    environmentSubtitle: 'Campera técnica ultraliviana, chaleco aerodinámico y calzado Fresh Foam 1080 / FuelCell',
    pedestalType: 'Pista de Tartán Rojo Oficial New Balance',
    description: 'Maniquí en pose ergonómica sobre pista de running, demostrando la ergonomía y respirabilidad del tejido técnico.'
  },
  heritage: {
    themeId: 'heritage',
    duoWindowImage: '/src/assets/images/nb_dual_mannequins_heritage_1792110451505.jpg',
    maleMannequinImage: '/src/assets/images/athletics_black_mannequin_1792109815661.jpg',
    femaleMannequinImage: '/src/assets/images/retail_mannequin_female_1792107396929.jpg',
    badge: 'COLLEGIATE ARCHIVE • HERITAGE 1906',
    environmentTitle: 'Maniquí Individual • Clásicos del Atletismo 1906',
    environmentSubtitle: 'Varsity jacket verde bosque con mangas crema, buzo fleece oversize y calzado retro 1906R',
    pedestalType: 'Piso de Pino Tea Macizo y Pared de Ladrillo Visto',
    description: 'Inspiración retro universitaria con maniquí de sastrería sobre piso de madera, celebrando el legado histórico New Balance.'
  }
};

/**
 * Intelligent matcher that assigns the best anatomical mannequin photography
 * to ANY selected PresetLook based on color, driver, category, and gender.
 */
export function getMannequinAssetsForLook(look: PresetLook): MannequinLookAssets {
  const code = (look.colorCode || '').toUpperCase();
  const name = (look.colorInfo?.name || '').toLowerCase();
  const spanish = (look.colorInfo?.spanishName || '').toLowerCase();
  const driver = (look.driver || '').toLowerCase();
  const family = look.colorInfo?.family;
  const title = (look.title || '').toLowerCase();
  const desc = (look.description || '').toLowerCase();
  const combined = `${code} ${name} ${spanish} ${driver} ${title} ${desc}`;

  // 1. Borgoña / Burgundy / Bordo / Wine
  if (
    ['BGU', 'BUR', 'WIN', 'BOR'].includes(code) ||
    /borgoña|burgundy|bordo|vino|maroon|wine/i.test(combined)
  ) {
    return THEME_MANNEQUIN_ASSETS.burgundy_trackside;
  }

  // 2. Rugby Stripe / Rosa / Pink / Blush
  if (
    ['CXP', 'LLA', 'LUP'].includes(code) ||
    /rugby|rosa|pink|blush|pastel|rayas|striped/i.test(combined)
  ) {
    return THEME_MANNEQUIN_ASSETS.rugby_pink_bone;
  }

  // 3. Verde Bosque / Ivy Green (DIV / BS6)
  if (
    ['DIV', 'BS6'].includes(code) ||
    family === 'green' ||
    /verde|ivy|forest|bosque|botanico/i.test(combined)
  ) {
    return THEME_MANNEQUIN_ASSETS.ivy_green;
  }

  // 4. Gris Melange / Heather Grey (BH0 / GML / CAS / ACK)
  if (
    ['BH0', 'GML', 'CAS', 'ACK'].includes(code) ||
    (family === 'grey' && !['BG0'].includes(code)) ||
    /melange|heather|gris melange|antracita|slate/i.test(combined)
  ) {
    return THEME_MANNEQUIN_ASSETS.grey_melange;
  }

  // 5. Cobalt Blue & Navy family
  if (
    ['CB6', 'TNV', 'BB0', 'AAX', 'DNT', 'TN2', 'DIN', 'GLE', 'DGD'].includes(code) ||
    family === 'navy' ||
    family === 'blue' ||
    /azul|blue|navy|cobalto|marino|indigo/i.test(combined)
  ) {
    return THEME_MANNEQUIN_ASSETS.cobalt_blue;
  }

  // 6. Bone / Oyster / Crema / Natural earthy tones
  if (
    ['BG0', 'WM', 'LIN', 'LMR', 'AGA', 'DSO', 'ABG', 'IOX'].includes(code) ||
    family === 'earth' ||
    /hueso|bone|crema|oyster|lino|avena|oatmeal|arena|stone/i.test(combined)
  ) {
    return THEME_MANNEQUIN_ASSETS.oyster_bone;
  }

  // 7. Performance / Running
  if (
    driver.includes('run') ||
    driver.includes('rc') ||
    driver.includes('speed') ||
    driver.includes('marathon') ||
    /running|daily run|1080|fuelcell/i.test(combined)
  ) {
    return THEME_MANNEQUIN_ASSETS.running;
  }

  // 8. Heritage Collegiate / Varsity 1906
  if (
    driver.includes('crafted') ||
    driver.includes('heritage') ||
    /1906|varsity|archive|collegiate/i.test(combined)
  ) {
    return THEME_MANNEQUIN_ASSETS.heritage;
  }

  // 9. Black / Charcoal / Monochromatic Core
  if (
    ['BK', 'BM', 'BKH'].includes(code) ||
    family === 'black' ||
    /negro|black|puro/i.test(combined)
  ) {
    return THEME_MANNEQUIN_ASSETS.lifestyle;
  }

  // Default to cobalt blue
  return THEME_MANNEQUIN_ASSETS.cobalt_blue;
}

/**
 * Automatically calculates the best matching store window theme ID
 * when user swaps or chooses products on the mannequin.
 */
export function resolveThemeForProducts(
  top?: { colorCode?: string; colorDescription?: string; name?: string; driver?: string; category?: string },
  bottom?: { colorCode?: string; colorDescription?: string; name?: string; driver?: string; category?: string },
  shoes?: { colorCode?: string; colorDescription?: string; name?: string; driver?: string; category?: string }
): DuoThemeId {
  const combined = `${top?.colorCode || ''} ${top?.colorDescription || ''} ${top?.name || ''} ${top?.driver || ''} ${bottom?.colorCode || ''} ${bottom?.colorDescription || ''} ${bottom?.name || ''} ${bottom?.driver || ''} ${shoes?.name || ''} ${shoes?.colorCode || ''}`.toLowerCase();
  const topCode = (top?.colorCode || '').toUpperCase();
  const bottomCode = (bottom?.colorCode || '').toUpperCase();

  // 1. Borgoña / Burgundy / Bordo / Wine
  if (
    ['BGU', 'BUR', 'WIN', 'BOR'].includes(topCode) ||
    ['BGU', 'BUR', 'WIN', 'BOR'].includes(bottomCode) ||
    /borgoña|burgundy|bordo|vino|maroon|wine/i.test(combined)
  ) {
    return 'burgundy_trackside';
  }

  // 2. Rugby Stripe / Rosa / Pink / Blush
  if (
    ['CXP', 'LLA', 'LUP'].includes(topCode) ||
    ['CXP', 'LLA', 'LUP'].includes(bottomCode) ||
    /rugby|rosa|pink|blush|pastel|rayas|striped/i.test(combined)
  ) {
    return 'rugby_pink_bone';
  }

  // 3. Verde Bosque / Ivy Green (DIV / BS6)
  if (
    ['DIV', 'BS6'].includes(topCode) ||
    ['DIV', 'BS6'].includes(bottomCode) ||
    /verde|ivy|forest|bosque|botanico/i.test(combined)
  ) {
    return 'ivy_green';
  }

  // 4. Gris Melange / Heather Grey (BH0 / GML / CAS / ACK)
  if (
    ['BH0', 'GML', 'CAS', 'ACK'].includes(topCode) ||
    ['BH0', 'GML', 'CAS', 'ACK'].includes(bottomCode) ||
    /melange|heather|gris melange|antracita|slate/i.test(combined)
  ) {
    return 'grey_melange';
  }

  // 5. Blue & Navy
  if (
    ['CB6', 'TNV', 'BB0', 'AAX', 'DNT', 'TN2', 'DIN', 'GLE', 'DGD'].includes(topCode) ||
    ['CB6', 'TNV', 'BB0', 'AAX', 'DNT', 'TN2', 'DIN', 'GLE', 'DGD'].includes(bottomCode) ||
    /azul|blue|navy|cobalto|marino|indigo/i.test(combined)
  ) {
    return 'cobalt_blue';
  }

  // 6. Bone, Crema, Oyster, Earth
  if (
    ['BG0', 'WM', 'LIN', 'LMR', 'AGA', 'DSO', 'ABG', 'IOX'].includes(topCode) ||
    ['BG0', 'WM', 'LIN', 'LMR', 'AGA', 'DSO', 'ABG', 'IOX'].includes(bottomCode) ||
    /hueso|bone|crema|oyster|lino|avena|beige|crudo|arcilla|terracota/i.test(combined)
  ) {
    return 'oyster_bone';
  }

  // 7. Performance / Running
  if (
    /running|daily run|speed|marathon|fuelcell|1080|rc/i.test(combined) ||
    /run/i.test(top?.driver || '') ||
    /run/i.test(bottom?.driver || '')
  ) {
    return 'running';
  }

  // 8. Heritage Varsity
  if (
    /heritage|crafted|1906|varsity/i.test(combined) ||
    /heritage/i.test(top?.driver || '')
  ) {
    return 'heritage';
  }

  // 9. Black / Grey Lifestyle Core
  if (
    ['BK', 'BM', 'BKH'].includes(topCode) ||
    ['BK', 'BM', 'BKH'].includes(bottomCode) ||
    /negro|black|puro/i.test(combined)
  ) {
    return 'lifestyle';
  }

  return 'cobalt_blue';
}

export interface MannequinPhotoResult {
  image: string;
  isFemale: boolean;
  label: string;
  themeTitle: string;
  themeDescription: string;
  hasLayerOption: boolean;
  layerImage: string;
  teeImage: string;
}

/**
 * Returns the exact photographic single mannequin matching the look's gender,
 * color palette, and whether the jacket/hoodie is currently on or off.
 */
export function getSingleMannequinImageForLook(
  look: PresetLook,
  showLayer: boolean = true
): MannequinPhotoResult {
  const isFemale = (look.gender || '').toUpperCase() === 'FEMENINO';
  const code = (look.colorCode || '').toUpperCase();
  const name = (look.colorInfo?.name || '').toLowerCase();
  const spanish = (look.colorInfo?.spanishName || '').toLowerCase();
  const driver = (look.driver || '').toLowerCase();
  const family = look.colorInfo?.family;
  const topText = `${look.top?.name || ''} ${look.top?.model || ''}`.toLowerCase();
  const hasLayer = Boolean(look.layer);
  const isTopHoodieOrJacket = /hoodie|buzo|campera|jacket|1\/4 zip|canguro|french terry/i.test(topText);

  // If the look has designated collection photos, use them directly!
  if (look.photoWithLayer && look.photoSoloRemera) {
    const selectedImage = hasLayer ? (showLayer ? look.photoWithLayer : look.photoSoloRemera) : (look.photoWithLayer || look.photoSoloRemera);
    return {
      image: selectedImage,
      isFemale,
      label: isFemale ? 'Maniquí Femenino' : 'Maniquí Masculino',
      themeTitle: look.title,
      themeDescription: look.description,
      hasLayerOption: hasLayer,
      layerImage: look.photoWithLayer,
      teeImage: look.photoSoloRemera
    };
  }

  // Palettes with both Layer (Hoodie/Jacket) and Tee (T-shirt/Shorts) photography:
  let layerImg = '';
  let teeImg = '';
  let themeTitle = '';
  let themeDescription = '';

  // 1. Burgundy / Borgoña
  if (['BGU', 'BUR', 'WIN', 'BOR'].includes(code) || /borgoña|burgundy|bordo|vino|maroon|wine/i.test(`${code} ${name} ${spanish}`)) {
    if (isFemale) {
      layerImg = '/src/assets/images/nb_look11_con_abrigo_exact.jpg';
      teeImg = '/src/assets/images/nb_look11_solo_remera_exact.jpg';
      themeTitle = 'Cápsula Borgoña Trackside • Maniquí Mujer';
      themeDescription = 'Conjunto New Balance borgoña con hoodie, remera, shorts lisos y zapatillas 740.';
    } else {
      layerImg = '/src/assets/images/nb_look12_con_abrigo_exact.jpg';
      teeImg = '/src/assets/images/nb_look12_solo_remera_exact.jpg';
      themeTitle = 'Cápsula Borgoña Trackside • Maniquí Hombre';
      themeDescription = 'Conjunto New Balance borgoña con campera trackside, remera New Balance, shorts lisos y zapatillas 740.';
    }
  }
  // 2. Verde Ivy / Forest Green
  else if (['DIV', 'BS6'].includes(code) || family === 'green' || /verde|ivy|forest|bosque/i.test(`${code} ${name} ${spanish}`)) {
    if (isFemale) {
      layerImg = '/src/assets/images/nb_look5_con_abrigo_exact.jpg';
      teeImg = '/src/assets/images/nb_look5_solo_remera_exact.jpg';
      themeTitle = 'Cápsula Verde Ivy (DIV) • Maniquí Mujer';
      themeDescription = 'Chaqueta New Balance verde ivy, calzas negras y zapatillas retro 740.';
    } else {
      layerImg = '/src/assets/images/nb_look6_con_abrigo_exact.jpg';
      teeImg = '/src/assets/images/nb_look6_solo_remera_exact.jpg';
      themeTitle = 'Cápsula Verde Ivy (DIV) • Maniquí Hombre';
      themeDescription = 'Chaqueta track New Balance verde ivy, shorts negros lisos y zapatillas 740.';
    }
  }
  // 3. Grey Melange
  else if (['BH0', 'GML', 'CAS', 'ACK'].includes(code) || (family === 'grey' && !['BG0'].includes(code)) || /gris|melange|heather/i.test(`${code} ${name} ${spanish}`)) {
    if (isFemale) {
      layerImg = '/src/assets/images/nb_look3_con_abrigo_exact.jpg';
      teeImg = '/src/assets/images/nb_look3_solo_remera_exact.jpg';
      themeTitle = 'Cápsula French Terry Gris Melange (BH0) • Maniquí Mujer';
      themeDescription = 'Hoodie gris melange New Balance, pantalón jogger largo y zapatillas 9060s.';
    } else {
      layerImg = '/src/assets/images/nb_look4_con_abrigo_exact.jpg';
      teeImg = '/src/assets/images/nb_look4_solo_remera_exact.jpg';
      themeTitle = 'Cápsula French Terry Gris Melange (BH0) • Maniquí Hombre';
      themeDescription = 'Buzo crewneck New Balance gris melange, pantalón jogger largo y zapatillas 574.';
    }
  }
  // 4. Blue / Navy / Cobalt
  else if (['CB6', 'TNV', 'BB0', 'AAX', 'DNT', 'TN2', 'DIN', 'GLE', 'DGD'].includes(code) || family === 'navy' || family === 'blue' || /azul|blue|navy|cobalto/i.test(`${code} ${name} ${spanish}`)) {
    if (isFemale) {
      layerImg = '/src/assets/images/nb_look7_con_abrigo_exact.jpg';
      teeImg = '/src/assets/images/nb_look7_solo_remera_exact.jpg';
      themeTitle = 'Cápsula Cobalt Blue & Navy • Maniquí Mujer';
      themeDescription = 'Campera deportiva New Balance azul cobalto, calzas largas de compresión y zapatillas running.';
    } else {
      layerImg = '/src/assets/images/nb_look8_con_abrigo_exact.jpg';
      teeImg = '/src/assets/images/nb_look8_solo_remera_exact.jpg';
      themeTitle = 'Cápsula Cobalt Blue & Navy • Maniquí Hombre';
      themeDescription = 'Rompeviento New Balance azul cobalto, pantalón track largo navy y zapatillas performance.';
    }
  }
  // 5. Bone / Crema / Oyster / Earth
  else if (['BG0', 'WM', 'LIN', 'LMR', 'AGA', 'DSO', 'ABG', 'IOX'].includes(code) || family === 'earth' || /hueso|bone|crema|oyster|lino|avena/i.test(`${code} ${name} ${spanish}`)) {
    if (isFemale) {
      layerImg = '/src/assets/images/nb_look9_con_abrigo_exact.jpg';
      teeImg = '/src/assets/images/nb_look9_solo_remera_exact.jpg';
      themeTitle = 'Cápsula Minimal Bone & Crema • Maniquí Mujer';
      themeDescription = 'Hoodie New Balance tono hueso, joggers largos y zapatillas clásicas 574.';
    } else {
      layerImg = '/src/assets/images/nb_look10_con_abrigo_exact.jpg';
      teeImg = '/src/assets/images/nb_look10_solo_remera_exact.jpg';
      themeTitle = 'Cápsula Minimal Bone & Crema • Maniquí Hombre';
      themeDescription = 'Hoodie New Balance tono crema, pantalón largo straight tan y zapatillas retro 550.';
    }
  }
  // 6. Rugby / Pink / Pastel
  else if (['CXP', 'LLA', 'LUP'].includes(code) || /rugby|rosa|pink|blush/i.test(`${code} ${name} ${spanish}`)) {
    if (isFemale) {
      layerImg = '/src/assets/images/nb_look9_con_abrigo_exact.jpg';
      teeImg = '/src/assets/images/nb_look9_solo_remera_exact.jpg';
      themeTitle = 'Cápsula Rugby Pastel • Maniquí Mujer';
      themeDescription = 'Top New Balance en tonos suaves hueso y rosa pastel sobre podio boutique.';
    } else {
      layerImg = '/src/assets/images/nb_look13_rugby_exact.jpg';
      teeImg = '/src/assets/images/nb_look13_rugby_exact.jpg';
      themeTitle = 'Cápsula Rugby Heritage • Maniquí Hombre';
      themeDescription = 'Chomba New Balance Rugby a rayas anchas con silueta atlética de archivo.';
    }
  }
  // 7. Core Black / Charcoal (Default)
  else {
    if (isFemale) {
      layerImg = '/src/assets/images/nb_look1_con_abrigo_exact.jpg';
      teeImg = '/src/assets/images/nb_look1_solo_remera_exact.jpg';
      themeTitle = 'Cápsula Core Black Athletics • Maniquí Mujer';
      themeDescription = 'Prendas New Balance negro azabache con pantalón wide leg y zapatillas 740 blancas.';
    } else {
      layerImg = '/src/assets/images/nb_look2_con_abrigo_exact.jpg';
      teeImg = '/src/assets/images/nb_look2_solo_remera_exact.jpg';
      themeTitle = 'Cápsula Core Black Athletics • Maniquí Hombre';
      themeDescription = 'Prendas New Balance negro core con shorts lisos y zapatillas 740 blancas.';
    }
  }

  // Active image selection:
  let selectedImage: string;
  if (hasLayer) {
    selectedImage = showLayer ? layerImg : teeImg;
  } else {
    // Look without separate layer:
    selectedImage = isTopHoodieOrJacket ? layerImg : teeImg;
  }

  return {
    image: selectedImage,
    isFemale,
    label: isFemale ? 'Maniquí Femenino' : 'Maniquí Masculino',
    themeTitle,
    themeDescription,
    hasLayerOption: hasLayer,
    layerImage: layerImg,
    teeImage: teeImg
  };
}



