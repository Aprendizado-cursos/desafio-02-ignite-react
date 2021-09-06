import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

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
        const storagedCart = localStorage.getItem("@RocketShoes:cart");

        if (storagedCart) {
            return JSON.parse(storagedCart);
        }

        return [];
    });

    const addProduct = async (productId: number) => {
        try {
            const copyCart = [...cart];
            const product = copyCart.find((p) => p.id === productId);

            const { data } = await api.get("/stock/" + productId);

            const amountInStock = data.amount;
            const currentAmount = product ? product.amount : 0;
            const amount = 1 + currentAmount;

            if (amount > amountInStock) {
                toast.error("Quantidade solicitada fora de estoque");
                return;
            }

            if (product) {
                product.amount = amount;
            } else {
                const { data } = await api.get("/products/" + productId);
                data.amount = amount;
                copyCart.push(data);
            }
            setCart(copyCart);
        } catch {
            toast.error("Erro na adição do produto");
        }
    };

    const removeProduct = (productId: number) => {
        try {
            const copyCart = [...cart];
            const cartWithoutProduct = copyCart.filter((p) => p.id !== productId);
            setCart(cartWithoutProduct);
        } catch {
            toast.error("Erro na remoção do produto");
        }
    };

    const updateProductAmount = async ({ productId, amount }: UpdateProductAmount) => {
        try {
            const { data } = await api.get("/stock/" + productId);
            const amountInStock = data.amount;

            const productInCart = cart.find(p => p.id === productId);

          

        } catch {
            toast.error("Erro na alteração de quantidade do produto");
        }
    };

    return (
        <CartContext.Provider value={{ cart, addProduct, removeProduct, updateProductAmount }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart(): CartContextData {
    const context = useContext(CartContext);

    return context;
}
