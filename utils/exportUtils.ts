import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CartItem } from '../types';
import { getProductSizes } from './sizeCurveHelper';
import { getCleanProductColor } from './colorHelper';

export const getBase64ImageFromUrl = async (imageUrl: string, stripPrefix: boolean = false): Promise<string | null> => {
    if (!imageUrl || imageUrl.includes('placeholder') || imageUrl.includes('via.placeholder.com') || imageUrl.includes('Sin+Imagen')) {
      return null;
    }

    const isLocal = imageUrl.startsWith('/') || imageUrl.startsWith('./') || !imageUrl.startsWith('http');
    const finalUrl = isLocal ? imageUrl : `/api/media-proxy?url=${encodeURIComponent(imageUrl)}`;

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      
      const timeout = setTimeout(() => resolve(null), 30000);

      img.onload = () => {
        clearTimeout(timeout);
        try {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(img, 0, 0);
                const dataURL = canvas.toDataURL('image/png');
                resolve(stripPrefix ? dataURL.replace(/^data:image\/(png|jpeg|jpg);base64,/, "") : dataURL);
            } else {
                resolve(null);
            }
        } catch (e) {
            console.error("Error drawing image to canvas", e);
            resolve(null);
        }
      };
      img.onerror = () => {
        clearTimeout(timeout);
        resolve(null);
      };
      img.src = finalUrl;
    });
};

export const generatePDF = async (exportItems: CartItem[], isFavorite: (id: number) => boolean, getReview: (id: string) => any) => {
    const doc = new jsPDF({ orientation: 'landscape' });
    
    doc.setFontSize(18);
    doc.text('Resumen de Productos', 14, 22);
    
    doc.setFontSize(11);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 32);
    
    const periods = ['Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const tableColumn = [
        "Imagen", "LINEA", "MODELO", "DESC.", "TALLE",
        "COD. COL", "DESC. COLOR", "PCIO CONF.", "PCIO PUB.",
        ...periods, "Total",
        ...periods.map(p => `Imp ${p}`), "Total Imp.",
        "Favorito", "Valoración", "Comentario"
    ];
    
    const tableRows: any[] = [];
    const imagesToEmbed: { base64: string | null }[] = [];
    
    let totalUnidadesGeneral = 0;
    
    for (const item of exportItems) {
        const sizes = getProductSizes(item);
 
        const imgBase64 = item.images && item.images.length > 0 ? await getBase64ImageFromUrl(item.images[0], false) : null;
        
        // Check if item has ANY distribution across ALL periods
        const itemHasDistribution = item.deliveryPlan && item.deliveryPlan.some(plan => 
            Object.values(plan.sizeBreakdown).some(qty => qty > 0)
        );
 
        sizes.forEach(size => {
            const periodQuantities = periods.map(p => item.deliveryPlan?.find(plan => plan.period === p)?.sizeBreakdown[size] || 0);
            const distributedTotalQ = periodQuantities.reduce((a, b) => a + b, 0);
            const cartTotalQ = item.sizeBreakdown?.[size] || 0;
            
            const finalTotalQ = itemHasDistribution ? distributedTotalQ : cartTotalQ;
            
            if (finalTotalQ > 0 || cartTotalQ > 0) {
                totalUnidadesGeneral += finalTotalQ;
                imagesToEmbed.push({ base64: imgBase64 });
                
                const review = getReview(item.id.toString());
                const periodAmounts = periodQuantities.map(q => `$${Math.floor(q * item.wholesalePrice)}`);
                
                const { colorCode: cleanColorCode, colorDescription: cleanColorDesc } = getCleanProductColor(item);
                
                tableRows.push([
                    '',
                    item.category,
                    item.model,
                    item.name,
                    size,
                    cleanColorCode,
                    cleanColorDesc,
                    `$${Math.floor(item.wholesalePrice)}`,
                    `$${Math.floor(item.price)}`,
                    ...(itemHasDistribution ? periodQuantities : periods.map(() => 'Sin definir')),
                    finalTotalQ,
                    ...(itemHasDistribution ? periodAmounts : periods.map(() => '$0')),
                    `$${Math.floor(finalTotalQ * item.wholesalePrice)}`,
                    isFavorite(item.id) ? 'Sí' : 'No',
                    review?.rating || 0,
                    review?.comment || ''
                ]);
            }
        });
    }

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 40,
        styles: { fontSize: 6, cellPadding: 1 },
        columnStyles: {
            3: { cellWidth: 35 },
            4: { halign: 'center' },
            5: { halign: 'center' },
            6: { halign: 'center' },
            7: { halign: 'center' },
            8: { halign: 'center' },
            9: { halign: 'center' },
            10: { halign: 'center' },
            11: { halign: 'center' },
            12: { halign: 'center' },
            13: { halign: 'center' },
            14: { halign: 'center' },
            15: { halign: 'center' },
            16: { halign: 'center' },
            17: { halign: 'center', cellWidth: 10 },
            18: { halign: 'center', cellWidth: 10 },
            19: { halign: 'center', cellWidth: 20 },
        },
        didDrawCell: (data) => {
            if (data.column.index === 0 && data.cell.section === 'body') {
                const imgData = imagesToEmbed[data.row.index];
                if (imgData && imgData.base64) {
                    try {
                        const dim = 10;
                        const yPos = data.cell.y + (data.cell.height - dim) / 2;
                        const xPos = data.cell.x + (data.cell.width - dim) / 2;
                        doc.addImage(imgData.base64, 'PNG', xPos, yPos, dim, dim);
                    } catch (e) {
                        console.error('Error adding image to pdf', e);
                    }
                }
            }
        }
    });
    
    const finalY = (doc as any).lastAutoTable.finalY || 65;
    doc.text(`Total Unidades: ${totalUnidadesGeneral}`, 14, finalY + 10);
    
    doc.save(`Listado_${new Date().toISOString().slice(0,10)}.pdf`);
};

