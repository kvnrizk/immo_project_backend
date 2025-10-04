# Analytics Module

This module provides comprehensive analytics and visitor tracking for the application, including server health monitoring and geolocation-based statistics.

## Features

### 1. Visitor Tracking
- Automatic tracking of all page visits via middleware
- IP-based geolocation (country/city)
- User agent tracking
- Page view tracking

### 2. Analytics Dashboard
- Total visitors (all-time, today, this week, this month)
- Geographic distribution of visitors
- Daily visitor trends (last 30 days)
- Top visited pages

### 3. Health Monitoring
- Server health status
- Database connection status
- Server uptime
- Memory usage (used/total/percentage)
- CPU usage percentage

## API Endpoints

### Public Endpoints

#### `POST /analytics/track`
Track a page view from the frontend.

**Request Body:**
```json
{
  "page": "/properties"
}
```

**Response:**
```json
{
  "success": true
}
```

#### `GET /health` or `GET /analytics/health`
Get server health status.

**Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "uptime": 86400,
  "memory": {
    "used": 512000000,
    "total": 2048000000,
    "percentage": 25.0
  },
  "cpu": {
    "usage": 15.5
  },
  "timestamp": "2025-10-03T10:00:00.000Z"
}
```

### Protected Endpoints (Requires Authentication)

#### `GET /analytics`
Get comprehensive analytics data.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "visitorStats": {
    "total": 1500,
    "today": 45,
    "thisWeek": 320,
    "thisMonth": 890
  },
  "countryStats": [
    {
      "country": "France",
      "count": 850
    },
    {
      "country": "United States",
      "count": 400
    }
  ],
  "dailyVisitors": [
    {
      "date": "2025-10-01",
      "count": 42
    },
    {
      "date": "2025-10-02",
      "count": 38
    }
  ],
  "topPages": [
    {
      "page": "/",
      "count": 650
    },
    {
      "page": "/properties",
      "count": 420
    }
  ]
}
```

## Database Schema

### Visitors Table
```sql
CREATE TABLE visitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip VARCHAR(45),
  country VARCHAR(100),
  city VARCHAR(100),
  user_agent TEXT,
  page VARCHAR(500),
  visited_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX idx_visitors_visited_at ON visitors(visited_at);
CREATE INDEX idx_visitors_country ON visitors(country);
CREATE INDEX idx_visitors_page ON visitors(page);
```

## Middleware

The `VisitorTrackingMiddleware` automatically tracks visits for all GET requests, with the following exclusions:
- `/health`
- `/api/analytics`
- `/favicon.ico`
- `/assets/*`

## Geolocation Service

Uses the free [ipapi.co](https://ipapi.co) API for IP geolocation:
- **Free tier**: 1,000 requests/day
- **No API key required**
- Automatic fallback to "Unknown" on failure
- Handles localhost/private IPs gracefully

### Alternative Geolocation Services

If you need more requests or better accuracy, consider:

1. **IPStack** (https://ipstack.com)
   - 10,000 requests/month free
   - Requires API key

2. **MaxMind GeoLite2** (https://dev.maxmind.com)
   - Unlimited requests
   - Requires downloading database file
   - More accurate

3. **IP-API** (http://ip-api.com)
   - 45 requests/minute free
   - No API key required

## Configuration

No additional configuration required. The module automatically:
- Creates the `visitors` table on first run (if `synchronize: true`)
- Tracks all incoming requests
- Stores geolocation data asynchronously

## Usage in Frontend

```typescript
import { analyticsAPI } from '@/services/api';

// Track page view
await analyticsAPI.trackPageView('/properties');

// Get analytics (admin only)
const analytics = await analyticsAPI.getAnalytics();

// Get health status
const health = await analyticsAPI.getHealth();
```

## Performance Considerations

1. **Async Tracking**: Visitor tracking is done asynchronously to not block requests
2. **Geolocation Caching**: Consider implementing IP caching to reduce API calls
3. **Database Indexes**: Indexes are created on frequently queried columns
4. **Cleanup**: Consider implementing a cron job to archive old visitor data

## Future Enhancements

- [ ] Add visitor sessions tracking
- [ ] Implement IP caching to reduce geolocation API calls
- [ ] Add real-time analytics with WebSockets
- [ ] Implement visitor data retention policies
- [ ] Add browser/OS analytics from user agent
- [ ] Add conversion tracking
- [ ] Add A/B testing capabilities
