---
id: upgrading
---

# Upgrading

### Upgrade to a new version

Review the release notes for breaking changes before upgrading.

#### Docker

```bash
docker compose pull
docker compose up -d
```

### Portainer

1. In your container page, click on Recreate.
2. Check the Re-Pull image toggle.
3. Click on Recreate.

#### Stand-alone

1. Stop the running app

   ```bash
   pm2 stop sharedock-backend sharedock-frontend
   ```

2. Repeat the steps from the [installation guide](./installation.md#stand-alone-installation) except the `git clone` step.

   ```bash
   cd sharedock

   # Update the checked-out public branch
   git pull --ff-only origin main

   # Start the backend
   cd backend
   npm install
   npm run build
   pm2 restart sharedock-backend

   # Start the frontend
   cd ../frontend
   npm install
   npm run build
   pm2 restart sharedock-frontend
   ```

   Note that environment variables are not picked up when using pm2 restart, if you actually want to change configs, you need to run `pm2 --update-env restart`
