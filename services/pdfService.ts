import { OrderDetails } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getCachedImage } from '../components/TransparentImage';
import { getProxiedUrl } from '../components/mediaHelper';
import { getCleanProductColor } from '../utils/colorHelper';

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
                console.error("Error resizing image in pdfService:", e);
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

export const createPdfBase64 = async (order: OrderDetails): Promise<string> => {
    const doc = new jsPDF({ orientation: 'landscape' });
    
    const findOrderIdForPeriod = (p: string, item?: any) => {
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
        
        // 3. Try partial normalized match (handling custom keys with parenthesis/etc)
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

    doc.setFontSize(18);
    doc.text('Resumen de Pedidos', 14, 18);
    
    doc.setFontSize(11);
    let currentY = 26;
    
    if (order.periodOrderIds) {
        doc.text('Pedidos:', 14, currentY);
        currentY += 5;
        Object.entries(order.periodOrderIds).forEach(([period, id]) => {
            doc.text(`- Período ${period}: ${id}`, 18, currentY);
            currentY += 5;
        });
    } else {
        doc.text(`Pedido: ${order.orderId}`, 14, currentY);
        currentY += 6;
    }
    
    doc.text(`Fecha: ${order.date}`, 14, currentY);
    currentY += 5;
    doc.text(`Cliente: ${order.customer.razonSocial}`, 14, currentY);
    currentY += 5;
    doc.text(`CUIT: ${order.customer.cuit}`, 14, currentY);
    currentY += 5;
    doc.text(`Solicitante: ${order.customer.solicitantName}`, 14, currentY);
    currentY += 5;
    if (order.customer.vendedor) {
        doc.text(`Vendedor Asignado: ${order.customer.vendedor}`, 14, currentY);
        currentY += 5;
    }
    if (order.customer.observations) {
        const splitText = doc.splitTextToSize(`Observaciones: ${order.customer.observations}`, 260);
        doc.text(splitText, 14, currentY);
        currentY += (splitText.length * 5);
    }
    
    const tableColumn = [
        "Imagen", "PEDIDO", "PERIODO", "LINEA", "MODELO/COLOR", "MODELO", 
        "DESCRIPCION", "DESC. COLOR", "PCIO CONF.", "PCIO PUB.", 
        "TALLE", "CANT", "PCIO TOTAL", "Comentarios", "Valoracion"
    ];
    const tableRows: any[] = [];
    const imagesToEmbed: { rowIndex: number, base64: string | null, isFav: boolean }[] = [];
    
    let totalUnidadesGeneral = 0;
    let totalPrecioGeneral = 0;
    let rowIndex = 0;
    
    const favorites = JSON.parse(localStorage.getItem('fila_favorites') || '[]');
 
    // Group items by period
    for (const item of order.items) {
        let imgBase64: string | null = null;
        if (item.images && item.images.length > 0) {
            imgBase64 = await getBase64ImageFromUrl(item.images[0], false);
        }

        if (item.deliveryPlan && item.deliveryPlan.length > 0) {
            for (const plan of item.deliveryPlan) {
                const orderId = findOrderIdForPeriod(plan.period, item);
  
                for (const [size, unitsVal] of Object.entries(plan.sizeBreakdown)) {
                    const units = Number(unitsVal);
                    if (units > 0) {
                        const totalPrice = units * item.wholesalePrice;
                        totalUnidadesGeneral += units;
                        totalPrecioGeneral += totalPrice;
                        const isFav = favorites.includes(item.id);
                        
                        imagesToEmbed.push({ rowIndex: rowIndex, base64: imgBase64, isFav });
                        
                        tableRows.push([
                            '', // Image placeholder
                            orderId,
                            plan.period,
                            item.category,
                            item.sku,
                            item.model,
                            item.name,
                            getCleanProductColor(item).colorDescription,
                            `$${Math.floor(item.wholesalePrice)}`,
                            `$${Math.floor(item.price)}`,
                            size,
                            units,
                            `$${Math.floor(totalPrice)}`,
                            item.comment || '',
                            item.rating && item.rating > 0 ? `${item.rating}` : ''
                        ]);
                        rowIndex++;
                    }
                }
            }
        } else {
            // Fallback for items without delivery plan
            const orderId = order.orderId; // Master ID
            const period = 'General';
            const sizeBreakdown = item.sizeBreakdown || {};
            
            if (Object.keys(sizeBreakdown).length === 0) {
                const units = item.quantity * (item.unitsPerCurve || 1);
                if (units > 0) {
                    const totalPrice = units * item.wholesalePrice;
                    totalUnidadesGeneral += units;
                    totalPrecioGeneral += totalPrice;
                    const isFav = favorites.includes(item.id);
                    
                    imagesToEmbed.push({ rowIndex: rowIndex, base64: imgBase64, isFav });
                    
                    tableRows.push([
                        '', // Image placeholder
                        orderId,
                        period,
                        item.category,
                        item.sku,
                        item.model,
                        item.name,
                        getCleanProductColor(item).colorDescription,
                        `$${Math.floor(item.wholesalePrice)}`,
                        `$${Math.floor(item.price)}`,
                        item.sizeRange || 'General',
                        units,
                        `$${Math.floor(totalPrice)}`,
                        item.comment || '',
                        item.rating && item.rating > 0 ? `${item.rating}` : ''
                    ]);
                    rowIndex++;
                }
            } else {
                for (const [size, unitsVal] of Object.entries(sizeBreakdown)) {
                    const units = Number(unitsVal);
                    if (units > 0) {
                        const totalPrice = units * item.wholesalePrice;
                        totalUnidadesGeneral += units;
                        totalPrecioGeneral += totalPrice;
                        const isFav = favorites.includes(item.id);
                        
                        imagesToEmbed.push({ rowIndex: rowIndex, base64: imgBase64, isFav });
                        
                        tableRows.push([
                            '', // Image placeholder
                            orderId,
                            period,
                            item.category,
                            item.sku,
                            item.model,
                            item.name,
                            getCleanProductColor(item).colorDescription,
                            `$${Math.floor(item.wholesalePrice)}`,
                            `$${Math.floor(item.price)}`,
                            size,
                            units,
                            `$${Math.floor(totalPrice)}`,
                            item.comment || '',
                            item.rating && item.rating > 0 ? `${item.rating}` : ''
                        ]);
                        rowIndex++;
                    }
                }
            }
        }
    }

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: currentY + 5,
        styles: { fontSize: 6, cellPadding: 1, overflow: 'linebreak' },
        columnStyles: {
            0: { cellWidth: 15 },
            6: { cellWidth: 30 },
            13: { cellWidth: 20 },
            14: { cellWidth: 15 },
        },
        bodyStyles: { minCellHeight: 15 },
        didDrawCell: (data) => {
            if (data.column.index === 0 && data.cell.section === 'body') {
                const imgData = imagesToEmbed.find(img => img.rowIndex === data.row.index);
                if (imgData) {
                    if (imgData.base64) {
                        try {
                            const dim = 12;
                            const yPos = data.cell.y + (data.cell.height - dim) / 2;
                            const xPos = data.cell.x + (data.cell.width - dim) / 2;
                            doc.addImage(imgData.base64, 'PNG', xPos, yPos, dim, dim);
                        } catch (e) {
                            console.error('Error adding image to pdf', e);
                        }
                    }
                    if (imgData.isFav) {
                        doc.setFontSize(10);
                        doc.setTextColor(255, 0, 0); // Set color to red
                        doc.text('\u2764', data.cell.x + 1, data.cell.y + 4);
                        doc.setTextColor(0, 0, 0); // Reset color
                    }
                }
            }
        }
    });
    
    const finalY = (doc as any).lastAutoTable.finalY || 65;
    doc.text(`Total Unidades: ${totalUnidadesGeneral}`, 14, finalY + 10);
    doc.text(`Total Precio: $${Math.floor(totalPrecioGeneral)}`, 14, finalY + 16);
    
    // Get base64 string
    const dataUri = doc.output('datauristring');
    const base64 = dataUri.split(',')[1];
    return base64;
};;

