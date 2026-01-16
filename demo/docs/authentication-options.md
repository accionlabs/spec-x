# Authentication Options for Custom PWA Deployments

## Requirements
- Restrict PWA access to predefined users per deployment
- Work offline after initial authentication
- Minimal cloud provider dependencies
- Flexible - support individual to enterprise scale
- Customer-managed user identities

---

## Option 1: Pre-seeded Credentials (Offline-First)

### How it works
- User credentials are included in the deployment config
- Passwords are hashed (bcrypt) and stored in config
- App validates credentials locally against config
- Session persists in localStorage/IndexedDB

```typescript
// In deployment config
{
  "configName": "acme-corp",
  "users": [
    {
      "id": "user-001",
      "email": "john@acme.com",
      "name": "John Smith",
      "passwordHash": "$2b$10$...", // bcrypt hash
      "persona": "technician",
      "permissions": ["view-work-orders", "update-status"]
    },
    {
      "id": "user-002",
      "email": "jane@acme.com",
      "name": "Jane Doe",
      "persona": "dispatcher",
      "permissions": ["assign-work-orders", "view-all"]
    }
  ]
}
```

### Flow
1. User opens `acme-corp/technician` → sees login screen
2. Enters email + password
3. App validates against config's user list (bcrypt compare)
4. On success, stores session in IndexedDB
5. Works fully offline after first login

### Pros
- **Zero cloud dependencies** - works completely offline
- **Simple** - no OAuth, no tokens, no external services
- **Fast** - local validation only
- **Customer controlled** - they manage users in spec-selector

### Cons
- Password changes require config update + app refresh
- No password reset without admin intervention
- Credentials bundled with app (security consideration)

### Best for
- Small teams (< 50 users)
- High-security environments (no external auth)
- Truly offline deployments

---

## Option 2: Deployment Access Tokens (URL-based)

### How it works
- Each deployment has unique access tokens
- Tokens are short-lived or long-lived based on config
- URL structure: `/{config}/{token}/{persona}`
- Token validated on first load, session persisted

```typescript
// In deployment config
{
  "configName": "acme-corp",
  "accessTokens": [
    {
      "token": "tk_abc123...",
      "name": "Field Team Token",
      "personas": ["technician"],
      "expiresAt": "2025-12-31",
      "maxDevices": 10
    },
    {
      "token": "tk_xyz789...",
      "name": "Management Token",
      "personas": ["dispatcher", "manager"],
      "expiresAt": null, // never expires
      "maxDevices": 5
    }
  ]
}
```

### Flow
1. Admin generates token in spec-selector
2. Shares URL: `acme-corp/tk_abc123/technician`
3. App validates token against config
4. Stores validation in localStorage
5. Subsequent visits don't need token in URL

### Pros
- **No passwords to remember** - link-based access
- **Easy distribution** - share URL via email/SMS
- **Revocable** - remove token from config
- **Group access** - one token for team

### Cons
- Token in URL is visible (can be shared)
- Less individual accountability
- Requires config update to revoke

### Best for
- Teams where individual identity isn't critical
- Quick onboarding of field workers
- Contractor/temporary access

---

## Option 3: PIN + Device Registration

### How it works
- Users get a one-time PIN to register their device
- Device ID stored in config after registration
- Subsequent access validated by device ID
- PIN is single-use

```typescript
// In deployment config
{
  "configName": "acme-corp",
  "registrationPins": [
    { "pin": "847291", "persona": "technician", "assignedTo": "John Smith", "used": false }
  ],
  "registeredDevices": [
    {
      "deviceId": "dev_...",
      "userId": "user-001",
      "persona": "technician",
      "registeredAt": "2025-01-10",
      "lastSeen": "2025-01-12"
    }
  ]
}
```

### Flow
1. Admin creates PIN in spec-selector for each user
2. User opens app → enters PIN
3. App generates device fingerprint
4. Device registered in config (via config-server)
5. Future access validated by device ID

### Pros
- **No passwords** - PIN used once
- **Device binding** - tied to specific device
- **Audit trail** - know which devices accessed
- **Easy to revoke** - remove device from list

### Cons
- Requires server call for registration
- Lost device = admin intervention
- Device fingerprinting isn't perfect

### Best for
- Mobile-first deployments
- Company-issued devices
- Need to track device usage

---

## Option 4: Self-Hosted Identity (Keycloak/Authentik)

### How it works
- Customer runs their own identity server
- App uses OIDC/OAuth for authentication
- Tokens validated and refreshed as needed
- Works with existing corporate directories (LDAP/AD)

