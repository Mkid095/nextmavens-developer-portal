/**
 * Correlation ID Middleware Tests
 *
 * US-002: Implement Correlation ID Middleware
 *
 * Tests for:
 * - Generating UUID if not in x-request-id header
 * - Setting req.id = correlation ID
 * - Setting x-request-id response header
 * - Working with Next.js request/response
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  generateCorrelationId,
  extractCorrelationId,
  withCorrelationId,
  setCorrelationHeader,
  correlationMiddleware,
  getCorrelationId,
  withCorrelation,
  CORRELATION_HEADER,
} from '../correlation'

/**
 * Test 1: generateCorrelationId creates valid UUIDs
 */
function testGenerateCorrelationId() {
  const id1 = generateCorrelationId()
  const id2 = generateCorrelationId()

  // Verify format: should be UUID v4 (xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id1)) {
    throw new Error(`Generated ID is not a valid UUID: ${id1}`)
  }

  // Verify uniqueness
  if (id1 === id2) {
    throw new Error('Generated IDs should be unique')
  }

  console.log('✓ Test 1 passed: generateCorrelationId creates valid UUIDs')
}

/**
 * Test 2: extractCorrelationId extracts from headers
 */
function testExtractCorrelationId() {
  // Create a mock request with x-request-id header
  const mockRequest = {
    headers: {
      get: (name: string) => {
        if (name.toLowerCase() === 'x-request-id') {
          return 'test-correlation-id-123'
        }
        return null
      },
    },
  } as unknown as NextRequest

  const extractedId = extractCorrelationId(mockRequest)
  if (extractedId !== 'test-correlation-id-123') {
    throw new Error(`Expected 'test-correlation-id-123', got '${extractedId}'`)
  }

  // Test with missing header
  const mockRequestNoHeader = {
    headers: {
      get: () => null,
    },
  } as unknown as NextRequest

  const extractedIdNull = extractCorrelationId(mockRequestNoHeader)
  if (extractedIdNull !== null) {
    throw new Error(`Expected null, got '${extractedIdNull}'`)
  }

  console.log('✓ Test 2 passed: extractCorrelationId extracts from headers')
}

/**
 * Test 3: withCorrelationId sets req.id and returns ID
 */
function testWithCorrelationId() {
  // Test with existing x-request-id header
  const mockRequestWithId = {
    headers: {
      get: (name: string) => {
        if (name.toLowerCase() === 'x-request-id') {
          return 'existing-correlation-id'
        }
        return null
      },
    },
  } as NextRequest

  const correlationId1 = withCorrelationId(mockRequestWithId)
  if (correlationId1 !== 'existing-correlation-id') {
    throw new Error(`Expected 'existing-correlation-id', got '${correlationId1}'`)
  }

  if ((mockRequestWithId as any).id !== 'existing-correlation-id') {
    throw new Error('req.id should be set to the existing correlation ID')
  }

  // Test without x-request-id header (should generate new UUID)
  const mockRequestWithoutId = {
    headers: {
      get: () => null,
    },
  } as NextRequest

  const correlationId2 = withCorrelationId(mockRequestWithoutId)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(correlationId2)) {
    throw new Error(`Generated ID is not a valid UUID: ${correlationId2}`)
  }

  if ((mockRequestWithoutId as any).id !== correlationId2) {
    throw new Error('req.id should be set to the generated correlation ID')
  }

  console.log('✓ Test 3 passed: withCorrelationId sets req.id and returns ID')
}

/**
 * Test 4: setCorrelationHeader adds header to response
 */
function testSetCorrelationHeader() {
  const mockResponse = {
    headers: {
      set: function (name: string, value: string) {
        this._headers = this._headers || {}
        this._headers[name.toLowerCase()] = value
      },
      get: function (name: string) {
        return this._headers?.[name.toLowerCase()]
      },
    },
    _headers: {},
  } as unknown as NextResponse

  const correlationId = 'test-response-correlation-id'
  const updatedResponse = setCorrelationHeader(mockResponse, correlationId)

  if (updatedResponse.headers.get(CORRELATION_HEADER) !== correlationId) {
    throw new Error(`Expected '${correlationId}' in response headers`)
  }

  console.log('✓ Test 4 passed: setCorrelationHeader adds header to response')
}

/**
 * Test 5: getCorrelationId retrieves from request
 */
