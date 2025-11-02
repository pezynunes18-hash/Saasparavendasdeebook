import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@17.4.0';
import * as kv from './kv_store.tsx';

const app = new Hono();

app.use('*', cors());
app.use('*', logger(console.log));

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Initialize Stripe
const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
console.log('Stripe key configured:', stripeKey ? `Yes (${stripeKey.substring(0, 7)}...)` : 'No');

const stripe = new Stripe(stripeKey || 'sk_test_dummy', {
  apiVersion: '2024-11-20.acacia',
});

// Initialize storage bucket
const bucketName = 'make-b50138d4-ebooks';
const { data: buckets } = await supabase.storage.listBuckets();
const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
if (!bucketExists) {
  const { error } = await supabase.storage.createBucket(bucketName, { public: false });
  if (error) console.log('Error creating bucket:', error);
}

// Helper to verify user
async function verifyUser(request: Request) {
  const accessToken = request.headers.get('Authorization')?.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  if (!user?.id || error) {
    return null;
  }
  return user;
}

// Auth routes
app.post('/make-server-b50138d4/signup', async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      email_confirm: true // Auto-confirm since email server not configured
    });

    if (error) {
      console.log('Signup error:', error);
      return c.json({ error: error.message }, 400);
    }

    // Store user profile
    await kv.set(`user:${data.user.id}:profile`, {
      id: data.user.id,
      email,
      name,
      isAdmin: false,
      createdAt: new Date().toISOString()
    });

    return c.json({ success: true, user: data.user });
  } catch (error) {
    console.log('Signup exception:', error);
    return c.json({ error: 'Signup failed' }, 500);
  }
});

// Vendor signup
app.post('/make-server-b50138d4/vendor-signup', async (c) => {
  try {
    const { email, password, name, businessName } = await c.req.json();
    
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, businessName, role: 'vendor' },
      email_confirm: true
    });

    if (error) {
      console.log('Vendor signup error:', error);
      return c.json({ error: error.message }, 400);
    }

    // Store vendor profile
    const vendorId = data.user.id;
    await kv.set(`vendor:${vendorId}`, {
      id: vendorId,
      email,
      name,
      businessName,
      status: 'pending', // pending, approved, rejected
      stripeAccountId: null,
      commission: 10, // Platform takes 10%
      createdAt: new Date().toISOString()
    });

    // Add to vendors list
    const vendorsList = await kv.get('vendors:all') || [];
    vendorsList.push(vendorId);
    await kv.set('vendors:all', vendorsList);

    return c.json({ success: true, vendor: data.user });
  } catch (error) {
    console.log('Vendor signup exception:', error);
    return c.json({ error: 'Vendor signup failed' }, 500);
  }
});

