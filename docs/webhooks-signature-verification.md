# Webhook Signature Verification

## Overview

All webhooks delivered by NextMavens are signed using HMAC-SHA256. This signature allows you to verify that the webhook you received is authentic and hasn't been tampered with in transit.

## How Signature Verification Works

When we deliver a webhook, we:

1. Convert the payload to a JSON string
2. Generate an HMAC-SHA256 hash using your webhook secret
3. Send the signature in the `X-Webhook-Signature` header

The signature format is: `sha256=<hex_signature>`

## Headers

Every webhook request includes these headers:

| Header | Description | Example |
|--------|-------------|---------|
| `X-Webhook-Signature` | HMAC-SHA256 signature of the payload | `sha256=abc123def456...` |
| `X-Webhook-Event` | The event type | `project.created` |
| `X-Webhook-Delivery` | Unique delivery ID for tracking | `evt_abc123xyz` |
| `User-Agent` | Identifies the sender | `NextMavens-Webhooks/1.0` |

## Verification Steps

### Step 1: Get Your Webhook Secret

When you create a webhook, you'll receive a secret. Store this securely - it's shown only once.

### Step 2: Capture the Raw Request Body

**Important**: Use the **raw** request body for signature verification, not the parsed JSON.

### Step 3: Compute the Expected Signature

Create an HMAC-SHA256 hash using:
- Your webhook secret as the key
- The raw request body as the message

### Step 4: Compare Signatures

Compare your computed signature with the `X-Webhook-Signature` header value.

**Security Note**: Use constant-time comparison to prevent timing attacks.

## Example Code

### Node.js / TypeScript (Express)

```typescript
import { createHmac, timingSafeEqual } from 'crypto'

function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  // Generate expected signature
  const hmac = createHmac('sha256', secret)
  hmac.update(rawBody)
  const expectedSignature = `sha256=${hmac.digest('hex')}`

  // Constant-time comparison
  const expectedBuffer = Buffer.from(expectedSignature)
  const providedBuffer = Buffer.from(signature)

  if (expectedBuffer.length !== providedBuffer.length) {
    return false
  }

  return timingSafeEqual(expectedBuffer, providedBuffer)
}

// Express middleware example
import express from 'express'

const app = express()

// Use raw body parser for webhooks
app.post('/webhooks', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-webhook-signature'] as string
  const secret = process.env.WEBHOOK_SECRET!

  const isValid = verifyWebhookSignature(req.body, signature, secret)

  if (!isValid) {
    return res.status(401).send('Invalid signature')
  }

  // Parse JSON after verification
  const payload = JSON.parse(req.body.toString())

  console.log('Received webhook:', payload)

  res.status(200).send('OK')
})
```

### Node.js / TypeScript (Next.js API Route)

```typescript
import { verifyWebhookSignature, parseVerifiedWebhook } from '@/features/webhooks/lib/webhook-signature'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Verify and parse in one step
    const webhook = await parseVerifiedWebhook(
      request,
      process.env.WEBHOOK_SECRET!
    )

    console.log('Received webhook:', webhook.event, webhook.data)

    // Process the webhook...
    switch (webhook.event) {
      case 'project.created':
        // Handle project creation
        break
      case 'user.signedup':
        // Handle user signup
        break
      // ... other events
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Invalid signature or payload' },
      { status: 401 }
    )
  }
}
```

### Python (Flask)

```python
import hmac
import hashlib
from flask import Flask, request, jsonify

app = Flask(__name__)

def verify_webhook_signature(raw_body: str, signature: str, secret: str) -> bool:
    """Verify webhook signature using HMAC-SHA256"""
    # Generate expected signature
    expected_signature = 'sha256=' + hmac.new(
        secret.encode(),
        raw_body.encode(),
        hashlib.sha256
    ).hexdigest()

    # Constant-time comparison
    return hmac.compare_digest(expected_signature, signature)

@app.route('/webhooks', methods=['POST'])
def handle_webhook():
    # Get raw data
    raw_body = request.get_data(as_text=False).decode('utf-8')
    signature = request.headers.get('X-Webhook-Signature')
    secret = 'your_webhook_secret'

    # Verify signature
    if not verify_webhook_signature(raw_body, signature, secret):
        return 'Invalid signature', 401

    # Parse JSON
    payload = request.get_json()

    print('Received webhook:', payload)

    return 'OK', 200
```

