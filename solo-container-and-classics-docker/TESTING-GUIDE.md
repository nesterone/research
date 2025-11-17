# Testing Guide

This guide explains how to test all three Docker container approaches to verify they work correctly.

## Overview

Each approach has its own `test.sh` script that:
- Builds the Docker image(s)
- Starts the container(s)
- Verifies services are running
- Tests HTTP endpoint
- Checks client-server communication
- Reports results
- Cleans up automatically

## Quick Start

### Test All Approaches

Run all tests with a single command:

```bash
cd solo-container-and-classics-docker
./run-all-tests.sh
```

This will test all three approaches sequentially and provide a comprehensive summary.

### Test Individual Approaches

**Approach 1a (systemd):**
```bash
cd approach1-systemd
./test.sh
```

**Approach 1b (supervisord):**
```bash
cd approach1-single-container
./test.sh
```

**Approach 2 (separate containers):**
```bash
cd approach2-separate-containers
./test.sh
```

## Test Script Options

### Unified Test Runner Options

The `run-all-tests.sh` script supports several options:

```bash
# Run all tests (default)
./run-all-tests.sh

# Skip specific tests
./run-all-tests.sh --skip-systemd
./run-all-tests.sh --skip-supervisord
./run-all-tests.sh --skip-separate

# Run only specific tests
./run-all-tests.sh --only-systemd
./run-all-tests.sh --only-supervisord
./run-all-tests.sh --only-separate

# Stop on first failure
./run-all-tests.sh --stop-on-failure

# Show help
./run-all-tests.sh --help
```

### Examples

```bash
# Test only the recommended approach
./run-all-tests.sh --only-separate

# Test both single-container approaches
./run-all-tests.sh --skip-separate

# Quick test without the slow systemd approach
./run-all-tests.sh --skip-systemd
```

## What Each Test Checks

### Approach 1a (systemd) Test Steps

