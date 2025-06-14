# DNS Configuration Checklist for aion.design

## Pre-Configuration Steps

- [ ] **Domain Registrar Access**: Ensure you have access to the domain registrar for aion.design
- [ ] **Backup Current DNS**: Take a screenshot/backup of current DNS settings (if any)
- [ ] **GitHub Pages Ready**: Verify the site loads at https://akshaybapat6365.github.io/aion-visualization/

## DNS Configuration

### Option 1: Direct A Records (Recommended)

- [ ] Log into your domain registrar's DNS management panel
- [ ] Delete any existing A records for @ (root domain)
- [ ] Add the following A records:
  ```
  Type: A
  Name: @ (or leave blank for root)
  Value: 185.199.108.153
  TTL: 3600 (or default)
  
  Type: A
  Name: @
  Value: 185.199.109.153
  TTL: 3600
  
  Type: A
  Name: @
  Value: 185.199.110.153
  TTL: 3600
  
  Type: A
  Name: @
  Value: 185.199.111.153
  TTL: 3600
  ```

### Option 2: WWW Subdomain

- [ ] Add CNAME record:
  ```
  Type: CNAME
  Name: www
  Value: akshaybapat6365.github.io
  TTL: 3600
  ```
- [ ] Add redirect from root to www (if supported by registrar)

## GitHub Configuration

- [ ] **Merge PR #72**: Ensure CNAME file is in the repository
- [ ] **GitHub Settings**: 
  1. Go to Settings → Pages
  2. Custom domain should show `aion.design`
  3. Wait for DNS check to complete (can take up to 24 hours)
  4. Enable "Enforce HTTPS" once available

## Verification Steps

### Immediate (0-1 hour)
- [ ] Run `dig aion.design` to verify A records
- [ ] Run `nslookup aion.design` to confirm DNS resolution
- [ ] Check https://www.whatsmydns.net/#A/aion.design for propagation

### After Propagation (1-24 hours)
- [ ] Visit http://aion.design - should redirect to HTTPS
- [ ] Visit https://aion.design - should load the site
- [ ] Check SSL certificate is valid (Let's Encrypt via GitHub)
- [ ] Verify old GitHub URL redirects to custom domain

## Cloudflare Setup (Optional but Recommended)

If using Cloudflare for enhanced performance:

- [ ] **Add Site to Cloudflare**:
  1. Add aion.design to Cloudflare
  2. Update nameservers at registrar
  3. Wait for nameserver propagation

- [ ] **Configure Cloudflare Settings**:
  - [ ] SSL/TLS: Set to "Full"
  - [ ] Always Use HTTPS: ON
  - [ ] Auto Minify: HTML, CSS, JS
  - [ ] Brotli: ON
  - [ ] Browser Cache TTL: 4 hours

- [ ] **Page Rules**:
  1. `*aion.design/*` → Cache Level: Standard
  2. `http://www.aion.design/*` → Forwarding URL (301) to `https://aion.design/$1`
  3. `http://aion.design/*` → Always Use HTTPS

## Post-Configuration

- [ ] **Update Documentation**: Update README with new URL
- [ ] **Update Social Links**: Update any existing links to use aion.design
- [ ] **Monitor Analytics**: Check analytics are working on new domain
- [ ] **Performance Test**: Run Lighthouse on new domain
- [ ] **Submit to Search Engines**: 
  - [ ] Google Search Console
  - [ ] Bing Webmaster Tools

## Troubleshooting

### Site Not Loading
1. Check DNS propagation (can take 24-48 hours)
2. Verify CNAME file exists in repository
3. Check GitHub Pages settings

### SSL Certificate Error
1. Wait up to 24 hours for Let's Encrypt provisioning
2. Ensure "Enforce HTTPS" is enabled in GitHub Pages
3. Clear browser cache

### Redirect Issues
1. Verify no conflicting redirects at registrar
2. Check Cloudflare page rules (if using)
3. Ensure no hard-coded redirects in code

## Support Resources

- GitHub Pages Custom Domain: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site
- DNS Propagation Checker: https://www.whatsmydns.net/
- SSL Labs Test: https://www.ssllabs.com/ssltest/analyze.html?d=aion.design
- GitHub Status: https://www.githubstatus.com/