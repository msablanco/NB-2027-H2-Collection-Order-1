import React, { useState, useEffect } from 'react';
import { AppView, OrderDetails } from '../types';
import { ArrowLeft, Search, Package, Clock } from 'lucide-react';

interface OrderLookupViewProps {
  setView: (view: AppView) => void;
  setLastOrder: (order: OrderDetails) => void;
}

const OrderLookupView: React.FC<OrderLookupViewProps> = ({ setView, setLastOrder }) => {
  const [searchId, setSearchId] = useState('');
  const [localOrders, setLocalOrders] = useState<OrderDetails[]>([]);
  const [displayedOrders, setDisplayedOrders] = useState<OrderDetails[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const history = JSON.parse(localStorage.getItem('fila_orders_history') || '[]');
    setLocalOrders(history);
  }, []);

  const handleSearch = () => {
    setError(null);
    
    if (!searchId.trim()) {
      if (localOrders.length === 0) {
        setError('No tienes pedidos recientes guardados en este dispositivo.');
      } else {
        setDisplayedOrders(localOrders);
      }
      return;
    }

    const query = searchId.trim().toUpperCase();
    const filteredOrders = localOrders.filter(o => 
      o.orderId.toUpperCase().includes(query) || 
      o.customer.razonSocial.toUpperCase().includes(query) ||
      (o.periodOrderIds && (Object.values(o.periodOrderIds) as string[]).some(id => id.toUpperCase().includes(query)))
    );

    if (filteredOrders.length > 0) {
      const isExactMatch = localOrders.some(o => 
        o.orderId.toUpperCase() === query || 
        o.orderId.toUpperCase().split(', ').includes(query) ||
        (o.periodOrderIds && (Object.values(o.periodOrderIds) as string[]).some(id => id.toUpperCase() === query))
      );
      if (filteredOrders.length === 1 && isExactMatch) {
         // Direct exact match
         setLastOrder(filteredOrders[0]);
         setView(AppView.CONFIRMATION);
      } else {
         setDisplayedOrders(filteredOrders);
      }
    } else {
      setDisplayedOrders([]);
      setError('No se encontró ningún pedido con ese ID o Razón Social en este dispositivo.');
    }
  };

  const handleViewOrder = (order: OrderDetails) => {
    setLastOrder(order);
    setView(AppView.CONFIRMATION);
  };

  return (
    <div className="bg-white p-4 sm:p-8 rounded-lg shadow-xl max-w-4xl mx-auto min-h-[60vh]">
      <button 
        onClick={() => setView(AppView.PRODUCTS)}
        className="flex items-center text-[#CF0A2C] hover:text-[#B00824] transition-colors mb-6 font-medium"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Volver al Catálogo
      </button>

      <h1 className="text-3xl font-extrabold text-gray-800 mb-2">Recuperar Pedido</h1>
      <p className="text-gray-600 mb-8">Ingresa el ID del pedido (Ej. NB272C0001 o NB272I0001) o la Razón Social para volver a descargar o ver el resumen.</p>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#CF0A2C] shadow-sm text-lg uppercase"
            placeholder="ID del Pedido (Ej. NB272C0001) o Razón Social"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <button 
          onClick={handleSearch}
          className="bg-[#CF0A2C] hover:bg-[#B00824] text-white font-bold py-3 px-8 rounded-md transition-colors shadow-sm whitespace-nowrap"
        >
          Buscar
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-8 border border-red-200">
          {error}
        </div>
      )}

      {displayedOrders.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-500" />
            Pedidos encontrados
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {displayedOrders.map((order, index) => (
              <div 
                key={index}
                className="border border-gray-200 rounded-lg p-5 hover:border-red-300 hover:shadow-md transition-all cursor-pointer bg-gray-50"
                onClick={() => handleViewOrder(order)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="space-y-1">
                    {order.periodOrderIds && Object.keys(order.periodOrderIds).length > 0 ? (
                      Object.entries(order.periodOrderIds).map(([period, id]) => (
                        <div key={period} className="font-bold text-xs text-[#CF0A2C] flex items-center gap-1.5 font-mono">
                          <Package className="w-3.5 h-3.5 text-[#CF0A2C] shrink-0" />
                          <span>{period}: {id}</span>
                        </div>
                      ))
                    ) : (
                      <span className="font-bold text-sm text-[#CF0A2C] flex items-center gap-1.5 font-mono">
                        <Package className="w-4 h-4" />
                        {order.orderId}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded border shrink-0">
                    {order.date}
                  </span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><span className="font-semibold text-gray-700">Cliente:</span> {order.customer.razonSocial}</p>
                  <p><span className="font-semibold text-gray-700">Skus:</span> {order.items.length}</p>
                  <p><span className="font-semibold text-gray-700">Total:</span> ${order.totalPrice.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderLookupView;
