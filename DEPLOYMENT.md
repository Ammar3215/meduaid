# MedUAid Production Deployment Guide

## Security Checklist (CRITICAL - Complete Before Deployment)

### 1. Environment Variables Setup

#### Backend (.env)
```bash
# Copy the example file
cp backend/.env.example backend/.env

# Edit the file with production values
MONGO_URI=mongodb+srv://prod_user:secure_password@your-cluster.mongodb.net/meduaid_prod
JWT_SECRET=$(openssl rand -hex 32)  # Generate a secure 64-character secret
GMAIL_USER=noreply@yourdomain.com
GMAIL_PASS=your_16_char_app_password
NODE_ENV=production
PORT=5050
```

#### Frontend (.env)
```bash
# Copy the example file
cp meduaid-portal/.env.example meduaid-portal/.env

# Edit with your production API URL
VITE_API_URL=https://your-api-domain.com
NODE_ENV=production
```

### 2. Remove Sensitive Files from Git

```bash
# Ensure .env files are not tracked
git rm --cached backend/.env
git rm --cached meduaid-portal/.env
echo "backend/.env" >> backend/.gitignore
echo "meduaid-portal/.env" >> meduaid-portal/.gitignore
git add .
git commit -m "Remove environment files from tracking"
```

### 3. Database Security

- [ ] Create production MongoDB cluster with IP restrictions
- [ ] Use strong database credentials
- [ ] Enable MongoDB encryption at rest
- [ ] Set up database backups

### 4. Security Headers & HTTPS

- [ ] Implement SSL/HTTPS certificates
- [ ] Configure security headers (CSP, HSTS, X-Frame-Options)
- [ ] Update CORS origins to production domains only

## Deployment Options

### Option 1: Vercel (Frontend) + Render (Backend)

#### Frontend (Vercel)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy frontend
cd meduaid-portal
vercel --prod

# Set environment variables in Vercel dashboard
# - VITE_API_URL: Your backend URL
```

#### Backend (Render)
1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Set build command: `npm run build`
4. Set start command: `npm start`
5. Add environment variables in Render dashboard

### Option 2: AWS/DigitalOcean/Other Cloud Providers

#### Frontend (Static Hosting)
```bash
cd meduaid-portal
npm run build
# Upload dist/ folder to your CDN/static hosting
```

#### Backend (VPS/Container)
```bash
cd backend
npm run build
pm2 start dist/server.js --name meduaid-api
```

## Environment Variables Reference

### Backend Required Variables
- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: Secure random string (min 32 chars)
- `GMAIL_USER`: Email for sending notifications
- `GMAIL_PASS`: App-specific password for Gmail
- `NODE_ENV`: Set to 'production'
- `PORT`: Port number (default: 5050)

### Frontend Required Variables
- `VITE_API_URL`: Backend API base URL
- `NODE_ENV`: Set to 'production'

## Post-Deployment Verification

### 1. Security Tests
```bash
# Test rate limiting
curl -X POST https://your-api.com/api/auth/login -d '{}' -H "Content-Type: application/json"

# Verify HTTPS redirect
curl -I http://your-domain.com

# Check security headers
curl -I https://your-domain.com
```

### 2. Functionality Tests
- [ ] User registration and email verification
- [ ] Login/logout functionality
- [ ] Question submission and review
- [ ] Admin dashboard functionality
- [ ] OSCE station management

### 3. Performance Tests
- [ ] API response times < 500ms
- [ ] Frontend load time < 3s
- [ ] Database query optimization

## Monitoring & Maintenance

### Recommended Tools
- **Error Tracking**: Sentry.io
- **Uptime Monitoring**: UptimeRobot
- **Performance**: Google Analytics, Lighthouse
- **Logs**: CloudWatch, Papertrail

### Regular Maintenance Tasks
- [ ] Monitor error rates
- [ ] Update dependencies monthly
- [ ] Database backup verification
- [ ] Security audit quarterly

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Verify frontend domain is in CORS origins
   - Check credentials: true in both frontend and backend

2. **JWT Token Issues**
   - Ensure JWT_SECRET is same across all instances
   - Check token expiration settings

3. **Database Connection**
   - Verify MongoDB IP whitelist
   - Check connection string format
   - Ensure network access from hosting provider

4. **Email Delivery**
   - Verify Gmail app password is correct
   - Check spam folder for test emails
   - Ensure "Less secure app access" is enabled (if using Gmail)

## Security Best Practices Implemented

✅ **Implemented**
- Password hashing with bcrypt
- JWT tokens with HTTP-only cookies
- Rate limiting on authentication endpoints
- CORS configuration
- Input validation and sanitization
- Error handling without information leakage
- Environment variable validation

⚠️ **Recommended for Production**
- Web Application Firewall (WAF)
- DDoS protection
- Regular security audits
- Automated vulnerability scanning
- Database encryption
- Backup and disaster recovery plan

---

**⚠️ IMPORTANT**: Do not deploy until all items in the Security Checklist are completed!