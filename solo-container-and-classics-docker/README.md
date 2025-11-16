# Docker Container Approaches Comparison

## Overview

This research compares two approaches for running networked services in Docker containers:

1. **Single Container Approach**: Both services in one Ubuntu container managed by supervisord
2. **Separate Containers Approach**: Each service in its own container, orchestrated with docker-compose

## Test Services

Two simple Python services were created to demonstrate inter-service communication:

- **Server** (`server.py`): HTTP server listening on port 8080, returns JSON with system info
- **Client** (`client.py`): HTTP client that polls the server every 5 seconds

## Approach 1: Single Container with Supervisord

### Architecture
- Single Ubuntu 22.04 based container
- Supervisord manages both services as separate processes
- Services communicate via localhost
- Single deployment unit

### Key Files
- `Dockerfile`: Ubuntu base with Python and supervisord
- `supervisord.conf`: Configuration for managing both services
- `run.sh`: Build and run script

### Advantages
- Lower memory footprint (single container)
- Faster inter-process communication (localhost)
- Simpler networking (no bridge overhead)
- Single deployment artifact

### Disadvantages
- Violates Docker best practice ("one process per container")
- Tightly coupled services
- Cannot scale services independently
- More complex process management setup
- Harder to debug (mixed logs)
- Both services must be redeployed together

### When to Use
- Legacy application migration where services must be co-located
- Resource-constrained environments
- When services are tightly coupled and always deployed together
- Development/testing scenarios where isolation isn't critical

## Approach 2: Two Separate Containers

### Architecture
- Two separate Ubuntu 22.04 containers
- Each container runs one service
- Docker Compose orchestrates both containers
- Services communicate via Docker bridge network
- Docker DNS resolves service hostnames

### Key Files
- `Dockerfile.server`: Server container definition
- `Dockerfile.client`: Client container definition
- `docker-compose.yml`: Orchestration configuration
- `run.sh`: Build and run script

### Advantages
- Follows Docker best practices
- Strong isolation between services
- Independent scaling (can run multiple clients)
- Independent deployment and updates
- Clearer separation of concerns
- Easier debugging (separate log streams)
- Better fault isolation

### Disadvantages
- Higher memory overhead (multiple containers)
- Slight network latency (bridge network)
- More complex orchestration (docker-compose required)
- Multiple build artifacts to manage

### When to Use
- Microservices architecture
- When services need to scale independently
- Production environments requiring isolation
- When services have different update cycles
- Modern cloud-native applications

## Comparison Matrix

| Aspect | Single Container | Separate Containers |
|--------|-----------------|---------------------|
| **Complexity** | Higher (supervisord config) | Lower per container, requires orchestration |
| **Memory Usage** | Lower | Higher |
| **Network Performance** | Faster (localhost) | Slightly slower (bridge) |
| **Isolation** | Weak | Strong |
| **Scalability** | Cannot scale independently | Can scale each service |
| **Deployment** | Single unit | Independent units |
| **Debugging** | Harder (mixed logs) | Easier (separate logs) |
| **Docker Best Practices** | ❌ Violates | ✅ Follows |
| **Fault Isolation** | Poor | Good |
| **Resource Overhead** | Minimal | Moderate |

## Technical Details

### Supervisord vs Systemd

For the single container approach, supervisord was chosen over systemd:

- **systemd in Docker**: Requires `--privileged` flag, complex setup, designed for full OS
- **supervisord**: Lightweight, designed for process management in containers, simpler configuration

### Network Communication

**Approach 1**: Services communicate via `localhost:8080`
```python
SERVER_HOST = "localhost"
```

**Approach 2**: Docker DNS resolves service name to container IP
```yaml
environment:
  - SERVER_HOST=server  # Docker resolves to server container IP
```

## How to Test

### Prerequisites
- Docker installed
- docker-compose installed (for Approach 2)

### Testing Approach 1
```bash
cd approach1-single-container
./run.sh
```

Watch the logs to see both services running in the same container.

### Testing Approach 2
```bash
cd approach2-separate-containers
./run.sh
```

Watch separate log streams for server and client containers.

### Verification

Both approaches should show:
- Server starting and listening on port 8080
- Client successfully polling server every 5 seconds
- Server responding with JSON containing hostname and timestamp

You can also test the server endpoint directly:
```bash
curl http://localhost:8080
```

## Recommendations

### Use Single Container When:
- Migrating legacy applications with co-located services
- Extremely resource-constrained environments
- Services are inseparable and always deployed together
- Quick prototyping or development scenarios

### Use Separate Containers When:
- Building microservices
- Need independent scaling
- Production deployments
- Services have different lifecycles or update schedules
- Following cloud-native patterns

## Conclusion

While the single container approach offers lower resource overhead and simpler networking, the separate containers approach is the recommended pattern for most use cases. It provides:

- Better alignment with Docker and cloud-native best practices
- Superior isolation and fault tolerance
- Greater flexibility for scaling and deployment
- Clearer separation of concerns
- Easier maintenance and debugging

The single container approach should be reserved for specific scenarios like legacy application migration or extreme resource constraints where the trade-offs are acceptable.

## File Structure

```
solo-container-and-classics-docker/
├── README.md (this file)
├── notes.md (research notes)
├── server.py (HTTP server service)
├── client.py (HTTP client service)
├── approach1-single-container/
│   ├── Dockerfile
│   ├── supervisord.conf
│   ├── run.sh
│   ├── server.py
│   └── client.py
└── approach2-separate-containers/
    ├── Dockerfile.server
    ├── Dockerfile.client
    ├── docker-compose.yml
    ├── run.sh
    ├── server.py
    └── client.py
```
