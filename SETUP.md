# Salon Management System Setup

## Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com/
2. Enable Authentication with Email/Password
3. Create a Firestore database
4. Enable Storage
5. Copy your Firebase config and create `.env.local` file:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

## Admin Setup

Create an admin user with email: `admin@salon.com`

## Features

- **Login Page** (`/`) - Email/password authentication
- **Stylist Registration** (`/register`) - Complete registration form with file uploads
- **Admin Dashboard** (`/dashboard`) - Summary and list views of stylists
- **Stylist Profile** (`/profile`) - View and edit stylist details

## User Roles

- **Admin**: Access to dashboard with stylist management
- **Stylist**: Access to personal profile page

## Run the Application

```bash
npm run dev
```

Open http://localhost:3000