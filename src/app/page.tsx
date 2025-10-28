'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';

// Re-usable components for cleaner code
const IconShop = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>;
const IconCart = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>;
const IconClose = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>;

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  stock: number;
  category: string;
}

interface CartItem {
  product: Product;
  qty: number;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddProductForm, setShowAddProductForm] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const router = useRouter();
  const customerId = 1; // Hardcoded for now

  async function fetchProducts() {
    try {
      const res = await fetch('http://localhost:3000/products');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  // Hydrate cart from sessionStorage so navigating back from checkout restores items
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('cart');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          if (parsed.length === 0) {
            setCart([]);
          } else if (parsed[0] && 'product' in parsed[0] && 'qty' in parsed[0]) {
            setCart(parsed as CartItem[]);
          } else {
            // Back-compat: was array of Product
            const byId = new Map<number, CartItem>();
            (parsed as Product[]).forEach(p => {
              const existing = byId.get(p.id);
              if (existing) existing.qty += 1; else byId.set(p.id, { product: p, qty: 1 });
            });
            const items = Array.from(byId.values());
            setCart(items);
            sessionStorage.setItem('cart', JSON.stringify(items));
          }
        }
      }
    } catch {}
  }, []);

  const addToCart = (product: Product) => {
    setCart(currentCart => {
      const idx = currentCart.findIndex(ci => ci.product.id === product.id);
      const next = [...currentCart];
      if (idx >= 0) {
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
      } else {
        next.push({ product, qty: 1 });
      }
      try { sessionStorage.setItem('cart', JSON.stringify(next)); } catch {}
      return next;
    });
    toast.success(`${product.name} added to cart!`);
  };

  const incQty = (productId: number) => {
    setCart(curr => {
      const next = curr.map(ci => ci.product.id === productId ? { ...ci, qty: ci.qty + 1 } : ci);
      try { sessionStorage.setItem('cart', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const decQty = (productId: number) => {
    setCart(curr => {
      const next = curr
        .map(ci => ci.product.id === productId ? { ...ci, qty: ci.qty - 1 } : ci)
        .filter(ci => ci.qty > 0);
      try { sessionStorage.setItem('cart', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.warn('Your cart is empty!');
      return;
    }
    sessionStorage.setItem('cart', JSON.stringify(cart));
    router.push('/checkout');
  };

  const handleAddProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newProduct = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      price: parseFloat(formData.get('price') as string),
      imageUrl: formData.get('imageUrl') as string,
      stock: parseInt(formData.get('stock') as string, 10),
      category: formData.get('category') as string,
    };

    try {
      const res = await fetch('http://localhost:3000/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct),
      });
      if (res.ok) {
        toast.success('Product added successfully!');
        setShowAddProductForm(false);
        fetchProducts();
      } else {
        toast.error('Failed to add product.');
      }
    } catch (error) {
      console.error('Failed to add product:', error);
      toast.error('An error occurred while adding the product.');
    }
  };

  const cartTotal = cart.reduce((total, item) => total + item.product.price * item.qty, 0);

  return (
    <div className="bg-primary min-h-screen font-sans text-text-primary">
      {/* Header */}
      <header className="border-b border-secondary sticky top-0 bg-primary/80 backdrop-blur-lg z-10">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <IconShop />
            <span className="text-xl font-bold">ShopHub</span>
          </Link>
          <nav className="flex items-center gap-8">
            <Link href="/" className="text-text-secondary hover:text-text-primary">Products</Link>
            <Link href="/customers" className="text-text-secondary hover:text-text-primary">Customers</Link>
            <Link href="/orders" className="text-text-secondary hover:text-text-primary">Orders</Link>
            <button onClick={() => setShowAddProductForm(true)} className="bg-accent text-white font-bold py-2 px-4 rounded-lg">
              Add Products
            </button>
            <button onClick={() => setShowCart(true)} className="relative">
              <IconCart />
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cart.reduce((n, i) => n + i.qty, 0)}
                </span>
              )}
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-extrabold mb-2">Discover Our Products</h1>
          <p className="text-lg text-text-secondary">Premium quality items for your everyday needs</p>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <p className="text-center">Loading products...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map(product => (
              <div key={product.id} className="bg-secondary rounded-lg overflow-hidden group relative">
                <div className="w-full h-64 bg-primary">
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-4">
                  <p className="text-xs text-text-secondary uppercase font-bold">{product.category}</p>
                  <h3 className="text-lg font-semibold mt-1">{product.name}</h3>
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => addToCart(product)} className="bg-accent text-white font-bold py-2 px-4 rounded-lg">
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add Product Modal */}
      {showAddProductForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <div className="bg-secondary text-text-primary rounded-lg shadow-2xl p-8 max-w-md w-full relative">
            <button onClick={() => setShowAddProductForm(false)} className="absolute top-4 right-4 text-text-secondary hover:text-text-primary"><IconClose /></button>
            <h2 className="text-2xl font-bold mb-6 text-center">Add a New Product</h2>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <input type="text" name="name" placeholder="Product Name" className="w-full p-3 bg-primary border border-secondary rounded-lg" required />
              <textarea name="description" placeholder="Product Description" className="w-full p-3 bg-primary border border-secondary rounded-lg" required />
              <div className="grid grid-cols-2 gap-4">
                <input type="number" name="price" placeholder="Price" step="0.01" className="w-full p-3 bg-primary border border-secondary rounded-lg" required />
                <input type="number" name="stock" placeholder="Stock Quantity" className="w-full p-3 bg-primary border border-secondary rounded-lg" required />
              </div>
              <input type="text" name="imageUrl" placeholder="Image URL" className="w-full p-3 bg-primary border border-secondary rounded-lg" />
              <input type="text" name="category" placeholder="Category" className="w-full p-3 bg-primary border border-secondary rounded-lg" />
              <button type="submit" className="w-full bg-accent hover:brightness-110 text-white font-bold py-3 rounded-lg">
                Submit Product
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Shopping Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-30" onClick={() => setShowCart(false)}>
          <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-secondary text-text-primary shadow-xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-primary">
              <h2 className="text-2xl font-bold">Your Cart</h2>
              <button onClick={() => setShowCart(false)}><IconClose /></button>
            </div>
            {cart.length === 0 ? (
              <div className="flex-grow flex flex-col items-center justify-center text-center p-6">
                <div className="w-40 h-40 bg-primary rounded-full flex items-center justify-center mb-4">
                  <IconCart />
                </div>
                <h3 className="text-xl font-bold mb-2">Your cart is empty</h3>
                <p className="text-text-secondary mb-4">Add some products to get started.</p>
                <button onClick={() => setShowCart(false)} className="bg-accent text-white font-bold py-2 px-6 rounded-lg">
                  Continue Shopping
                </button>
              </div>
            ) : (
              <div className="flex-grow p-6 overflow-y-auto">
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex items-center gap-4">
                      <img src={item.product.imageUrl} alt={item.product.name} className="w-16 h-16 rounded-lg object-cover" />
                      <div className="flex-grow">
                        <p className="font-semibold">{item.product.name}</p>
                        <p className="text-text-secondary">${item.product.price.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="px-2 py-1 bg-primary rounded" onClick={() => decQty(item.product.id)}>-</button>
                        <span className="min-w-6 text-center">{item.qty}</span>
                        <button className="px-2 py-1 bg-primary rounded" onClick={() => incQty(item.product.id)}>+</button>
                      </div>
                      <div className="w-20 text-right font-semibold">${(item.product.price * item.qty).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {cart.length > 0 && (
              <div className="p-6 border-t border-primary">
                <div className="flex justify-between items-center font-bold text-xl mb-4">
                  <span>Total</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                <button onClick={handleCheckout} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg">
                  Proceed to Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