### Go

```go
package main

import (
    "crypto/hmac"
    "crypto/sha256"
    "encoding/hex"
    "fmt"
    "io"
    "log"
    "net/http"
)

func verifyWebhookSignature(body, signature, secret string) bool {
    // Generate expected signature
    h := hmac.New(sha256.New, []byte(secret))
    h.Write([]byte(body))
    expectedSignature := "sha256=" + hex.EncodeToString(h.Sum(nil))

    // Constant-time comparison
    return hmac.Equal([]byte(expectedSignature), []byte(signature))
}

func webhookHandler(w http.ResponseWriter, r *http.Request) {
    // Read raw body
    body, err := io.ReadAll(r.Body)
    if err != nil {
        http.Error(w, "Error reading body", http.StatusBadRequest)
        return
    }

    signature := r.Header.Get("X-Webhook-Signature")
    secret := "your_webhook_secret"

    // Verify signature
    if !verifyWebhookSignature(string(body), signature, secret) {
        http.Error(w, "Invalid signature", http.StatusUnauthorized)
        return
    }

    // Process webhook
    fmt.Println("Received webhook:", string(body))

    w.WriteHeader(http.StatusOK)
    fmt.Fprint(w, "OK")
}

func main() {
    http.HandleFunc("/webhooks", webhookHandler)
    log.Fatal(http.ListenAndServe(":8080", nil))
}
```

## Security Best Practices

### 1. Always Verify Signatures

Never process webhook payloads without verifying the signature first. This protects you from:
- Fake webhooks from malicious actors
- Man-in-the-middle attacks
- Payload tampering

### 2. Use Constant-Time Comparison

When comparing signatures, always use constant-time comparison:
- **Node.js**: `crypto.timingSafeEqual()`
- **Python**: `hmac.compare_digest()`
- **Go**: `hmac.Equal()`

Regular string comparison (`===`, `==`) can leak information through timing differences.

### 3. Check Timestamps (Recommended)

For additional security, check the webhook timestamp to prevent replay attacks:

```typescript
const webhookTimestamp = payload.timestamp
const currentTime = Date.now()
const maxAge = 5 * 60 * 1000 // 5 minutes

if (currentTime - webhookTimestamp > maxAge) {
  // Reject old webhooks
  return res.status(401).send('Webhook too old')
}
```

### 4. Return Proper Status Codes

- **200 OK** - Webhook processed successfully
- **401 Unauthorized** - Invalid signature
- **400 Bad Request** - Malformed payload
- **500 Server Error** - Internal processing error

We will retry failed deliveries, so return non-2xx codes for temporary failures.

### 5. Handle Idempotency

Webhooks may be delivered multiple times (due to retries). Use the `X-Webhook-Delivery` header to deduplicate:

```typescript
const deliveryId = request.headers.get('X-Webhook-Delivery')

// Check if already processed
if (await isAlreadyProcessed(deliveryId)) {
  return res.status(200).send('Already processed')
}

// Process webhook...
await markAsProcessed(deliveryId)
```

## Testing Signature Verification

You can test your signature verification using our helper function:

```typescript
import { generateSignature, verifyWebhookSignature } from '@/features/webhooks/lib/webhook-signature'

// Generate a test signature
const payload = JSON.stringify({ event: 'test', data: {} })
const secret = 'test_secret'
const signature = generateSignature(payload, secret)

// Verify it works
const isValid = verifyWebhookSignature(payload, signature, secret)
console.log(isValid) // true
```

## Troubleshooting

### Signature Always Fails

1. **Raw Body Issue**: Make sure you're using the raw request body, not parsed JSON
2. **Encoding**: Ensure you're treating the body as UTF-8
3. **Secret**: Double-check you're using the correct webhook secret

### Intermittent Failures

1. **Timing Attack**: Make sure you're using constant-time comparison
2. **Whitespace**: Check for extra whitespace in the body
3. **Headers**: Ensure you're reading headers case-insensitively

### Signature Format

The signature always follows this format:
```
sha256=<64_hex_characters>
```

Example:
```
sha256=a1b2c3d4e5f6...64_characters_total
```

## Need Help?

If you're having trouble with webhook signature verification:

1. Check your webhook secret in the dashboard
2. Use our verification library directly
3. Contact support with your webhook ID and a sample payload
