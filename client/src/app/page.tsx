'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, TrendingUp, Users, ArrowRight, Lock, Clock, CheckCircle } from 'lucide-react';
import { fetchAPI } from '@/lib/api';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};


const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const getPlaceholderImage = (text: string) => {
  const svg = `
    <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#2a2a2a;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#1a1a1a;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)"/>
      <rect x="20" y="20" width="360" height="360" rx="20" fill="none" stroke="#D4AF37" stroke-width="2" stroke-opacity="0.3"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-weight="bold" font-size="24" fill="#D4AF37" text-anchor="middle" dy=".3em">${text}</text>
    </svg>
  `;
  return `data:image/svg+xml;base64,${typeof window !== 'undefined' ? window.btoa(svg) : Buffer.from(svg).toString('base64')}`;
};

const isUploadsSrc = (src: unknown) => typeof src === 'string' && src.includes('/uploads/');

export default function LandingPage() {
  const [heroTitle] = useState(
    'Keanggunan Emas, Nilai Yang Berkekalan 💛<br /><span class="text-gold-500">Eksklusif • Tulen • Pelaburan Bijak</span>',
  );
  const [heroSubtitle] = useState(
    'Koleksi emas baru berprestij dan preloved terpilih untuk anda yang menghargai kualiti, gaya dan nilai.',
  );
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string>('');

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const [productsData, categoriesData] = await Promise.all([fetchAPI('/products'), fetchAPI('/categories')]);
      setProducts((Array.isArray(productsData) ? productsData : []).filter((p: any) => p.isActive).slice(0, 6));
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (err) {
      console.error('Failed to load content:', err);
    }
  };

  const filteredProducts = products.filter((p: any) => {
    if (!activeCategoryId) return true;
    return String(p?.categoryId || '') === activeCategoryId;
  });

  const categoryChips = [{ id: '', label: 'Semua' }].concat(
    (categories || [])
      .map((c: any) => ({ id: String(c?.id || ''), label: String(c?.name || '') }))
      .filter((c) => c.id && c.label),
  );

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold tracking-tighter">
            <span className="bg-gradient-to-r from-gold-400 via-yellow-200 to-gold-500 bg-clip-text text-transparent">
              AmyEmpire
            </span>
          </Link>
          
          <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-gray-300">
            <Link href="#products" className="hover:text-gold-400 transition-colors">Koleksi</Link>
            <Link href="#about" className="hover:text-gold-400 transition-colors">Kenapa Kami</Link>
            <Link href="#member" className="hover:text-gold-400 transition-colors">Ahli Privilege</Link>
            <Link href="#contact" className="hover:text-gold-400 transition-colors">Hubungi</Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link href="/login" className="text-sm font-medium hover:text-white text-gray-300 transition-colors">
              Log Masuk
            </Link>
            <Link 
              href="/register" 
              className="px-5 py-2 text-sm font-semibold bg-gradient-to-r from-gold-600 to-gold-400 text-black rounded-full hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all duration-300"
            >
              Daftar
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gold-900/20 via-black to-black z-0"></div>
        
        <div className="container mx-auto px-6 relative z-10 text-center">
          <motion.div 
            initial="initial"
            animate="animate"
            variants={staggerContainer}
            className="max-w-4xl mx-auto space-y-8"
          >
            <motion.h1 
              variants={fadeInUp}
              className="text-5xl md:text-7xl font-bold tracking-tight leading-tight"
              dangerouslySetInnerHTML={{ __html: heroTitle }}
            />
            
            <motion.p 
              variants={fadeInUp}
              className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed"
            >
              {heroSubtitle}
            </motion.p>
            
            <motion.div 
              variants={fadeInUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            >
              <Link 
                href="#products"
                className="w-full sm:w-auto px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                Lihat Koleksi <ArrowRight className="w-4 h-4" />
              </Link>
              <Link 
                href="#member"
                className="w-full sm:w-auto px-8 py-4 border border-white/20 hover:border-gold-500/50 hover:bg-gold-500/10 rounded-full transition-all text-white font-medium"
              >
                Jadi Ahli Privilege
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-y border-white/5 bg-white/5">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { label: "Emas Tulen", value: "916 / 999" },
              { label: "Rekaan Premium", value: "Limited" },
              { label: "Preloved Terpilih", value: "Hampir Baru" },
              { label: "Khidmat Personal", value: "1-to-1" }
            ].map((stat, i) => (
              <div key={i} className="space-y-2">
                <div className="text-3xl md:text-4xl font-bold text-gold-500">{stat.value}</div>
                <div className="text-sm text-gray-400 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Showcase */}
      <section id="products" className="py-24 bg-black relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold">Koleksi Kami</h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Emas baru berprestij dan preloved premium terpilih untuk gaya moden & elegan.
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 overflow-x-auto whitespace-nowrap pb-1 mb-10">
            {categoryChips.map((c) => (
              <button
                key={c.id || 'all'}
                type="button"
                onClick={() => setActiveCategoryId(c.id)}
                className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                  activeCategoryId === c.id
                    ? 'bg-gold-500 text-black border-gold-500'
                    : 'bg-white/5 text-gray-200 border-white/10 hover:border-gold-500/40 hover:bg-gold-500/10'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
              <div className="text-lg font-bold text-white">💛 Emas Baru</div>
              <p className="text-gray-400 mt-2">
                Kilauan sempurna, rekaan terkini untuk gaya moden & elegan.
              </p>
            </div>
            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
              <div className="text-lg font-bold text-white">♻️ Emas Preloved Premium</div>
              <p className="text-gray-400 mt-2">
                Disaring rapi — hanya item berkualiti tinggi dipilih. Rare, unik & lebih bernilai.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product, i) => (
                <motion.div 
                  key={product.id || i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group relative bg-zinc-900 rounded-2xl overflow-hidden border border-white/5 hover:border-gold-500/30 transition-all duration-300"
                >
                  <div className="aspect-square relative bg-zinc-800">
                    <div className="absolute inset-0 flex items-center justify-center text-gold-500/20">
                      {(() => {
                        const src = product.imageUrl || getPlaceholderImage(product.name);
                        return (
                      <Image 
                        src={src} 
                        alt={product.name} 
                        fill 
                        unoptimized={isUploadsSrc(src)}
                        className="object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                      />
                        );
                      })()}
                    </div>
                    <div className="absolute top-4 right-4 bg-black/50 backdrop-blur px-3 py-1 rounded-full border border-white/10 text-xs font-medium text-gold-400">
                      {product.purity} Ketulenan
                    </div>
                    <div className="absolute top-4 left-4 bg-black/50 backdrop-blur px-3 py-1 rounded-full border border-white/10 text-xs font-medium text-gray-100">
                      {product?.categoryRel?.name || product?.category || 'Lain-lain'}
                    </div>
                  </div>
                  
                  <div className="p-8 space-y-4 relative z-10 bg-gradient-to-t from-black via-zinc-900/50 to-transparent -mt-20 pt-24">
                    <h3 className="text-2xl font-bold text-white group-hover:text-gold-400 transition-colors">{product.name}</h3>
                    
                    <div className="flex justify-between items-center text-sm text-gray-400 border-t border-white/10 pt-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-gold-500"></span>
                        {product.weight}g
                      </div>
                      <div className="font-mono text-gold-500">
                        {!product.hidePrice && product.price > 0 
                          ? `RM ${product.price.toLocaleString()}` 
                          : 'Harga Tersembunyi'}
                      </div>
                    </div>

                    <Link href={`/products/${product.id}`} className="block w-full text-center py-3 mt-4 bg-white/5 hover:bg-gold-500 hover:text-black border border-white/10 hover:border-gold-500 rounded-lg transition-all duration-300 font-medium">
                      Lihat Butiran
                    </Link>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-3 text-center text-gray-500 py-12">
                Tiada produk tersedia buat masa ini.
              </div>
            )}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/products"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors"
            >
              Lihat Semua Produk <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features / Why Us */}
      <section id="about" className="py-24 bg-zinc-900">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-3xl md:text-4xl font-bold leading-tight">
                👑 Kenapa Kami Berbeza
              </h2>
              <p className="text-gray-400 text-lg">
                Kami bukan sekadar menjual emas — kami menawarkan nilai, kepercayaan & eksklusiviti.
              </p>
              
              <div className="space-y-6">
                {[
                  { icon: CheckCircle, title: "Emas Tulen 916 / 999", desc: "Tulen, berkualiti, dan diyakini." },
                  { icon: CheckCircle, title: "Rekaan Premium & Limited", desc: "Design eksklusif untuk yang menghargai gaya." },
                  { icon: CheckCircle, title: "Preloved Dipilih (Condition Hampir Baru)", desc: "Hanya item terbaik yang melepasi saringan." },
                  { icon: CheckCircle, title: "Harga Kompetitif & Telus", desc: "Nilai terbaik tanpa kompromi." },
                  { icon: CheckCircle, title: "Khidmat Personal (1-to-1 consultation)", desc: "Bimbingan pilihan ikut keperluan anda." },
                ].map((feature, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gold-500/10 flex items-center justify-center flex-shrink-0 text-gold-500">
                      <feature.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-white">{feature.title}</h4>
                      <p className="text-gray-400 text-sm">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-gold-500 to-gold-700 rounded-2xl opacity-20 blur-2xl"></div>
              <div className="relative bg-black rounded-2xl border border-white/10 p-8 aspect-square flex flex-col justify-center items-center text-center space-y-6">
                 <div className="w-24 h-24 bg-gold-500 rounded-full flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(212,175,55,0.4)]">
                    <Lock className="w-10 h-10 text-black" />
                 </div>
                 <h3 className="text-2xl font-bold">💰 Harga Eksklusif Untuk Ahli</h3>
                 <p className="text-gray-400">
                   Nikmati harga lebih istimewa dengan menjadi Ahli Privilege kami.
                 </p>
                 <Link href="/register" className="text-gold-500 font-semibold hover:text-gold-400">
                   Jadi Ahli Privilege &rarr;
                 </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="member" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gold-600/10"></div>
        <div className="container mx-auto px-6 relative z-10 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-3xl md:text-5xl font-bold text-white">💰 Harga Eksklusif Untuk Ahli</h2>
            <p className="text-xl text-gray-300">
              Nikmati harga lebih istimewa dengan menjadi Ahli Privilege kami.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left max-w-2xl mx-auto py-8">
              {[
                "Diskaun khas setiap pembelian",
                "Akses awal design baru",
                "Harga lebih rendah berbanding non-member",
                "Priority booking & lock harga",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-gold-400 font-medium">
                  <CheckCircle className="w-5 h-5" /> {item}
                </div>
              ))}
            </div>
            <Link 
              href="/register"
              className="inline-block px-8 py-4 bg-gold-500 hover:bg-gold-400 text-black font-bold text-lg rounded-full transition-colors shadow-lg shadow-gold-500/20"
            >
              Jadi Ahli Privilege
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-zinc-950 pt-20 pb-10 border-t border-white/5">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="space-y-4">
              <Link href="/" className="text-2xl font-bold tracking-tighter">
                <span className="bg-gradient-to-r from-gold-400 via-yellow-200 to-gold-500 bg-clip-text text-transparent">
                  AmyEmpire
                </span>
              </Link>
              <p className="text-gray-500 text-sm">
                Platform utama untuk perdagangan emas yang selamat dan eksklusif.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-white mb-6">Platform</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><Link href="#products" className="hover:text-gold-500">Koleksi</Link></li>
                <li><Link href="#member" className="hover:text-gold-500">Ahli Privilege</Link></li>
                <li><Link href="/login" className="hover:text-gold-500">Log Masuk</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-white mb-6">Syarikat</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><Link href="#about" className="hover:text-gold-500">Tentang Kami</Link></li>
                <li><Link href="#" className="hover:text-gold-500">Kerjaya</Link></li>
                <li><Link href="#" className="hover:text-gold-500">Hubungi</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-white mb-6">Undang-undang</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><Link href="#" className="hover:text-gold-500">Dasar Privasi</Link></li>
                <li><Link href="#" className="hover:text-gold-500">Terma Perkhidmatan</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/5 text-center text-sm text-gray-600">
            &copy; {new Date().getFullYear()} AmyEmpire. Hak cipta terpelihara.
          </div>
        </div>
      </footer>
    </div>
  );
}