function testGetCorrelationId() {
  // Test with req.id set (already processed)
  const mockRequestProcessed = {
    headers: {
      get: () => null,
    },
    id: 'processed-correlation-id',
  } as unknown as NextRequest

  const id1 = getCorrelationId(mockRequestProcessed)
  if (id1 !== 'processed-correlation-id') {
    throw new Error(`Expected 'processed-correlation-id', got '${id1}'`)
  }

  // Test with x-request-id header (not yet processed)
  const mockRequestWithHeader = {
    headers: {
      get: (name: string) => {
        if (name.toLowerCase() === 'x-request-id') {
          return 'header-correlation-id'
        }
        return null
      },
    },
  } as unknown as NextRequest

  const id2 = getCorrelationId(mockRequestWithHeader)
  if (id2 !== 'header-correlation-id') {
    throw new Error(`Expected 'header-correlation-id', got '${id2}'`)
  }

  // Test with neither
  const mockRequestEmpty = {
    headers: {
      get: () => null,
    },
  } as unknown as NextRequest

  const id3 = getCorrelationId(mockRequestEmpty)
  if (id3 !== null) {
    throw new Error(`Expected null, got '${id3}'`)
  }

  console.log('✓ Test 5 passed: getCorrelationId retrieves from request')
}

/**
 * Test 6: withCorrelation HOF wraps handlers
 */
async function testWithCorrelation() {
  let capturedCorrelationId: string | undefined

  const mockHandler = async (req: NextRequest) => {
    capturedCorrelationId = (req as any).id
    return NextResponse.json({ success: true })
  }

  const wrappedHandler = withCorrelation(mockHandler)

  const mockRequest = {
    headers: {
      get: () => null,
    },
  } as NextRequest

  const response = await wrappedHandler(mockRequest)

  // Verify handler received correlation ID
  if (!capturedCorrelationId) {
    throw new Error('Handler should have received correlation ID')
  }

  // Verify response has correlation header
  const responseCorrelationId = response.headers.get(CORRELATION_HEADER)
  if (responseCorrelationId !== capturedCorrelationId) {
    throw new Error(`Response header should match request ID`)
  }

  console.log('✓ Test 6 passed: withCorrelation HOF wraps handlers')
}

/**
 * Test 7: Integration test - full request/response flow
 */
async function testIntegrationFlow() {
  // Simulate incoming request without x-request-id
  const incomingRequest = {
    headers: {
      get: () => null,
    },
  } as NextRequest

  // Apply correlation ID
  const correlationId = withCorrelationId(incomingRequest)

  // Create response
  const responseBody = { message: 'OK', correlation_id: correlationId }
  const response = NextResponse.json(responseBody)

  // Add correlation header
  const finalResponse = setCorrelationHeader(response, correlationId)

  // Verify full flow
  if ((incomingRequest as any).id !== correlationId) {
    throw new Error('Request ID not set correctly')
  }

  if (finalResponse.headers.get(CORRELATION_HEADER) !== correlationId) {
    throw new Error('Response correlation header not set correctly')
  }

  // Test with existing x-request-id
  const incomingRequestWithId = {
    headers: {
      get: (name: string) => {
        if (name.toLowerCase() === 'x-request-id') {
          return 'client-provided-id-456'
        }
        return null
      },
    },
  } as NextRequest

  const correlationId2 = withCorrelationId(incomingRequestWithId)

  if (correlationId2 !== 'client-provided-id-456') {
    throw new Error('Should use client-provided correlation ID')
  }

  if ((incomingRequestWithId as any).id !== 'client-provided-id-456') {
    throw new Error('Request ID should match client-provided ID')
  }

  console.log('✓ Test 7 passed: Integration test - full request/response flow')
}

/**
 * Run all tests
 */
export function runCorrelationTests() {
  console.log('Running Correlation ID Middleware Tests...\n')

  try {
    testGenerateCorrelationId()
    testExtractCorrelationId()
    testWithCorrelationId()
    testSetCorrelationHeader()
    testGetCorrelationId()
    await testWithCorrelation()
    await testIntegrationFlow()

    console.log('\n✅ All correlation ID middleware tests passed!')
    console.log('✅ Acceptance criteria met:')
    console.log('  - Middleware created at src/lib/middleware/correlation.ts')
    console.log('  - Generates UUID if not in x-request-id header')
    console.log('  - Sets req.id = correlation ID')
    console.log('  - Sets x-request-id response header')
    console.log('  - Works with Next.js')
    return true
  } catch (error) {
    console.error('\n❌ Test failed:', error)
    return false
  }
}

// Export test functions for individual execution
export {
  testGenerateCorrelationId,
  testExtractCorrelationId,
  testWithCorrelationId,
  testSetCorrelationHeader,
  testGetCorrelationId,
  testWithCorrelation,
  testIntegrationFlow,
}

// Run tests if executed directly
if (require.main === module) {
  runCorrelationTests()
}