// Get vendor profile
app.get('/make-server-b50138d4/vendor-profile', async (c) => {
  try {
    const user = await verifyUser(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const vendor = await kv.get(`vendor:${user.id}`);
    if (!vendor) {
      return c.json({ error: 'Not a vendor' }, 404);
    }

    return c.json({ vendor });
  } catch (error) {
    console.log('Get vendor profile error:', error);
    return c.json({ error: 'Failed to get vendor profile' }, 500);
  }
});

// Stripe Connect Onboarding
app.post('/make-server-b50138d4/vendor-onboarding', async (c) => {
  try {
    console.log('=== Stripe Onboarding Request ===');
    
    const user = await verifyUser(c.req.raw);
    if (!user) {
      console.log('Unauthorized user');
      return c.json({ error: 'Unauthorized' }, 401);
    }
    console.log('User ID:', user.id);

    const vendor = await kv.get(`vendor:${user.id}`);
    if (!vendor) {
      console.log('Not a vendor');
      return c.json({ error: 'Not a vendor' }, 404);
    }
    console.log('Vendor status:', vendor.status);
    console.log('Vendor email:', vendor.email);

    if (vendor.status !== 'approved') {
      console.log('Vendor not approved yet');
      return c.json({ error: 'Vendedor ainda não aprovado. Aguarde a aprovação do administrador.' }, 403);
    }

    // Check if Stripe is configured
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey || stripeKey === '') {
      console.log('Stripe not configured');
      return c.json({ error: 'Stripe não configurado. Configure a chave STRIPE_SECRET_KEY.' }, 500);
    }
    console.log('Stripe configured');

    // Create Stripe Connect account if doesn't exist
    let stripeAccountId = vendor.stripeAccountId;

    if (!stripeAccountId) {
      console.log('Creating new Stripe Connect account...');
      try {
        const account = await stripe.accounts.create({
          type: 'express',
          email: vendor.email,
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
          business_type: 'individual',
        });

        stripeAccountId = account.id;
        vendor.stripeAccountId = stripeAccountId;
        await kv.set(`vendor:${user.id}`, vendor);
        console.log('Stripe account created:', stripeAccountId);
      } catch (stripeError: any) {
        console.error('Stripe account creation error:', stripeError);
        return c.json({ 
          error: `Erro ao criar conta Stripe: ${stripeError.message}` 
        }, 500);
      }
    } else {
      console.log('Using existing Stripe account:', stripeAccountId);
    }

    // Create account link for onboarding
    console.log('Creating account link...');
    const origin = c.req.header('origin') || 'http://localhost:5173';
    console.log('Origin:', origin);
    
    try {
      const accountLink = await stripe.accountLinks.create({
        account: stripeAccountId,
        refresh_url: `${origin}/vendor-dashboard`,
        return_url: `${origin}/vendor-dashboard`,
        type: 'account_onboarding',
      });

      console.log('Account link created successfully');
      return c.json({ url: accountLink.url });
    } catch (linkError: any) {
      console.error('Account link creation error:', linkError);
      return c.json({ 
        error: `Erro ao criar link de onboarding: ${linkError.message}` 
      }, 500);
    }
  } catch (error: any) {
    console.error('Vendor onboarding error:', error);
    return c.json({ 
      error: `Falha ao criar link de conexão: ${error.message}` 
    }, 500);
  }
});

// Ebook management routes
app.post('/make-server-b50138d4/ebooks', async (c) => {
  try {
    const user = await verifyUser(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const { title, description, price, coverUrl, author, category } = await c.req.json();
    
    // Check if user is vendor
    const vendor = await kv.get(`vendor:${user.id}`);
    
    const ebookId = crypto.randomUUID();
    const ebook = {
      id: ebookId,
      title,
      description,
      price,
      coverUrl,
      author,
      category: category || null,
      createdBy: user.id,
      vendorId: vendor ? user.id : null, // Associate with vendor if exists
      createdAt: new Date().toISOString()
    };

    await kv.set(`ebook:${ebookId}`, ebook);
    
    // Add to ebooks list
    const ebooksList = await kv.get('ebooks:all') || [];
    ebooksList.push(ebookId);
    await kv.set('ebooks:all', ebooksList);

    // Add to vendor's ebooks if vendor
    if (vendor) {
      const vendorEbooks = await kv.get(`vendor:${user.id}:ebooks`) || [];
      vendorEbooks.push(ebookId);
      await kv.set(`vendor:${user.id}:ebooks`, vendorEbooks);
    }

    return c.json({ success: true, ebook });
  } catch (error) {
    console.log('Create ebook error:', error);
    return c.json({ error: 'Failed to create ebook' }, 500);
  }
});

app.get('/make-server-b50138d4/ebooks', async (c) => {
  try {
    const ebooksList = await kv.get('ebooks:all') || [];
    const ebooks = await kv.mget(ebooksList.map((id: string) => `ebook:${id}`));
    return c.json({ ebooks: ebooks.filter(Boolean) });
  } catch (error) {
    console.log('Get ebooks error:', error);
    return c.json({ error: 'Failed to get ebooks' }, 500);
  }
});

app.get('/make-server-b50138d4/ebooks/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const ebook = await kv.get(`ebook:${id}`);
    if (!ebook) {
      return c.json({ error: 'Ebook not found' }, 404);
    }
    return c.json({ ebook });
  } catch (error) {
    console.log('Get ebook error:', error);
    return c.json({ error: 'Failed to get ebook' }, 500);
  }
});

