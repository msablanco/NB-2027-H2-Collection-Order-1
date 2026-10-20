import { CartItem, CustomerData, OrderDetails } from "../types";
import { createExcelBase64 } from "./excelService";
import { createPdfBase64 } from "./pdfService";
import { expandSizeRange } from "../utils/sizeCurveHelper";
import { getCleanProductColor } from "../utils/colorHelper";
import { safeGetItem, safeSetItem, safeGetJSON } from "../utils/storage";

const GOOGLE_SHEET_API_URL = 'https://script.google.com/macros/s/AKfycbyxAbFj4OufAiYhHfjXKwD_7ZbXwtXUEP7w74RRpa67p8o5jdnhPcPWu_JdbVxPnaotLg/exec';

const parseCurveAndSizes = (sizeRange: string, curve: string): { size: string; units: number }[] => {
    const sizes = expandSizeRange(sizeRange);
    const curveUnits = (curve || '').split('-').map(Number);

    if (sizes.length === 0 || curveUnits.some(isNaN)) {
        return [];
    }

    const minLength = Math.min(sizes.length, curveUnits.length);
    const result = [];
    for (let i = 0; i < minLength; i++) {
        result.push({ size: sizes[i], units: curveUnits[i] });
    }

    return result;
};


export const isIndumentariaOrAccesorios = (item: { division?: string; category?: string }): boolean => {
    const div = (item.division || '').toUpperCase().trim();
    const cat = (item.category || '').toUpperCase().trim();
    return (
        div.includes('INDUMENTARIA') || 
        div.includes('ACCESORIO') || 
        div.includes('TEXTIL') || 
        div.includes('APPAREL') ||
        cat.includes('INDUMENTARIA') || 
        cat.includes('ACCESORIO') || 
        cat.includes('TEXTIL') || 
        cat.includes('APPAREL')
    );
};

export const getItemDivision = (item: { division?: string; category?: string }): 'CALZADO' | 'INDUMENTARIA' => {
    return isIndumentariaOrAccesorios(item) ? 'INDUMENTARIA' : 'CALZADO';
};

let inMemoryCalzadoSeq = 0;
let inMemoryIndumSeq = 0;

/**
 * Generates correlative Order IDs:
 * - Calzado: NB272C + 4 digits (e.g. NB272C0001, NB272C0002)
 * - Indumentaria y Accesorios: NB272I + 4 digits (e.g. NB272I0001, NB272I0002)
 */
export const getNextCorrelativeOrderId = (division: 'CALZADO' | 'INDUMENTARIA'): string => {
    const isCalzado = division === 'CALZADO';
    const prefix = isCalzado ? 'NB272C' : 'NB272I';
    const storageKey = isCalzado ? 'nb_order_seq_calzado' : 'nb_order_seq_indumentaria';
    
    let currentSeq = isCalzado ? inMemoryCalzadoSeq : inMemoryIndumSeq;
    try {
        const stored = safeGetItem(storageKey);
        if (stored) {
            const parsed = parseInt(stored, 10);
            if (!isNaN(parsed) && parsed > currentSeq) {
                currentSeq = parsed;
            }
        }
        
        // Also inspect orders history to prevent resetting if counter was cleared
        const history = safeGetJSON<any[]>('fila_orders_history', []);
        if (Array.isArray(history)) {
            const regex = new RegExp(`${prefix}(\\d{4,})`, 'i');
            for (const ord of history) {
                if (ord?.orderId) {
                    const matches = ord.orderId.match(new RegExp(`${prefix}(\\d{4,})`, 'gi'));
                    if (matches) {
                        for (const m of matches) {
                            const numMatch = m.match(new RegExp(`${prefix}(\\d{4,})`, 'i'));
                            if (numMatch && numMatch[1]) {
                                const num = parseInt(numMatch[1], 10);
                                if (!isNaN(num) && num > currentSeq) currentSeq = num;
                            }
                        }
                    }
                }
                if (ord?.periodOrderIds) {
                    for (const val of Object.values(ord.periodOrderIds)) {
                        if (typeof val === 'string') {
                            const match = val.match(regex);
                            if (match && match[1]) {
                                const num = parseInt(match[1], 10);
                                if (!isNaN(num) && num > currentSeq) currentSeq = num;
                            }
                        }
                    }
                }
            }
        }
    } catch (e) {
        console.warn("Could not inspect existing orders for correlative count:", e);
    }

    const nextSeq = currentSeq + 1;
    if (isCalzado) {
        inMemoryCalzadoSeq = nextSeq;
    } else {
        inMemoryIndumSeq = nextSeq;
    }
    
    try {
        safeSetItem(storageKey, nextSeq.toString());
    } catch (e) {
        console.warn("Could not save updated order sequence:", e);
    }

    return `${prefix}${nextSeq.toString().padStart(4, '0')}`;
};

/**
 * Tries to submit the order to the live API, with a fallback to local simulation.
 */
