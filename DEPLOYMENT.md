# DoctorSoft+ Deployment Guide

## Environment Variables Required

When deploying to any platform (Netlify, Vercel, etc.), ensure these environment variables are set:

```
VITE_SUPABASE_URL=https://0ec90b57d6e95fcbda19832f.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJib2x0IiwicmVmIjoiMGVjOTBiNTdkNmU5NWZjYmRhMTk4MzJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODE1NzQsImV4cCI6MTc1ODg4MTU3NH0.9I8-U0x86Ak8t2DGaIk0HfvTSLsAyzdnz-Nw00mMkKw
VITE_MAX_FILE_SIZE_MB=10
VITE_BUCKET_NAME=00000000-default-bucket
```

## Build Configuration

### Build Command
```
npm run build
```

### Publish Directory
```
dist
```

### Node Version
Use Node.js 18 or higher

## Platform-Specific Instructions

### Netlify

1. Go to Site Settings > Build & Deploy > Environment
2. Add all environment variables listed above
3. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Deploy triggers are automatically configured

The `_redirects` file in the `dist` folder handles SPA routing.

### Vercel

1. Go to Project Settings > Environment Variables
2. Add all environment variables for Production, Preview, and Development
3. Configure build settings:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Deploy

### Other Platforms

For any other platform:
1. Set Node.js version to 18+
2. Add environment variables to the platform's configuration
3. Set build command to `npm run build`
4. Set output/publish directory to `dist`
5. Ensure the platform supports SPA routing (or configure redirects)

## Verification

After deployment, verify:
1. The app loads without errors
2. You can log in successfully
3. The Supabase connection is working
4. File uploads work (if you have the storage bucket configured)

## Troubleshooting

### "Supabase connection error"
- Verify environment variables are set correctly in your deployment platform
- Check that the Supabase project is active
- Confirm the Supabase URL and Anon Key are valid

### "Blank page after deployment"
- Check browser console for errors
- Verify the `dist` folder was built correctly
- Ensure SPA routing is configured (check `_redirects` file)

### "File upload errors"
- Verify `VITE_BUCKET_NAME` matches your Supabase storage bucket name
- Check that the bucket exists in Supabase Storage
- Confirm RLS policies allow authenticated users to upload files

## Local Development

To run locally:
```bash
npm install
npm run dev
```

The app will be available at `http://localhost:5173`
