# EAS Push Notifications Setup Guide

This guide will help you configure push notifications for production builds with EAS Build.

## What Changed

I've updated your configuration files to support production push notifications:

- ✅ Changed `aps-environment` from `development` to `production` in `app.json` and `ios/coincopilot/coincopilot.entitlements`
- ✅ Updated `eas.json` with build configuration settings

## Required Steps to Enable Push Notifications

### Step 1: Set Up iOS Credentials (APNs)

For iOS push notifications to work in production, you need to configure APNs (Apple Push Notification service) credentials in EAS.

**Option A: Let EAS Generate Credentials (Recommended)**

1. Run the credential configuration:

   ```bash
   eas credentials
   ```

2. Select your project (coin-copilot)
3. Select iOS
4. Choose "Production" credentials
5. When prompted about push notification setup:
   - Select "Let EAS handle this"
   - EAS will automatically generate APNs credentials for you

**Option B: Manual Certificate Upload**

If you already have APNs certificates:

1. Run:

   ```bash
   eas credentials
   ```

2. Select iOS → Production
3. Choose "Upload existing certificate"
4. Upload your `.p8` key file or provide:
   - Key ID
   - Team ID
   - Auth Key file

### Step 2: Set Up Android Credentials (FCM - Firebase Cloud Messaging)

For Android push notifications:

1. **Create a Firebase Project**:

   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or use existing one
   - Enable Google Sign-In if needed

2. **Add Android App to Firebase**:

   - Add your Android app with package name: `com.mreyesh85.coincopilot`
   - Download `google-services.json`

3. **Configure in EAS**:
   ```bash
   eas credentials
   ```
   - Select Android
   - Choose the credential type you want to update (e.g., keystore)
   - Follow prompts to upload `google-services.json`

**Alternative: Let EAS Auto-configure**

EAS can automatically configure FCM for you:

```bash
eas credentials
# Select Android
# Let EAS handle FCM setup
```

### Step 3: Verify Credentials

Check that your credentials are properly configured:

```bash
eas credentials
```

You should see credentials for:

- **iOS**: APNs configured
- **Android**: FCM/Google Services configured

### Step 4: Build and Test

1. **Build for production**:

   ```bash
   eas build --profile production --platform ios
   # or
   eas build --profile production --platform android
   ```

2. **Test push notifications**:
   - Install the production build on a physical device
   - Open the app and grant notification permissions
   - The app will register the push token in your Supabase database
   - Test by creating an event with a notification schedule
   - Wait for the scheduled time or manually trigger the notification

### Step 5: Verify Setup

1. **Check Supabase database**:

   ```sql
   SELECT user_id, expo_push_token, device_info
   FROM user_api_keys
   WHERE expo_push_token IS NOT NULL;
   ```

2. **Check edge function logs**:

   ```bash
   supabase functions logs register-push-token --tail
   ```

3. **Test notification delivery**:
   - Create a test event in the app
   - Wait for the scheduled notification time
   - Or manually trigger: `curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/send-scheduled-notifications`

## Troubleshooting

### Error: "No APNs credentials found"

**Solution**: Run `eas credentials` and configure APNs for production

### Error: "Invalid push token"

**Solution**: Ensure you're building with production credentials and testing on a physical device (not simulator)

### Error: "Notification not received"

**Solutions**:

1. Verify the device has internet connection
2. Check that notification permissions are granted
3. Verify the push token is registered in database
4. Check edge function logs for errors
5. Ensure the notification schedule is configured correctly

### Development vs Production

- **Development builds**: Use development APS environment (what you had before)
- **Production builds**: Use production APS environment (updated configuration)
- For testing in development, you can temporarily switch back to `"development"` in `app.json` if needed

## Important Notes

1. **Never commit credentials** to your repository
2. EAS stores credentials securely in the cloud
3. Production APNs certificates are different from development certificates
4. Expo handles push notification delivery, no additional setup needed on your end

## Next Steps

1. Run `eas credentials` to configure your credentials
2. Build a production version: `eas build --profile production`
3. Test push notifications on a physical device
4. Monitor via Supabase logs and notification queue table

## Additional Resources

- [EAS Credentials Documentation](https://docs.expo.dev/app-signing/managed-credentials/)
- [Push Notifications Guide](https://docs.expo.dev/push-notifications/push-notifications-setup/)
- [APNs Guide](https://developer.apple.com/documentation/usernotifications)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
