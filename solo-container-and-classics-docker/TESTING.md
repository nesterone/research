# Testing Instructions

## Prerequisites

Ensure you have the following installed:
- Docker (version 20.10 or later recommended)
- docker-compose (for Approach 2)

Verify installations:
```bash
docker --version
docker-compose --version
```

## Test Approach 1: Single Container with Supervisord

### Step 1: Navigate to the directory
```bash
cd approach1-single-container
```

### Step 2: Build the container
```bash
docker build -t approach1-single-container .
```

### Step 3: Run the container
```bash
docker run --rm --name approach1-test -p 8080:8080 approach1-single-container
```

Or use the provided script:
```bash
./run.sh
```

### Step 4: Observe the output
You should see:
- Supervisord starting
- Server starting on port 8080
- Client beginning to poll the server
- Successful responses every 5 seconds

### Step 5: Test the endpoint (in another terminal)
```bash
curl http://localhost:8080
```

Expected response:
```json
{
  "timestamp": "2024-...",
  "hostname": "...",
  "pid": ...,
  "message": "Hello from the server!",
  "uptime": ...
}
```

### Step 6: Check logs
View supervisor logs:
```bash
docker exec approach1-test cat /var/log/services/server.out.log
docker exec approach1-test cat /var/log/services/client.out.log
```

### Step 7: Stop the container
Press `Ctrl+C` or:
```bash
docker stop approach1-test
```

## Test Approach 2: Separate Containers

### Step 1: Navigate to the directory
```bash
cd approach2-separate-containers
```

### Step 2: Build and run with docker-compose
```bash
docker-compose up --build
```

Or use the provided script:
```bash
./run.sh
```

### Step 3: Observe the output
You should see:
- Two containers starting (approach2-server and approach2-client)
- Color-coded logs for each container
- Server starting on port 8080
- Client successfully connecting and polling
- Successful responses every 5 seconds

### Step 4: Test the endpoint (in another terminal)
```bash
curl http://localhost:8080
```

### Step 5: Check individual container logs
```bash
docker logs approach2-server
docker logs approach2-client
```

### Step 6: Inspect the network
```bash
docker network ls
docker network inspect approach2-separate-containers_service-network
```

### Step 7: Stop the containers
Press `Ctrl+C` or:
```bash
docker-compose down
```

## Advanced Testing

### Scale the client (Approach 2 only)
```bash
docker-compose up --scale client=3
```

This runs 3 client containers polling the single server.

### Monitor resource usage
```bash
docker stats
```

Compare the memory and CPU usage between the two approaches.

### Interactive debugging

**Approach 1**:
```bash
docker exec -it approach1-test /bin/bash
supervisorctl status
supervisorctl tail -f server
supervisorctl tail -f client
```

**Approach 2**:
```bash
docker exec -it approach2-server /bin/bash
docker exec -it approach2-client /bin/bash
```

## Expected Results

### Success Indicators
- ✅ Server starts without errors
- ✅ Client connects to server successfully
- ✅ Client logs show "SUCCESS" messages every 5 seconds
- ✅ curl requests return valid JSON
- ✅ No connection errors or timeouts

### Common Issues

**Port already in use**:
```
Error: bind: address already in use
```
Solution: Stop other services using port 8080 or change the port mapping.

**Connection refused (Approach 2)**:
- Ensure the server container started before the client
- Check Docker network connectivity
- Verify service name resolution

**Supervisord errors (Approach 1)**:
- Check `/var/log/supervisor/supervisord.log`
- Verify Python scripts have execute permissions

## Cleanup

Remove all containers and images:

```bash
# Approach 1
docker stop approach1-test
docker rmi approach1-single-container

# Approach 2
docker-compose down
docker rmi approach2-separate-containers_server
docker rmi approach2-separate-containers_client
```

Remove dangling images:
```bash
docker image prune
```
