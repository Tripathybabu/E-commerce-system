'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Order {
  id: number;
  total?: number;
  productIds: number[];
  subtotal?: number;
  discount?: number;
  tax?: number;
}

interface Product {
  id: number;
  name: string;
  imageUrl: string;
  price: number;
}

export default function OrderSummaryPage() {
  const [order, setOrder] = useState<Order | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const router = useRouter();

  useEffect(() => {
    const orderData = sessionStorage.getItem('order');
    if (orderData) {
      setOrder(JSON.parse(orderData));
      sessionStorage.removeItem('cart'); // Clean up cart from storage
    }
  }, []);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch('http://localhost:3000/products');
        if (!res.ok) throw new Error('Failed to load products');
        const data: Product[] = await res.json();
        setProducts(data);
      } catch (e) {
        // ignore; we'll just hide item details if cannot load
      }
    }
    fetchProducts();
  }, []);

  if (!order) {
    return <p className="text-center text-text-secondary mt-10">Loading order summary...</p>;
  }

  const hasBreakdown = typeof order.subtotal === 'number' || typeof order.discount === 'number' || typeof order.tax === 'number';
  const computedTotal = typeof order.total === 'number'
    ? order.total
    : Math.max(0, (order.subtotal || 0) - (order.discount || 0)) + Math.max(0, ((order.subtotal || 0) - (order.discount || 0)) * 0) + (order.tax || 0);

  const productMap = new Map(products.map(p => [p.id, p] as const));
  const items = (() => {
    if (!order) return [] as { id: number; qty: number; product?: Product }[];
    const counts = new Map<number, number>();
    for (const id of order.productIds || []) {
      counts.set(id, (counts.get(id) || 0) + 1);
    }
    return Array.from(counts.entries()).map(([id, qty]) => ({ id, qty, product: productMap.get(id) }));
  })();

  return (
    <div className="bg-primary min-h-screen text-text-primary flex items-center justify-center">
      <div className="bg-secondary rounded-xl shadow-2xl p-8 max-w-2xl w-full">
        <div className="text-center mb-8">
          <svg className="w-16 h-16 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <h1 className="text-3xl font-bold mt-4">Order Successful!</h1>
          <p className="text-text-secondary">Thank you for your purchase.</p>
        </div>

        <div className="bg-primary rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-bold">Invoice #{order.id}</h2>
          <div className="border-t border-secondary pt-4 space-y-2">
            {items.length > 0 && (
              <div className="space-y-3">
                {items.map(it => (
                  <div key={it.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {it.product ? (
                        <img src={it.product.imageUrl} alt={it.product.name} className="w-12 h-12 rounded-lg object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-secondary" />
                      )}
                      <div>
                        <p className="font-semibold">{it.product ? it.product.name : `Product #${it.id}`}</p>
                        <p className="text-sm text-text-secondary">Qty: {it.qty}</p>
                      </div>
                    </div>
                    <div className="text-right min-w-[80px]">
                      {it.product && <span>${(it.product.price * it.qty).toFixed(2)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {hasBreakdown && (
              <>
                {typeof order.subtotal === 'number' && (
                  <div className="flex justify-between text-text-secondary">
                    <span>Subtotal</span>
                    <span>${order.subtotal.toFixed(2)}</span>
                  </div>
                )}
                {typeof order.discount === 'number' && order.discount > 0 && (
                  <div className="flex justify-between text-text-secondary">
                    <span>Discount</span>
                    <span>- ${order.discount.toFixed(2)}</span>
                  </div>
                )}
                {typeof order.tax === 'number' && (
                  <div className="flex justify-between text-text-secondary">
                    <span>Tax</span>
                    <span>${order.tax.toFixed(2)}</span>
                  </div>
                )}
              </>
            )}
            <div className="flex justify-between items-center font-bold text-2xl">
              <span>Grand Total</span>
              <span className="text-accent">${computedTotal.toFixed(2)}</span>
            </div>
            {/* Removed raw Product IDs from UI for cleaner look */}
          </div>
        </div>

        <div className="text-center mt-8">
          <button
            onClick={() => router.push('/')}
            className="bg-accent hover:brightness-110 text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}
