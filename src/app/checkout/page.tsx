'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';

interface Product {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
}

interface CartItem {
  product: Product;
  qty: number;
}

interface Customer {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | ''>('');
  const [shipName, setShipName] = useState('');
  const [shipEmail, setShipEmail] = useState('');
  const [shipAddress, setShipAddress] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discountValue, setDiscountValue] = useState<number>(0); // currency amount
  const [taxPct, setTaxPct] = useState<number>(8); // percent
  const router = useRouter();

  useEffect(() => {
    const cartData = sessionStorage.getItem('cart');
    if (cartData) {
      try {
        const parsed = JSON.parse(cartData);
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
      } catch {}
    } else {
      // Redirect if cart is empty
      router.push('/');
    }
  }, [router]);

  const incQty = (productId: number) => {
    setCart(curr => {
      const next = curr.map(ci => ci.product.id === productId ? { ...ci, qty: ci.qty + 1 } : ci);
      try { sessionStorage.setItem('cart', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  // Filter out any malformed entries to avoid runtime errors
  const displayCart = cart.filter(
    (ci): ci is CartItem => !!ci && !!ci.product && typeof ci.product.id === 'number' && typeof ci.qty === 'number'
  );
  const cartTotal = displayCart.reduce((t, i) => t + i.product.price * i.qty, 0);

  const decQty = (productId: number) => {
    setCart(curr => {
      const next = curr
        .map(ci => ci.product.id === productId ? { ...ci, qty: ci.qty - 1 } : ci)
        .filter(ci => ci.qty > 0);
      try { sessionStorage.setItem('cart', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  useEffect(() => {
    async function fetchCustomers() {
      try {
        const res = await fetch('http://localhost:3001/customers');
        if (!res.ok) throw new Error('Failed to load customers');
        const data: Customer[] = await res.json();
        setCustomers(data);
        // If you want to preselect the first customer
        if (data.length > 0) {
          const c = data[0];
          setSelectedCustomerId(c.id);
          setShipName(c.name || '');
          setShipEmail(c.email || '');
          const addr = [c.address, c.city, c.state, c.postalCode?.trim()].filter(Boolean).join(', ');
          setShipAddress(addr);
        }
      } catch (e) {
        // keep customers empty; user can type manually
      } finally {
        setLoadingCustomers(false);
      }
    }
    fetchCustomers();
  }, []);

  const handlePlaceOrder = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsProcessing(true);
    const productIds = displayCart.flatMap(ci => Array(ci.qty).fill(ci.product.id));
    try {
      if (!selectedCustomerId) {
        throw new Error('Please select a customer');
      }
      const res = await fetch('http://localhost:3000/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomerId,
          productIds,
          couponCode: appliedCoupon || undefined,
          taxPct,
          discount: discountValue || 0,
        }),
      });

      if (!res.ok) throw new Error('Order placement failed');

      const newOrder = await res.json();
      toast.success('Order placed successfully!');
      sessionStorage.setItem('order', JSON.stringify(newOrder));
      sessionStorage.setItem('lastCustomerId', String(selectedCustomerId));
      router.push('/order-summary');

    } catch (error) {
      console.error('Checkout failed:', error);
      toast.error('An error occurred during checkout.');
      setIsProcessing(false);
    }
  };

  // cartTotal computed above using displayCart

  return (
    <div className="bg-primary min-h-screen text-text-primary font-sans">
      <header className="border-b border-secondary">
        <div className="container mx-auto px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
            <span className="text-xl font-bold">ShopHub</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <h1 className="text-4xl font-extrabold mb-8">Checkout</h1>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Shipping Form */}
          <div className="lg:col-span-7 bg-secondary p-8 rounded-lg">
            <h2 className="text-2xl font-bold mb-6">Shipping Information</h2>
            <form onSubmit={handlePlaceOrder} className="space-y-6">
              <div>
                <label className="block mb-2 text-sm text-text-secondary">Select Customer</label>
                <select
                  className="w-full p-3 bg-primary border border-secondary rounded-lg"
                  value={selectedCustomerId}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : '';
                    setSelectedCustomerId(val);
                    const c = customers.find(x => x.id === Number(val));
                    if (c) {
                      setShipName(c.name || '');
                      setShipEmail(c.email || '');
                      const addr = [c.address, c.city, c.state, c.postalCode?.trim()].filter(Boolean).join(', ');
                      setShipAddress(addr);
                    } else {
                      setShipName('');
                      setShipEmail('');
                      setShipAddress('');
                    }
                  }}
                >
                  <option value="">{loadingCustomers ? 'Loading customers...' : 'Select a customer'}</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <input
                type="text"
                placeholder="Full Name"
                className="w-full p-3 bg-primary border border-secondary rounded-lg"
                value={shipName}
                onChange={(e) => setShipName(e.target.value)}
                required
              />
              <input
                type="email"
                placeholder="Email Address"
                className="w-full p-3 bg-primary border border-secondary rounded-lg"
                value={shipEmail}
                onChange={(e) => setShipEmail(e.target.value)}
                required
              />
              <textarea
                placeholder="Shipping Address"
                className="w-full p-3 bg-primary border border-secondary rounded-lg h-24"
                value={shipAddress}
                onChange={(e) => setShipAddress(e.target.value)}
                required
              />
              <div className="flex items-center justify-between pt-6">
                <Link href="/" className="text-accent hover:underline">Back to Cart</Link>
                <button type="submit" disabled={isProcessing} className="bg-accent text-white font-bold py-3 px-8 rounded-lg disabled:bg-gray-500">
                  {isProcessing ? 'Processing...' : 'Place Order'}
                </button>
              </div>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-5 bg-secondary p-8 rounded-lg">
            <h2 className="text-2xl font-bold mb-6">Order Summary</h2>
            <div className="space-y-4">
              {displayCart.map(item => (
                <div key={item.product.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img src={item.product.imageUrl} alt={item.product.name} className="w-16 h-16 rounded-lg object-cover" />
                    <div>
                      <p className="font-semibold">{item.product.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <button type="button" className="px-2 py-1 bg-primary rounded" onClick={() => decQty(item.product.id)}>-</button>
                        <span className="min-w-6 text-center">{item.qty}</span>
                        <button type="button" className="px-2 py-1 bg-primary rounded" onClick={() => incQty(item.product.id)}>+</button>
                      </div>
                    </div>
                  </div>
                  <p className="font-semibold">${(item.product.price * item.qty).toFixed(2)}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-primary my-6"></div>
            <div className="space-y-2">
              <div className="flex justify-between text-text-secondary">
                <span>Subtotal</span>
                <span>${displayCart.reduce((t, i) => t + i.product.price * i.qty, 0).toFixed(2)}</span>
              </div>
              {/* Coupon */}
              <div className="mt-4">
                <label className="block mb-2 text-sm text-text-secondary">Have a coupon?</label>
                <div className="flex gap-2">
                  <input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter code (e.g., SAVE10, FLAT50)"
                    className="flex-1 p-3 bg-primary border border-secondary rounded-lg"
                  />
                  <button
                    type="button"
                    className="bg-accent text-white font-bold px-4 rounded-lg"
                    onClick={() => {
                      const raw = couponCode.trim();
                      if (!raw) return;
                      const maybeAmount = Number(raw);
                      let discount = 0;
                      let codeLabel: string | null = null;
                      if (Number.isFinite(maybeAmount) && maybeAmount > 0) {
                        // Treat numeric input as a flat discount amount
                        discount = maybeAmount;
                        codeLabel = `FLAT-${maybeAmount}`;
                      } else {
                        const code = raw.toUpperCase();
                        if (code === 'SAVE10') {
                          discount = cartTotal * 0.10;
                          codeLabel = code;
                        } else if (code === 'SAVE20') {
                          discount = cartTotal * 0.20;
                          codeLabel = code;
                        } else if (code === 'FLAT50') {
                          discount = 50;
                          codeLabel = code;
                        } else {
                          setAppliedCoupon(null);
                          setDiscountValue(0);
                          return;
                        }
                      }
                      // Clamp to subtotal
                      const clamped = Math.min(discount, cartTotal);
                      setAppliedCoupon(codeLabel);
                      setDiscountValue(Number(clamped.toFixed(2)));
                    }}
                  >
                    Apply
                  </button>
                </div>
                {appliedCoupon && (
                  <p className="text-sm text-text-secondary mt-2">Applied coupon: <span className="font-semibold">{appliedCoupon}</span></p>
                )}
              </div>
              {discountValue > 0 && (
                <div className="flex justify-between text-text-secondary">
                  <span>Discount</span>
                  <span>- ${discountValue.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-text-secondary">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              {/* Tax */}
              <div className="flex items-center justify-between text-text-secondary">
                <div className="flex items-center gap-2">
                  <span>Tax</span>
                  <input
                    type="number"
                    className="w-16 p-1 bg-primary border border-secondary rounded text-sm"
                    value={taxPct}
                    min={0}
                    max={30}
                    onChange={(e) => setTaxPct(Math.max(0, Math.min(30, Number(e.target.value) || 0)))}
                  />
                  <span>%</span>
                </div>
                <span>
                  ${Math.max(0, (cartTotal - discountValue) * (taxPct / 100)).toFixed(2)}
                </span>
              </div>
              <div className="border-t border-primary my-4"></div>
              <div className="flex justify-between font-bold text-xl">
                <span>Total</span>
                <span>
                  ${(
                    Math.max(0, cartTotal - discountValue) + Math.max(0, (cartTotal - discountValue) * (taxPct / 100))
                  ).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
