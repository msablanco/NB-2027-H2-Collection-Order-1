import './index.css';
import React, { Component, ReactNode, ErrorInfo } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { safeRemoveItem } from './utils/storage';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  props: Readonly<ErrorBoundaryProps>;
  state: ErrorBoundaryState = { hasError: false, error: null };

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    try {
      const msg = error ? (error.message || (typeof error === 'string' ? error : 'App error')) : 'Unknown error';
      console.error('App runtime error caught by ErrorBoundary:', msg, errorInfo);
    } catch {
      // safe fallback
    }
  }

  handleReset = () => {
    try {
      safeRemoveItem('fila_cart');
      safeRemoveItem('fila_favorites');
      safeRemoveItem('fila_reviews');
      safeRemoveItem('fila_customer_data');
      safeRemoveItem('fila_orders_history');
    } catch (e) {
      console.error(e);
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || 
        (typeof this.state.error === 'string' ? this.state.error : 'Ocurrió un error inesperado al renderizar.');
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full border border-gray-100">
            <div className="w-16 h-16 bg-red-100 text-[#E31B23] rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              !
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Error al iniciar el catálogo</h1>
            <p className="text-sm text-gray-600 mb-4">
              Se detectó un cambio en los datos del catálogo o datos almacenados previos.
            </p>
            {this.state.error && (
              <pre className="text-xs bg-gray-100 p-3 rounded text-left overflow-x-auto text-red-600 font-mono mb-6 max-h-32">
                {errorMessage}
              </pre>
            )}
            <button
              onClick={this.handleReset}
              className="w-full bg-[#E31B23] hover:bg-[#b91016] text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-md"
            >
              Actualizar Catálogo y Recargar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
