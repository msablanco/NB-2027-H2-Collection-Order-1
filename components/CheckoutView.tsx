import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, Building2, MapPin, Mail, Phone, User, FileText, Send, UserCheck } from 'lucide-react';
import { AppView, CustomerData, OrderDetails } from '../types';
import { useCart } from '../context/CartContext';
import { submitOrder, getNextCorrelativeOrderId, getItemDivision } from '../services/googleSheetService';
import { safeGetJSON, safeSetJSON } from '../utils/storage';

export const SALES_REPRESENTATIVES = [
  { name: 'Camila De Almeida', email: 'cdealmeida@grupodass.com.ar' },
  { name: 'Marcelo Dornheim', email: 'mdornheim@grupodass.com.ar' },
  { name: 'German Menichelli', email: 'gmenichelli@grupodass.com.ar' }
];

interface CheckoutViewProps {
  setView: (view: AppView) => void;
  setLastOrder: (order: OrderDetails) => void;
  initialData?: any;
}

export const CheckoutView: React.FC<CheckoutViewProps> = ({ setView, setLastOrder, initialData }) => {
  const { cartItems, totalPrice, clearCart } = useCart();
  const [customer, setCustomer] = useState<CustomerData>(() => {
    const saved = safeGetJSON<any>('fila_customer_data', null);

    const initialVendedor = initialData?.vendedor || saved?.vendedor || SALES_REPRESENTATIVES[0].name;
    const initialRep = SALES_REPRESENTATIVES.find(r => r.name === initialVendedor) || SALES_REPRESENTATIVES[0];

    return {
      cuit: initialData?.cuit || saved?.cuit || '',
      razonSocial: initialData?.razonSocial || saved?.razonSocial || '',
      deliveryAddress: initialData?.deliveryAddress || saved?.deliveryAddress || '',
      email: initialData?.email || saved?.email || '',
      phone: initialData?.phone || saved?.phone || '',
      solicitantName: initialData?.solicitantName || saved?.solicitantName || '',
      observations: initialData?.observations || saved?.observations || '',
      vendedor: initialVendedor,
      salesRepEmail: initialData?.salesRepEmail || saved?.salesRepEmail || initialRep.email
    };
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setCustomer({ ...customer, [e.target.name]: e.target.value });
  };

  const handleVendedorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedName = e.target.value;
    const rep = SALES_REPRESENTATIVES.find(r => r.name === selectedName);
    setCustomer(prev => ({
      ...prev,
      vendedor: selectedName,
      salesRepEmail: rep ? rep.email : ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer.cuit || !customer.razonSocial || !customer.deliveryAddress || !customer.email || !customer.solicitantName || !customer.vendedor) {
      setErrorMsg('Por favor complete todos los campos obligatorios (*) incluyendo el vendedor asignado.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      console.log('Enviando pedido a Google Sheets y notificando por email...');
      const result = await submitOrder(customer, cartItems);

      if (!result.success && result.error) {
        console.warn('Advertencia en respuesta de Google Sheets API:', result.error);
      }

      const activePeriodOrderIds = result.periodOrderIds && Object.keys(result.periodOrderIds).length > 0
        ? result.periodOrderIds
        : {};

      const orderIdValues = Object.values(activePeriodOrderIds);
      const consolidatedOrderId = orderIdValues.length === 1 
        ? orderIdValues[0] 
        : (orderIdValues.length > 1 ? orderIdValues.join(', ') : (result.orderId || 'NB272-' + Date.now().toString().slice(-4)));

      const newOrder: OrderDetails = {
        orderId: consolidatedOrderId,
        periodOrderIds: activePeriodOrderIds,
        customer,
        items: [...cartItems],
        totalPrice,
        date: new Date().toLocaleDateString('es-AR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
      };

      // Persist customer profile for future auto-fill
      safeSetJSON('fila_customer_data', customer);

      // Persist order in local history for OrderLookupView & branch duplication
      const existingHistory = safeGetJSON<any[]>('fila_orders_history', []);
      const updatedHistory = [newOrder, ...existingHistory.filter((o: any) => o.orderId !== newOrder.orderId)];
      safeSetJSON('fila_orders_history', updatedHistory);

      setLastOrder(newOrder);
      clearCart();
      setIsSubmitting(false);
      setView(AppView.CONFIRMATION);
    } catch (err: any) {
      console.error('Error enviando el pedido:', err);
      setErrorMsg('Ocurrió un error al procesar y registrar el pedido: ' + (err?.message || 'Error de conexión'));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <button
        onClick={() => setView(AppView.CART)}
        className="inline-flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-gray-900 mb-6 cursor-pointer bg-white px-3 py-2 rounded-xl shadow-xs border border-gray-200"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver al Carrito</span>
      </button>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-[#111111] p-6 sm:p-8 border-b border-gray-800">
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white !text-white">
            Finalizar Pedido / Preventa H2-2027
          </h1>
          <p className="text-xs text-gray-300 mt-1.5">Complete los datos de facturación y entrega para procesar su orden.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {errorMsg && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-600">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-2">
                Razón Social *
              </label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  name="razonSocial"
                  value={customer.razonSocial}
                  onChange={handleChange}
                  placeholder="Ej: Deportes Sur S.A."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-xs font-medium focus:ring-2 focus:ring-[#CF0A2C] focus:border-transparent outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-2">
                CUIT / Identificación Fiscal *
              </label>
              <div className="relative">
                <FileText className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  name="cuit"
                  value={customer.cuit}
                  onChange={handleChange}
                  placeholder="Ej: 30-71234567-9"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-xs font-medium focus:ring-2 focus:ring-[#CF0A2C] focus:border-transparent outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-2">
                Nombre de Solicitante / Comprador *
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  name="solicitantName"
                  value={customer.solicitantName}
                  onChange={handleChange}
                  placeholder="Ej: Juan Pérez"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-xs font-medium focus:ring-2 focus:ring-[#CF0A2C] focus:border-transparent outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-2">
                Correo Electrónico de Contacto *
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={customer.email}
                  onChange={handleChange}
                  placeholder="ejemplo@empresa.com.ar"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-xs font-medium focus:ring-2 focus:ring-[#CF0A2C] focus:border-transparent outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-2">
                Teléfono / WhatsApp *
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  name="phone"
                  value={customer.phone}
                  onChange={handleChange}
                  placeholder="Ej: +54 11 4567-8900"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-xs font-medium focus:ring-2 focus:ring-[#CF0A2C] focus:border-transparent outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-2">
                Dirección de Entrega / Sucursal *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  name="deliveryAddress"
                  value={customer.deliveryAddress}
                  onChange={handleChange}
                  placeholder="Ej: Av. Corrientes 1234, CABA"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-xs font-medium focus:ring-2 focus:ring-[#CF0A2C] focus:border-transparent outline-none"
                  required
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Vendedor / Representante de Ventas Asignado *</span>
                <span className="text-[10px] text-gray-500 font-normal normal-case">Se enviará copia del pedido</span>
              </label>
              <div className="relative">
                <UserCheck className="absolute left-3.5 top-3 w-4 h-4 text-[#CF0A2C]" />
                <select
                  name="vendedor"
                  value={customer.vendedor || ''}
                  onChange={handleVendedorChange}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-900 bg-white focus:ring-2 focus:ring-[#CF0A2C] focus:border-transparent outline-none cursor-pointer appearance-none shadow-xs"
                  required
                >
                  <option value="" disabled>Seleccione un vendedor...</option>
                  {SALES_REPRESENTATIVES.map(rep => (
                    <option key={rep.email} value={rep.name}>
                      {rep.name} ({rep.email})
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-gray-500">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd" />
                  </svg>
                </div>
              </div>
              {customer.salesRepEmail && (
                <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-gray-600 bg-red-50/70 border border-red-100 rounded-lg px-2.5 py-1">
                  <span className="font-semibold text-gray-700">Email de notificación:</span>
                  <span className="font-bold text-[#CF0A2C]">{customer.salesRepEmail}</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-2">
              Observaciones o Comentarios del Pedido
            </label>
            <textarea
              name="observations"
              value={customer.observations}
              onChange={handleChange}
              rows={3}
              placeholder="Instrucciones especiales de entrega, transporte preferido, etc."
              className="w-full p-4 rounded-xl border border-gray-300 text-xs font-medium focus:ring-2 focus:ring-[#CF0A2C] focus:border-transparent outline-none"
            />
          </div>

          <div className="pt-6 border-t border-gray-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Total Preventa:</span>
              <span className="text-xl font-black text-gray-950">${totalPrice.toLocaleString('es-AR')}</span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || cartItems.length === 0}
              className="px-8 py-3.5 bg-[#CF0A2C] hover:bg-[#B00824] disabled:bg-gray-300 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer hover:scale-102 active:scale-98"
            >
              {isSubmitting ? (
                <span>Procesando...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Confirmar y Enviar Pedido</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckoutView;
