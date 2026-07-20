# Dr. Arif Raza — Next.js clinic platform

A modern, responsive Next.js website with Supabase authentication, dynamic treatment/article content, patient-linked bookings, role-protected administration and image uploads.

## Local setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` and add the Supabase project URL and anon key.
3. Run `supabase/schema.sql` in the Supabase SQL editor. For an existing installation, also run `supabase/upgrade_v2.sql`.
4. Create the first user through `/login`, then promote that exact authenticated user in the SQL editor:
   `update public.profiles set role = 'admin' where id = 'USER_UUID';`
   Sign out and sign back in after changing the role. The account icon will then open `/admin`.
5. Start with `npm run dev`.

Without environment variables, the public site runs with built-in content and appointment requests are kept in browser storage for preview.

## Content model

- `treatments`: public treatment detail pages and listing cards
- `articles`: health library posts
- `site_settings`: flexible JSON settings for future site-wide content
- `site_pages`: editable headings and section copy for every public page
- `navigation_items`: editable header/footer links, ordering and visibility
- `gallery_items`: public gallery images, categories and captions
- `appointments`: guest or user-linked appointment requests
- `profiles`: patient/admin roles
- `site-media` storage bucket: public content images with admin-only writes

Legacy `.html` URLs redirect to the equivalent new routes.
