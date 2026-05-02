'use client';

import { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, MoreHorizontal, Edit, Trash } from 'lucide-react';
import { fetchAPI } from '@/lib/api';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [productToDelete, setProductToDelete] = useState<any>(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [categorySaving, setCategorySaving] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await fetchAPI('/products');
      setProducts(data);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;

    try {
      await fetchAPI(`/products/${productToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Refresh list
      loadProducts();
      setProductToDelete(null);
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('Gagal memadam produk');
    }
  };

  const createCategory = async () => {
    const name = categoryName.trim();
    if (!name) {
      setCategoryError('Nama kategori diperlukan');
      return;
    }

    setCategorySaving(true);
    setCategoryError(null);
    try {
      await fetchAPI('/categories', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          name,
          description: categoryDescription.trim() || undefined,
        }),
      });
      setCategoryName('');
      setCategoryDescription('');
      setCategoryDialogOpen(false);
    } catch (e: any) {
      setCategoryError(e?.message || 'Gagal tambah kategori');
    } finally {
      setCategorySaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Produk</h1>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setCategoryDialogOpen(true)}>
            Tambah Kategori
          </Button>
          <Link href="/admin/categories">
            <Button variant="outline">Urus Kategori</Button>
          </Link>
          <Link href="/admin/products/new">
            <Button className="flex items-center gap-2">
              <Plus size={16} />
              Tambah Produk
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-zinc-900 p-4 rounded-xl border border-white/10">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <Input 
            placeholder="Cari produk..." 
            className="pl-10"
          />
        </div>
      </div>

      <div className="bg-zinc-900 border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="bg-white/5 text-gray-200 uppercase font-medium">
            <tr>
              <th className="px-6 py-4">Nama Produk</th>
              <th className="px-6 py-4">Berat (g)</th>
              <th className="px-6 py-4">Ketulenan</th>
              <th className="px-6 py-4">Stok</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Tindakan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center">Memuatkan...</td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center">Tiada produk ditemui.</td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-medium text-white">{product.name}</td>
                  <td className="px-6 py-4">{product.weight}g</td>
                  <td className="px-6 py-4">{product.purity}</td>
                  <td className="px-6 py-4">{product.stock}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-xs font-medium border ${
                      product.isActive 
                        ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                        : 'bg-red-500/10 text-red-500 border-red-500/20'
                    }`}>
                      {product.isActive ? 'Aktif' : 'Tidak Aktif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Buka menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-zinc-900 border-white/10 text-white">
                        <DropdownMenuLabel>Tindakan</DropdownMenuLabel>
                        <DropdownMenuItem className="cursor-pointer hover:bg-white/10">
                          <Link href={`/admin/products/${product.id}`} className="flex w-full items-center">
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuItem 
                          className="text-red-500 cursor-pointer hover:bg-red-500/10 focus:bg-red-500/10"
                          onClick={() => setProductToDelete(product)}
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Padam
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <AlertDialogContent className="bg-zinc-900 border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Adakah anda pasti?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Tindakan ini tidak boleh dipulihkan. Ini akan memadam produk 
              <span className="font-bold text-white"> {productToDelete?.name} </span>
              daripada pangkalan data secara kekal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/10 hover:bg-white/5 hover:text-white">Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteProduct}
              className="bg-red-600 hover:bg-red-700 text-white border-none"
            >
              Padam
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={categoryDialogOpen}
        onOpenChange={(open) => {
          setCategoryDialogOpen(open);
          if (!open) {
            setCategoryError(null);
          }
        }}
      >
        <AlertDialogContent className="bg-zinc-900 border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Tambah Kategori</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Kategori ini akan boleh dipilih semasa tambah atau edit produk.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {categoryError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-200 text-sm">
              {categoryError}
            </div>
          )}

          <div className="space-y-4">
            <Input
              label="Nama Kategori"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="cth. Barang Kemas"
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Penerangan (optional)</label>
              <textarea
                value={categoryDescription}
                onChange={(e) => setCategoryDescription(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-gold-500 min-h-[90px]"
                placeholder="Penerangan kategori..."
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/10 hover:bg-white/5 hover:text-white">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={createCategory}
              disabled={categorySaving}
              className="bg-gold-500 hover:bg-gold-600 text-black border-none"
            >
              {categorySaving ? 'Menyimpan...' : 'Simpan'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
