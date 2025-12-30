# npm Publishing Guide for nest-hex

This guide walks you through publishing your package to npm and setting up trusted publishing with GitHub Actions.

## Prerequisites

- [x] npm account (create at https://www.npmjs.com/signup)
- [x] Package built and tested locally
- [x] Git repository pushed to GitHub

## Step 1: Prepare Your Package

### 1.1 Verify package.json

Make sure your `package.json` has the correct package name and is set to public:

```json
{
  "name": "nest-hex",
  "version": "0.2.0",
  "publishConfig": {
    "access": "public"
  }
}
```

### 1.2 Build the package

```bash
bun run build
```

### 1.3 Test the package locally (optional)

```bash
# Pack the package to see what will be published
bun run pack

# This creates a tarball you can inspect
```

## Step 2: Initial Manual Publish (Required for Trusted Publishing)

**Important:** You must publish the package at least once manually before you can configure trusted publishing in npm settings.

### 2.1 Login to npm

```bash
npm login
```

This will:
- Ask for your npm username
- Ask for your password
- Ask for your email
- Ask for a one-time password (OTP) if you have 2FA enabled

### 2.2 Publish the package

```bash
npm publish --access public
```

Or using Bun:

```bash
bunx npm publish --access public
```

**Expected output:**
```
+ nest-hex@0.2.0
```

### 2.3 Verify the package

- Visit https://www.npmjs.com/package/nest-hex
- You should see your package listed!

## Step 3: Configure Trusted Publishing on npm

Now that the package exists, you can set up trusted publishing:

### 3.1 Go to package settings

1. Visit https://www.npmjs.com/package/nest-hex
2. Click the **Settings** tab
3. Scroll down to **Publishing access**

### 3.2 Enable trusted publishing

1. Under **Publishing access**, find **Trusted publishing**
2. Click **Configure trusted publishing**
3. Click **Add a new trusted publisher**

### 3.3 Configure GitHub Actions

Fill in the following details:

- **Provider:** GitHub Actions
- **Repository owner:** `LiorVainer`
- **Repository name:** `nest-hex` (or `nestjs-adapter` - use your actual repo name)
- **Workflow name:** `release.yml`
- **Environment name:** (leave empty or use `production` if you want to add environment protection)

Click **Add**.

## Step 4: Update GitHub Actions Workflow

### 4.1 Remove the old authentication step

Your workflow should now use OIDC instead of `NPM_TOKEN`. Here's the updated workflow:

**Before:**
```yaml
- name: Authenticate npm
  run: |
    echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > ~/.npmrc
  env:
    NPM_TOKEN: ${{ secrets.NPM_TOKEN }}

- name: Publish to npm
  run: bunx npm publish --access public
  env:
    NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

**After:**
```yaml
- name: Publish to npm
  run: bunx npm publish --access public --provenance
```

### 4.2 Ensure workflow permissions are set

Your workflow file should have these permissions at the top:

```yaml
permissions:
  contents: write
  id-token: write  # Required for trusted publishing
```

✅ Your current workflow already has this!

### 4.3 Remove NPM_TOKEN secret (optional)

Once trusted publishing is working, you can delete the `NPM_TOKEN` secret from your GitHub repository settings.

## Step 5: Test the Workflow

### 5.1 Create a new release

```bash
bun run release
```

This will:
1. Bump the version
2. Create a git commit
3. Create a git tag
4. Push to GitHub
5. Trigger the release workflow

### 5.2 Monitor the workflow

1. Go to your GitHub repository
2. Click the **Actions** tab
3. Watch the "Release" workflow run
4. It should publish to npm using trusted publishing (no token needed!)

## Benefits of Trusted Publishing

✅ **No more tokens:** No need to manage long-lived `NPM_TOKEN` secrets
✅ **More secure:** Uses short-lived OIDC tokens that can't be stolen
✅ **Provenance:** Publishes with provenance attestations showing the package came from your GitHub Actions workflow
✅ **Easier rotation:** No manual token rotation needed

## Troubleshooting

### Error: "You must verify your email address"

- Check your npm email and click the verification link
- Run `npm profile get` to check your email verification status

### Error: "You do not have permission to publish"

- Make sure you're logged in: `npm whoami`
- Check package name isn't taken: search on npmjs.com
- Ensure `publishConfig.access` is set to `"public"`

### Error: "Trusted publishing failed"

- Verify the workflow name matches exactly: `release.yml`
- Check the repository owner/name are correct
- Ensure `id-token: write` permission is set in workflow
- Make sure you're pushing a tag (trusted publishing only works on tag pushes)

### Error: "Package name too similar to existing package"

- npm may block names too similar to popular packages
- Try a more unique name or add a scope: `@yourusername/nest-hex`

## Using a Scoped Package (Optional)

If you want to publish under your npm username:

1. Update `package.json`:
   ```json
   {
     "name": "@liorvainer/nest-hex"
   }
   ```

2. Publish:
   ```bash
   npm publish --access public
   ```

3. Users install with:
   ```bash
   npm install @liorvainer/nest-hex
   ```

## Next Steps

After successful publishing:

1. ✅ Add a badge to README.md:
   ```markdown
   [![npm version](https://badge.fury.io/js/nest-hex.svg)](https://www.npmjs.com/package/nest-hex)
   [![npm downloads](https://img.shields.io/npm/dm/nest-hex.svg)](https://www.npmjs.com/package/nest-hex)
   ```

2. ✅ Update documentation with installation instructions
3. ✅ Consider adding a CHANGELOG.md for version history
4. ✅ Set up automated testing before publish

## Resources

- [npm Trusted Publishing Documentation](https://docs.npmjs.com/trusted-publishers)
- [GitHub OIDC Documentation](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-npm)
- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
