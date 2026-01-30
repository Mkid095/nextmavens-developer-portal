/**
 * Integration Test for Correlation ID Middleware
 * Tests the complete integration flow and correlation ID propagation
 *
 * This file can be run with: npx tsx src/lib/middleware/__tests__/integration-test.ts
 *
 * US-002: Implement Correlation ID Middleware
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  withCorrelationId,
  setCorrelationHeader,
  withCorrelation,
  getCorrelationId,
  generateCorrelationId,
  CORRELATION_HEADER,
} from '../correlation'

// Test runner utilities
function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`)
  }
}

// Test Group: Correlation ID Propagation Across Services
async function testCorrelationIdPropagation() {
  console.log('\n📋 Test Group: Correlation ID Propagation\n')

  // Simulate a request entering the system without correlation ID
  const incomingRequest = {
    url: 'https://api.example.com/v1/projects',
    method: 'GET',
    headers: {
      get: (name: string) => {
        if (name.toLowerCase() === 'x-request-id') return null
        if (name.toLowerCase() === 'user-agent') return 'TestClient/1.0'
        return null
      },
    },
  } as NextRequest

  // Apply correlation ID (as if middleware processed it)
  const correlationId1 = withCorrelationId(incomingRequest)

  assert(correlationId1 !== null, 'Correlation ID should be generated')
  assert((incomingRequest as any).id === correlationId1, 'Request should have id property set')

  // Simulate downstream service call with correlation ID
  const downstreamRequest = {
    url: 'https://auth-service.example.com/v1/users',
    method: 'POST',
    headers: {
      get: (name: string) => {
        if (name.toLowerCase() === 'x-request-id') return correlationId1
        return null
      },
      set: function (name: string, value: string) {
        this._headers = this._headers || {}
        this._headers[name.toLowerCase()] = value
      },
    },
  } as NextRequest

  const correlationId2 = withCorrelationId(downstreamRequest)

  assert(correlationId2 === correlationId1, 'Downstream service should use same correlation ID')

  console.log('  ✓ Correlation ID propagates across services')
  console.log(`    Generated ID: ${correlationId1}`)
  console.log(`    Propagated ID: ${correlationId2}`)
}

// Test Group: Response Header Propagation
async function testResponseHeaderPropagation() {
  console.log('\n📋 Test Group: Response Header Propagation\n')

  // Create a request with correlation ID
  const request = {
    headers: {
      get: (name: string) => {
        if (name.toLowerCase() === 'x-request-id') return 'test-correlation-123'
        return null
      },
    },
  } as NextRequest

  const correlationId = withCorrelationId(request)

  // Create response
  const response = NextResponse.json({
    status: 'success',
    data: { message: 'Operation completed' },
  })

  // Set correlation header
  const finalResponse = setCorrelationHeader(response, correlationId)

  const responseCorrelationId = finalResponse.headers.get(CORRELATION_HEADER)

  assert(responseCorrelationId === correlationId, 'Response should contain correlation ID in header')
  assert(responseCorrelationId === 'test-correlation-123', 'Should use original correlation ID')

  console.log('  ✓ Response includes correlation ID in header')
  console.log(`    Correlation ID: ${responseCorrelationId}`)
}

// Test Group: Client-Provided Correlation ID
async function testClientProvidedCorrelationId() {
  console.log('\n📋 Test Group: Client-Provided Correlation ID\n')

  // Client sends request with their own correlation ID
  const clientRequestId = 'client-trace-abc-123-def-456'

  const request = {
    headers: {
      get: (name: string) => {
        if (name.toLowerCase() === 'x-request-id') return clientRequestId
        return null
      },
    },
  } as NextRequest

  const correlationId = withCorrelationId(request)

  assert(correlationId === clientRequestId, 'Should use client-provided correlation ID')
  assert((request as any).id === clientRequestId, 'Request id should match client-provided ID')

  // Verify it's propagated to response
  const response = NextResponse.json({ success: true })
  const finalResponse = setCorrelationHeader(response, correlationId)

  const responseId = finalResponse.headers.get(CORRELATION_HEADER)
  assert(responseId === clientRequestId, 'Response should use client-provided ID')

  console.log('  ✓ Client-provided correlation ID is preserved')
  console.log(`    Client ID: ${clientRequestId}`)
}

// Test Group: Multiple Service Calls (Trace)
async function testMultipleServiceCalls() {
  console.log('\n📋 Test Group: Multiple Service Calls (Distributed Trace)\n')

  // Simulate a distributed trace across multiple services
  const services = [
    'api-gateway',
    'auth-service',
    'data-service',
    'notification-service',
  ]

  // Initial request without correlation ID
  const initialRequest = {
    headers: {
      get: () => null,
    },
  } as NextRequest

  const rootCorrelationId = withCorrelationId(initialRequest)

  console.log(`  Root correlation ID: ${rootCorrelationId}`)

  // Trace through each service
  const serviceIds: string[] = []
  for (const service of services) {
    const serviceRequest = {
      headers: {
        get: (name: string) => {
          if (name.toLowerCase() === 'x-request-id') return rootCorrelationId
          return null
        },
      },
    } as NextRequest

    const serviceCorrelationId = withCorrelationId(serviceRequest)
    serviceIds.push(serviceCorrelationId)

    assert(serviceCorrelationId === rootCorrelationId, `${service} should use root correlation ID`)

    // Simulate service response
    const serviceResponse = NextResponse.json({
      service,
      status: 'ok',
    })

    const finalResponse = setCorrelationHeader(serviceResponse, serviceCorrelationId)
    assert(
      finalResponse.headers.get(CORRELATION_HEADER) === rootCorrelationId,
      `${service} response should include root correlation ID`
    )

    console.log(`  ✓ ${service}: ${serviceCorrelationId}`)
  }

  // Verify all services used the same ID
  const uniqueIds = new Set(serviceIds)
  assert(uniqueIds.size === 1, 'All services should use the same correlation ID')

  console.log('  ✓ All services in the trace share the same correlation ID')
}

// Test Group: Higher-Order Function Wrapper
async function testHigherOrderFunctionWrapper() {
  console.log('\n📋 Test Group: Higher-Order Function Wrapper\n')

  let handlerRequestId: string | undefined
  let handlerResponseId: string | undefined

  // Create a handler that captures correlation ID
  const mockHandler = async (req: NextRequest) => {
    handlerRequestId = (req as any).id

    const response = NextResponse.json({
      message: 'Handler executed',
      correlation_id: handlerRequestId,
    })

    handlerResponseId = response.headers.get(CORRELATION_HEADER) || undefined

    return response
  }

  // Wrap with withCorrelation HOF
  const wrappedHandler = withCorrelation(mockHandler)

  // Call wrapped handler
  const request = {
    headers: {
      get: () => null,
    },
  } as NextRequest

  const response = await wrappedHandler(request)

  assert(handlerRequestId !== undefined, 'Handler should receive correlation ID')
  assert(handlerResponseId !== undefined, 'Response should have correlation ID header')
  assert(handlerRequestId === handlerResponseId, 'Request and response IDs should match')
  assert(
    response.headers.get(CORRELATION_HEADER) === handlerRequestId,
    'Wrapped response should include correlation ID'
  )

  console.log('  ✓ withCorrelation wrapper correctly applies correlation ID')
  console.log(`    Request ID: ${handlerRequestId}`)
  console.log(`    Response ID: ${handlerResponseId}`)
}

// Test Group: Type Safety
async function testTypeSafety() {
  console.log('\n📋 Test Group: Type Safety\n')

  const request = {
    headers: {
      get: (name: string) => {
        if (name.toLowerCase() === 'x-request-id') return 'type-safe-test-id'
        return null
      },
    },
  } as NextRequest

  // Test withCorrelationId returns string
  const correlationId: string = withCorrelationId(request)
  assert(typeof correlationId === 'string', 'withCorrelationId should return string')

  // Test getCorrelationId returns string | null
  const retrievedId: string | null = getCorrelationId(request)
  assert(retrievedId === 'type-safe-test-id', 'getCorrelationId should return the ID')

  // Test setCorrelationHeader returns NextResponse
  const response = NextResponse.json({ test: true })
  const updatedResponse: NextResponse = setCorrelationHeader(response, correlationId)
  assert(updatedResponse instanceof NextResponse, 'setCorrelationHeader should return NextResponse')

  console.log('  ✓ All functions have correct type signatures')
}

// Test Group: Edge Cases
async function testEdgeCases() {
  console.log('\n📋 Test Group: Edge Cases\n')

  // Test 1: Empty string correlation ID (should generate new one)
  const emptyRequest = {
    headers: {
      get: (name: string) => {
        if (name.toLowerCase() === 'x-request-id') return ''
        return null
      },
    },
  } as NextRequest

  const emptyId = withCorrelationId(emptyRequest)
  assert(emptyId !== '', 'Empty string should trigger new ID generation')
  assert(emptyId.length > 0, 'Should generate valid UUID')

  console.log('  ✓ Empty correlation ID triggers new generation')

  // Test 2: Invalid UUID format (should still use what client provided)
  const invalidRequest = {
    headers: {
      get: (name: string) => {
        if (name.toLowerCase() === 'x-request-id') return 'not-a-uuid-but-valid-trace-id'
        return null
      },
    },
  } as NextRequest

  const invalidId = withCorrelationId(invalidRequest)
  assert(invalidId === 'not-a-uuid-but-valid-trace-id', 'Should use client-provided ID even if not UUID format')

  console.log('  ✓ Non-UUID correlation IDs are preserved')

  // Test 3: Very long correlation ID
  const longId = 'a'.repeat(500)
  const longRequest = {
    headers: {
      get: (name: string) => {
        if (name.toLowerCase() === 'x-request-id') return longId
        return null
      },
    },
  } as NextRequest

  const longIdResult = withCorrelationId(longRequest)
  assert(longIdResult === longId, 'Should preserve very long correlation IDs')

  console.log('  ✓ Very long correlation IDs are preserved')

  // Test 4: Special characters in correlation ID
  const specialId = 'trace-123_456.789/test'
  const specialRequest = {
    headers: {
      get: (name: string) => {
        if (name.toLowerCase() === 'x-request-id') return specialId
        return null
      },
    },
  } as NextRequest

  const specialIdResult = withCorrelationId(specialRequest)
  assert(specialIdResult === specialId, 'Should preserve special characters in correlation ID')

  console.log('  ✓ Special characters in correlation IDs are preserved')
}

// Main test runner
async function runAllTests() {
  console.log('\n🧪 Running Integration Tests for Correlation ID Middleware')
  console.log('='.repeat(60))

  try {
    await testCorrelationIdPropagation()
    await testResponseHeaderPropagation()
    await testClientProvidedCorrelationId()
    await testMultipleServiceCalls()
    await testHigherOrderFunctionWrapper()
    await testTypeSafety()
    await testEdgeCases()

    console.log('\n' + '='.repeat(60))
    console.log('\n✅ All integration tests passed!\n')
    console.log('✅ Correlation ID propagation works correctly!')
    console.log('✅ Response headers include correlation IDs!')
    console.log('✅ Client-provided IDs are preserved!')
    console.log('✅ Distributed tracing is supported!')
    console.log('✅ Type safety is maintained!')
    console.log('✅ Edge cases are handled!')
    console.log('\n' + '='.repeat(60) + '\n')

    return true
  } catch (error) {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  }
}

// Run tests
runAllTests()
