# Dr. Arif Raza — Next.js clinic platform

A modern, responsive Next.js website with Supabase authentication, dynamic treatment/article content, patient-linked bookings, role-protected administration and image uploads.

## Local setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` and add the Supabase project URL and anon key.
3. Run `supabase/schema.sql` in the Supabase SQL editor.
4. Create the first user through `/login`, then promote it in the SQL editor:
   `update public.profiles set role = 'admin' where id = 'USER_UUID';`
5. Start with `npm run dev`.

Without environment variables, the public site runs with built-in content and appointment requests are kept in browser storage for preview.

## Content model

- `treatments`: public treatment detail pages and listing cards
- `articles`: health library posts
- `site_settings`: flexible JSON settings for future site-wide content
- `appointments`: guest or user-linked appointment requests
- `profiles`: patient/admin roles
- `site-media` storage bucket: public content images with admin-only writes

Legacy `.html` URLs redirect to the equivalent new routes.
