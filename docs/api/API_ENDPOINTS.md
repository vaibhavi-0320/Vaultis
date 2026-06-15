# API Endpoints Documentation

## Base URL
- Development: `http://localhost:5000/api`
- Production: `https://your-domain.com/api`

## Authentication Endpoints

### Register User
```
POST /auth/register
Content-Type: application/json

{
  "username": "user@example.com",
  "password": "securePassword123",
  "confirmPassword": "securePassword123"
}
```

### Login User
```
POST /auth/login
Content-Type: application/json

{
  "username": "user@example.com",
  "password": "securePassword123"
}
```

## Asset Management

### Get All Assets
```
GET /assets
Authorization: Bearer <token>
```

### Create Asset
```
POST /assets
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Asset Name",
  "description": "Asset Description",
  "value": 1000,
  "type": "crypto|real-estate|document"
}
```

### Update Asset
```
PUT /assets/:id
Authorization: Bearer <token>
```

### Delete Asset
```
DELETE /assets/:id
Authorization: Bearer <token>
```

## Will Management

### Get Will
```
GET /will
Authorization: Bearer <token>
```

### Create/Update Will
```
POST /will
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Will document content...",
  "beneficiaries": [...]
}
```

## Contacts

### Get Contacts
```
GET /contacts
Authorization: Bearer <token>
```

### Add Contact
```
POST /contacts
Authorization: Bearer <token>
Content-Type: application/json
```

### Delete Contact
```
DELETE /contacts/:id
Authorization: Bearer <token>
```

## Health Check

### System Status
```
GET /health
```

Returns:
```json
{
  "success": true,
  "message": "VAULTIS API running",
  "mongodb": "connected",
  "blockchain": "synced",
  "environment": "production"
}
```

## Rate Limiting
- General API: 100 requests per 15 minutes
- Check-in: Unlimited (configurable per environment)

## Error Responses
All errors follow this format:
```json
{
  "success": false,
  "message": "Error description"
}
```

## Authentication
Include JWT token in Authorization header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

Tokens are valid for 7 days by default.
