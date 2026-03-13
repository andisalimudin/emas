'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fetchAPI } from '@/lib/api';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    weight: 0,
    price: 0,
    lockDuration: 15,
    purity: '999.9',
    stock: 0,
    isActive: true,
    hidePrice: false,
    imageUrl: '',
  });

  useEffect(() => {
    if (id) {
      loadProduct();
    }
  }, [id]);

  const loadProduct = async () => {
    try {
      const data = await fetchAPI(`/products/${id}`);
      setFormData({
        name: data.name || '',
        description: data.description || '',
        weight: data.weight || 0,
        price: data.price || 0,
        lockDuration: data.lockDuration || 15,
        purity: data.purity || '999.9',
        stock: data.stock || 0,
        isActive: data.isActive,
        hidePrice: data.hidePrice,
        imageUrl: data.imageUrl || '',
      });
    } catch (err: any) {
      setError(err.message || 'Gagal memuatkan produk');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' 
        ? (value === '' ? 0 : parseFloat(value)) 
        : value
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      await fetchAPI(`/products/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...formData,
          weight: parseFloat(formData.weight.toString()),
          price: parseFloat(formData.price.toString()),
          stock: parseInt(formData.stock.toString()),
          lockDuration: parseInt(formData.lockDuration.toString())
        }),
      });

      router.push('/admin/products');
    } catch (err: any) {
      console.error('Update Error:', err);
      setError(err.message || 'Gagal mengemaskini produk');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-white text-center py-8">Memuatkan...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/products" className="text-gray-400 hover:text-white">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold text-white">Edit Produk</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-zinc-900 border border-white/10 rounded-xl p-6 space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <Input
            label="Nama Produk"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="cth. Gold Bar 10g"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Berat (g)"
              name="weight"
              type="number"
              step="0.01"
              value={formData.weight}
              onChange={handleChange}
              required
              placeholder="10.00"
            />
            <Input
              label="Harga (RM)"
              name="price"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={handleChange}
              required
              placeholder="0.00"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Ketulenan"
              name="purity"
              value={formData.purity}
              onChange={handleChange}
              required
              placeholder="999.9"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Kuantiti Stok"
              name="stock"
              type="number"
              value={formData.stock}
              onChange={handleChange}
              required
              placeholder="cth. 10"
            />
            <Input
              label="Tempoh Kunci (Minit)"
              name="lockDuration"
              type="number"
              value={formData.lockDuration}
              onChange={handleChange}
              required
              placeholder="cth. 15"
            />
          </div>

          <Input
              label="URL Imej"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
            />

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Penerangan</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-gold-500 min-h-[100px]"
              placeholder="Penerangan produk..."
            />
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleCheckboxChange}
                className="w-4 h-4 rounded border-gray-300 text-gold-500 focus:ring-gold-500"
              />
              <span className="text-sm text-gray-300">Aktif (Kelihatan kepada pengguna)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="hidePrice"
                checked={formData.hidePrice}
                onChange={handleCheckboxChange}
                className="w-4 h-4 rounded border-gray-300 text-gold-500 focus:ring-gold-500"
              />
              <span className="text-sm text-gray-300">Sembunyi Harga (Awam)</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t border-white/10">
          <Link href="/admin/products">
            <Button type="button" variant="ghost">Batal</Button>
          </Link>
          <Button type="submit" disabled={saving}>
            {saving ? 'Sedang Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </div>
      </form>
    </div>
  );
}