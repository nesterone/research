#!/bin/bash
set -e

echo "============================================"
echo "Testing Approach 1a: Single Container with systemd"
echo "============================================"
echo ""

CONTAINER_NAME="approach1-systemd-test"
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
docker build -t approach1-systemd . || {
    echo "❌ FAILED: Docker build failed"
    exit 1
}
echo "✓ Build successful"
echo ""

echo "Step 2: Starting container..."
docker run -d \
    --name $CONTAINER_NAME \
    --privileged \
    -p 8080:8080 \
    -v /sys/fs/cgroup:/sys/fs/cgroup:ro \
    --tmpfs /run \
    --tmpfs /run/lock \
    approach1-systemd || {
    echo "❌ FAILED: Container failed to start"
    exit 1
}
echo "✓ Container started"
echo ""

echo "Step 3: Waiting for systemd to initialize (15 seconds)..."
sleep 15

echo "Step 4: Checking if container is running..."
if ! docker ps | grep -q $CONTAINER_NAME; then
    echo "❌ FAILED: Container is not running"
    docker logs $CONTAINER_NAME
    exit 1
fi
echo "✓ Container is running"
echo ""

echo "Step 5: Checking systemd status..."
docker exec $CONTAINER_NAME systemctl status --no-pager || {
    echo "⚠️  WARNING: systemd status check failed (may be normal during startup)"
}
echo ""

echo "Step 6: Checking server service status..."
docker exec $CONTAINER_NAME systemctl status server.service --no-pager || {
    echo "⚠️  WARNING: Server service check failed"
    TEST_FAILED=1
}
echo ""

echo "Step 7: Checking client service status..."
docker exec $CONTAINER_NAME systemctl status client.service --no-pager || {
    echo "⚠️  WARNING: Client service check failed"
    TEST_FAILED=1
}
echo ""

echo "Step 8: Waiting for services to be fully operational (5 seconds)..."
sleep 5

echo "Step 9: Testing HTTP endpoint..."
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

echo "Step 10: Checking server logs..."
echo "--- Server logs (via journalctl) ---"
docker exec $CONTAINER_NAME journalctl -u server.service --no-pager -n 10 || {
    echo "⚠️  Could not retrieve server logs"
}
echo ""

echo "Step 11: Checking client logs..."
echo "--- Client logs (via journalctl) ---"
docker exec $CONTAINER_NAME journalctl -u client.service --no-pager -n 10 || {
    echo "⚠️  Could not retrieve client logs"
}
echo ""

echo "Step 12: Verifying client-server communication..."
CLIENT_LOG=$(docker exec $CONTAINER_NAME journalctl -u client.service --no-pager -n 20)
if echo "$CLIENT_LOG" | grep -q "SUCCESS"; then
    echo "✓ Client is successfully communicating with server"
else
    echo "❌ FAILED: No successful client-server communication detected"
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
    echo "Approach 1a (systemd) is working correctly!"
    echo "Note: This approach requires --privileged mode and should NOT be used in production."
    exit 0
else
    echo "❌ SOME TESTS FAILED"
    echo ""
    echo "Check the logs above for details."
    exit 1
fi
