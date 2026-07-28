export type GuestCartItem = {
  productId: string;
  quantity: number;
  installedProductId?: string;
  type?: 'machine' | 'filter' | 'accessory' | 'service';
};
