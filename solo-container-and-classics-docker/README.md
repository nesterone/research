# Docker Container Approaches Comparison

## Overview

This research compares three approaches for running networked services in Docker containers:

1. **Single Container with systemd**: Both services in one Ubuntu container managed by systemd (requires --privileged)
2. **Single Container with supervisord**: Both services in one Ubuntu container managed by supervisord
3. **Separate Containers**: Each service in its own container, orchestrated with docker-compose

## Quick Start: Run Tests

To verify all approaches work correctly:

```bash
# Test all three approaches
./run-all-tests.sh

# Test only the recommended approach
./run-all-tests.sh --only-separate

# Test individual approach
cd approach2-separate-containers
./test.sh
```

See [TESTING-GUIDE.md](TESTING-GUIDE.md) for detailed testing instructions.

## Test Services

Two simple Python services were created to demonstrate inter-service communication:

- **Server** (`server.py`): HTTP server listening on port 8080, returns JSON with system info
- **Client** (`client.py`): HTTP client that polls the server every 5 seconds

## Approach 1a: Single Container with systemd

### Architecture
- Single Ubuntu 22.04 based container
- systemd (native Linux init system) manages both services
- Services communicate via localhost
- Requires --privileged mode and special volume mounts

### Key Files
- `Dockerfile`: Ubuntu base with Python and systemd
- `server.service`: systemd unit file for server
- `client.service`: systemd unit file for client
- `run.sh`: Build and run script with required flags

### Advantages
- Native Linux init system, familiar to sysadmins
- Advanced service management features (cgroups, dependencies, socket activation)
- Centralized logging via journalctl
- Automatic service restarts and dependency management
- Lower memory footprint (single container)

### Disadvantages
- **Requires --privileged flag**: Major security risk
- Breaks container isolation (near root-level host access)
- Requires cgroup mount from host
- Most complex setup
- Portability issues (may not work on Docker Desktop for Mac)
- Violates Docker best practice ("one process per container")
- Higher overhead than supervisord
- Should NEVER be used in production

### When to Use
- Legacy migration where systemd is required
- Development/testing environments mimicking systemd-based systems
- When systemd-specific features are absolutely necessary
- **NOT for production use**

## Approach 1b: Single Container with Supervisord

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

| Aspect | systemd (1a) | supervisord (1b) | Separate Containers (2) |
|--------|--------------|------------------|-------------------------|
| **Complexity** | Very High | Medium | Low per container |
| **Security** | ⚠️ Very Low (--privileged) | ✓ Medium | ✓✓ High |
| **Privileges Required** | --privileged + mounts | None | None |
| **Memory Usage** | Low | Low | Higher |
| **Network Performance** | Fastest (localhost) | Fastest (localhost) | Slightly slower (bridge) |
| **Isolation** | Broken (privileged) | Weak | Strong |
| **Scalability** | Cannot scale independently | Cannot scale independently | Can scale each service |
| **Deployment** | Single unit | Single unit | Independent units |
| **Debugging** | Medium (journalctl) | Harder (mixed logs) | Easiest (separate logs) |
| **Docker Best Practices** | ❌❌ Violates severely | ❌ Violates | ✅ Follows |
| **Production Ready** | ❌ NO | ⚠️ Not recommended | ✅ YES |
| **Portability** | Poor | Good | Excellent |
| **Service Management** | Rich (systemctl) | Basic | Native Docker |

## Technical Details

### Process Managers: systemd vs supervisord

For single container approaches, there are two main options:

#### systemd (Approach 1a)
- **Native Linux init system**, familiar to system administrators
- **Requires**: `--privileged` flag, cgroup mounts, tmpfs mounts
- **Features**: Advanced (cgroups, socket activation, complex dependencies)
- **Security**: Major concern - breaks container isolation
- **Use case**: Legacy migrations, development mimicking production systems
- **Recommendation**: Avoid in production

#### supervisord (Approach 1b)
- **Container-friendly** process manager
- **Requires**: No special privileges
- **Features**: Basic process management, restart policies
- **Security**: Better than systemd (no privileged mode)
- **Use case**: Simple multi-process containers, prototypes
- **Recommendation**: Better than systemd, but separate containers preferred

