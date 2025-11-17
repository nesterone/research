#!/bin/bash

echo "Building Approach 1: Single Container with systemd..."
docker build -t approach1-systemd .

echo ""
echo "Running Approach 1 with systemd..."
echo "NOTE: This requires --privileged flag for systemd to work properly"
echo "Press Ctrl+C to stop"
echo ""

# Run with systemd support
# --privileged: Required for systemd to manage services
# --tmpfs: Required for systemd runtime directories
# -v /sys/fs/cgroup: Mount cgroup for systemd (read-only)
docker run --rm \
    --name approach1-systemd-test \
    --privileged \
    -p 8080:8080 \
    -v /sys/fs/cgroup:/sys/fs/cgroup:ro \
    --tmpfs /run \
    --tmpfs /run/lock \
    approach1-systemd
