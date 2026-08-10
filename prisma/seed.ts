import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Production SISMA Database...');

  // 1. Pengaturan Sekolah Official
  await prisma.pengaturan.upsert({
    where: { id: 1 },
    update: {
      namaSekolah: 'SMA Swasta Persiapan Stabat',
      npsn: '10201322',
      alamat: 'JL. HIB Tembeleng, Kec. Stabat, Kab. Langkat, Prov. Sumatera Utara',
      telepon: '(061) 8911118',
      email: 'info@smapersiapan-stabat.sch.id',
      website: 'https://www.smaspersiapanstabat.sch.id/',
      kepalaSekolah: 'Irwan Amri, S.P',
      nipKepalaSekolah: '-',
      bendahara: 'Fairuza Rikha Amri, S.E, M.Si',
      nipBendahara: '-',
      logo: '/logo_sisma.png',
    },
    create: {
      id: 1,
      namaSekolah: 'SMA Swasta Persiapan Stabat',
      npsn: '10201322',
      alamat: 'JL. HIB Tembeleng, Kec. Stabat, Kab. Langkat, Prov. Sumatera Utara',
      telepon: '(061) 8911118',
      email: 'info@smapersiapan-stabat.sch.id',
      website: 'https://www.smaspersiapanstabat.sch.id/',
      kepalaSekolah: 'Irwan Amri, S.P',
      nipKepalaSekolah: '-',
      bendahara: 'Fairuza Rikha Amri, S.E, M.Si',
      nipBendahara: '-',
      logo: '/logo_sisma.png',
    },
  });

  // 2. Tahun Ajaran Aktif
  let taActive = await prisma.tahunAjaran.findFirst({ where: { status: 'AKTIF' } });
  if (!taActive) {
    taActive = await prisma.tahunAjaran.create({
      data: {
        tahunAjaran: '2026/2027',
        status: 'AKTIF',
      },
    });
  }

  // 3. User Administrator Utama (Strong Credentials for Production)
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      password: 'Stabat#2026!Sisma',
      namaLengkap: 'Administrator Utama',
      level: 'admin',
    },
    create: {
      username: 'admin',
      password: 'Stabat#2026!Sisma',
      namaLengkap: 'Administrator Utama',
      level: 'admin',
      idTahunAjaran: taActive.id,
    },
  });

  // 4. Default Pos Bayar & Jenis Pembayaran SPP
  const posSPP = await prisma.posBayar.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      namaPosBayar: 'SPP Bulanan',
      keterangan: 'Pembayaran Sumbangan Pembinaan Pendidikan',
    },
  });

  await prisma.jenisPembayaran.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      idPosBayar: posSPP.id,
      idTahunAjaran: taActive.id,
      tipeBayar: 'bulanan',
    },
  });

  console.log('Production Database Seed Completed Cleanly!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