export const submitOrder = async (customerData: CustomerData, cartItems: CartItem[]): Promise<{ success: boolean; orderId: string; periodOrderIds?: Record<string, string>; error?: string }> => {
    try {
        console.log("Intentando enviar pedido a la API en vivo (desglosado por talle, periodo y division)...");
        
        const hasCalzado = cartItems.some(item => getItemDivision(item) === 'CALZADO');
        const hasIndumentaria = cartItems.some(item => getItemDivision(item) === 'INDUMENTARIA');
        const hasBothDivisions = hasCalzado && hasIndumentaria;

        // Group items by period and division
        const groupedOrders: Record<string, { period: string; division: 'CALZADO' | 'INDUMENTARIA'; items: CartItem[] }> = {};
        
        cartItems.forEach(item => {
            const division = getItemDivision(item);
            const divLabel = division === 'CALZADO' ? 'Calzado' : 'Indumentaria y Accesorios';

            if (item.deliveryPlan && item.deliveryPlan.length > 0) {
                item.deliveryPlan.forEach(plan => {
                    const hasUnits = Object.values(plan.sizeBreakdown).some(u => u > 0);
                    if (hasUnits) {
                        const compositeKey = hasBothDivisions 
                            ? `${plan.period} (${divLabel})` 
                            : `${plan.period}`;
                        
                        if (!groupedOrders[compositeKey]) {
                            groupedOrders[compositeKey] = {
                                period: plan.period,
                                division: division,
                                items: []
                            };
                        }
                        
                        // For the grouped item, we only care about this specific size breakdown
                        groupedOrders[compositeKey].items.push({
                            ...item,
                            sizeBreakdown: plan.sizeBreakdown
                        });
                    }
                });
            } else {
                // Fallback for items without a delivery plan
                const compositeKey = hasBothDivisions 
                    ? `General (${divLabel})` 
                    : `General`;
                
                if (!groupedOrders[compositeKey]) {
                    groupedOrders[compositeKey] = {
                        period: 'General',
                        division: division,
                        items: []
                    };
                }
                
                groupedOrders[compositeKey].items.push(item);
            }
        });

        // Prepare Order IDs per period/division
        const periodOrderIds: Record<string, string> = {};
        const allRows: any[] = [];
        const allItems: CartItem[] = [];

        // Generate unique correlative Order IDs for each period/division
        Object.entries(groupedOrders).forEach(([groupKey, groupDetails]) => {
            periodOrderIds[groupKey] = getNextCorrelativeOrderId(groupDetails.division);
        });

        Object.entries(groupedOrders).forEach(([groupKey, details]) => {
            const periodOrderId = periodOrderIds[groupKey];
            
            details.items.forEach(item => {
                const sizeBreakdown = item.sizeBreakdown || {};
                let commentText = item.comment || '';
                let ratingValue = item.rating && item.rating > 0 ? item.rating.toString() : '';
                const { colorCode: cleanColorCode, colorDescription: cleanColorDesc } = getCleanProductColor(item);

                if (Object.keys(sizeBreakdown).length === 0) {
                    const unitsNum = item.quantity * (item.unitsPerCurve || 1);
                    if (unitsNum > 0) {
                        allRows.push({
                            'Fecha de Carga': new Date().toLocaleString('es-AR'),
                            'Division': item.division || (getItemDivision(item) === 'CALZADO' ? 'CALZADO' : 'INDUMENTARIA Y ACCESORIOS'),
                            'Disciplina': item.category,
                            'Genero': item.gender,
                            'Pedido': periodOrderId,
                            'Fecha de Entrega': details.period,
                            'Producto': item.productCode,
                            'Modelo': item.model,
                            'Descripcion': item.name,
                            'Codigo Color': cleanColorCode,
                            'Descripcion de color': cleanColorDesc,
                            'Talle': item.sizeRange || 'General',
                            'Unidades': unitsNum,
                            'CUIT': customerData.cuit,
                            'Razon Social': customerData.razonSocial,
                            'Direccion de entrega': customerData.deliveryAddress,
                            'Nombre de solicitante': customerData.solicitantName,
                            'Email': customerData.email,
                            'Telefono': customerData.phone,
                            'Observaciones': customerData.observations || '',
                            'Favoritos': safeGetJSON<number[]>('fila_favorites', []).includes(item.id) ? 'Sí' : 'No',
                            'Comentarios de producto': commentText,
                            'Valoracion': ratingValue,
                            'Vendedor': customerData.vendedor || customerData.salesRepEmail || '',
                            'Importe Neto': unitsNum * item.wholesalePrice,
                        });
                    }
                } else {
                    Object.entries(sizeBreakdown).forEach(([size, units]) => {
                        const unitsNum = Number(units);
                        if (unitsNum > 0) {
                            allRows.push({
                                'Fecha de Carga': new Date().toLocaleString('es-AR'),
                                'Division': item.division || (getItemDivision(item) === 'CALZADO' ? 'CALZADO' : 'INDUMENTARIA Y ACCESORIOS'),
                                'Disciplina': item.category,
                                'Genero': item.gender,
                                'Pedido': periodOrderId,
                                'Fecha de Entrega': details.period,
                                'Producto': item.productCode,
                                'Modelo': item.model,
                                'Descripcion': item.name,
                                'Codigo Color': cleanColorCode,
                                'Descripcion de color': cleanColorDesc,
                                'Talle': size,
                                'Unidades': unitsNum,
                                'CUIT': customerData.cuit,
                                'Razon Social': customerData.razonSocial,
                                'Direccion de entrega': customerData.deliveryAddress,
                                'Nombre de solicitante': customerData.solicitantName,
                                'Email': customerData.email,
                                'Telefono': customerData.phone,
                                'Observaciones': customerData.observations || '',
                                'Favoritos': safeGetJSON<number[]>('fila_favorites', []).includes(item.id) ? 'Sí' : 'No',
                                'Comentarios de producto': commentText,
                                'Valoracion': ratingValue,
                                'Vendedor': customerData.vendedor || customerData.salesRepEmail || '',
                                'Importe Neto': unitsNum * item.wholesalePrice,
                            });
                        }
                    });
                }
                allItems.push(item);
            });
        });

        const masterOrderId = Object.values(periodOrderIds).join(', ');
        
        // Prepare descriptive string for UI display: "Periodo: ID | Periodo: ID"
        const descriptiveOrderId = Object.entries(periodOrderIds)
            .map(([groupKey, id]) => {
                const period = groupedOrders[groupKey].period;
                return `${period}: ${id}`;
            })
            .join(' | ');

        // OrderDetails for document generation for the consolidated order
        const orderDetails: OrderDetails = {
            orderId: masterOrderId,
            periodOrderIds: periodOrderIds, // Pass the period IDs mapping
            customer: customerData,
            items: cartItems,
            totalPrice: cartItems.reduce((total, item) => {
                let units = 0;
                if (item.deliveryPlan && item.deliveryPlan.length > 0) {
                    item.deliveryPlan.forEach(plan => {
                        units += Object.values(plan.sizeBreakdown).reduce((sum, u) => sum + Number(u), 0);
                    });
                } else {
                    units = Object.values(item.sizeBreakdown || {}).reduce((sum, u) => sum + Number(u), 0);
                }
                return total + (item.wholesalePrice * units);
            }, 0),
            date: new Date().toLocaleDateString('es-AR')
        };

        let base64Excel = '';
        let base64Pdf = '';
        try {
            base64Excel = await createExcelBase64(orderDetails);
        } catch (err) {
            console.warn("No se pudo generar archivo Excel base64 para adjunto:", err);
        }
        try {
            base64Pdf = await createPdfBase64(orderDetails);
        } catch (err) {
            console.warn("No se pudo generar archivo PDF base64 para adjunto:", err);
        }

        const payload = {
            action: 'submitOrder',
            spreadsheetId: '18Q2xsKaASSlKAh4IjZ0XYGmiRWYoBDYHfR1sIGf2rUA',
            sheetId: '18Q2xsKaASSlKAh4IjZ0XYGmiRWYoBDYHfR1sIGf2rUA',
            customerEmail: customerData.email,
            salesRepEmail: customerData.salesRepEmail || '',
            vendedorEmail: customerData.salesRepEmail || '',
            vendedor: customerData.vendedor || customerData.salesRepEmail || '',
            adminEmail: 'mblanco@grupodass.com.ar',
            userEmail: 'mblanco@grupodass.com.ar',
            copyEmails: ['mblanco@grupodass.com.ar', customerData.salesRepEmail].filter(Boolean),
            customerName: customerData.razonSocial || customerData.solicitantName,
            orderId: masterOrderId,
            periodOrderIds: periodOrderIds,
            excelFileName: `Pedido_${masterOrderId.replace(/, /g, '_')}.xlsx`,
            excelFileBase64: base64Excel,
            pdfFileName: `Resumen_${masterOrderId.replace(/, /g, '_')}.pdf`,
            pdfFileBase64: base64Pdf,
            data: allRows
        };

        console.log(`Enviando pedido consolidado (ID: ${masterOrderId}) a la API Google Sheets / Apps Script...`);
        const response = await fetch(GOOGLE_SHEET_API_URL, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Respuesta de error del servidor:", errorText);
            throw new Error(`El servidor respondió con un error: ${response.status} ${response.statusText}`);
        }
        
        const responseText = await response.text();
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            console.error("La respuesta de la API no es un JSON válido. Respuesta recibida:", responseText);
            throw new Error("La respuesta del servidor no se pudo procesar.");
        }

        console.log(`Datos recibidos de la API para pedido ${masterOrderId}:`, data);

        if (!data.success) {
            console.error("La API devolvió una respuesta inesperada:", JSON.stringify(data, null, 2));
            throw new Error(data.error || "La API falló.");
        }

        return { 
            success: true, 
            orderId: descriptiveOrderId,
            periodOrderIds: periodOrderIds
        };

    } catch (error: any) {
        console.error("FALLO EL ENVÍO DEL PEDIDO A LA API EN VIVO:", error);
        
        // Return a structured error to the UI
        return { 
            success: false, 
            orderId: '', 
            error: error.message || 'Ocurrió un error desconocido al contactar la API.' 
        };
    }
};
