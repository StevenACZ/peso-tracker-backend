# 🧪 Peso Tracker API - Bruno Testing Suite

## 🚀 Quick Start

### 1. **Setup Environment**
- Select environment: `Development` or `Production`
- Default credentials: `test@example.com` / `Test123!`

### 2. **Authentication Flow**
1. Run `Auth/01 - Register` (if first time)
2. Run `Auth/02 - Login` 
3. ✅ Tokens are auto-saved for subsequent requests

### 3. **Testing Workflow**
```
Auth Flow:    Register → Login → Refresh Token
Weight Flow:  Create → Get All → Get by ID → Update → Delete
Photo Flow:   Create with Photo → Verify signed URLs
Goals Flow:   Create → Get by ID → Update → Delete
Analytics:    Chart Data → Progress
Health:       Health Check
```

## 🔧 Features

### **🔄 Automatic Token Management**
- Access tokens saved after login/register
- Refresh tokens handled automatically
- No manual token copying needed

### **📊 Dynamic Variables**
- `lastWeightId` auto-saved after weight creation
- `lastGoalId` auto-saved after goal creation
- Used automatically in update/delete operations
- Hardcoded credentials (no environment variables needed)

### **🧪 Comprehensive Tests**
- Status code validation
- Response structure verification
- Signed URL security checks
- Photo upload validation

## 📱 Photo Testing

**Note:** To test photo uploads:
1. Update the `photo` field path in `Create Weight with Photo`
2. Use a real image file (JPEG, PNG, WebP)
3. Max size: 10MB
4. Verify signed URLs in response

## 🔒 Security Testing

All requests use:
- ✅ Bearer token authentication
- ✅ Automatic token refresh
- ✅ Signed photo URLs (15min expiry)
- ✅ User isolation validation

## 📝 Test Results

Each request includes:
- **Status validation** → Correct HTTP codes
- **Structure validation** → Expected response format
- **Security validation** → Tokens and permissions
- **Business logic** → Data integrity checks