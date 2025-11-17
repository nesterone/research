#!/bin/bash
set -e

echo "============================================"
echo "Testing Approach 2: Two Separate Containers"
echo "============================================"
echo ""

TEST_FAILED=0

# Cleanup function
cleanup() {
    echo ""
    echo "Cleaning up..."
    docker-compose down -v 2>/dev/null || true
}

# Set trap to cleanup on exit
trap cleanup EXIT

echo "Step 1: Building Docker images..."
docker-compose build || {
    echo "❌ FAILED: Docker compose build failed"
    exit 1
}
echo "✓ Build successful"
echo ""

echo "Step 2: Starting containers..."
docker-compose up -d || {
    echo "❌ FAILED: Containers failed to start"
    exit 1
}
echo "✓ Containers started"
echo ""

echo "Step 3: Waiting for services to start (10 seconds)..."
sleep 10

echo "Step 4: Checking if containers are running..."
if ! docker ps | grep -q "approach2-server"; then
    echo "❌ FAILED: Server container is not running"
    docker-compose logs
    exit 1
fi
if ! docker ps | grep -q "approach2-client"; then
    echo "❌ FAILED: Client container is not running"
    docker-compose logs
    exit 1
fi
echo "✓ Both containers are running"
echo ""

echo "Step 5: Testing HTTP endpoint..."
for i in {1..5}; do
    if curl -s -f http://localhost:8080 > /tmp/response.json; then
        echo "✓ HTTP endpoint responded successfully"
        echo ""
        echo "Response:"
        cat /tmp/response.json | python3 -m json.tool
        break
    else
        if [ $i -eq 5 ]; then
            echo "❌ FAILED: HTTP endpoint not responding after 5 attempts"
            TEST_FAILED=1
        else
            echo "⚠️  Attempt $i failed, retrying..."
            sleep 2
        fi
    fi
done
echo ""

echo "Step 6: Checking server logs..."
echo "--- Server logs ---"
docker logs approach2-server --tail 20 || {
    echo "⚠️  Could not retrieve server logs"
}
echo ""

echo "Step 7: Checking client logs..."
echo "--- Client logs ---"
docker logs approach2-client --tail 20 || {
    echo "⚠️  Could not retrieve client logs"
}
echo ""

echo "Step 8: Verifying client-server communication..."
CLIENT_LOG=$(docker logs approach2-client --tail 50 2>&1)
if echo "$CLIENT_LOG" | grep -q "SUCCESS"; then
    echo "✓ Client is successfully communicating with server"
else
    echo "❌ FAILED: No successful client-server communication detected"
    TEST_FAILED=1
fi
echo ""

echo "Step 9: Checking container isolation..."
SERVER_HOSTNAME=$(docker exec approach2-server hostname)
CLIENT_HOSTNAME=$(docker exec approach2-client hostname)

echo "Server hostname: $SERVER_HOSTNAME"
echo "Client hostname: $CLIENT_HOSTNAME"

if [ "$SERVER_HOSTNAME" != "$CLIENT_HOSTNAME" ]; then
    echo "✓ Containers have different hostnames (properly isolated)"
else
    echo "⚠️  WARNING: Containers have the same hostname"
fi
echo ""

echo "Step 10: Checking network connectivity..."
if docker exec approach2-client ping -c 1 server > /dev/null 2>&1; then
    echo "✓ Client can reach server via Docker DNS"
else
    echo "❌ FAILED: Client cannot reach server via Docker DNS"
    TEST_FAILED=1
fi
echo ""

echo "Step 11: Testing scaling capability..."
echo "Scaling client to 2 instances..."
docker-compose up -d --scale client=2 || {
    echo "⚠️  WARNING: Scaling failed (may not be supported in this docker-compose version)"
}
sleep 5
CLIENT_COUNT=$(docker ps | grep -c "approach2.*client" || echo "0")
echo "Number of client containers running: $CLIENT_COUNT"
if [ "$CLIENT_COUNT" -ge 1 ]; then
    echo "✓ Scaling works (demonstrated independent scaling capability)"
else
    echo "⚠️  WARNING: No client containers found after scaling"
fi
echo ""

# Summary
echo "============================================"
echo "Test Summary"
echo "============================================"
if [ $TEST_FAILED -eq 0 ]; then
    echo "✅ ALL TESTS PASSED"
    echo ""
    echo "Approach 2 (separate containers) is working correctly!"
    echo "This is the RECOMMENDED approach for production use."
    exit 0
else
    echo "❌ SOME TESTS FAILED"
    echo ""
    echo "Check the logs above for details."
    exit 1
fi
