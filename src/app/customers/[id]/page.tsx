'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

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

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params?.id);

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function load() {
      try {
        const res = await fetch(`http://localhost:3001/customers/${id}`);
        if (!res.ok) throw new Error('Failed to load customer');
        setCustomer(await res.json());
      } catch (e) {
        toast.error('Unable to load customer');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!customer) return;
    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload = {
      name: String(fd.get('name') || ''),
      email: String(fd.get('email') || ''),
      phone: String(fd.get('phone') || ''),
      address: String(fd.get('address') || ''),
      city: String(fd.get('city') || ''),
      state: String(fd.get('state') || ''),
      postalCode: String(fd.get('postalCode') || ''),
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
      setSaving(true);
      const res = await fetch(`http://localhost:3001/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Save failed');
      }
      toast.success('Customer updated');
    } catch (e) {
      toast.error('Failed to update');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const result = await Swal.fire({
      title: 'Delete this customer?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;
    try {
      const res = await fetch(`http://localhost:3001/customers/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      await Swal.fire({ title: 'Deleted!', text: 'Customer has been deleted.', icon: 'success' });
      router.push('/customers');
    } catch (e) {
      Swal.fire({ title: 'Error', text: 'Failed to delete customer.', icon: 'error' });
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
            <Link href="/customers" className="text-text-primary font-semibold">Customers</Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-xl">
        {loading && <p className="text-text-secondary">Loading...</p>}
        {!loading && customer && (
          <form onSubmit={handleSave} className="space-y-4 bg-secondary p-6 rounded-lg">
            <h1 className="text-2xl font-extrabold">{customer.name}</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input name="name" defaultValue={customer.name} placeholder="Full name" className="w-full p-3 bg-primary border border-secondary rounded-lg" />
              <input name="email" type="email" defaultValue={customer.email} placeholder="Email" className="w-full p-3 bg-primary border border-secondary rounded-lg" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input name="phone" defaultValue={customer.phone || ''} placeholder="Phone" className="w-full p-3 bg-primary border border-secondary rounded-lg" />
              <input name="postalCode" defaultValue={customer.postalCode || ''} placeholder="Postal Code" className="w-full p-3 bg-primary border border-secondary rounded-lg" />
            </div>
            <input name="address" defaultValue={customer.address || ''} placeholder="Address" className="w-full p-3 bg-primary border border-secondary rounded-lg" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input name="city" defaultValue={customer.city || ''} placeholder="City" className="w-full p-3 bg-primary border border-secondary rounded-lg" />
              <input name="state" defaultValue={customer.state || ''} placeholder="State" className="w-full p-3 bg-primary border border-secondary rounded-lg" />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Link href="/customers" className="px-4 py-2 rounded-lg border border-secondary text-text-secondary">Back</Link>
              <button type="submit" disabled={saving} className="bg-accent text-white font-bold py-2 px-4 rounded-lg disabled:opacity-60">{saving ? 'Saving...' : 'Save'}</button>
              <button type="button" onClick={handleDelete} className="px-4 py-2 rounded-lg border border-secondary text-red-400">Delete</button>
            </div>
          </form>
        )}
        {!loading && !customer && <p className="text-text-secondary">Customer not found.</p>}
      </main>
    </div>
  );
}
