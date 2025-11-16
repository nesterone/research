#!/bin/bash

echo "Building Approach 1: Single Container with Supervisord..."
docker build -t approach1-single-container .

echo ""
echo "Running Approach 1..."
echo "Press Ctrl+C to stop"
echo ""

docker run --rm \
    --name approach1-test \
    -p 8080:8080 \
    approach1-single-container
