# Domain Setup Guide for aion.design

## DNS Configuration

To point aion.design to this GitHub Pages site, configure your DNS with the following records:

### Option 1: Apex Domain (aion.design)
Add these A records:
```
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

### Option 2: CNAME Record (www.aion.design)
```
CNAME www -> akshaybapat6365.github.io
```

## GitHub Pages Configuration

1. The CNAME file has been created with `aion.design`
2. In GitHub repository settings:
   - Go to Settings > Pages
   - Under "Custom domain", it should show `aion.design`
   - Check "Enforce HTTPS" once DNS propagates

## Verification Steps

1. DNS propagation (can take 24-48 hours):
   ```bash
   dig aion.design
   nslookup aion.design
   ```

2. SSL certificate (automatic via Let's Encrypt):
   - GitHub will automatically provision SSL
   - May take up to 24 hours after DNS verification

3. Test redirects:
   - http://aion.design → https://aion.design
   - http://www.aion.design → https://aion.design
   - https://akshaybapat6365.github.io/aion-visualization/ → https://aion.design

## Cloudflare Configuration (Optional)

If using Cloudflare:
1. Set SSL/TLS to "Full"
2. Add Page Rules:
   - `http://aion.design/*` → Always Use HTTPS
   - `www.aion.design/*` → Forward to `https://aion.design/$1`
3. Enable Cloudflare caching for assets

## Monitoring

- GitHub Pages status: https://www.githubstatus.com/
- Domain propagation: https://www.whatsmydns.net/
- SSL Labs test: https://www.ssllabs.com/ssltest/