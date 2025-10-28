'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { toast } from 'react-toastify';

export default function NewCustomerPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: String(formData.get('name') || ''),
      email: String(formData.get('email') || ''),
      phone: String(formData.get('phone') || ''),
      address: String(formData.get('address') || ''),
      city: String(formData.get('city') || ''),
      state: String(formData.get('state') || ''),
      postalCode: String(formData.get('postalCode') || ''),
    };

    if (!payload.name.trim()) {
      toast.warn('Name is required');
      return;
    }
    if (!payload.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      toast.warn('Valid email is required');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('http://localhost:3001/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Failed to create customer');
      }
      toast.success('Customer created');
      router.push('/customers');
    } catch (err) {
      console.error(err);
      toast.error('Could not create customer');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-primary min-h-screen text-text-primary font-sans">
      <header className="border-b border-secondary">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold">ShopHub</Link>
          <nav className="flex items-center gap-8">
            <Link href="/" className="text-text-secondary hover:text-text-primary">Products</Link>
            <Link href="/orders" className="text-text-secondary hover:text-text-primary">Orders</Link>
            <Link href="/customers" className="text-text-secondary hover:text-text-primary">Customers</Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-xl">
        <h1 className="text-3xl font-extrabold mb-6">Add Customer</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input name="name" placeholder="Full name" className="w-full p-3 bg-primary border border-secondary rounded-lg" required />
            <input name="email" type="email" placeholder="Email" className="w-full p-3 bg-primary border border-secondary rounded-lg" required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input name="phone" placeholder="Phone" className="w-full p-3 bg-primary border border-secondary rounded-lg" />
            <input name="postalCode" placeholder="Postal Code" className="w-full p-3 bg-primary border border-secondary rounded-lg" />
          </div>
          <input name="address" placeholder="Address" className="w-full p-3 bg-primary border border-secondary rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input name="city" placeholder="City" className="w-full p-3 bg-primary border border-secondary rounded-lg" />
            <input name="state" placeholder="State" className="w-full p-3 bg-primary border border-secondary rounded-lg" />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Link href="/customers" className="px-4 py-2 rounded-lg border border-secondary text-text-secondary">Cancel</Link>
            <button type="submit" disabled={submitting} className="bg-accent text-white font-bold py-2 px-4 rounded-lg disabled:opacity-60">
              {submitting ? 'Saving...' : 'Save Customer'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
