# CleanCity Supabase setup

The application uses Supabase Auth for citizen accounts and PostgreSQL for
citizen profiles, complaints, notifications, and citizen dashboard statistics.
Administrator screens still use the existing demonstration data.

## 1. Create and configure the project

1. Create a project in the Supabase Dashboard.
2. Open **SQL Editor**, create a new query, paste the contents of
   `supabase/migrations/202609110001_create_citizen_profiles.sql`, and run it.
3. Create another query, paste the contents of
   `supabase/migrations/202609120001_create_citizen_dashboard_data.sql`, and run
   it. Run the migrations in this order because the dashboard migration uses
   the profile migration's updated-at function.
4. Open **Project Settings > API** and copy the Project URL and Publishable key.
5. Copy `.env.example` to `.env.local` and replace the two Supabase placeholders.
   Never use the `service_role` key in this frontend.

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
VITE_DEMO_MODE=true
```

Restart the Vite development server after changing environment variables.

## 2. Configure authentication URLs

Open **Authentication > URL Configuration** in Supabase.

- Set **Site URL** to the deployed CleanCity URL. During local development it
  can be `http://localhost:5173`.
- Add `http://localhost:5173/**` to **Redirect URLs** for local testing.
- Add the final deployed URL pattern before production release.

## 3. Choose the email-confirmation behavior

Open **Authentication > Providers > Email**.

- Keep **Confirm email** enabled for production. New citizens must use the link
  sent to their email before logging in.
- It can be disabled temporarily for controlled local testing.

For real email delivery, configure a custom SMTP provider before production.

## 4. Verify the installation

1. Register a new citizen using a real email address.
2. Confirm the email if confirmation is enabled.
3. Log in and open the Profile page.
4. Edit the name, phone, address, language, and notification preference.
5. Confirm the changes appear in **Table Editor > profiles**.
6. Submit a complaint and confirm a row appears in **Table Editor > complaints**
   and **Table Editor > notifications**.
7. Confirm the citizen dashboard uses those rows and shows zero instead of
   sample records for a citizen who has not submitted a complaint.
8. Sign out and verify that citizen routes redirect to Login.

The full NID is not stored. Only its final four numeric characters are retained,
and the citizen cannot change protected fields such as role, account status,
verification state, or trust score from the browser.
