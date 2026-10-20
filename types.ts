
export interface Product {
  id: number;
  sku: string;
  category: string;
  division?: string;
  gender: string;
  name: string;
  colorDescription?: string;
  price: number; // Public price
  wholesalePrice: number; // Wholesale price
  sizeRange: string;
  curve: string;
  unitsPerCurve: number;
  images: string[];
  videoUrl?: string; // Add this
  allowedPeriods?: string[]; // Allowed delivery periods from CSV (Enero, Febrero, etc.)
  // New fields for Google Sheet export
  productCode: string; // Corresponds to 'Producto' column (from source col E)
  model: string;       // Corresponds to 'Modelo' column (from source col D)
  colorCode?: string;   // Corresponds to 'Descripcion Color' column (from source col G)
  displayOrder: number;
  generalOrder: number;
  marketingLaunch: boolean;
  northStar?: boolean;
  segmentation?: string;
  status?: string;
  driver?: string;
  campaignLook?: string;
  silhouette?: string;
  composition?: string;
  technologies?: string;
  origin?: string;
  Line?: string;
  line?: string;
  sizes?: string[];
  date?: string;
  description?: string;
}

export interface DeliveryRequirement {
  period: string;
  sizeBreakdown: Record<string, number>;
}

export interface CartItem extends Product {
  quantity: number;
  comment?: string;
  rating?: number;
  isFavorite?: boolean;
  sizeBreakdown?: Record<string, number>; // Breakdown of quantity per size
  deliveryPlan?: DeliveryRequirement[]; // New field for bimonthly delivery
}

export enum AppView {
  PRODUCTS,
  CART,
  CHECKOUT,
  CONFIRMATION,
  INTERACTIVE_WALL,
  FAVORITES,
  FAVORITES_WALL,
  ORDERS,
  MANUAL,
  APPAREL_EXHIBITION,
}

// Data for a new customer being entered in the form
export interface CustomerData {
    cuit: string;
    razonSocial: string;
    deliveryAddress: string;
    email: string;
    vendedor?: string;
    salesRepEmail?: string;
    phone: string;
    solicitantName: string;
    observations?: string;
}

export interface OrderDetails {
  orderId: string;
  periodOrderIds?: Record<string, string>;
  customer: CustomerData;
  items: CartItem[];
  totalPrice: number;
  date: string;
}