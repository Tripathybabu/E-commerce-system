'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Order {
  id: number;
  total: number;
  productIds: number[];
}

export default function OrderSummaryPage() {
  const [order, setOrder] = useState<Order | null>(null);
  const router = useRouter();

  useEffect(() => {
    const orderData = sessionStorage.getItem('order');
    if (orderData) {
      setOrder(JSON.parse(orderData));
      sessionStorage.removeItem('cart'); // Clean up cart from storage
    }
  }, []);

  if (!order) {
    return <p className="text-center text-text-secondary mt-10">Loading order summary...</p>;
  }

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
          <div className="border-t border-secondary pt-4">
            <div className="flex justify-between items-center font-bold text-2xl">
              <span>Total Paid</span>
              <span className="text-accent">${order.total.toFixed(2)}</span>
            </div>
            <p className="text-text-secondary mt-2">Product IDs: {order.productIds.join(', ')}</p>
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
