import * as ExcelJS from 'exceljs';
import { OrderDetails , CartItem } from '../types';
import { getCachedImage } from '../components/TransparentImage';
import { getProxiedUrl } from '../components/mediaHelper';
import { getCleanProductColor } from '../utils/colorHelper';
import { safeGetJSON } from '../utils/storage';

const resizeBase64Image = (base64Str: string, maxDim = 120): Promise<string> => {
    return new Promise((resolve) => {
        if (!base64Str || base64Str.length < 1000) {
            resolve(base64Str);
            return;
        }
        const img = new Image();
        img.onload = () => {
            try {
                const canvas = document.createElement("canvas");
                let width = img.width;
                let height = img.height;
                if (width > maxDim || height > maxDim) {
                    if (width > height) {
                        height = Math.round((height * maxDim) / width);
                        width = maxDim;
                    } else {
                        width = Math.round((width * maxDim) / height);
                        height = maxDim;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL("image/png"));
                } else {
                    resolve(base64Str);
                }
            } catch (e) {
                console.error("Error resizing image in excelService:", e);
                resolve(base64Str);
            }
        };
        img.onerror = () => {
            resolve(base64Str);
        };
        img.src = base64Str;
    });
};

const getBase64ImageFromUrl = async (imageUrl: string, stripPrefix: boolean = false): Promise<string | null> => {
    // 1. Optimize local placeholders to resolve immediately without network requests
    if (!imageUrl || imageUrl.includes('placeholder') || imageUrl.includes('via.placeholder.com') || imageUrl.includes('Sin+Imagen')) {
      const tinyPng = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
      if (stripPrefix) {
        return tinyPng.split(',')[1];
      }
      return tinyPng;
    }

    // 1. Check in-memory cache first (from TransparentImage)
    let cached = getCachedImage(imageUrl) || getCachedImage(getProxiedUrl(imageUrl));
    if (cached) {
      const resized = await resizeBase64Image(cached, 140);
      return stripPrefix ? (resized.includes(',') ? resized.split(',')[1] : resized) : resized;
    }

    // 2. Resolve image via media-proxy or direct URL
    const proxiedUrl = getProxiedUrl(imageUrl);
    const mediaProxyUrl = `/api/media-proxy?url=${encodeURIComponent(proxiedUrl)}`;

    // Try fetching binary blob through local proxy (same-origin, 100% CORS-safe in all browsers/iframes)
    try {
      const resp = await fetch(mediaProxyUrl);
      if (resp.ok) {
        const blob = await resp.blob();
        if (blob && blob.size > 100) {
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          if (dataUrl) {
            const resized = await resizeBase64Image(dataUrl, 140);
            return stripPrefix ? (resized.includes(',') ? resized.split(',')[1] : resized) : resized;
          }
        }
      }
    } catch {
      // Continue to direct fetch fallback
    }

    // 3. Fallback: direct fetch from proxiedUrl
    try {
      const resp = await fetch(proxiedUrl, { mode: 'cors', referrerPolicy: 'no-referrer' });
      if (resp.ok) {
        const blob = await resp.blob();
        if (blob && blob.size > 100) {
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          if (dataUrl) {
            const resized = await resizeBase64Image(dataUrl, 140);
            return stripPrefix ? (resized.includes(',') ? resized.split(',')[1] : resized) : resized;
          }
        }
      }
    } catch {
      // Continue to Image element fallback
    }

    // 4. Fallback with Image element
    const imgData = await new Promise<string | null>((resolve) => {
      const timeoutId = setTimeout(() => resolve(null), 3000);
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.referrerPolicy = 'no-referrer';
      img.onload = () => {
        clearTimeout(timeoutId);
        try {
          const canvas = document.createElement('canvas');
          canvas.width = Math.min(img.width || 120, 140);
          canvas.height = Math.min(img.height || 120, 140);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/png'));
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => {
        clearTimeout(timeoutId);
        resolve(null);
      };
      img.src = mediaProxyUrl;
    });

    if (imgData) {
      const resized = await resizeBase64Image(imgData, 140);
      return stripPrefix ? (resized.includes(',') ? resized.split(',')[1] : resized) : resized;
    }

    return null;
};

export const createExcelBuffer = async (order: OrderDetails): Promise<ExcelJS.Buffer> => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Pedido');

    const findOrderIdForPeriod = (p: string, item?: CartItem) => {
        if (!order.periodOrderIds) return order.orderId;
        const cleanP = p.trim().toLowerCase();
        const div = item ? ((item.division || '').toUpperCase().includes('INDUMENTARIA') || (item.division || '').toUpperCase().includes('ACCESORIO') ? 'indumentaria' : 'calzado') : null;

        if (div) {
            for (const [key, value] of Object.entries(order.periodOrderIds)) {
                const cleanKey = key.trim().toLowerCase();
                if (cleanKey.includes(cleanP) && cleanKey.includes(div)) {
                    return value;
                }
            }
        }
        
        // 1. Try exact match first
        if (order.periodOrderIds[p]) return order.periodOrderIds[p];
        
        // 2. Try exact normalized match
        for (const [key, value] of Object.entries(order.periodOrderIds)) {
            const cleanKey = key.trim().toLowerCase();
            if (cleanKey === cleanP) {
                return value;
            }
        }
        
        // 3. Try partial normalized match
        for (const [key, value] of Object.entries(order.periodOrderIds)) {
            const cleanKey = key.trim().toLowerCase();
            if (cleanKey.includes(cleanP) || cleanP.includes(cleanKey)) {
                return value;
            }
        }
        
        // 4. If there's only one period order ID, return it
        const values = Object.values(order.periodOrderIds);
        if (values.length === 1) return values[0];
        
        return order.orderId;
    };

    // Header info
    worksheet.addRow(['RESUMEN DE PEDIDO']);
    worksheet.addRow([]);
    
    if (order.periodOrderIds) {
        worksheet.addRow(['Pedidos por Período de Entrega:']);
        Object.entries(order.periodOrderIds).forEach(([period, id]) => {
            worksheet.addRow([`- Período ${period}`, id]);
        });
    } else {
        worksheet.addRow(['Pedidos', order.orderId]);
    }
    
    worksheet.addRow(['Fecha', order.date]);
    worksheet.addRow(['Cliente', order.customer.razonSocial]);
    worksheet.addRow(['CUIT', order.customer.cuit]);
    worksheet.addRow(['Solicitante', order.customer.solicitantName]);
    if (order.customer.vendedor) {
        worksheet.addRow(['Vendedor Asignado', `${order.customer.vendedor}${order.customer.salesRepEmail ? ' (' + order.customer.salesRepEmail + ')' : ''}`]);
    }
    worksheet.addRow(['Dirección', order.customer.deliveryAddress]);
    worksheet.addRow(['Email', order.customer.email]);
    worksheet.addRow(['Teléfono', order.customer.phone]);
    if (order.customer.observations) {
        worksheet.addRow(['Observaciones', order.customer.observations]);
    }
    worksheet.addRow([]);

    // Columns
    const headerRow = worksheet.addRow([
      'Imagen', 'PEDIDO', 'PERIODO ENTREGA', 'LINEA', 'GENERO', 'MODELO/COLOR', 'MODELO', 'PRODUCTO', 
      'DESCRIPCION', 'DESCRIPCION DE COLOR', 'PRECIO CONFIDENCIAL', 
      'PRECIO PUBLICO', 'TALLE', 'CANT X TALLE', 'PRECIO TOTAL', 'Comentarios', 'Valoracion', 'Segmentacion'
    ]);
    headerRow.font = { bold: true };

    let totalUnidadesGeneral = 0;
    let totalPrecioGeneral = 0;
    
    const favorites = safeGetJSON<number[]>('fila_favorites', []);

    // Group items by period
    const groupedByPeriod: Record<string, {item: CartItem, size: string, units: number, orderId: string, totalPrice: number}[]> = {};
    
    order.items.forEach(item => {
        if (item.deliveryPlan && item.deliveryPlan.length > 0) {
            item.deliveryPlan.forEach(plan => {
                const periodGroupId = `${plan.period}`;
                if (!groupedByPeriod[periodGroupId]) {
                    groupedByPeriod[periodGroupId] = [];
                }
                
                const orderId = findOrderIdForPeriod(plan.period, item);

                Object.entries(plan.sizeBreakdown).forEach(([size, units]) => {
                    const unitsNum = Number(units);
                    if (unitsNum > 0) {
                        const totalPrice = unitsNum * item.wholesalePrice;
                        groupedByPeriod[periodGroupId].push({
                            item,
                            size,
                            units: unitsNum,
                            orderId,
                            totalPrice
                        });
                    }
                });
            });
        } else {
            const periodGroupId = 'General';
            if (!groupedByPeriod[periodGroupId]) {
                groupedByPeriod[periodGroupId] = [];
            }
            const orderId = order.orderId;
            const sizeBreakdown = item.sizeBreakdown || {};
            if (Object.keys(sizeBreakdown).length === 0) {
                const unitsNum = item.quantity * (item.unitsPerCurve || 1);
                if (unitsNum > 0) {
                    const totalPrice = unitsNum * item.wholesalePrice;
                    groupedByPeriod[periodGroupId].push({
                        item,
                        size: item.sizeRange || 'General',
                        units: unitsNum,
                        orderId,
                        totalPrice
                    });
                }
            } else {
                Object.entries(sizeBreakdown).forEach(([size, units]) => {
                    const unitsNum = Number(units);
                    if (unitsNum > 0) {
                        const totalPrice = unitsNum * item.wholesalePrice;
                        groupedByPeriod[periodGroupId].push({
                            item,
                            size,
                            units: unitsNum,
                            orderId,
                            totalPrice
                        });
                    }
                });
            }
        }
    });

    for (const [period, entries] of Object.entries(groupedByPeriod)) {
        for (const entry of entries) {
            const { item, size, units, orderId, totalPrice } = entry;
            const isFav = favorites.includes(item.id);
            totalUnidadesGeneral += units;
            totalPrecioGeneral += totalPrice;
            
            let commentText = item.comment || '';
            let ratingValue = item.rating && item.rating > 0 ? `${item.rating} Estrellas` : '';
            
            const row = worksheet.addRow([
                isFav ? '\u2764' : '',
                orderId,
                period,
                item.category,
                item.gender,
                item.sku,
                item.model,
                item.productCode,
                item.name,
                getCleanProductColor(item).colorDescription,
                Math.floor(item.wholesalePrice),
                Math.floor(item.price),
                size,
                units,
                Math.floor(totalPrice),
                commentText,
                ratingValue,
                item.segmentation || ''
            ]);

            row.height = 40;

            // Add image
            if (item.images && item.images.length > 0) {
                const base64 = await getBase64ImageFromUrl(item.images[0], true);
                if (base64) {
                    const imageId = workbook.addImage({
                        base64: base64,
                        extension: 'png',
                    });
                    worksheet.addImage(imageId, {
                        tl: { col: 0.1, row: row.number - 1 + 0.1 } as any,
                        br: { col: 0.9, row: row.number - 0.1 } as any,
                        editAs: 'oneCell'
                    });
                }
            }
        }
    }

    worksheet.addRow([]);
    const totalRow = worksheet.addRow([
        ...Array(12).fill(''),
        'Total Unidades:', totalUnidadesGeneral, 
        'Total Precio:', Math.floor(totalPrecioGeneral), '', '', ''
    ]);
    totalRow.font = { bold: true };

    // Auto-adjust column widths based on content
    worksheet.columns.forEach((col, index) => {
        let maxLen = 0;
        if (index === 0) {
            col.width = 15; // Set fixed width for 'Imagen' column
            return;
        }
        col.eachCell({ includeEmpty: true }, (cell) => {
            if (cell.value) {
                const valStr = cell.value.toString();
                const lines = valStr.split('\n');
                lines.forEach(line => {
                    if (line.length > maxLen) {
                        maxLen = line.length;
                    }
                });
            }
        });
        col.width = maxLen < 12 ? 12 : maxLen + 3;
    });

    return await workbook.xlsx.writeBuffer();
};

export const createCartExcelBuffer = async (cartItems: CartItem[], totalPrice: number): Promise<ExcelJS.Buffer> => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Carrito');

    worksheet.addRow(['CARRITO DE COMPRAS']);
    worksheet.addRow([]);
    worksheet.addRow(['Fecha', new Date().toLocaleDateString()]);
    worksheet.addRow([]);

    const headerRow = worksheet.addRow([
      'Imagen', 'LINEA', 'GENERO', 'MODELO/COLOR', 'MODELO', 'PRODUCTO', 
      'DESCRIPCION', 'PRECIO CONFIDENCIAL', 
      'PRECIO PUBLICO', 'TALLE', 'CURVA', 'CANT X CURVA', 'Cant. Curvas', 'Total Unidades', 'Precio Total', 'Segmentacion'
    ]);
    headerRow.font = { bold: true };

    let totalUnidadesGeneral = 0;

    for (let i = 0; i < cartItems.length; i++) {
        const item = cartItems[i];
        const totalUnidades = item.quantity * item.unitsPerCurve;
        totalUnidadesGeneral += totalUnidades;
        const totalPrecio = totalUnidades * item.wholesalePrice;
        
        const row = worksheet.addRow([
            '', // Placeholder for image
            item.category,
            item.gender,
            item.sku,
            item.model,
            item.productCode,
            item.name,
            Math.floor(item.wholesalePrice),
            Math.floor(item.price),
            item.sizeRange,
            item.curve,
            item.unitsPerCurve,
            item.quantity,
            totalUnidades,
            Math.floor(totalPrecio),
            item.segmentation || ''
        ]);

        row.height = 40;

        if (item.images && item.images.length > 0) {
            const base64 = await getBase64ImageFromUrl(item.images[0], true);
            if (base64) {
                const imageId = workbook.addImage({
                    base64: base64,
                    extension: 'png',
                });
                worksheet.addImage(imageId, {
                    tl: { col: 0.1, row: row.number - 1 + 0.1 } as any,
                    br: { col: 0.9, row: row.number - 0.1 } as any,
                    editAs: 'oneCell'
                });
            }
        }
    }

    worksheet.addRow([]);
    const totalRow = worksheet.addRow([
        ...Array(12).fill(''),
        'Total Unidades:', totalUnidadesGeneral, Math.floor(totalPrice), ''
    ]);
    totalRow.font = { bold: true };

    // Auto-adjust column widths based on content
    worksheet.columns.forEach((col, index) => {
        let maxLen = 0;
        if (index === 0) {
            col.width = 15; // Set fixed width for 'Imagen' column
            return;
        }
        col.eachCell({ includeEmpty: true }, (cell) => {
            if (cell.value) {
                const valStr = cell.value.toString();
                const lines = valStr.split('\n');
                lines.forEach(line => {
                    if (line.length > maxLen) {
                        maxLen = line.length;
                    }
                });
            }
        });
        col.width = maxLen < 12 ? 12 : maxLen + 3;
    });

    return await workbook.xlsx.writeBuffer();
};
export const createExcelBase64 = async (order: OrderDetails): Promise<string> => {
    const buffer = await createExcelBuffer(order);
    
    // Convert ArrayBuffer to base64
    let binary = '';
    const bytes = new Uint8Array(buffer as ArrayBuffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
};
