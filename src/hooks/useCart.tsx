import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      // TODO
      const stockItem = await api.get<Stock>(`stock/${productId}`);
      const currentProduct = cart.find(product => product.id === productId)

      if (currentProduct) {
        if (stockItem.data.amount === currentProduct.amount) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }
        //updateProductAmount already sets setCart and localStorage
        updateProductAmount({ productId, amount: currentProduct.amount + 1 });
      }
      else {
        const product = await api.get<Product>(`products/${productId}`);
        product.data.amount = 1;
        const filteredCart = [...cart, product.data]
        setCart(filteredCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(filteredCart))
      }
    } catch {
      // TODO
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
      if (cart.find(product => productId === product.id)) {
        const filteredCart = cart.filter(product => product.id !== productId)
        setCart(filteredCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(filteredCart))
      }
      else {
        throw new Error('Product does not exist');
      }
    } catch {
      // TODO
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
      if (amount <= 0) {
        return;
      }
      const stockItem = await api.get<Stock>(`stock/${productId}`);
      const currentProduct = cart.find(product => product.id === productId)

      if (currentProduct) {
        if (stockItem.data.amount < amount) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }
        const updatedCart = cart.map(product => {
          if (productId === product.id) {
            product.amount = amount;
          }
          return product;
        })
        setCart(updatedCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart))
      }
      else {
        throw new Error('Product does not exist')
      }

    } catch {
      // TODO
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