```typescript
// In deployment config
{
  "configName": "acme-corp",
  "auth": {
    "type": "oidc",
    "issuer": "https://auth.acme.com/realms/field-service",
    "clientId": "field-service-pwa",
    "scopes": ["openid", "profile", "offline_access"],
    "offlineTokenLifetime": 2592000 // 30 days
  }
}
```

### Flow
1. User opens app → redirected to identity server
2. Logs in with corporate credentials
3. Receives offline-capable refresh token
4. App stores tokens in secure storage
5. Works offline with cached token (30 days)

### Pros
- **Enterprise-grade** - supports MFA, SSO, policies
- **Self-hosted** - no cloud dependency
- **Integrates with AD/LDAP** - existing user directories
- **Standard protocols** - OIDC, OAuth2

### Cons
- Requires customer to run identity server
- More complex setup
- Initial auth requires network

### Best for
- Enterprise deployments
- Existing corporate identity infrastructure
- Compliance requirements (SOC2, HIPAA)

---

## Option 5: Magic Links (Email-based)

### How it works
- Users request login via email
- Config-server generates time-limited magic link
- Link opens app with auth token
- Session persists after first use

```typescript
// Email sent to user
"Click to access Field Service:
https://app.example.com/acme-corp/auth/ml_abc123xyz"

// Config stores pending magic links
{
  "magicLinks": [
    {
      "token": "ml_abc123xyz",
      "email": "john@acme.com",
      "expiresAt": "2025-01-12T10:30:00Z",
      "persona": "technician"
    }
  ]
}
```

### Flow
1. User enters email on login screen
2. Config-server sends magic link email
3. User clicks link → validated → session created
4. Works offline after initial auth

### Pros
- **No passwords** - email is the identity
- **Familiar pattern** - users know magic links
- **Self-service** - users can re-request links
- **Email verification** - proves email ownership

### Cons
- Requires email sending capability
- First auth needs network
- Email deliverability challenges

### Best for
- Consumer-facing deployments
- Users with varying tech skills
- Deployments where email is primary contact

---

## Option 6: Hybrid Approach (Recommended)

### How it works
Combine multiple methods based on infrastructure level:

| Infrastructure | Auth Method |
|----------------|-------------|
| Individual | Pre-seeded credentials |
| Small Team | PIN + Device registration |
| Department | Self-hosted OIDC or Magic Links |
| Enterprise | Self-hosted OIDC with AD integration |

```typescript
// In deployment config
{
  "configName": "acme-corp",
  "auth": {
    "method": "hybrid",
    "primary": "pin-device",    // Default method
    "fallback": "credentials",  // Offline fallback
    "enterprise": {             // Optional enterprise override
      "type": "oidc",
      "issuer": "https://..."
    }
  },
  "users": [...],              // For credentials fallback
  "registrationPins": [...],   // For PIN method
  "registeredDevices": [...]   // Device registry
}
```

### Recommended Implementation

**Phase 1: Pre-seeded Credentials**
- Add to current config structure
- Simple login screen
- bcrypt validation in browser
- Session in IndexedDB

**Phase 2: PIN + Device Registration**
- Add PIN generation to spec-selector
- Device fingerprinting
- Registration endpoint on config-server

**Phase 3: Self-Hosted OIDC**
- Optional OIDC configuration
- Support for Keycloak/Authentik
- Offline token caching

---

## Security Considerations

### For All Options
- **HTTPS required** for production
- **Secure storage** - use IndexedDB with encryption
- **Session timeout** - configurable per deployment
- **Audit logging** - track auth events

### Password Hashing
```typescript
// Use bcrypt in browser via bcryptjs
import bcrypt from 'bcryptjs'

// Hash password (spec-selector side)
const hash = await bcrypt.hash(password, 10)

// Verify password (PWA side)
const valid = await bcrypt.compare(inputPassword, storedHash)
```

### Device Fingerprinting
```typescript
// Generate stable device ID
const getDeviceId = async () => {
  // Use combination of stable factors
  const factors = [
    navigator.userAgent,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    navigator.language,
    // Add WebGL renderer if available
  ]
  const fingerprint = factors.join('|')
  const encoder = new TextEncoder()
  const data = encoder.encode(fingerprint)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}
```

---

## Recommendation

Start with **Option 1 (Pre-seeded Credentials)** because:

1. **Zero dependencies** - no external services needed
2. **Works immediately** - fits current architecture
3. **Offline-first** - aligns with PWA model
4. **Customer controlled** - users managed in spec-selector
5. **Foundation for more** - can add OIDC later

### Implementation Priority

1. Add user management to spec-selector UI
2. Add bcrypt password hashing
3. Add login screen to PWA
4. Add session management (IndexedDB)
5. Add persona-based access control

This gives customers authentication today, with a clear upgrade path to enterprise auth when needed.
