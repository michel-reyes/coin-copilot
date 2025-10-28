# Quick Setup Instructions for Push Notifications

## Problem

You cannot publish with push notifications because EAS doesn't have the required credentials configured.

## Solution

Follow these steps in order:

### 1. Configure iOS Credentials

Open terminal in your project and run:

```bash
eas credentials
```

When prompted:

1. Select platform: **iOS**
2. Select credential type to update: Choose the **iOS Distribution Certificate** or select to update credentials
3. For push notifications, choose: **Let EAS handle this**

This will automatically configure APNs (Apple Push Notification service) for your app.

### 2. Configure Android Credentials (if building for Android)

```bash
eas credentials
```

Select:

1. Platform: **Android**
2. Follow prompts to configure Google Services / FCM

Or if you already have `google-services.json`:

- Upload it when prompted
- Place it in the root of your project if doing manual setup

### 3. Verify Configuration

Check your credentials:

```bash
eas credentials
# Select your platform and review credentials
```

### 4. Build Production Version

```bash
# For iOS
eas build --profile production --platform ios

# For Android
eas build --profile production --platform android

# Or both
eas build --profile production --platform all
```

### 5. Test Push Notifications

After the build completes:

1. Download and install on a **physical device**
2. Open the app and grant notification permissions
3. Create a test event with notifications
4. Verify notification is received at scheduled time

## What I Changed

✅ Updated `app.json` - Changed APS environment to `production`
✅ Updated `ios/coincopilot/coincopilot.entitlements` - Set to production
✅ Updated `eas.json` - Added build configurations

These changes allow your app to receive push notifications in production builds.

## Common Issues

**Error: "No APNs credentials"**
→ Run `eas credentials` for iOS and configure

**Push notifications not working**
→ Must test on physical device, not simulator

**Build fails**
→ Ensure you've run `eas credentials` first

## Need Help?

See `EAS_PUSH_NOTIFICATIONS_SETUP.md` for detailed instructions.