export const generateExcel = async (exportItems: CartItem[], isFavorite: (id: number) => boolean, getReview: (id: string) => any) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Productos');

    worksheet.addRow(['LISTADO DE PRODUCTOS']);
    worksheet.addRow(['Fecha', new Date().toLocaleDateString()]);
    worksheet.addRow([]);

    const periods = ['Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const header = [
        'Imagen', 'LINEA', 'GENERO', 'MODELO', 'PRODUCTO', 'DESCRIPCION', 'TALLE',
        'COD. COL', 'DESC. COLOR', 'PCIO CONF.', 'PCIO PUB.',
        ...periods, 'Total',
        ...periods.map(p => `Imp ${p}`), 'Total Imp.',
        'Favorito', 'Valoración', 'Comentario', 'Segmentación'
    ];
    worksheet.addRow(header).font = { bold: true };

    let totalUnidadesGeneral = 0;

    for (const item of exportItems) {
        const sizes = getProductSizes(item);

        const imgBase64 = item.images && item.images.length > 0 ? await getBase64ImageFromUrl(item.images[0], true) : null;

        const itemHasDistribution = item.deliveryPlan && item.deliveryPlan.some(plan => 
            Object.values(plan.sizeBreakdown).some(qty => qty > 0)
        );
 
        sizes.forEach(size => {
            const periodQuantities = periods.map(p => item.deliveryPlan?.find(plan => plan.period === p)?.sizeBreakdown[size] || 0);
            const distributedTotalQ = periodQuantities.reduce((a, b) => a + b, 0);
            const cartTotalQ = item.sizeBreakdown?.[size] || 0;
            
            const finalTotalQ = itemHasDistribution ? distributedTotalQ : cartTotalQ;
            
            if (finalTotalQ > 0 || cartTotalQ > 0) {
                totalUnidadesGeneral += finalTotalQ;
                const review = getReview(item.id.toString());
                const periodAmounts = periodQuantities.map(q => Math.floor(q * item.wholesalePrice));
                
                const { colorCode: cleanColorCode, colorDescription: cleanColorDesc } = getCleanProductColor(item);

                const row = worksheet.addRow([
                    '',
                    item.category, item.gender, item.model, item.productCode, item.name, size,
                    cleanColorCode, cleanColorDesc, Math.floor(item.wholesalePrice), Math.floor(item.price),
                    ...(itemHasDistribution ? periodQuantities : periods.map(() => 'Sin definir')), finalTotalQ,                
                    ...(itemHasDistribution ? periodAmounts : periods.map(() => 0)),
                    Math.floor(finalTotalQ * item.wholesalePrice),
                    isFavorite(item.id) ? 'Sí' : 'No', review?.rating || 0, review?.comment || '',
                    item.segmentation || ''
                ]);
                
                row.alignment = { vertical: 'middle', horizontal: 'center' };
                row.height = 40;
                
                if (imgBase64) {
                    const imageId = workbook.addImage({
                        base64: imgBase64,
                        extension: 'png',
                    });
                    worksheet.addImage(imageId, {
                        tl: { col: 0.1, row: row.number - 1 + 0.1 } as any,
                        br: { col: 0.9, row: row.number - 0.1 } as any,
                        editAs: 'oneCell'
                    });
                }
            }
        });
    }

    worksheet.addRow([]);
    worksheet.addRow(['', '', '', '', '', '', '', '', 'Total:', totalUnidadesGeneral]).font = { bold: true };

    worksheet.columns.forEach((col, index) => {
        let maxLen = 0;
        if (index === 0) {
            col.width = 15;
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
        col.width = maxLen < 10 ? 10 : maxLen + 2;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Listado_${new Date().toISOString().slice(0,10)}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
};


export const generateFavoritesPDF = async (exportItems: CartItem[]) => {
    const doc = new jsPDF({ orientation: 'landscape' });
    
    doc.setFontSize(18);
    doc.text('Mis Favoritos', 14, 22);
    
    doc.setFontSize(11);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 32);
    
    const tableColumn = [
        "Imagen", "LINEA", "MODELO", "DESC.", "TALLE",
        "DESC. COLOR", "PCIO CONF.", "PCIO PUB."
    ];
    
    const tableRows: any[] = [];
    const imagesToEmbed: { base64: string | null }[] = [];
    
    for (const item of exportItems) {
        const imgBase64 = item.images && item.images.length > 0 ? await getBase64ImageFromUrl(item.images[0], false) : null;
        
        imagesToEmbed.push({ base64: imgBase64 });
        
        tableRows.push([
            '',
            item.category,
            item.model,
            item.name,
            item.sizeRange,
            getCleanProductColor(item).colorDescription,
            `$${Math.floor(item.wholesalePrice)}`,
            `$${Math.floor(item.price)}`
        ]);
    }

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 40,
        styles: { fontSize: 8, cellPadding: 2, minCellHeight: 15 },
        columnStyles: {
            0: { cellWidth: 15 },
            3: { cellWidth: 35 },
            4: { halign: 'center' },
            5: { halign: 'center' },
            6: { halign: 'center' },
            7: { halign: 'center' }
        },
        didDrawCell: (data) => {
            if (data.column.index === 0 && data.cell.section === 'body') {
                const imgData = imagesToEmbed[data.row.index];
                if (imgData && imgData.base64) {
                    try {
                        const dim = 12;
                        const yPos = data.cell.y + (data.cell.height - dim) / 2;
                        const xPos = data.cell.x + (data.cell.width - dim) / 2;
                        doc.addImage(imgData.base64, 'PNG', xPos, yPos, dim, dim);
                    } catch (e) {
                        console.error('Error adding image to pdf', e);
                    }
                }
            }
        }
    });
    
    doc.save(`Favoritos_${new Date().toISOString().slice(0,10)}.pdf`);
};

