#!/bin/bash
set -e

echo "============================================"
echo "Testing Approach 1b: Single Container with supervisord"
echo "============================================"
echo ""

CONTAINER_NAME="approach1-supervisord-test"
TEST_FAILED=0

# Cleanup function
cleanup() {
    echo ""
    echo "Cleaning up..."
    docker stop $CONTAINER_NAME 2>/dev/null || true
    docker rm $CONTAINER_NAME 2>/dev/null || true
}

# Set trap to cleanup on exit
trap cleanup EXIT

echo "Step 1: Building Docker image..."
docker build -t approach1-single-container . || {
    echo "❌ FAILED: Docker build failed"
    exit 1
}
echo "✓ Build successful"
echo ""

echo "Step 2: Starting container..."
docker run -d \
    --name $CONTAINER_NAME \
    -p 8081:8080 \
    approach1-single-container || {
    echo "❌ FAILED: Container failed to start"
    exit 1
}
echo "✓ Container started"
echo ""

echo "Step 3: Waiting for services to start (10 seconds)..."
sleep 10

echo "Step 4: Checking if container is running..."
if ! docker ps | grep -q $CONTAINER_NAME; then
    echo "❌ FAILED: Container is not running"
    docker logs $CONTAINER_NAME
    exit 1
fi
echo "✓ Container is running"
echo ""

echo "Step 5: Checking supervisord status..."
docker exec $CONTAINER_NAME supervisorctl status || {
    echo "⚠️  WARNING: supervisorctl status check failed"
    TEST_FAILED=1
}
echo ""

echo "Step 6: Testing HTTP endpoint..."
for i in {1..5}; do
    if curl -s -f http://localhost:8081 > /tmp/response.json; then
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

echo "Step 7: Checking server logs..."
echo "--- Server logs ---"
docker exec $CONTAINER_NAME tail -20 /var/log/services/server.out.log || {
    echo "⚠️  Could not retrieve server logs"
}
echo ""

echo "Step 8: Checking client logs..."
echo "--- Client logs ---"
docker exec $CONTAINER_NAME tail -20 /var/log/services/client.out.log || {
    echo "⚠️  Could not retrieve client logs"
}
echo ""

echo "Step 9: Verifying client-server communication..."
CLIENT_LOG=$(docker exec $CONTAINER_NAME tail -50 /var/log/services/client.out.log 2>/dev/null || echo "")
if echo "$CLIENT_LOG" | grep -q "SUCCESS"; then
    echo "✓ Client is successfully communicating with server"
else
    echo "❌ FAILED: No successful client-server communication detected"
    TEST_FAILED=1
fi
echo ""

echo "Step 10: Checking supervisor process status..."
SERVER_STATUS=$(docker exec $CONTAINER_NAME supervisorctl status server | awk '{print $2}')
CLIENT_STATUS=$(docker exec $CONTAINER_NAME supervisorctl status client | awk '{print $2}')

if [ "$SERVER_STATUS" = "RUNNING" ]; then
    echo "✓ Server process is RUNNING"
else
    echo "❌ FAILED: Server process is not running (status: $SERVER_STATUS)"
    TEST_FAILED=1
fi

if [ "$CLIENT_STATUS" = "RUNNING" ]; then
    echo "✓ Client process is RUNNING"
else
    echo "❌ FAILED: Client process is not running (status: $CLIENT_STATUS)"
    TEST_FAILED=1
fi
echo ""

# Summary
echo "============================================"
echo "Test Summary"
echo "============================================"
if [ $TEST_FAILED -eq 0 ]; then
    echo "✅ ALL TESTS PASSED"
    echo ""
    echo "Approach 1b (supervisord) is working correctly!"
    echo "Note: This approach violates Docker best practices but is better than systemd."
    exit 0
else
    echo "❌ SOME TESTS FAILED"
    echo ""
    echo "Check the logs above for details."
    exit 1
fi
