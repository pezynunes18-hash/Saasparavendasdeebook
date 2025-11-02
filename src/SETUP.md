# Ebook SaaS - Setup Instructions

## Stripe Configuration

To enable payments in your ebook store, you need to configure Stripe:

### 1. Get Your Stripe API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Sign up or log in to your Stripe account
3. Get both keys:
   - **Secret Key** (starts with `sk_test_...`) - Already configured in environment
   - **Publishable Key** (starts with `pk_test_...`) - Needs to be added to code

### 2. Update the Publishable Key

Open `/components/Store.tsx` and replace the `stripePromise` initialization with your actual publishable key:

```typescript
const stripePromise = loadStripe('pk_test_YOUR_ACTUAL_KEY_HERE');
```

### 3. Test Payment

Use these test card details:
- Card Number: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

## How to Use

1. **Sign Up**: Create an account as an admin
2. **Add Ebooks**: Go to Dashboard → Add New Ebook
3. **Upload Files**: Upload PDF/EPUB files for each ebook
4. **Start Selling**: Users can browse and purchase from the store

## Features

- ✅ User Authentication
- ✅ Ebook Management Dashboard
- ✅ Stripe Payment Integration
- ✅ File Storage (Supabase)
- ✅ Purchase History
- ✅ Download Purchased Ebooks
