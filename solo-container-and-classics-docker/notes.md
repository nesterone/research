# Research Notes: Comparing Docker Container Approaches

## Objective
Compare two approaches for running two networked services:
1. Single Ubuntu container with both services managed by systemd (or alternative)
2. Two separate containers, one service per container

## Investigation Log

### Step 1: Project Setup
- Created folder: `solo-container-and-classics-docker`
- Started notes.md tracking

### Step 2: Service Design
Planning to create two simple services that communicate over a network:
- Service A: HTTP server (listens on port 8080)
- Service B: HTTP client (makes periodic requests to Service A)

This will demonstrate inter-service communication clearly.

### Step 3: Service Implementation
Created two Python services:
- `server.py`: HTTP server on port 8080, returns JSON with system info
- `client.py`: HTTP client that polls the server every 5 seconds

Services are simple, self-contained, and demonstrate network communication.

### Step 4: Approach 1 - Single Container Decision
For the single container approach, I need to consider:
- **systemd**: Requires `--privileged` flag and special setup, complex in Docker
- **supervisord**: Designed for managing multiple processes in containers, simpler
- **Decision**: Will use supervisord as the systemd alternative for better Docker compatibility

### Step 5: Implementation Complete
Both approaches have been implemented:

**Approach 1: Single Container**
- Created Dockerfile based on Ubuntu 22.04
- Installed supervisord for process management
- Created supervisord.conf to manage both services
- Server and client run in the same container
- Communication via localhost

**Approach 2: Two Separate Containers**
- Created separate Dockerfiles for server and client
- Used docker-compose to orchestrate containers
- Communication via Docker network (bridge)
- Server hostname resolution via Docker DNS

### Step 6: Testing Limitation
Docker is not available in this environment, so direct testing is not possible.
However, all configurations have been created and can be tested in a Docker environment.

### Step 7: Analysis and Comparison
Based on the implementations, here are the key findings:

**Complexity:**
- Approach 1 requires supervisord configuration and understanding process management
- Approach 2 is simpler per container but requires docker-compose orchestration

**Resource Usage:**
- Approach 1: Single container, shared kernel, minimal overhead
- Approach 2: Two containers, more memory overhead, separate processes

**Network Communication:**
- Approach 1: localhost (faster, no network stack)
- Approach 2: Docker network bridge (slight overhead, but isolated)

**Isolation:**
- Approach 1: Processes share the same filesystem and network namespace
- Approach 2: Strong isolation between services, separate filesystems

**Maintainability:**
- Approach 1: Single deployment unit, but changes affect both services
- Approach 2: Independent deployments, easier to scale individual services

**Scalability:**
- Approach 1: Can only scale both services together
- Approach 2: Can scale services independently (e.g., 3 clients, 1 server)

**Debugging:**
- Approach 1: Both services' logs mixed, need to check supervisord logs
- Approach 2: Separate log streams, easier to debug individual services

**Best Practices:**
- Approach 1: Against Docker best practice of "one process per container"
- Approach 2: Follows Docker best practices and microservices architecture

### Step 8: Documentation Complete
Created comprehensive documentation:
- README.md: Full comparison report with recommendations
- TESTING.md: Detailed testing instructions for both approaches
- notes.md: This file, tracking the research process

### Step 9: Final Thoughts

The research clearly demonstrates that while both approaches are technically viable, the separate containers approach is superior for most modern use cases:

1. **Modularity**: Easier to maintain and update individual services
2. **Scalability**: Can scale services independently based on load
3. **Isolation**: Better fault isolation and security boundaries
4. **Best Practices**: Aligns with Docker philosophy and microservices patterns

The single container approach has its place in:
- Legacy migrations where services must remain co-located
- Embedded systems or IoT with severe resource constraints
- Quick prototypes where isolation isn't critical

Key learning: supervisord is a viable systemd alternative for container environments, but the need for it suggests an architectural issue that should be addressed by splitting services into separate containers.

---

## Additional Research: systemd Implementation

### Step 10: User Request for systemd
User asked if systemd can be used instead of supervisord for managing services in a single container.

### Step 11: systemd Implementation
Created `approach1-systemd/` with full systemd support:

**Implementation Details:**
- Base: Ubuntu 22.04 with systemd and systemd-sysv
- Cleanup: Removed unnecessary systemd units that conflict with containers
- Service Files: Created proper systemd unit files for both services
- Init: systemd runs as PID 1 in the container

**Required Docker Flags:**
```bash
--privileged              # systemd needs extended capabilities
-v /sys/fs/cgroup:/sys/fs/cgroup:ro  # cgroup access
--tmpfs /run              # systemd runtime directory
--tmpfs /run/lock         # systemd lock directory
```

**Service Configuration:**
- `server.service`: HTTP server managed by systemd
- `client.service`: HTTP client with dependency on server.service
- Both use `Restart=always` for automatic recovery
- Logs go to systemd journal (journalctl)

### Step 12: systemd vs supervisord Analysis

**systemd Advantages:**
- Native Linux init system, familiar to sysadmins
- Advanced features: cgroups, socket activation, complex dependencies
- Centralized logging with journalctl
- Rich service management (start, stop, restart, status)

**systemd Disadvantages:**
- **Requires --privileged flag**: Major security concern
- Breaks container isolation (near root-level host access)
- More complex setup and configuration
- Higher resource overhead
- Portability issues (doesn't work well on Docker Desktop for Mac)
- Against Docker best practices

**supervisord Advantages:**
- No privileged mode required
- Simpler configuration
- Lower resource overhead
- Better portability
- Designed for containers

**supervisord Disadvantages:**
- Less powerful than systemd
- Different tooling from traditional Linux systems
- Basic process management only

### Step 13: Security Implications

The `--privileged` flag required for systemd is a significant security risk:
- Full access to host devices
- Can load kernel modules
- Bypasses many security restrictions
- Essentially breaks container isolation

**Conclusion**: systemd works but should NEVER be used in production containers unless:
1. Absolutely required for legacy migration
2. Running in highly trusted environments
3. Security team has explicitly approved the risk

For new deployments:
- **Best**: Use separate containers (approach2)
- **Acceptable**: Use supervisord (approach1-single-container)
- **Last Resort**: Use systemd (approach1-systemd) only for legacy migrations

### Step 14: Final Comparison Matrix

| Approach | Process Manager | Privileges | Security | Complexity | Best For |
|----------|----------------|------------|----------|------------|----------|
| approach1-systemd | systemd | --privileged | ⚠️ Low | High | Legacy migration |
| approach1-single-container | supervisord | None | ✓ Medium | Medium | Simple multi-process |
| approach2-separate-containers | Native (one per) | None | ✓✓ High | Low | Production, microservices |

