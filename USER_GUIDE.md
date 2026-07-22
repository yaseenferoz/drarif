# Dr. Arif Raza Clinic Platform — Complete User Guide

This guide explains how to install, configure, use and maintain the clinic website.

## 1. What the application includes

### Public website

- Home page: `/`
- About: `/about`
- Treatments: `/treatments`
- Individual treatment pages: `/treatments/<slug>`
- Health library: `/articles`
- Individual articles: `/articles/<slug>`
- Gallery: `/gallery`
- Contact: `/contact`
- Appointment booking: `/booking`
- Patient sign-in and portal: `/login`, `/portal`
- Privacy and terms: `/privacy`, `/terms`

### Admin portal

The protected admin portal is available at `/admin` and includes:

- Overview and operational insights
- Appointment requests
- Editable pages
- Treatments
- Health articles
- Navigation menus
- Gallery
- Site settings
- Media library

## 2. Local installation

Requirements:

- Node.js 18.18 or newer
- A Supabase project
- npm

Run:

```bash
npm install
copy .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

For a production build:

```bash
npm run build
npm run start
```

## 3. Environment variables

Copy `.env.example` to `.env.local` and fill in the Supabase values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

AI provider keys must remain server-side. Never use `NEXT_PUBLIC_` for an AI key and never commit `.env.local`.

After changing environment variables, restart the Next.js server.

## 4. Supabase setup

1. Create or open the Supabase project.
2. Open **SQL Editor**.
3. Run `supabase/schema.sql`.
4. For the CMS, gallery, navigation, site settings and appointment status features, run `supabase/upgrade_v2.sql`.
5. If appointment delete/update permissions are missing, run `supabase/fix_appointments_permissions.sql`.
6. Confirm the expected tables exist:

   - `profiles`
   - `appointments`
   - `site_pages`
   - `navigation_items`
   - `gallery_items`
   - `treatments`
   - `articles`
   - `site_settings`

The `site-media` Storage bucket is used for reusable images. Its public read URL is used by the website; admin users require write/delete policies.

## 5. Creating the first admin user

1. Open `/login`.
2. Create an account or sign in with the Supabase Auth account.
3. In Supabase SQL Editor, promote that exact account:

```sql
update public.profiles
set role = 'admin'
where id = (
  select id from auth.users
  where lower(email) = lower('admin@example.com')
);
```

4. Sign out and sign in again.
5. Open `/admin` or use the account icon in the header.

Verify the role:

```sql
select u.email, p.role
from auth.users u
join public.profiles p on p.id = u.id
where lower(u.email) = lower('admin@example.com');
```

Only accounts with `profiles.role = 'admin'` can edit CMS content.

## 6. Patient workflow

### Booking an appointment

1. Open **Book visit** or `/booking`.
2. Enter the patient’s full name.
3. Enter a valid Indian mobile number: exactly 10 digits beginning with 6–9.
4. Enter an email address if available. Email validation is automatic.
5. Choose consultation type, preferred date and preferred time.
6. Describe symptoms or report details.
7. If using the compact logged-in booking form, complete the required fields first.
8. Enable **Pre-check summary** only when the required fields are valid.
9. Answer the assistant’s questions. The report is attached to the appointment when the assessment is complete.
10. Submit the request. In the compact patient flow, completion can submit automatically.

Pre-check information is for clinician review only. It is not a diagnosis, treatment plan or emergency service.

### Duplicate booking protection

Patients with an active request should not create another request until the existing request is completed or cancelled. The active workflow statuses are:

- `new`
- `confirmed`

Completed and cancelled requests do not block a new booking.

### Patient portal

After signing in at `/login`, the patient can:

- View appointment requests and statuses
- View pre-consultation reports attached to requests
- Edit profile details such as name, date of birth, phone, address, emergency contact, allergies and medical history
- Sign out

## 7. Admin appointment workflow

Open **Admin → Appointments**.

### List controls

- Search by name, phone, email, concern or consultation type
- Filter by status
- Filter by appointment date
- Sort by newest, oldest or appointment date
- Select multiple records
- Delete selected records
- Refresh the list from Supabase
- Open **View full details** without leaving the appointment component

### Updating status

Use the status dropdown on each row:

- `new`: newly received request
- `confirmed`: clinic has confirmed the request
- `completed`: consultation/workflow completed
- `cancelled`: request cancelled

Status updates require the `status` column and authenticated update permissions. If Supabase reports a missing column, run the latest upgrade SQL and refresh the schema cache.

### Appointment details

The detail view shows:

- Patient and contact details
- Consultation date and time
- Symptoms/report details
- Readable pre-consultation summary
- Full conversation transcript

Use **Back to appointments** to return to the same list component.

## 8. Managing pages

Open **Admin → Pages**.

### Editing a page

1. Select a page and click **Edit**.
2. Update the page key, eyebrow, title and description.
3. Use the rich editor for body content.
4. Add headings, paragraphs, links, lists and images.
5. Choose an existing media item or upload a new image.
6. Set image alignment when supported by the section editor.
7. Save changes.
8. Use **Published** to control storefront visibility.

Default seeded pages are protected from deletion. Newly created pages can be removed. Use **Restore defaults** when you need to restore the original seeded page content.

### Adding a page section

Use **Add section** inside the page editor. A section can contain a heading, text, list content and an image. Keep each section focused so the public page remains readable on mobile.

## 9. Managing treatments and articles

### Treatments

Open **Admin → Treatments** to edit:

- Title and URL slug
- Category label
- Image
- Summary
- Symptoms
- Evaluation/diagnosis information
- Treatment options
- Preparation
- Recovery and follow-up
- Urgent warning signs
- Published state and sort order

### Articles

Open **Admin → Articles** to edit:

- Title and slug
- Category
- Cover image
- Short summary
- Reading time
- Full article content
- Published state

Use **Restore defaults** to restore the original seeded treatment or article collection.

## 10. Navigation menus

Open **Admin → Navigation**.

Each navigation item can be mapped to an editable CMS page or assigned a custom URL. Configure:

- Label
- CMS page mapping
- Optional custom URL
- Header/footer location
- Sort order
- Visibility

After saving, refresh the public site. Default navigation items should be preserved; newly created links can be removed. Use the navigation restore option when available to return to the seeded menu.

## 11. Gallery

Open **Admin → Gallery**.

You can:

- Add an image
- Choose an existing media URL
- Set title, caption, category and order
- Publish/unpublish an item
- Open an image in the public gallery viewer
- Edit or delete custom gallery records

Use unique record IDs for gallery items. Duplicate titles are allowed, but the UI must use the database ID as the React key.

## 12. Media library

Open **Admin → Media library**.

1. Click the branded upload area.
2. Choose a PNG, JPG or WebP image.
3. Click **Upload image**.
4. Search files by name.
5. Click an image preview or **Copy URL** to copy its public URL.
6. Paste the URL into a page, treatment, article, gallery or site-settings image field.
7. Delete unused images through the confirmation dialog.

Do not delete an image that is still referenced by public content.

## 13. Site settings

Open **Admin → Site settings** to update clinic-wide details such as:

- Logo
- Doctor name and credentials
- Phone and email
- Hospital and location
- Clinic hours

Use the existing logo asset or upload a transparent logo variant through Media library first.

## 14. Dashboard insights

Open **Admin → Overview** and use **Analyse bookings** or **Refresh insights**.

Insights summarize operational data such as:

- Total appointments
- Status distribution
- Consultation types
- Upcoming dates
- Pre-consultation coverage
- Practical scheduling observations

The report is formatted into readable sections and the latest generated report is saved in the browser so it remains visible after a refresh on that device.

Insights are operational only. They must not be used as diagnosis or clinical decision-making.

## 15. AI and pre-consultation safety

The assistant is a care-intake assistant for Dr. Arif Raza’s clinic. It should:

- Ask concise questions one at a time
- Collect context for clinician review
- Detect explicit emergency warning signs and advise urgent care
- Avoid diagnosis, treatment recommendations and prognosis

Never place provider API keys in client-side code. The browser should call the application’s server endpoints, and server code should call the configured AI provider.

If an AI provider is unavailable, the patient should still be able to submit a normal appointment request without a pre-check report.

## 16. Common problems and fixes

### The site displays plain HTML with no styling

This usually means stale or conflicting Next.js processes. Stop existing Node processes, then start one development server:

```powershell
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
npm run dev
```

Hard-refresh the browser afterward.

### Static files return 404 from `/_next/static`

Stop the old server and restart `npm run dev`. Do not run `next start` against a partially generated build.

### Admin says the account is a patient

Promote the exact Auth user ID in `profiles`, then sign out and sign in again.

### Appointment status cannot be updated

Run `supabase/upgrade_v2.sql` and confirm the `appointments.status` column exists. Check authenticated update permissions.

### Appointment deletion is denied

Run `supabase/fix_appointments_permissions.sql` and verify the admin delete policy. The database remains the final security boundary.

### Images do not appear

Check that:

- The `site-media` bucket exists.
- The image URL is public and correct.
- The image file has not been deleted.
- The URL is entered without extra quotes or spaces.

### Content changes do not appear

Confirm the record is published, save the editor, refresh the public page and check that the navigation item points to the intended CMS page.

### Rich editor errors appear

Restart the dev server and ensure only the lazy editor wrapper is importing CKEditor. Avoid importing multiple incompatible CKEditor builds in the same client bundle.

## 17. Production checklist

- Set production Supabase URL and anon key.
- Configure Supabase Auth redirect URLs for the production domain.
- Run all required SQL migrations.
- Configure Storage bucket policies.
- Confirm the first admin role.
- Keep all AI and service keys server-only.
- Test booking, status updates, deletion permissions and patient portal access.
- Test desktop and mobile navigation.
- Test image upload, image deletion confirmation and gallery viewing.
- Run:

```bash
npm run build
npm run start
```

- Verify the production domain uses HTTPS.
- Do not expose Supabase service-role keys in the browser.

## 18. Useful maintenance files

- `README.md` — quick project setup
- `.env.example` — required environment variable names
- `supabase/schema.sql` — base schema
- `supabase/upgrade_v2.sql` — CMS and appointment upgrades
- `supabase/fix_appointments_permissions.sql` — appointment permissions
- `app/admin/page.tsx` — admin portal UI
- `components/booking-form.tsx` — booking workflow
- `components/pre-consultation-assistant.tsx` — pre-consultation chat
- `components/appointment-report.tsx` — readable appointment report rendering