export const generateFavoritesExcel = async (exportItems: CartItem[]) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Favoritos');

    worksheet.addRow(['MIS FAVORITOS']);
    worksheet.addRow(['Fecha', new Date().toLocaleDateString()]);
    worksheet.addRow([]);

    const header = [
        'Imagen', 'LINEA', 'GENERO', 'MODELO', 'PRODUCTO', 'DESCRIPCION', 'TALLE',
        'DESC. COLOR', 'PCIO CONF.', 'PCIO PUB.', 'Segmentación'
    ];
    worksheet.addRow(header).font = { bold: true };

    for (const item of exportItems) {
        const imgBase64 = item.images && item.images.length > 0 ? await getBase64ImageFromUrl(item.images[0], true) : null;
        
        const row = worksheet.addRow([
            '',
            item.category, item.gender, item.model, item.productCode, item.name, item.sizeRange,
            getCleanProductColor(item).colorDescription, Math.floor(item.wholesalePrice), Math.floor(item.price),
            item.segmentation || ''
        ]);
        
        row.alignment = { vertical: 'middle', horizontal: 'center' };
        row.height = 40;
        
        if (imgBase64) {
            const imageId = workbook.addImage({
                base64: imgBase64,
                extension: 'png',
            });
            worksheet.addImage(imageId, {
                tl: { col: 0.1, row: row.number - 1 + 0.1 } as any,
                br: { col: 0.9, row: row.number - 0.1 } as any,
                editAs: 'oneCell'
            });
        }
    }

    worksheet.columns.forEach((col, index) => {
        let maxLen = 0;
        if (index === 0) {
            col.width = 15;
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
        col.width = maxLen < 12 ? 12 : maxLen + 2;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Favoritos_${new Date().toISOString().slice(0,10)}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
};