1. ✓ Build Docker image
2. ✓ Start container with --privileged flag
3. ✓ Wait for systemd initialization
4. ✓ Verify container is running
5. ✓ Check systemd status
6. ✓ Check server service status
7. ✓ Check client service status
8. ✓ Test HTTP endpoint (http://localhost:8080)
9. ✓ Verify server logs (via journalctl)
10. ✓ Verify client logs (via journalctl)
11. ✓ Verify client-server communication

**Expected Duration:** ~30 seconds

### Approach 1b (supervisord) Test Steps

1. ✓ Build Docker image
2. ✓ Start container
3. ✓ Wait for services to start
4. ✓ Verify container is running
5. ✓ Check supervisord status
6. ✓ Test HTTP endpoint (http://localhost:8081)
7. ✓ Verify server logs
8. ✓ Verify client logs
9. ✓ Verify client-server communication
10. ✓ Check supervisor process status

**Expected Duration:** ~20 seconds

### Approach 2 (separate containers) Test Steps

1. ✓ Build Docker images
2. ✓ Start containers with docker-compose
3. ✓ Wait for services to start
4. ✓ Verify both containers are running
5. ✓ Test HTTP endpoint (http://localhost:8080)
6. ✓ Verify server logs
7. ✓ Verify client logs
8. ✓ Verify client-server communication
9. ✓ Check container isolation (different hostnames)
10. ✓ Test network connectivity via Docker DNS
11. ✓ Test scaling capability

**Expected Duration:** ~25 seconds

## Understanding Test Results

### Success Output

When all tests pass, you'll see:

```
============================================
Test Summary
============================================
✅ ALL TESTS PASSED

Approach X is working correctly!
```

### Failure Output

If tests fail, you'll see:

```
============================================
Test Summary
============================================
❌ SOME TESTS FAILED

Check the logs above for details.
```

Look for lines starting with:
- `❌ FAILED:` - Critical failure
- `⚠️  WARNING:` - Non-critical issue

## Common Issues and Solutions

### Issue: Port Already in Use

**Error:**
```
Error: bind: address already in use
```

**Solution:**
```bash
# Check what's using the port
lsof -i :8080

# Kill the process or use a different port
# Edit the test script to use a different port mapping
```

### Issue: Docker Not Found

**Error:**
```
docker: command not found
```

**Solution:**
```bash
# Install Docker
# Visit: https://docs.docker.com/get-docker/
```

### Issue: Permission Denied

**Error:**
```
permission denied while trying to connect to Docker daemon
```

**Solution:**
```bash
# Add your user to docker group
sudo usermod -aG docker $USER

# Log out and back in, or run:
newgrp docker
```

### Issue: systemd Test Fails

**Error:**
```
systemd failed to start
```

**Common Causes:**
- Docker Desktop on Mac (systemd not fully supported)
- Missing /sys/fs/cgroup on host
- Kernel doesn't support cgroups

**Solution:**
- Use Linux with proper cgroup support
- Skip systemd tests: `./run-all-tests.sh --skip-systemd`
- Use supervisord or separate containers instead

### Issue: Test Takes Too Long

**Solution:**
```bash
# Increase wait times in test scripts
# Edit the test.sh file and increase sleep durations

# Or just be patient - first run downloads base images
```

## Cleaning Up After Tests

Tests automatically clean up, but if something goes wrong:

```bash
# Stop and remove all test containers
docker stop approach1-systemd-test approach1-supervisord-test 2>/dev/null
docker rm approach1-systemd-test approach1-supervisord-test 2>/dev/null

# Stop docker-compose services
cd approach2-separate-containers
docker-compose down -v

# Remove all test images (optional)
docker rmi approach1-systemd approach1-single-container 2>/dev/null
docker rmi approach2-separate-containers_server approach2-separate-containers_client 2>/dev/null

# Clean up unused Docker resources
docker system prune -f
```

## Continuous Integration

### Using in CI/CD Pipelines

Example GitHub Actions workflow:

```yaml
name: Test Docker Approaches

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v2

    - name: Test Supervisord Approach
      run: |
        cd solo-container-and-classics-docker
        ./run-all-tests.sh --only-supervisord

    - name: Test Separate Containers Approach
      run: |
        cd solo-container-and-classics-docker
        ./run-all-tests.sh --only-separate
```

**Note:** Skip systemd tests in CI as they require --privileged mode which is often restricted.

## Manual Verification

If you want to manually verify functionality:

### Approach 1a (systemd)

```bash
cd approach1-systemd
./run.sh

# In another terminal:
curl http://localhost:8080
docker exec -it approach1-systemd-test systemctl status
docker exec -it approach1-systemd-test journalctl -u server.service -f
docker exec -it approach1-systemd-test journalctl -u client.service -f
```

### Approach 1b (supervisord)

```bash
cd approach1-single-container
./run.sh

# In another terminal:
curl http://localhost:8080
docker exec -it approach1-test supervisorctl status
docker exec -it approach1-test tail -f /var/log/services/server.out.log
docker exec -it approach1-test tail -f /var/log/services/client.out.log
```

### Approach 2 (separate containers)

```bash
cd approach2-separate-containers
./run.sh

# In another terminal:
curl http://localhost:8080
docker logs -f approach2-server
docker logs -f approach2-client
docker-compose ps
```

## Performance Benchmarking

To compare performance:

```bash
# Test endpoint response time
time curl http://localhost:8080

# Check resource usage
docker stats

# Compare startup times
time ./run-all-tests.sh
```

## Test Development

Want to add more tests? Each test script follows this structure:

```bash
#!/bin/bash
set -e  # Exit on error

# 1. Setup
CONTAINER_NAME="..."
cleanup() { docker stop $CONTAINER_NAME; }
trap cleanup EXIT

# 2. Build
docker build -t image-name .

# 3. Run
docker run -d --name $CONTAINER_NAME ...

# 4. Test
curl http://localhost:PORT
docker logs $CONTAINER_NAME

# 5. Verify
if [ condition ]; then
    echo "✓ Test passed"
else
    echo "❌ Test failed"
    exit 1
fi

# 6. Cleanup (automatic via trap)
```

## Summary

- ✅ **Recommended**: Test with `./run-all-tests.sh`
- ✅ **CI/CD**: Use `--skip-systemd` option
- ✅ **Quick Test**: Use `--only-separate` to test recommended approach
- ✅ **Production**: Only deploy Approach 2 (separate containers)

For more information, see:
- `README.md` - Complete comparison
- `TESTING.md` - Manual testing instructions
- `notes.md` - Research process and findings
