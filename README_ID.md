# PhotoPrinter Pro — License Admin (Starter)

Paket awal panel Next.js untuk Vercel + Supabase.

## PENTING
Edge Function yang saat ini Anda deploy hanya mendukung `trial`, `activate`, dan `status`. Panel ini memerlukan aksi tambahan `admin_create`, `admin_list`, dan `admin_revoke`. **Jangan gunakan panel untuk menerbitkan lisensi sampai backend admin tersebut ditambahkan dan diuji.**

## Langkah GitHub dan Vercel
1. Ekstrak ZIP.
2. Buat repository GitHub bernama `photoprinter-license-admin`.
3. Upload seluruh isi folder ini ke root repository.
4. Buka Vercel → Add New → Project → Import repository.
5. Tambahkan Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`: Project URL Supabase.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: publishable/anon key. Bukan service role/secret.
6. Deploy.

## Supabase Auth
Buat akun administrator melalui Authentication → Users (email/password). Backend nantinya harus memverifikasi JWT dengan `auth.getUser(token)` dan membandingkan email dengan `ADMIN_EMAIL` yang disimpan sebagai Edge Function Secret.

## Keamanan
Jangan pernah menaruh service role key di frontend atau GitHub. Kode lisensi harus di-hash di server, dan operasi admin hanya boleh dijalankan setelah autentikasi admin terverifikasi. Paket ini adalah starter UI, belum sistem produksi siap jual.