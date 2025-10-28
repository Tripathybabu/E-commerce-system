'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCustomers() {
      try {
        const res = await fetch('http://localhost:3001/customers');
        if (!res.ok) throw new Error('Failed to fetch customers');
        const data = await res.json();
        setCustomers(data);
      } catch (e: any) {
        setError(e.message ?? 'Failed to fetch customers');
      } finally {
        setIsLoading(false);
      }
    }
    fetchCustomers();
  }, []);

  return (
    <div className="bg-primary min-h-screen text-text-primary font-sans">
      <header className="border-b border-secondary">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold">ShopHub</Link>
          <nav className="flex items-center gap-8">
            <Link href="/" className="text-text-secondary hover:text-text-primary">Products</Link>
            <Link href="/orders" className="text-text-secondary hover:text-text-primary">Orders</Link>
            <Link href="/customers" className="text-text-primary font-semibold">Customers</Link>
            <Link href="/customers/new" className="bg-accent text-white font-bold py-2 px-4 rounded-lg">Add Customer</Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-extrabold mb-2">Customers</h1>
            <p className="text-text-secondary">Manage your customers</p>
          </div>
          <Link href="/customers/new" className="bg-accent text-white font-bold py-2 px-4 rounded-lg">New Customer</Link>
        </div>

        {isLoading && <p className="text-text-secondary">Loading customers...</p>}
        {error && <p className="text-red-400">{error}</p>}

        {!isLoading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {customers.map((c) => (
              <div key={c.id} className="bg-secondary p-6 rounded-lg">
                <h3 className="text-xl font-bold">{c.name}</h3>
                <p className="text-text-secondary">{c.email}</p>
                {(c.phone || c.city || c.state) && (
                  <p className="text-text-secondary mt-1">
                    {c.phone ? `${c.phone}` : ''}
                    {(c.city || c.state) ? `${c.phone ? ' · ' : ''}${c.city || ''}${c.city && c.state ? ', ' : ''}${c.state || ''}` : ''}
                  </p>
                )}
                {c.address && (
                  <p className="text-text-secondary mt-1">{c.address}{c.postalCode ? `, ${c.postalCode}` : ''}</p>
                )}
                <div className="mt-4 flex gap-3">
                  <Link href={`/customers/${c.id}`} className="underline text-accent">View</Link>
                </div>
              </div>
            ))}
            {customers.length === 0 && (
              <div className="text-text-secondary">No customers found.</div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
