/**
 * Helper to normalize and sanitize color codes and color descriptions.
 * Tanto en los archivos que se envían a clientes (Excel / PDF) como en los que
 * se cargan a Google Sheets: en el caso de calzado que no tengan informado
 * código de color ni descripción de color, deja la información vacía (''),
 * sin completarla con 'no aplica' ni con 'Colección H2-2027'.
 */

export const isNoAplicaOrColeccion = (val?: string | null): boolean => {
  if (!val) return true;
  const str = String(val).trim().toLowerCase();
  if (str === '') return true;
  return (
    str === 'no aplica' ||
    str === 'no-aplica' ||
    str === 'no_aplica' ||
    str === 'n/a' ||
    str === 'na' ||
    str === '-' ||
    str === '.' ||
    str === '0' ||
    str.includes('no aplica') ||
    str.includes('colección h2-2027') ||
    str.includes('coleccion h2-2027') ||
    str.includes('h2-2027')
  );
};

export const isCalzadoProduct = (item: { division?: string; category?: string }): boolean => {
  const div = (item.division || '').toUpperCase().trim();
  const cat = (item.category || '').toUpperCase().trim();
  
  const isIndumentariaOrAcc = (
    div.includes('INDUMENTARIA') ||
    div.includes('ACCESORIO') ||
    div.includes('TEXTIL') ||
    div.includes('APPAREL') ||
    cat.includes('INDUMENTARIA') ||
    cat.includes('ACCESORIO') ||
    cat.includes('TEXTIL') ||
    cat.includes('APPAREL')
  );

  return div === 'CALZADO' || !isIndumentariaOrAcc;
};

export const getCleanProductColor = (item: { division?: string; category?: string; colorCode?: string; colorDescription?: string }) => {
  const cleanVal = (val?: string | null): string => {
    if (!val) return '';
    const trimmed = String(val).trim();
    if (isNoAplicaOrColeccion(trimmed)) {
      return '';
    }
    return trimmed;
  };

  const code = cleanVal(item.colorCode);
  const desc = cleanVal(item.colorDescription);

  return {
    colorCode: code,
    colorDescription: desc
  };
};
