# Deploying to Vercel

## Prerequisites

1. A Vercel account (sign up at https://vercel.com)
2. Your Supabase project URL and API key

## Step 1: Initialize Git (if not already done)

```bash
git init
git add .
git commit -m "Initial commit"
```

## Step 2: Push to GitHub

1. Create a new repository on GitHub
2. Push your code:

```bash
git remote add origin <YOUR_GITHUB_REPO_URL>
git branch -M main
git push -u origin main
```

## Step 3: Deploy to Vercel

### Option A: Using Vercel CLI

1. Install Vercel CLI:

```bash
npm i -g vercel
```

2. Login to Vercel:

```bash
vercel login
```

3. Deploy:

```bash
vercel
```

### Option B: Using Vercel Dashboard (Recommended)

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure the project:

   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. Add Environment Variables:

   - `VITE_SUPABASE_URL` - Your Supabase project URL
   - `VITE_SUPABASE_PUBLISHABLE_KEY` - Your Supabase anon/public key

5. Click "Deploy"

## Environment Variables

Make sure to add these in Vercel Dashboard → Settings → Environment Variables:

- `VITE_SUPABASE_URL` - Your Supabase project URL (e.g., https://xxxxx.supabase.co)
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Your Supabase anon/public key

## Notes

- The `vercel.json` file is already configured for SPA routing
- All routes will be handled by `index.html` for client-side routing
- The build output will be in the `dist` folder
