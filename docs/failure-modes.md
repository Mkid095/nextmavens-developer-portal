# Failure Modes Documentation

This document describes the limits, constraints, and common failure modes across all NextMavens platform services. Understanding these limits helps you design applications that work within platform constraints and avoid common pitfalls.

## Overview

Every service in the NextMavens platform has limits to ensure fair resource allocation and system stability. This document provides a comprehensive reference for:

- Rate limits per service
- Maximum file sizes
- Query timeouts
- Connection limits
- Error codes and their meanings
- Common pitfalls and how to avoid them

---

## Database Limits

### Query Limits

| Limit | Value | Notes |
|-------|-------|-------|
| Max rows per query | 1,000 | Use pagination for larger result sets |
| Query timeout | 30 seconds | Long-running queries are automatically terminated |
| Rate limit | 100 requests/minute | Per project |
| Connection pool | 20 per project | Shared across all database operations |
| Transaction timeout | 60 seconds | Transactions exceeding this are rolled back |

### Best Practices

- **Use pagination**: Always use `LIMIT` and `OFFSET` for large result sets
- **Index columns**: Frequently queried columns should be indexed
- **Avoid N+1 queries**: Use JOINs or batch queries instead
- **Keep transactions short**: Minimize work inside transactions
- **Use connection pooling**: Reuse connections instead of creating new ones

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Query timeout | Inefficient queries, missing indexes | Add indexes, optimize queries, use pagination |
| Connection pool exhausted | Not releasing connections | Ensure connections are properly closed |
| Transaction timeout | Long-running transactions | Break into smaller transactions |

---

## Auth Limits

### User Management

| Limit | Value | Notes |
|-------|-------|-------|
| Max users per project | 100,000 | Contact support for higher limits |
| Rate limit | 50 requests/minute | Per project for auth operations |
| Session duration | 7 days | Sessions expire after 7 days of inactivity |
| Max concurrent sessions | 10 per user | Oldest session is revoked when exceeded |

### Authentication

| Limit | Value | Notes |
|-------|-------|-------|
| Password reset requests | 5 per hour per user | Prevents abuse |
| MFA codes | 3 attempts per code | Code expires after 5 minutes |
| Login attempts | 10 per IP per minute | Temporary lockout after exceeding |

### Best Practices

- **Handle session expiry gracefully**: Implement re-authentication when sessions expire
- **Use secure session storage**: Store session tokens securely (httpOnly cookies recommended)
- **Implement rate limiting in clients**: Respect rate limits to avoid temporary lockouts
- **Monitor active sessions**: Provide UI for users to manage their active sessions

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Session expired | 7 days of inactivity | Re-authenticate the user |
| Too many sessions | Exceeded 10 concurrent sessions | Revoke old sessions or implement session management |
| Rate limited | Too many auth requests | Implement exponential backoff and retry |

---

## Realtime Limits

### Connection Limits

| Limit | Value | Notes |
|-------|-------|-------|
| Max connections | 50 per project | Concurrent WebSocket connections |
| Message rate | 100/second | Per connection |
| Channel subscription limit | 100 per connection | Maximum channels a connection can subscribe to |
| Connection timeout | 2 hours | Connections are automatically disconnected |
| Message size | 64KB max | Larger messages are rejected |

### Best Practices

- **Clean up subscriptions**: Unsubscribe from channels when no longer needed
- **Handle reconnections**: Implement automatic reconnection with exponential backoff
- **Batch messages**: Send multiple updates in a single message when possible
- **Monitor connection count**: Track active connections to avoid hitting limits

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Connection rejected | Exceeded 50 concurrent connections | Implement connection pooling or reduce connections |
| Message rejected | Message size exceeds 64KB | Split large messages or use alternative transport |
| Subscription failed | Exceeded 100 channel subscriptions | Unsubscribe from unused channels |

---

## Storage Limits

### File Upload Limits

| Limit | Value | Notes |
|-------|-------|-------|
| Max file size | 5GB | Per file upload |
| Upload rate | 10/minute | Per project |
| Storage quota | Varies by plan | Check your plan for specific limits |
| Bucket limit | 100 per project | Contact support for more buckets |
| File retention | 30 days minimum | Files are retained for at least 30 days |

### Best Practices

- **Use multipart uploads**: For files > 100MB, use multipart upload
- **Implement retry logic**: Network failures can interrupt uploads
- **Monitor storage usage**: Track storage usage to avoid hitting quota
- **Use CDN links**: Serve files through CDN for better performance

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Upload rejected | File size exceeds 5GB | Split file or use multipart upload |
| Quota exceeded | Storage limit reached | Delete old files or upgrade plan |
| Upload failed | Network interruption | Implement retry logic with exponential backoff |

---

## GraphQL Limits

### Query Limits

