
import React, { useState } from 'react';
import { AppView, OrderDetails } from '../types';
import { submitOrder } from '../services/googleSheetService';
import { useCart } from '../context/CartContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as ExcelJS from 'exceljs';
import { getCachedImage } from './TransparentImage';
import { getProxiedUrl } from './mediaHelper';
import { getCleanProductColor } from '../utils/colorHelper';

interface OrderConfirmationViewProps {
  order: OrderDetails | null;
  setView: (view: AppView) => void;
  setLastOrder?: (order: OrderDetails) => void;
  setCheckoutInitialData?: (data: any) => void;
}

const OrderConfirmationView: React.FC<OrderConfirmationViewProps> = ({ order, setView, setLastOrder, setCheckoutInitialData }) => {
  const { restoreCart } = useCart();
  
  const startDuplicating = () => {
    if (order && setCheckoutInitialData) {
      restoreCart(order.items);
      setCheckoutInitialData({
        ...order.customer,
        deliveryAddress: '', // clear address for new branch
        observations: '' // clear observations
      });
      setView(AppView.CART);
    }
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

    // 2. Check local cache with both original and proxied URL keys
    let cached = getCachedImage(imageUrl) || getCachedImage(getProxiedUrl(imageUrl));
    if (cached) {
      return stripPrefix ? (cached.includes(',') ? cached.split(',')[1] : cached) : cached;
    }

    // 3. Resolve image via media-proxy (same-origin, 100% CORS safe)
    const proxiedUrl = getProxiedUrl(imageUrl);
    const mediaProxyUrl = `/api/media-proxy?url=${encodeURIComponent(proxiedUrl)}`;

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
            return stripPrefix ? (dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl) : dataUrl;
          }
        }
      }
    } catch {
      // Fallback to direct fetch
    }

    // 4. Fallback direct fetch
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
            return stripPrefix ? (dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl) : dataUrl;
          }
        }
      }
    } catch {
      // Fallback to Image element
    }

    // 5. Fallback Image element
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => resolve(null), 3000);
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.referrerPolicy = "no-referrer";
      img.onload = () => {
        clearTimeout(timeoutId);
        try {
          const canvas = document.createElement("canvas");
          canvas.width = Math.min(img.width || 120, 160);
          canvas.height = Math.min(img.height || 120, 160);
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const dataURL = canvas.toDataURL("image/png");
            resolve(stripPrefix ? dataURL.split(',')[1] : dataURL);
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
  };

  const generatePDF = async () => {
    if (!order) return;
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

    doc.setFontSize(18);
    doc.text('Resumen de Pedido', 14, 18);
    
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
        doc.text(`Vendedor: ${order.customer.vendedor}${order.customer.salesRepEmail ? ' (' + order.customer.salesRepEmail + ')' : ''}`, 14, currentY);
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
            const orderId = order.orderId;
            const sizeBreakdown = item.sizeBreakdown || {};
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
                        'General',
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
    
    doc.save(`Pedido_${order.orderId.replace(/, /g, '_')}.pdf`);
  };

  const generateExcel = async () => {
    if (!order) return;

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

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Pedido');

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
    worksheet.addRow(['Dirección', order.customer.deliveryAddress]);
    worksheet.addRow(['Email', order.customer.email]);
    worksheet.addRow(['Teléfono', order.customer.phone]);
    if (order.customer.vendedor) {
        worksheet.addRow(['Vendedor Asignado', `${order.customer.vendedor}${order.customer.salesRepEmail ? ' (' + order.customer.salesRepEmail + ')' : ''}`]);
    }
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
    const favorites = JSON.parse(localStorage.getItem('fila_favorites') || '[]');

    // Group items by period
    const groupedByPeriod: Record<string, {item: typeof order.items[0], size: string, units: number, orderId: string, totalPrice: number}[]> = {};
    
    order.items.forEach(item => {
        if (item.deliveryPlan && item.deliveryPlan.length > 0) {
            item.deliveryPlan.forEach(plan => {
                const periodGroupId = `${plan.period}`;
                if (!groupedByPeriod[periodGroupId]) {
                    groupedByPeriod[periodGroupId] = [];
                }
                
                const orderId = findOrderIdForPeriod(plan.period, item);

                Object.entries(plan.sizeBreakdown).forEach(([size, units]: [string, any]) => { units = Number(units);
                    if (units > 0) {
                        const totalPrice = units * item.wholesalePrice;
                        groupedByPeriod[periodGroupId].push({
                            item,
                            size,
                            units,
                            orderId,
                            totalPrice
                        });
                    }
                });
            });
        } else {
            // General fallback
            const periodGroupId = 'General';
            if (!groupedByPeriod[periodGroupId]) {
                groupedByPeriod[periodGroupId] = [];
            }
            const totalUnidades = item.deliveryPlan && item.deliveryPlan.length > 0
                ? item.deliveryPlan.reduce((acc, p) => acc + Object.values(p.sizeBreakdown).reduce((a: number, b: any) => a + Number(b), 0), 0)
                : item.quantity * item.unitsPerCurve;
            const totalPrice = totalUnidades * item.wholesalePrice;
            groupedByPeriod[periodGroupId].push({
                item,
                size: item.sizeRange,
                units: totalUnidades,
                orderId: order.orderId,
                totalPrice: totalPrice
            });
        }
    });

    for (const [period, entries] of Object.entries(groupedByPeriod)) {
        for (const entry of entries) {
            const { item, size, units, orderId, totalPrice } = entry;
            const isFav = favorites.includes(item.id);
            totalUnidadesGeneral += units;
            totalPrecioGeneral += totalPrice;
            
            let commentText = item.comment || '';
            let ratingValue = item.rating && item.rating > 0 ? `${item.rating}` : '';
            
            const row = worksheet.addRow([
                isFav ? '❤' : '',
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

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Pedido_${order.orderId.replace(/, /g, '_')}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="text-center bg-white p-12 rounded-lg shadow-xl max-w-2xl mx-auto">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
        </div>
      <h1 className="text-3xl font-extrabold text-gray-800 mb-4">Resumen del Pedido</h1>
      <p className="text-gray-600 mb-2">Aquí puedes ver los detalles de la solicitud y descargar los archivos.</p>
      {order && (
        <div className="bg-gray-100 p-4 rounded-lg my-6 inline-block w-full max-w-md">
            {order.periodOrderIds ? (
                <div className="text-left bg-white border border-gray-200 rounded-lg p-4 mb-4 font-sans max-w-md mx-auto">
                    <p className="text-gray-700 font-semibold mb-3 text-center border-b border-gray-200 pb-2">Pedidos Generados por Período:</p>
                    {Object.entries(order.periodOrderIds).map(([groupKey, id]) => {
                        const period = groupKey.split(' (')[0];
                        const note = groupKey.includes('(') ? groupKey.substring(groupKey.indexOf('(')).replace(/[()]/g, '') : '';
                        return (
                            <div key={groupKey} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0 text-sm">
                                <span className="text-gray-700 font-semibold flex items-center gap-1.5">
                                  <span>📦</span> Período {period}
                                  {note && (
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                      note.toLowerCase().includes('calzado')
                                        ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                        : 'bg-purple-100 text-purple-900 border border-purple-200'
                                    }`}>
                                      {note}
                                    </span>
                                  )}:
                                </span>
                                <span className="font-mono bg-red-50 text-[#CF0A2C] border border-red-200 px-2 py-0.5 rounded font-black text-xs">
                                  {id}
                                </span>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p className="text-gray-800 mb-4 text-center">
                    Tu número de pedido es: <strong className="font-mono text-[#CF0A2C]">{order.orderId}</strong>
                </p>
            )}
            
            <div className="bg-red-50 border border-red-200 text-gray-800 rounded-lg p-3 text-sm text-left mb-4 flex items-start gap-2.5">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 mt-0.5 text-[#CF0A2C] shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
                <div className="leading-relaxed">
                  <p className="font-medium mb-0.5">Notificación de envío</p>
                  <p className="text-xs text-gray-600">
                    Recibirás el pedido por correo en la cuenta informada (<span className="font-semibold text-gray-900">{order.customer.email}</span>)
                    {order.customer.vendedor && (
                      <> y con copia al vendedor asignado: <span className="font-semibold text-gray-900">{order.customer.vendedor}</span> {order.customer.salesRepEmail ? `(${order.customer.salesRepEmail})` : ''}</>
                    )}.
                  </p>
                </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
                <button
                    onClick={generatePDF}
                    className="flex-1 bg-red-50 text-red-700 border border-red-200 font-semibold py-2 px-4 rounded-md hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                    Descargar PDF
                </button>
                <button
                    onClick={generateExcel}
                    className="flex-1 bg-green-50 text-green-700 border border-green-200 font-semibold py-2 px-4 rounded-md hover:bg-green-100 transition-colors flex items-center justify-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                    Descargar Excel
                </button>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-3">¿Deseas cargar este mismo pedido para otra sucursal?</p>
                <button
                    onClick={startDuplicating}
                    className="w-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold py-2 px-4 rounded-md hover:bg-indigo-100 transition-colors"
                >
                    Duplicar Pedido
                </button>
            </div>
        </div>
      )}
      
      <div className="mt-8">
        <button
          onClick={() => {
            setView(AppView.PRODUCTS);
            if (setCheckoutInitialData) setCheckoutInitialData(null);
          }}
          className="bg-[#CF0A2C] text-white font-bold py-3 px-6 rounded-lg hover:bg-[#B00824] transition-colors duration-300"
        >
          Finalizar y Volver a la Tienda
        </button>
      </div>
    </div>
  );
};

export default OrderConfirmationView;

