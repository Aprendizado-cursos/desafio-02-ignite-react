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

    function setValuesInLocalStorage(cart: Product[]) {
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(cart));
    }

    const addProduct = async (productId: number) => {
        try {
            const copyCart = [...cart];
            const product = copyCart.find((p) => p.id === productId);

            const { data }: { data: Stock } = await api.get("/stock/" + productId);

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
            setValuesInLocalStorage(copyCart);
        } catch {
            toast.error("Erro na adição do produto");
        }
    };

    const removeProduct = (productId: number) => {
        try {
            const copyCart = [...cart];
            const cartWithoutProduct = copyCart.filter((p) => {
                if (p.id !== productId) {
                    return p;
                }
                return 0;
            });
            if (cartWithoutProduct.length < copyCart.length) {
                setCart(cartWithoutProduct);
                setValuesInLocalStorage(cartWithoutProduct);
            } else {
                throw new Error();
            }
        } catch {
            toast.error("Erro na remoção do produto");
        }
    };

    const updateProductAmount = async ({ productId, amount }: UpdateProductAmount) => {
        try {
            if (amount > 0) {
                const { data }: { data: Stock } = await api.get("/stock/" + productId);
                const amountInStock = data.amount;
                const productInCart = cart.find((p) => p.id === productId);

                if (amount > amountInStock) {
                    toast.error("Quantidade solicitada fora de estoque");
                    return;
                }

                if (productInCart) {
                    productInCart.amount = amount;
                    setCart([...cart]);
                    setValuesInLocalStorage([...cart]);
                }
            }
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