| Limit | Value | Notes |
|-------|-------|-------|
| Query depth | 10 levels | Maximum nesting depth |
| Query complexity | 1000 points | Complexity points calculated per field |
| Rate limit | 60 requests/minute | Per project |
| Query timeout | 30 seconds | Long-running queries are terminated |
| Max result size | 10MB | Response size limit |

### Best Practices

- **Use query batching**: Combine multiple queries into a single request
- **Avoid deep nesting**: Keep queries under 10 levels of nesting
- **Use fragments**: Reuse common field selections
- **Implement pagination**: Use cursor-based pagination for large lists

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Query too complex | Exceeded 1000 complexity points | Simplify query or reduce field count |
| Query depth exceeded | Nesting > 10 levels | Flatten query structure |
| Result too large | Response > 10MB | Use pagination or reduce fields |

---

## Error Codes

### Common Error Codes

| Error Code | Message | Retryable | Description |
|------------|---------|-----------|-------------|
| `PROJECT_SUSPENDED` | Project is suspended | No | Project has been suspended by platform |
| `RATE_LIMITED` | Too many requests | Yes | Rate limit exceeded, retry after delay |
| `QUOTA_EXCEEDED` | Monthly quota exceeded | No | Resource quota for the period exceeded |
| `KEY_INVALID` | API key invalid or expired | No | API key authentication failed |
| `SERVICE_DISABLED` | Service not enabled for project | No | Requested service is not enabled |
| `PERMISSION_DENIED` | Insufficient permissions | No | User lacks required permissions |
| `VALIDATION_ERROR` | Request validation failed | No | Invalid request parameters |
| `INTERNAL_ERROR` | Unexpected server error | Yes | Server-side error, can be retried |
| `TIMEOUT_ERROR` | Request timeout | Yes | Request took too long to complete |

### Handling Errors

```typescript
try {
  const response = await apiCall()
} catch (error) {
  if (error.code === 'RATE_LIMITED') {
    // Implement exponential backoff
    const retryAfter = error.retryAfter || 60
    await sleep(retryAfter * 1000)
    // Retry request
  } else if (error.code === 'PERMISSION_DENIED') {
    // Redirect to permissions page or show upgrade prompt
  } else if (error.retryable) {
    // Retry with exponential backoff
  } else {
    // Show error to user
  }
}
```

---

## Common Pitfalls

### Database Pitfalls

| Pitfall | Description | Solution |
|---------|-------------|----------|
| N+1 queries | Querying related data in a loop | Use JOINs or batch queries |
| Missing indexes | Slow queries on unindexed columns | Add indexes to frequently queried columns |
| Not releasing connections | Connection pool exhaustion | Always release connections in finally blocks |

### Auth Pitfalls

| Pitfall | Description | Solution |
|---------|-------------|----------|
| Storing tokens insecurely | XSS vulnerability | Use httpOnly cookies or secure storage |
| Not handling session expiry | Poor UX | Implement re-authentication flow |
| Ignoring rate limits | Temporary lockouts | Implement exponential backoff |

### Realtime Pitfalls

| Pitfall | Description | Solution |
|---------|-------------|----------|
| Not cleaning up subscriptions | Memory leaks | Unsubscribe when component unmounts |
| No reconnection logic | Connection drops | Implement automatic reconnection |
| Sending large messages | Message rejected | Keep messages under 64KB |

### Storage Pitfalls

| Pitfall | Description | Solution |
|---------|-------------|----------|
| Large file uploads | Upload failures | Use multipart uploads for files > 100MB |
| No retry logic | Failed uploads | Implement retry with exponential backoff |
| Ignoring quota limits | Upload failures | Monitor storage usage and notify users |

---

## Troubleshooting

### Query Timeout Scenarios

When queries timeout, consider these common causes:

1. **Large result sets**: Use pagination to limit results
2. **Missing indexes**: Add indexes to improve query performance
3. **Complex joins**: Simplify queries or denormalize data
4. **Locks and blocking**: Check for long-running transactions

**Diagnosis**: Use query analysis tools to identify slow queries
**Solution**: Optimize queries, add indexes, or break into smaller queries

### Rate Limit Behavior

Rate limits use a sliding window algorithm:

- Each request consumes capacity from the window
- Capacity replenishes over time
- Response headers indicate remaining capacity:
  - `RateLimit-Remaining`: Requests remaining in current window
  - `RateLimit-Reset`: When the window resets (Unix timestamp)
  - `Retry-After`: Seconds to wait before retrying (on 429 responses)

**Best Practice**: Implement exponential backoff when receiving 429 responses

### When to Contact Support

Contact platform support when:

- You need higher limits than defaults
- You encounter persistent errors not documented here
- You need guidance on optimizing for scale
- You suspect a platform bug or issue

---

## Additional Resources

- [Auth Service API Documentation](/docs/auth-service-api.md)
- [Security Documentation](/docs/security-audit-US-011.md)
- [Platform Invariants](/docs/prd-platform-invariants.json)
- [Standardized Errors](/docs/prd-standardized-errors.json)