#### Comparison

| Feature | systemd | supervisord |
|---------|---------|-------------|
| **Privileges** | --privileged required | None |
| **Security** | ⚠️ Low | ✓ Medium |
| **Setup** | Complex | Simple |
| **Features** | Rich | Basic |
| **Overhead** | Higher | Lower |
| **Portability** | Limited | Good |
| **Production** | ❌ No | ⚠️ Not recommended |

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

### Testing Approach 1a (systemd)
```bash
cd approach1-systemd
./run.sh
```

**Note**: Requires `--privileged` mode. Watch systemd manage both services. Use `docker exec -it approach1-systemd-test systemctl status` to check service status.

### Testing Approach 1b (supervisord)
```bash
cd approach1-single-container
./run.sh
```

Watch the logs to see both services running in the same container via supervisord.

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

### Priority Order (Best to Worst)

1. **✅ Use Separate Containers (Approach 2)** when:
   - Building microservices or cloud-native applications
   - Need independent scaling
   - Production deployments
   - Services have different lifecycles or update schedules
   - Following modern Docker best practices
   - **This is the recommended approach for 90% of use cases**

2. **⚠️ Use supervisord (Approach 1b)** when:
   - Quick prototyping or development scenarios
   - Extremely resource-constrained environments
   - Services are inseparable and always deployed together
   - Migrating legacy applications (temporary solution)

3. **❌ Use systemd (Approach 1a)** ONLY when:
   - Migrating legacy systemd-based systems (temporary)
   - Development/testing environment mimicking production
   - systemd-specific features are absolutely required
   - **NEVER in production** - security risk is too high

### systemd Security Warning

The `--privileged` flag required for systemd:
- Breaks container isolation completely
- Provides near root-level access to the host
- Can access all host devices
- Can load kernel modules
- Bypasses most security restrictions

**Only use systemd in highly trusted development environments, never in production.**

## Conclusion

This research demonstrates three ways to run networked services in Docker:

### systemd Approach (1a)
While systemd works in containers, it requires `--privileged` mode which:
- Breaks container security model
- Should never be used in production
- Only suitable for legacy migrations in trusted dev environments

### supervisord Approach (1b)
Offers lower resource overhead and simpler networking, but:
- Still violates "one process per container" principle
- Limited scalability
- Better than systemd, but not ideal

### Separate Containers Approach (2) - RECOMMENDED
This is the recommended pattern for most use cases:
- ✅ Better alignment with Docker and cloud-native best practices
- ✅ Superior isolation and fault tolerance
- ✅ Greater flexibility for scaling and deployment
- ✅ Clearer separation of concerns
- ✅ Easier maintenance and debugging
- ✅ No security compromises

**Final Recommendation**: Always start with separate containers (Approach 2). Only consider single-container approaches for specific legacy migration scenarios, and if you must, use supervisord over systemd.

## File Structure

```
solo-container-and-classics-docker/
├── README.md (this file - comprehensive comparison)
├── TESTING.md (manual testing instructions)
├── TESTING-GUIDE.md (automated test suite guide)
├── notes.md (research notes and process)
├── run-all-tests.sh (unified test runner)
├── server.py (HTTP server service)
├── client.py (HTTP client service)
├── approach1-systemd/
│   ├── README.md (systemd-specific documentation)
│   ├── Dockerfile
│   ├── server.service (systemd unit file)
│   ├── client.service (systemd unit file)
│   ├── run.sh (manual run script)
│   ├── test.sh (automated test script)
│   ├── server.py
│   └── client.py
├── approach1-single-container/
│   ├── Dockerfile
│   ├── supervisord.conf
│   ├── run.sh (manual run script)
│   ├── test.sh (automated test script)
│   ├── server.py
│   └── client.py
└── approach2-separate-containers/
    ├── Dockerfile.server
    ├── Dockerfile.client
    ├── docker-compose.yml
    ├── run.sh (manual run script)
    ├── test.sh (automated test script)
    ├── server.py
    └── client.py
```
