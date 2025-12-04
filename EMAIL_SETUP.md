# Email Configuration Setup Guide

## Problem
If you're not receiving verification emails, it's because the SMTP (email) configuration is missing.

## Solution

### Step 1: Create `.env.local` file
Create a file named `.env.local` in the root of your project (same folder as `package.json`).

### Step 2: Configure Email Settings

#### Option A: Using Gmail (Recommended for Development)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Enter "FastLink" as the name
   - Click "Generate"
   - Copy the 16-character password (no spaces)

3. **Add to `.env.local`**:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-character-app-password
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Option B: Using Other Email Providers

**Outlook/Hotmail:**
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

**Yahoo:**
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=your-email@yahoo.com
SMTP_PASS=your-app-password
```

**Custom SMTP Server:**
```env
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASS=your-password
```

### Step 3: Restart Your Development Server

After creating/updating `.env.local`:
1. Stop your server (Ctrl+C)
2. Run `npm run dev` again

### Step 4: Test Email Configuration

Try registering a new account. Check:
1. **Server console** - Look for "Verification email sent successfully" message
2. **Your email inbox** - Check spam folder too
3. **Server console errors** - If email fails, you'll see detailed error messages

## Troubleshooting

### "Email not configured" error
- Make sure `.env.local` exists in the project root
- Check that `SMTP_USER` and `SMTP_PASS` are set
- Restart your dev server after adding environment variables

### "Invalid login" or "Authentication failed"
- For Gmail: Make sure you're using an **App Password**, not your regular password
- Check that 2FA is enabled on your Gmail account
- Verify the email and password are correct

### "Connection timeout"
- Check your internet connection
- Verify SMTP_HOST and SMTP_PORT are correct
- Some networks block SMTP ports - try a different network

### Emails go to spam
- This is normal for development emails
- Check your spam/junk folder
- Mark as "Not Spam" to help future emails

## Alternative: Use Email Testing Service (Development Only)

For testing without real email setup, you can use services like:
- **Mailtrap** (https://mailtrap.io) - Free tier available
- **Ethereal Email** (https://ethereal.email) - Generates test accounts

Example with Mailtrap:
```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-mailtrap-username
SMTP_PASS=your-mailtrap-password
```

## Production Setup

For production, consider:
- **SendGrid** (https://sendgrid.com)
- **Mailgun** (https://www.mailgun.com)
- **Amazon SES** (https://aws.amazon.com/ses/)
- **Resend** (https://resend.com)

These services provide better deliverability and analytics.










