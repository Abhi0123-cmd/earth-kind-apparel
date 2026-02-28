# Second Chance — Owner's Manual

> Complete guide to managing, maintaining, and operating your e-commerce website.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Frontend — Where Your Website Lives](#2-frontend)
3. [Backend — Where Your Data Lives](#3-backend)
4. [Admin Dashboard Guide](#4-admin-dashboard)
5. [Managing Products & Inventory](#5-products--inventory)
6. [Order Lifecycle](#6-order-lifecycle)
7. [Payment Integration (Razorpay)](#7-razorpay)
8. [Shipping Integration (Shiprocket)](#8-shiprocket)
9. [Invoicing Integration (Zoho Books)](#9-zoho-books)
10. [Email Notifications (Brevo)](#10-brevo)
11. [Authentication & User Management](#11-auth)
12. [Domain & DNS](#12-domain)
13. [Token Refresh & Maintenance Schedule](#13-maintenance)
14. [Troubleshooting & Common Issues](#14-troubleshooting)
15. [Go-Live Checklist](#15-go-live-checklist)

---

## 1. Architecture Overview

| Layer | Technology | Location |
|-------|-----------|----------|
| Frontend | React + Vite + Tailwind CSS | Lovable Cloud (hosted at `seconddchance.com`) |
| Backend | Lovable Cloud (Supabase) | Managed cloud — database, auth, edge functions, storage |
| Payments | Razorpay | External SaaS — API keys stored as encrypted secrets |
| Shipping | Shiprocket | External SaaS — API token stored as encrypted secret |
| Invoicing | Zoho Books | External SaaS — OAuth refresh token stored as secret |
| Emails | Brevo (Sendinblue) | External SaaS — API key stored as secret |

**Key principle**: All sensitive credentials are stored as encrypted backend secrets, never in the frontend code.

---

## 2. Frontend

### Where it's hosted
Your frontend is hosted on **Lovable Cloud**. The published URL is accessible at your custom domain `seconddchance.com`.

### How to make changes
1. Go to [lovable.dev](https://lovable.dev) and open your project
2. Use the chat interface to describe changes (e.g., "Change the hero heading to...")
3. Use **Visual Edits** for quick text/color/font changes without AI credits
4. Click **Publish → Update** to push changes live

### Key pages
| Page | Route | Purpose |
|------|-------|---------|
| Home | `/` | Hero + featured product |
| Shop | `/shop` | Product listing |
| Product Detail | `/product/:slug` | Individual product with size/color selection |
| Cart | `/cart` | Shopping cart |
| Checkout | `/checkout` | Shipping address + payment |
| Orders | `/orders` | Customer order history |
| Auth | `/auth` | Login / Sign up |
| Admin Dashboard | `/admin` | Full admin panel |

---

## 3. Backend

### Accessing the backend
In Lovable, click the **Cloud** tab to access:
- **Database**: View/edit tables, export data
- **Users**: See registered users
- **Edge Functions**: View logs for backend functions
- **Secrets**: Manage API keys

### Database tables
| Table | Purpose |
|-------|---------|
| `products` | Product catalog (name, price, slug, images) |
| `product_variants` | Size/color/stock per product |
| `orders` | Customer orders with shipping info |
| `order_items` | Individual items in each order |
| `payments` | Razorpay payment records |
| `shipments` | Shiprocket shipping tracking |
| `refunds` | Refund records |
| `returns` | Return requests |
| `profiles` | Customer profiles |
| `user_roles` | Admin/user role assignments |
| `support_tickets` | Customer support tickets |
| `ticket_messages` | Messages within support tickets |
| `activity_logs` | Admin action audit trail |

### Price format
All prices are stored in **paise** (1 INR = 100 paise). So ₹999 = `99900` in the database.

---

## 4. Admin Dashboard

Access at: `seconddchance.com/admin`

**Requirements**: You must be logged in with an account that has the `admin` role in the `user_roles` table.

### Sections
- **Dashboard**: Revenue, order count, return summary
- **Orders**: View/update all orders, bulk status changes
- **Inventory**: View and edit stock levels for each variant
- **Returns**: Manage return requests (approve/reject)
- **Refunds**: Track refund status
- **Support**: Respond to customer support tickets
- **Integrations**: View status of connected services

---

## 5. Products & Inventory

### Adding a new product
Currently, products are managed directly in the database. To add a product:

1. Open Lovable → Cloud → Database → `products` table
2. Insert a new row with:
   - `name`: Product name
   - `slug`: URL-friendly name (e.g., `classic-hoodie`)
   - `price`: Price in paise (e.g., `149900` for ₹1,499)
   - `category`: e.g., "T-Shirts", "Hoodies"
   - `images`: Array of image URLs
   - `is_active`: `true` to make it visible
3. Add variants in `product_variants` table with:
   - `product_id`: The UUID from step 2
   - `size`: "S", "M", "L", "XL"
   - `color`: "White", "Black", etc.
   - `color_hex`: Hex code (e.g., "#F5F5F5")
   - `sku`: Unique SKU code
   - `stock`: Number of units available

### Updating stock
Use the Admin Dashboard → Inventory page to update stock levels inline.

### Disabling a product
Set `is_active` to `false` in the `products` table. It will disappear from the shop immediately.

---

## 6. Order Lifecycle

```
Customer places order → pending
  ↓
Razorpay payment captured → paid
  ↓
Shiprocket order created → processing
  ↓
Shiprocket picks up → shipped
  ↓
Delivered → delivered
```

### Status values
`pending` → `confirmed` → `paid` → `processing` → `shipped` → `delivered`

Other statuses: `cancelled`, `refunded`, `return_requested`, `return_approved`, `returned`

---

## 7. Razorpay (Payments)

### How it works
1. Customer clicks "Pay" → Edge function `create-razorpay-order` creates a Razorpay order
2. Razorpay checkout modal opens in the browser
3. Customer completes payment
4. Edge function `verify-razorpay-payment` verifies the signature
5. Webhook `razorpay-webhook` handles async payment events

### Secrets involved
| Secret | Purpose |
|--------|---------|
| `RAZORPAY_KEY_ID` | Public API key (also in frontend) |
| `RAZORPAY_KEY_SECRET` | Private key for server-side verification |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook signature verification |

### Switching to production
1. Log into [dashboard.razorpay.com](https://dashboard.razorpay.com)
2. Complete KYC verification
3. Switch to **Live Mode**
4. Copy your **Live** Key ID, Key Secret, and Webhook Secret
5. Update secrets in Lovable → Cloud → Secrets
6. Update the webhook URL in Razorpay dashboard to: `https://<your-supabase-url>/functions/v1/razorpay-webhook`

### ⚠️ Important
- Test mode keys start with `rzp_test_`
- Live mode keys start with `rzp_live_`
- **Never mix test and live keys**

---

## 8. Shiprocket (Shipping)

### How it works
1. After payment is confirmed, `create-shiprocket-order` creates a shipment
2. `poll-shiprocket-status` periodically checks delivery status
3. `carrier-webhook` receives real-time updates from Shiprocket

### Secrets involved
| Secret | Purpose |
|--------|---------|
| `SHIPROCKET_EMAIL` | Shiprocket account email |
| `SHIPROCKET_PASSWORD` | Shiprocket account password |
| `SHIPROCKET_TOKEN` | API authentication token |

### ⚠️ Token refresh required
The Shiprocket API token expires every **10 days**. You need to:
1. Generate a new token from the Shiprocket dashboard (Settings → API)
2. Update the `SHIPROCKET_TOKEN` secret in Lovable → Cloud → Secrets

**Recommendation**: Consider setting a recurring calendar reminder every 9 days to refresh this token.

---

## 9. Zoho Books (Invoicing)

### How it works
1. After payment confirmation, `create-zoho-invoice` generates an invoice
2. The `zoho-token-exchange` function handles OAuth token refresh

### Secrets involved
| Secret | Purpose |
|--------|---------|
| `ZOHO_CLIENT_ID` | OAuth app client ID |
| `ZOHO_CLIENT_SECRET` | OAuth app client secret |
| `ZOHO_REFRESH_TOKEN` | Long-lived refresh token for auto-authentication |
| `ZOHO_ORG_ID` | Your Zoho organization ID |

### Token behavior
The refresh token is **long-lived** and auto-refreshes access tokens. However, if you change your Zoho password or revoke the app, you'll need to re-authorize:
1. Go to Zoho API Console → your app → generate a new authorization code
2. Exchange it for a new refresh token
3. Update `ZOHO_REFRESH_TOKEN` in Lovable → Cloud → Secrets

---

## 10. Brevo (Email Notifications)

### How it works
The `send-brevo-email` edge function sends transactional emails for:
- Order confirmation
- Shipping updates
- Password reset

### Secrets involved
| Secret | Purpose |
|--------|---------|
| `BREVO_API_KEY` | Brevo API key for sending emails |

### Setup
1. Configure your sender email in Brevo dashboard
2. Verify your sending domain for better deliverability
3. The API key does not expire unless you regenerate it

---

## 11. Authentication & User Management

### How it works
- Email + password authentication
- Email verification required before login
- Password reset via email
- User profiles auto-created on signup

### Making someone an admin
1. Find the user's UUID in Lovable → Cloud → Users
2. Go to the `user_roles` table
3. Change their `role` from `user` to `admin`
4. They can now access `/admin`

---

## 12. Domain & DNS

### Current setup
- Domain: `seconddchance.com` (via GoDaddy)
- DNS: A record → `185.158.133.1`

### If you need to update DNS
1. Log into GoDaddy → DNS Management
2. Ensure A record points to `185.158.133.1`
3. TTL: 600 seconds recommended
4. Changes propagate within 1-48 hours

---

## 13. Token Refresh & Maintenance Schedule

| Integration | Token Type | Expiry | Action Required |
|-------------|-----------|--------|-----------------|
| **Shiprocket** | API Token | **10 days** | ⚠️ Manually refresh every 9 days |
| **Zoho Books** | Refresh Token | Long-lived | Auto-refreshes; only re-auth if password changes |
| **Razorpay** | API Key | Never expires | No action needed unless you regenerate keys |
| **Brevo** | API Key | Never expires | No action needed unless you regenerate keys |

### Recommended maintenance routine
- **Every 9 days**: Refresh Shiprocket token
- **Monthly**: Check admin dashboard for stuck orders, review activity logs
- **Quarterly**: Review Razorpay settlement reports, reconcile with Zoho Books

---

## 14. Troubleshooting & Common Issues

### "Payment failed" or "Order stuck in pending"
1. Check Razorpay dashboard for the payment status
2. Check edge function logs in Lovable → Cloud → Edge Functions → `verify-razorpay-payment`
3. If payment was captured but order not updated, manually update the order status in the `orders` table

### "Shipping not created after payment"
1. Check if `SHIPROCKET_TOKEN` has expired (most common cause)
2. Check edge function logs for `create-shiprocket-order`
3. Refresh the Shiprocket token and retry

### "Invoices not generating"
1. Check if `ZOHO_REFRESH_TOKEN` is still valid
2. Check edge function logs for `create-zoho-invoice`
3. Re-authorize Zoho if needed (see Section 9)

### "Emails not sending"
1. Check Brevo dashboard for delivery logs
2. Verify sender domain is properly configured
3. Check edge function logs for `send-brevo-email`

### "Product image not showing"
1. Check the `images` array in the `products` table
2. Ensure URLs are publicly accessible
3. For the mock/fallback product, the image is bundled in the frontend assets

### "Customer can't log in"
1. Check if they verified their email (confirmation email is required)
2. Check Lovable → Cloud → Users for their account status
3. They can use "Forgot Password" to reset

### "Admin dashboard returns 403"
1. Verify the user has `admin` role in `user_roles` table
2. Make sure they're logged in with the correct account

### "Site showing outdated content"
1. Click **Publish → Update** in Lovable to push latest frontend changes
2. Backend changes (edge functions, DB) deploy automatically

---

## 15. Go-Live Checklist

Before accepting real customer orders, complete these steps:

### ✅ Already done
- [x] Database schema with RLS security policies
- [x] Authentication system (signup, login, email verification)
- [x] Admin dashboard with order/inventory/return management
- [x] Product catalog with variant-based inventory
- [x] Cart and checkout flow
- [x] SEO metadata (title, description, Open Graph, JSON-LD)
- [x] Sitemap and robots.txt
- [x] Security hardening (profiles RLS, leaked password protection)

### 🔲 Required before going live
- [ ] **Razorpay**: Switch from test keys (`rzp_test_`) to live keys (`rzp_live_`). Complete KYC on Razorpay dashboard.
- [ ] **Razorpay Webhook**: Update the webhook URL in Razorpay dashboard to your production edge function URL
- [ ] **Shiprocket**: Ensure your Shiprocket account has a valid pickup address and active courier partners
- [ ] **Shiprocket Token**: Generate a fresh API token and update the `SHIPROCKET_TOKEN` secret
- [ ] **Zoho Books**: Verify your Zoho org has the correct GST and business details for invoices
- [ ] **Brevo**: Verify your sender domain for reliable email delivery
- [ ] **Domain**: Confirm `seconddchance.com` DNS is pointing to `185.158.133.1` and SSL is active
- [ ] **End-to-end test**: Place a test order through the entire flow (browse → cart → checkout → pay → verify order in admin)
- [ ] **Product images**: Consider uploading product images to cloud storage for admin management (Phase 6 — optional)

### 🔲 Recommended
- [ ] Set up Google Analytics / Search Console for traffic monitoring
- [ ] Generate a proper OG image (1200×630) for social media previews
- [ ] Configure a custom "from" email address in Brevo for professional appearance
- [ ] Set a recurring reminder (every 9 days) for Shiprocket token refresh

---

## Quick Reference — Edge Functions

| Function | Trigger | Purpose |
|----------|---------|---------|
| `create-razorpay-order` | Checkout page | Creates a Razorpay order for payment |
| `verify-razorpay-payment` | After payment modal | Verifies payment signature |
| `razorpay-webhook` | Razorpay async callback | Handles payment events |
| `create-shiprocket-order` | After payment confirmed | Creates shipping order |
| `poll-shiprocket-status` | Cron / manual | Checks delivery status |
| `carrier-webhook` | Shiprocket callback | Real-time shipping updates |
| `create-zoho-invoice` | After payment confirmed | Generates invoice |
| `zoho-token-exchange` | Internal | Refreshes Zoho access token |
| `send-brevo-email` | Various events | Sends transactional emails |

---

*Document generated for Second Chance — February 2026*
*For support, use the Lovable chat interface or contact your developer.*
