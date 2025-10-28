'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const IconBox = () => <svg className="w-12 h-12 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>;

interface Order {
  id: number;
  total: number;
  productIds: number[];
  createdAt: string;
  status: string;
}

interface Product {
  id: number;
  name: string;
  imageUrl: string;
  price: number;
}

interface Customer {
  id: number;
  name: string;
  email: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);

  useEffect(() => {
    async function fetchOrders(cid: number) {
      try {
        const res = await fetch(`http://localhost:3000/orders/customer/${cid}`);
        if (!res.ok) throw new Error('Failed to fetch orders');
        const data = await res.json();
        setOrders(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    async function fetchProductsAll() {
      try {
        const res = await fetch('http://localhost:3000/products');
        if (!res.ok) throw new Error('Failed to fetch products');
        const data = await res.json();
        setProducts(data);
      } catch (e) {
        console.error(e);
      }
    }
    async function fetchCustomersAll() {
      try {
        const res = await fetch('http://localhost:3001/customers');
        if (!res.ok) throw new Error('Failed to fetch customers');
        const data: Customer[] = await res.json();
        setCustomers(data);
        // Resolve initial customerId: session -> first customer -> 1
        const stored = typeof window !== 'undefined' ? sessionStorage.getItem('lastCustomerId') : null;
        const fromSession = stored ? Number(stored) : undefined;
        const initial = Number.isFinite(fromSession as number) && (fromSession as number)! > 0
          ? (fromSession as number)
          : (data[0]?.id ?? 1);
        setCustomerId(initial);
        fetchOrders(initial);
      } catch (e) {
        console.error(e);
        // Fallback
        const fallback = 1;
        setCustomerId(fallback);
        fetchOrders(fallback);
      } finally {
        setLoadingCustomers(false);
      }
    }

    fetchProductsAll();
    fetchCustomersAll();
  }, []);

  // Refetch orders when customer changes
  useEffect(() => {
    async function refetch() {
      if (!customerId) return;
      try {
        const res = await fetch(`http://localhost:3000/orders/customer/${customerId}`);
        if (!res.ok) throw new Error('Failed to fetch orders');
        const data = await res.json();
        setOrders(data);
      } catch (e) {
        console.error(e);
      }
    }
    refetch();
  }, [customerId]);

  const productMap = new Map(products.map(p => [p.id, p] as const));

  function itemsFor(order: Order) {
    const counts = new Map<number, number>();
    for (const id of order.productIds || []) {
      counts.set(id, (counts.get(id) || 0) + 1);
    }
    return Array.from(counts.entries()).map(([id, qty]) => ({ product: productMap.get(id), qty, id }));
  }

  return (
    <div className="bg-primary min-h-screen text-text-primary font-sans">
      <header className="border-b border-secondary">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
            <span className="text-xl font-bold">ShopHub</span>
          </Link>
          <nav className="flex items-center gap-8">
            <Link href="/" className="text-text-secondary hover:text-text-primary">Products</Link>
            <Link href="/orders" className="text-text-primary font-semibold">Orders</Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <h1 className="text-4xl font-extrabold mb-8">Orders</h1>
        <div className="bg-secondary p-4 rounded-lg mb-6">
          <label className="block mb-2 text-sm text-text-secondary">Select Customer</label>
          <select
            className="w-full p-3 bg-primary border border-secondary rounded-lg max-w-md"
            value={customerId ?? ''}
            onChange={(e) => {
              const id = e.target.value ? Number(e.target.value) : null;
              setCustomerId(id);
              if (id) sessionStorage.setItem('lastCustomerId', String(id));
            }}
          >
            <option value="">{loadingCustomers ? 'Loading customers...' : 'Select a customer'}</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <IconBox />
            <p className="text-text-secondary mt-4">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center bg-secondary rounded-lg p-16">
            <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
              <IconBox />
            </div>
            <h2 className="text-2xl font-bold mb-2">No orders yet</h2>
            <p className="text-text-secondary mb-6">Start shopping to see your orders here</p>
            <Link href="/" className="bg-accent text-white font-bold py-3 px-6 rounded-lg">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {orders.map(order => (
              <div key={order.id} className="bg-secondary rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold">Order ORD-{order.id}</h3>
                    <p className="text-sm text-text-secondary">{new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                  <span className="text-sm font-medium bg-green-500/20 text-green-400 px-3 py-1 rounded-full">{order.status}</span>
                </div>
                <div className="border-t border-primary pt-4 mt-4">
                  <h4 className="font-bold mb-3">Order Items</h4>
                  <div className="space-y-3">
                    {itemsFor(order).map(item => (
                      <div key={item.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {item.product ? (
                            <img src={item.product.imageUrl} alt={item.product.name} className="w-12 h-12 rounded-lg object-cover" />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-primary" />
                          )}
                          <div>
                            <p className="font-semibold">{item.product ? item.product.name : `Product #${item.id}`}</p>
                            <p className="text-sm text-text-secondary">Qty: {item.qty}</p>
                          </div>
                        </div>
                        <div className="text-right min-w-[80px]">
                          {item.product && <span>${(item.product.price * item.qty).toFixed(2)}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-primary mt-4 pt-3 space-y-1">
                    {typeof (order as any).subtotal === 'number' && (
                      <div className="flex justify-between text-text-secondary">
                        <span>Subtotal</span>
                        <span>${(order as any).subtotal.toFixed(2)}</span>
                      </div>
                    )}
                    {typeof (order as any).discount === 'number' && (order as any).discount > 0 && (
                      <div className="flex justify-between text-text-secondary">
                        <span>Discount</span>
                        <span>- ${(order as any).discount.toFixed(2)}</span>
                      </div>
                    )}
                    {typeof (order as any).tax === 'number' && (
                      <div className="flex justify-between text-text-secondary">
                        <span>Tax</span>
                        <span>${(order as any).tax.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg pt-2">
                      <span>Total</span>
                      <span>${order.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