app.delete('/make-server-b50138d4/ebooks/:id', async (c) => {
  try {
    const user = await verifyUser(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const id = c.req.param('id');
    
    // Remove from list
    const ebooksList = await kv.get('ebooks:all') || [];
    const filteredList = ebooksList.filter((ebookId: string) => ebookId !== id);
    await kv.set('ebooks:all', filteredList);
    
    // Delete ebook
    await kv.del(`ebook:${id}`);

    return c.json({ success: true });
  } catch (error) {
    console.log('Delete ebook error:', error);
    return c.json({ error: 'Failed to delete ebook' }, 500);
  }
});

// Health check for Stripe
app.get('/make-server-b50138d4/stripe-status', async (c) => {
  const stripeConfigured = !!Deno.env.get('STRIPE_SECRET_KEY');
  const keyPrefix = Deno.env.get('STRIPE_SECRET_KEY')?.substring(0, 7) || 'none';
  
  return c.json({ 
    configured: stripeConfigured,
    keyPrefix: keyPrefix,
    message: stripeConfigured 
      ? 'Stripe is configured' 
      : 'Stripe secret key not found in environment'
  });
});

// Payment routes (with split payment for multi-vendor)
app.post('/make-server-b50138d4/create-payment-intent', async (c) => {
  try {
    const { ebookId } = await c.req.json();
    
    const ebook = await kv.get(`ebook:${ebookId}`);
    if (!ebook) {
      console.log('Ebook not found:', ebookId);
      return c.json({ error: 'Ebook not found' }, 404);
    }

    // Check if Stripe is properly configured
    if (!Deno.env.get('STRIPE_SECRET_KEY') || Deno.env.get('STRIPE_SECRET_KEY') === '') {
      console.log('Stripe secret key not configured');
      return c.json({ error: 'Stripe not configured. Please set STRIPE_SECRET_KEY environment variable.' }, 500);
    }

    console.log('Creating payment intent for ebook:', ebook.title, 'Amount:', ebook.price);

    const amount = Math.round(ebook.price * 100); // Convert to cents
    
    // Check if ebook has a vendor (marketplace mode)
    let paymentIntent;
    
    if (ebook.vendorId) {
      const vendor = await kv.get(`vendor:${ebook.vendorId}`);
      
      if (vendor && vendor.stripeAccountId) {
        // Split payment: 90% to vendor, 10% to platform
        const platformFee = Math.round(amount * (vendor.commission / 100));
        
        console.log(`Split payment: Total $${amount/100}, Platform fee $${platformFee/100}, Vendor gets $${(amount - platformFee)/100}`);
        
        paymentIntent = await stripe.paymentIntents.create({
          amount,
          currency: 'usd',
          application_fee_amount: platformFee,
          transfer_data: {
            destination: vendor.stripeAccountId,
          },
          metadata: {
            ebookId: ebook.id,
            ebookTitle: ebook.title,
            vendorId: vendor.id
          }
        });
      } else {
        console.log('Vendor has no Stripe account, payment goes to platform');
        // Vendor not connected to Stripe yet, payment goes to platform
        paymentIntent = await stripe.paymentIntents.create({
          amount,
          currency: 'usd',
          metadata: {
            ebookId: ebook.id,
            ebookTitle: ebook.title,
            vendorId: ebook.vendorId
          }
        });
      }
    } else {
      // Platform ebook (no vendor)
      paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: 'usd',
        metadata: {
          ebookId: ebook.id,
          ebookTitle: ebook.title
        }
      });
    }

    console.log('Payment intent created successfully:', paymentIntent.id);
    return c.json({ clientSecret: paymentIntent.client_secret });
  } catch (error: any) {
    console.log('Create payment intent error:', error);
    console.log('Error details:', error.message, error.type, error.code);
    return c.json({ 
      error: `Failed to create payment intent: ${error.message || 'Unknown error'}`,
      details: error.type || 'stripe_error'
    }, 500);
  }
});

