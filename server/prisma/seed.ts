import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient({
  // @ts-ignore
  datasourceUrl: process.env.DATABASE_URL,
});

async function main() {
  const nodeEnv = typeof process.env.NODE_ENV === 'string' ? process.env.NODE_ENV.toLowerCase() : '';
  const isProd = nodeEnv === 'production';

  const adminEmail = (process.env.DEFAULT_ADMIN_EMAIL || 'admin@goldexclude.com').trim();
  const adminUsername = (process.env.DEFAULT_ADMIN_USERNAME || 'admin').trim();
  const adminPassword =
    typeof process.env.DEFAULT_ADMIN_PASSWORD === 'string' && process.env.DEFAULT_ADMIN_PASSWORD.trim()
      ? process.env.DEFAULT_ADMIN_PASSWORD.trim()
      : isProd
        ? ''
        : 'adminpassword123';

  if (isProd && !adminPassword) {
    throw new Error('DEFAULT_ADMIN_PASSWORD is required in production');
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        username: adminUsername,
        password: hashedPassword,
        name: 'Super Admin',
        role: 'ADMIN',
      },
    });
    console.log(`Admin user created: ${admin.email}`);
  } else {
    console.log(`Admin user already exists: ${existingAdmin.email}`);
  }

  // Seed Products
  const products = [
    {
      name: 'Jongkong Emas 1 Gram 999.9',
      description: 'Jongkong emas 1 gram dengan ketulenan 999.9. Sesuai untuk pelaburan kecil-kecilan atau sebagai hadiah. Didatangkan dengan sijil ketulenan.',
      weight: 1.0,
      purity: '999.9',
      price: 380.00,
      stock: 50,
      imageUrl: 'https://placehold.co/600x400/D4AF37/FFFFFF?text=1g+Gold+999.9',
      category: 'Gold Bar',
    },
    {
      name: 'Jongkong Emas 5 Gram 999.9',
      description: 'Jongkong emas 5 gram tulen 999.9. Pilihan popular untuk penyimpan emas tegar. Mudah dicairkan di mana-mana sahaja.',
      weight: 5.0,
      purity: '999.9',
      price: 1900.00,
      stock: 30,
      imageUrl: 'https://placehold.co/600x400/D4AF37/FFFFFF?text=5g+Gold+999.9',
      category: 'Gold Bar',
    },
    {
      name: 'Jongkong Emas 10 Gram 999.9',
      description: 'Jongkong emas 10 gram 999.9. Saiz yang ideal untuk pelaburan jangka masa panjang. Nilai spread yang rendah.',
      weight: 10.0,
      purity: '999.9',
      price: 3800.00,
      stock: 25,
      imageUrl: 'https://placehold.co/600x400/D4AF37/FFFFFF?text=10g+Gold+999.9',
      category: 'Gold Bar',
    },
    {
      name: 'Jongkong Emas 20 Gram 999.9',
      description: 'Jongkong emas 20 gram berkualiti tinggi. Ketulenan 999.9 dijamin. Sesuai untuk mempelbagaikan portfolio pelaburan anda.',
      weight: 20.0,
      purity: '999.9',
      price: 7600.00,
      stock: 15,
      imageUrl: 'https://placehold.co/600x400/D4AF37/FFFFFF?text=20g+Gold+999.9',
      category: 'Gold Bar',
    },
    {
      name: 'Jongkong Emas 50 Gram 999.9',
      description: 'Jongkong emas 50 gram premium. Aset pelindung nilai kekayaan yang unggul. Reka bentuk eksklusif.',
      weight: 50.0,
      purity: '999.9',
      price: 19000.00,
      stock: 10,
      imageUrl: 'https://placehold.co/600x400/D4AF37/FFFFFF?text=50g+Gold+999.9',
      category: 'Gold Bar',
    },
    {
      name: 'Jongkong Emas 100 Gram 999.9',
      description: 'Jongkong emas 100 gram untuk pelabur serius. Spread paling rendah dan nilai jualan balik yang tinggi.',
      weight: 100.0,
      purity: '999.9',
      price: 38000.00,
      stock: 5,
      imageUrl: 'https://placehold.co/600x400/D4AF37/FFFFFF?text=100g+Gold+999.9',
      category: 'Gold Bar',
    },
    {
      name: '1 Dinar Emas 916 (4.25g)',
      description: 'Syiling 1 Dinar Emas seberat 4.25g dengan ketulenan 916. Sesuai untuk simpanan, mahar, atau muamalat.',
      weight: 4.25,
      purity: '916',
      price: 1615.00,
      stock: 40,
      imageUrl: 'https://placehold.co/600x400/D4AF37/FFFFFF?text=1+Dinar+Emas',
      category: 'Dinar',
    },
    {
      name: '5 Dinar Emas 916 (21.25g)',
      description: 'Syiling 5 Dinar Emas seberat 21.25g. Ketulenan 916. Simbol kekayaan dan kestabilan ekonomi Islam.',
      weight: 21.25,
      purity: '916',
      price: 8075.00,
      stock: 20,
      imageUrl: 'https://placehold.co/600x400/D4AF37/FFFFFF?text=5+Dinar+Emas',
      category: 'Dinar',
    },
    {
      name: '10 Dinar Emas 916 (42.5g)',
      description: 'Syiling 10 Dinar Emas seberat 42.5g. Pilihan terbaik untuk menyimpan aset fizikal yang mudah dibawa.',
      weight: 42.50,
      purity: '916',
      price: 16150.00,
      stock: 10,
      imageUrl: 'https://placehold.co/600x400/D4AF37/FFFFFF?text=10+Dinar+Emas',
      category: 'Dinar',
    },
    {
      name: 'Koleksi Bunga Raya 10g Limited Edition',
      description: 'Edisi Terhad: Jongkong emas 10g dengan ukiran Bunga Raya. Ketulenan 999.9. Sangat sesuai untuk dijadikan koleksi.',
      weight: 10.0,
      purity: '999.9',
      price: 3850.00,
      stock: 50,
      imageUrl: 'https://placehold.co/600x400/D4AF37/FFFFFF?text=Bunga+Raya+10g',
      category: 'Limited Edition',
    },
  ];

  for (const product of products) {
    const existingProduct = await prisma.product.findFirst({
      where: { name: product.name },
    });

    if (!existingProduct) {
      await prisma.product.create({
        data: product,
      });
      console.log(`Product created: ${product.name}`);
    } else {
      console.log(`Product already exists: ${product.name}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