app.post('/make-server-b50138d4/confirm-purchase', async (c) => {
  try {
    const user = await verifyUser(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const { ebookId, paymentIntentId } = await c.req.json();
    
    const ebook = await kv.get(`ebook:${ebookId}`);
    if (!ebook) {
      return c.json({ error: 'Ebook not found' }, 404);
    }

    // Calculate amounts
    const totalAmount = ebook.price;
    let vendorAmount = 0;
    let platformAmount = totalAmount;

    if (ebook.vendorId) {
      const vendor = await kv.get(`vendor:${ebook.vendorId}`);
      if (vendor) {
        platformAmount = totalAmount * (vendor.commission / 100);
        vendorAmount = totalAmount - platformAmount;
      }
    }

    // Record sale
    const saleId = crypto.randomUUID();
    const sale = {
      id: saleId,
      ebookId,
      userId: user.id,
      vendorId: ebook.vendorId || null,
      totalAmount,
      vendorAmount,
      platformAmount,
      paymentIntentId,
      createdAt: new Date().toISOString()
    };

    await kv.set(`sale:${saleId}`, sale);
    
    // Add to sales list
    const salesList = await kv.get('sales:all') || [];
    salesList.push(saleId);
    await kv.set('sales:all', salesList);

    // Add to vendor sales if applicable
    if (ebook.vendorId) {
      const vendorSales = await kv.get(`vendor:${ebook.vendorId}:sales`) || [];
      vendorSales.push(saleId);
      await kv.set(`vendor:${ebook.vendorId}:sales`, vendorSales);

      // Update vendor balance
      const currentBalance = await kv.get(`vendor:${ebook.vendorId}:balance`) || 0;
      await kv.set(`vendor:${ebook.vendorId}:balance`, currentBalance + vendorAmount);
    }

    // Add to user purchases
    const userPurchases = await kv.get(`user:${user.id}:purchases`) || [];
    userPurchases.push(ebookId);
    await kv.set(`user:${user.id}:purchases`, userPurchases);

    return c.json({ success: true, sale });
  } catch (error) {
    console.log('Confirm purchase error:', error);
    return c.json({ error: 'Failed to confirm purchase' }, 500);
  }
});

// Sales routes
app.get('/make-server-b50138d4/sales', async (c) => {
  try {
    const user = await verifyUser(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const salesList = await kv.get('sales:all') || [];
    const sales = await kv.mget(salesList.map((id: string) => `sale:${id}`));
    
    // Enhance sales with ebook info
    const enhancedSales = await Promise.all(
      sales.filter(Boolean).map(async (sale: any) => {
        const ebook = await kv.get(`ebook:${sale.ebookId}`);
        const userProfile = await kv.get(`user:${sale.userId}:profile`);
        return {
          ...sale,
          ebookTitle: ebook?.title || 'Unknown',
          buyerEmail: userProfile?.email || 'Unknown'
        };
      })
    );

    return c.json({ sales: enhancedSales });
  } catch (error) {
    console.log('Get sales error:', error);
    return c.json({ error: 'Failed to get sales' }, 500);
  }
});

// User purchases
app.get('/make-server-b50138d4/my-purchases', async (c) => {
  try {
    const user = await verifyUser(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const userPurchases = await kv.get(`user:${user.id}:purchases`) || [];
    const ebooks = await kv.mget(userPurchases.map((id: string) => `ebook:${id}`));
    
    return c.json({ purchases: ebooks.filter(Boolean) });
  } catch (error) {
    console.log('Get purchases error:', error);
    return c.json({ error: 'Failed to get purchases' }, 500);
  }
});

// Upload ebook file
app.post('/make-server-b50138d4/upload-ebook-file', async (c) => {
  try {
    const user = await verifyUser(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const ebookId = formData.get('ebookId') as string;

    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    const fileBuffer = await file.arrayBuffer();
    const fileName = `${ebookId}/${file.name}`;

    const { error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: true
      });

    if (error) {
      console.log('Upload error:', error);
      return c.json({ error: 'Failed to upload file' }, 500);
    }

    // Update ebook with file path
    const ebook = await kv.get(`ebook:${ebookId}`);
    if (ebook) {
      ebook.filePath = fileName;
      await kv.set(`ebook:${ebookId}`, ebook);
    }

    return c.json({ success: true, fileName });
  } catch (error) {
    console.log('Upload exception:', error);
    return c.json({ error: 'Failed to upload file' }, 500);
  }
});

// Download ebook
app.get('/make-server-b50138d4/download/:ebookId', async (c) => {
  try {
    const user = await verifyUser(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const ebookId = c.req.param('ebookId');
    
    // Check if user owns this ebook
    const userPurchases = await kv.get(`user:${user.id}:purchases`) || [];
    if (!userPurchases.includes(ebookId)) {
      return c.json({ error: 'You do not own this ebook' }, 403);
    }

    const ebook = await kv.get(`ebook:${ebookId}`);
    if (!ebook?.filePath) {
      return c.json({ error: 'Ebook file not found' }, 404);
    }

    // Create signed URL for download
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(ebook.filePath, 3600); // 1 hour expiry

    if (error || !data) {
      console.log('Download URL error:', error);
      return c.json({ error: 'Failed to generate download URL' }, 500);
    }

    return c.json({ downloadUrl: data.signedUrl });
  } catch (error) {
    console.log('Download exception:', error);
    return c.json({ error: 'Failed to get download URL' }, 500);
  }
});

// Vendor-specific routes
app.get('/make-server-b50138d4/vendor-ebooks', async (c) => {
  try {
    const user = await verifyUser(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const vendorEbooks = await kv.get(`vendor:${user.id}:ebooks`) || [];
    const ebooks = await kv.mget(vendorEbooks.map((id: string) => `ebook:${id}`));
    
    return c.json({ ebooks: ebooks.filter(Boolean) });
  } catch (error) {
    console.log('Get vendor ebooks error:', error);
    return c.json({ error: 'Failed to get vendor ebooks' }, 500);
  }
});

app.get('/make-server-b50138d4/vendor-sales', async (c) => {
  try {
    const user = await verifyUser(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const vendorSales = await kv.get(`vendor:${user.id}:sales`) || [];
    const sales = await kv.mget(vendorSales.map((id: string) => `sale:${id}`));
    
    // Enhance sales with ebook info
    const enhancedSales = await Promise.all(
      sales.filter(Boolean).map(async (sale: any) => {
        const ebook = await kv.get(`ebook:${sale.ebookId}`);
        const userProfile = await kv.get(`user:${sale.userId}:profile`);
        return {
          ...sale,
          ebookTitle: ebook?.title || 'Unknown',
          buyerEmail: userProfile?.email || 'Unknown'
        };
      })
    );

    return c.json({ sales: enhancedSales });
  } catch (error) {
    console.log('Get vendor sales error:', error);
    return c.json({ error: 'Failed to get vendor sales' }, 500);
  }
});

app.get('/make-server-b50138d4/vendor-balance', async (c) => {
  try {
    const user = await verifyUser(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const balance = await kv.get(`vendor:${user.id}:balance`) || 0;
    const withdrawals = await kv.get(`vendor:${user.id}:withdrawals`) || [];
    
    const totalWithdrawn = withdrawals
      .filter((w: any) => w.status === 'completed')
      .reduce((sum: number, w: any) => sum + w.amount, 0);

    return c.json({ 
      balance, 
      totalWithdrawn,
      availableBalance: balance,
      withdrawals 
    });
  } catch (error) {
    console.log('Get vendor balance error:', error);
    return c.json({ error: 'Failed to get vendor balance' }, 500);
  }
});

app.post('/make-server-b50138d4/vendor-withdrawal', async (c) => {
  try {
    const user = await verifyUser(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const { amount } = await c.req.json();
    const vendor = await kv.get(`vendor:${user.id}`);
    
    if (!vendor) return c.json({ error: 'Not a vendor' }, 404);
    if (vendor.status !== 'approved') return c.json({ error: 'Vendor not approved' }, 403);
    if (!vendor.stripeAccountId) return c.json({ error: 'Stripe account not connected' }, 400);

    const balance = await kv.get(`vendor:${user.id}:balance`) || 0;
    
    if (amount > balance) {
      return c.json({ error: 'Insufficient balance' }, 400);
    }

    // Create withdrawal request
    const withdrawalId = crypto.randomUUID();
    const withdrawal = {
      id: withdrawalId,
      vendorId: user.id,
      amount,
      status: 'pending', // pending, processing, completed, failed
      createdAt: new Date().toISOString()
    };

    await kv.set(`withdrawal:${withdrawalId}`, withdrawal);

    // Add to vendor withdrawals
    const withdrawals = await kv.get(`vendor:${user.id}:withdrawals`) || [];
    withdrawals.push(withdrawal);
    await kv.set(`vendor:${user.id}:withdrawals`, withdrawals);

    // Update balance
    await kv.set(`vendor:${user.id}:balance`, balance - amount);

    // Process transfer (in real scenario, this would be async)
    try {
      const transfer = await stripe.transfers.create({
        amount: Math.round(amount * 100),
        currency: 'usd',
        destination: vendor.stripeAccountId,
        metadata: {
          withdrawalId,
          vendorId: user.id
        }
      });

      withdrawal.status = 'completed';
      withdrawal.transferId = transfer.id;
      withdrawal.completedAt = new Date().toISOString();
      
      await kv.set(`withdrawal:${withdrawalId}`, withdrawal);
      
      // Update in vendor withdrawals array
      const updatedWithdrawals = withdrawals.map((w: any) => 
        w.id === withdrawalId ? withdrawal : w
      );
      await kv.set(`vendor:${user.id}:withdrawals`, updatedWithdrawals);

    } catch (transferError: any) {
      console.log('Transfer error:', transferError);
      withdrawal.status = 'failed';
      withdrawal.error = transferError.message;
      await kv.set(`withdrawal:${withdrawalId}`, withdrawal);
      
      // Refund balance
      await kv.set(`vendor:${user.id}:balance`, balance);
      
      return c.json({ error: `Transfer failed: ${transferError.message}` }, 500);
    }

    return c.json({ success: true, withdrawal });
  } catch (error: any) {
    console.log('Withdrawal error:', error);
    return c.json({ error: `Withdrawal failed: ${error.message}` }, 500);
  }
});

// Admin routes
app.get('/make-server-b50138d4/admin/vendors', async (c) => {
  try {
    const user = await verifyUser(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    // Check if user is admin (in production, check against admin list)
    const userProfile = await kv.get(`user:${user.id}:profile`);
    // For now, we'll allow anyone to view vendors - in production add isAdmin check

    const vendorsList = await kv.get('vendors:all') || [];
    const vendors = await kv.mget(vendorsList.map((id: string) => `vendor:${id}`));
    
    // Enhance with stats
    const enhancedVendors = await Promise.all(
      vendors.filter(Boolean).map(async (vendor: any) => {
        const ebooks = await kv.get(`vendor:${vendor.id}:ebooks`) || [];
        const sales = await kv.get(`vendor:${vendor.id}:sales`) || [];
        const balance = await kv.get(`vendor:${vendor.id}:balance`) || 0;
        
        return {
          ...vendor,
          totalEbooks: ebooks.length,
          totalSales: sales.length,
          balance
        };
      })
    );

    return c.json({ vendors: enhancedVendors });
  } catch (error) {
    console.log('Get vendors error:', error);
    return c.json({ error: 'Failed to get vendors' }, 500);
  }
});

app.post('/make-server-b50138d4/admin/approve-vendor', async (c) => {
  try {
    const user = await verifyUser(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const { vendorId, status } = await c.req.json();
    
    const vendor = await kv.get(`vendor:${vendorId}`);
    if (!vendor) return c.json({ error: 'Vendor not found' }, 404);

    vendor.status = status; // approved or rejected
    vendor.approvedAt = new Date().toISOString();
    vendor.approvedBy = user.id;

    await kv.set(`vendor:${vendorId}`, vendor);

    return c.json({ success: true, vendor });
  } catch (error) {
    console.log('Approve vendor error:', error);
    return c.json({ error: 'Failed to approve vendor' }, 500);
  }
});

app.get('/make-server-b50138d4/admin/platform-revenue', async (c) => {
  try {
    const user = await verifyUser(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const salesList = await kv.get('sales:all') || [];
    const sales = await kv.mget(salesList.map((id: string) => `sale:${id}`));
    
    const platformRevenue = sales
      .filter(Boolean)
      .reduce((sum: number, sale: any) => sum + (sale.platformAmount || sale.totalAmount), 0);

    const vendorRevenue = sales
      .filter(Boolean)
      .reduce((sum: number, sale: any) => sum + (sale.vendorAmount || 0), 0);

    return c.json({ 
      platformRevenue,
      vendorRevenue,
      totalRevenue: platformRevenue + vendorRevenue,
      totalSales: sales.filter(Boolean).length
    });
  } catch (error) {
    console.log('Get platform revenue error:', error);
    return c.json({ error: 'Failed to get platform revenue' }, 500);
  }
});

Deno.serve(app.fetch);
