# Approach 1: Single Container with systemd

This approach runs both services in a single Ubuntu container managed by systemd.

## Overview

Unlike the supervisord approach, this uses the native Linux init system (systemd) to manage services within the container. This is closer to traditional system administration but requires special Docker runtime flags.

## Architecture

```
┌─────────────────────────────────────┐
│     Docker Container (Ubuntu)       │
│                                     │
│  ┌──────────────────────────────┐  │
│  │         systemd (PID 1)      │  │
│  └──────────────────────────────┘  │
│              │                      │
│              ├──────────┬──────────┤
│              │          │          │
│         ┌────▼────┐ ┌──▼─────┐   │
│         │ server  │ │ client │   │
│         │ service │ │ service│   │
│         └─────────┘ └────────┘   │
│              │          │          │
│         port 8080   localhost     │
└─────────────────────────────────────┘
```

## Files

- `Dockerfile`: Container definition with systemd setup
- `server.service`: systemd unit file for the HTTP server
- `client.service`: systemd unit file for the HTTP client
- `server.py`: HTTP server implementation
- `client.py`: HTTP client implementation
- `run.sh`: Build and run script with required flags

## systemd Requirements in Docker

Running systemd in Docker requires several special configurations:

### 1. Privileged Mode
```bash
--privileged
```
systemd needs extended capabilities to manage services, cgroups, and namespaces.

### 2. Cgroup Access
```bash
--cgroupns=host
-v /sys/fs/cgroup:/sys/fs/cgroup:rw
```
systemd requires:
- `--cgroupns=host`: Use the host's cgroup namespace
- Read-write (`:rw`) access to `/sys/fs/cgroup` for service management

**Note**: Earlier documentation suggested read-only (`:ro`), but systemd needs write access to actually manage services and create cgroups for them. This is critical on macOS with OrbStack/Docker Desktop.

### 3. Temporary Filesystems
```bash
--tmpfs /run
--tmpfs /run/lock
```
systemd requires writable `/run` and `/run/lock` directories for runtime state.

### 4. Stop Signal
```dockerfile
STOPSIGNAL SIGRTMIN+3
```
systemd uses SIGRTMIN+3 for graceful shutdown instead of SIGTERM.

## systemd Service Files

### server.service
- **Type**: simple (foreground process)
- **Restart**: always (auto-restart on failure)
- **Dependencies**: Starts after network.target
- **Logging**: Output to systemd journal

### client.service
- **Type**: simple (foreground process)
- **Restart**: always (auto-restart on failure)
- **Dependencies**: Requires server.service, starts after it
- **Environment**: SERVER_HOST, SERVER_PORT, POLL_INTERVAL
- **Logging**: Output to systemd journal

## How to Use

### Build and Run
```bash
./run.sh
```

Or manually:
```bash
# Build
docker build -t approach1-systemd .

# Run
docker run --rm \
    --name approach1-systemd-test \
    --privileged \
    --cgroupns=host \
    -p 8080:8080 \
    -v /sys/fs/cgroup:/sys/fs/cgroup:rw \
    --tmpfs /run \
    --tmpfs /run/lock \
    approach1-systemd
```

### Check Service Status

In another terminal:
```bash
# Enter the container
docker exec -it approach1-systemd-test /bin/bash

# Check systemd status
systemctl status

# Check individual services
systemctl status server.service
systemctl status client.service

# View logs
journalctl -u server.service -f
journalctl -u client.service -f

# Restart a service
systemctl restart server.service
```

### Test the Endpoint
```bash
curl http://localhost:8080
```

## Advantages of systemd

1. **Native Linux Init System**: Uses the standard Linux service manager
2. **Advanced Features**:
   - Resource limits (cgroups)
   - Socket activation
   - Dependency management
   - Automatic restarts
3. **Familiar Tools**: systemctl, journalctl for management
4. **Service Dependencies**: Client waits for server via `Requires=` and `After=`
5. **Centralized Logging**: All logs in systemd journal

## Disadvantages of systemd in Docker

1. **Requires --privileged**: Security concern, breaks container isolation
2. **Complex Setup**: More configuration than supervisord
3. **Against Docker Philosophy**: Docker expects one process per container
4. **Resource Overhead**: systemd adds significant overhead vs supervisord
5. **Portability Issues**: Requires platform-specific configurations (e.g., macOS with OrbStack needs `--cgroupns=host` and `:rw` cgroup mount)
6. **Cgroup Mount Required**: Host system dependency with read-write access
7. **Python Buffering**: Services need unbuffered output (`python3 -u`) for logs to appear in journalctl

## systemd vs supervisord

| Feature | systemd | supervisord |
|---------|---------|-------------|
| **Privileges** | Requires --privileged | No special privileges |
| **Setup Complexity** | High | Low |
| **Docker Best Practices** | Violates | Still violates, but less |
| **Security** | Lower (privileged mode) | Higher |
| **Features** | Rich (cgroups, sockets, etc.) | Basic process management |
| **Portability** | Limited | Better |
| **Resource Usage** | Higher overhead | Lower overhead |
| **Familiarity** | Linux admins | Container users |

## When to Use systemd in Containers

Use systemd when:
- **Legacy Migration**: Moving existing systemd-based systems to containers
- **Complex Dependencies**: Need systemd's dependency resolution
- **Resource Limits**: Need cgroup-based resource management
- **Traditional Ops**: Team familiar with systemd tooling

Avoid systemd when:
- **Security is Critical**: --privileged flag is a security risk
- **Portability Matters**: May not work on all Docker hosts
- **Following Best Practices**: Want to follow "one process per container"
- **Microservices**: Building cloud-native applications (use separate containers)

## macOS/OrbStack Specific Configuration

When running systemd containers on macOS with OrbStack or Docker Desktop, additional configuration is required:

### Issue 1: Container Exits Immediately
**Symptom**: Container starts but exits within seconds with no logs.

**Root Cause**: systemd cannot operate without proper cgroup namespace and write access to cgroups.

**Solution**:
```bash
--cgroupns=host                          # Use host's cgroup namespace
-v /sys/fs/cgroup:/sys/fs/cgroup:rw     # Read-write access (not :ro)
```

Without these flags, systemd silently fails to initialize as PID 1.

### Issue 2: Service Logs Not Appearing in journalctl
**Symptom**: Services are running (`systemctl status` shows active), but `journalctl -u service.name` shows no output from the service.

**Root Cause**: Python buffers stdout by default, preventing logs from reaching systemd's journal.

**Solution**: Add `-u` flag to Python commands in service files:
```ini
# In server.service and client.service
ExecStart=/usr/bin/python3 -u /opt/services/server.py
```

The `-u` flag forces unbuffered output, allowing logs to immediately appear in journalctl.

### Testing
Run `./test.sh` to verify the configuration works correctly. All tests should pass:
- Container starts and stays running
- systemd initializes properly
- Both services start successfully
- HTTP endpoint responds
- Client-server communication works
- Logs are visible in journalctl

## Security Considerations

The `--privileged` flag gives the container:
- Full access to host devices
- Ability to load kernel modules
- Bypass of many security restrictions
- Near root-level access to the host

**Never use --privileged in production** unless absolutely necessary and within a trusted environment.

## Alternatives

If you need systemd-like features without --privileged:
1. **systemd in rootless mode**: Experimental, limited functionality
2. **supervisord**: Simpler process manager (see `approach1-single-container/`)
3. **Separate containers**: Best practice (see `approach2-separate-containers/`)
4. **Init systems**: tini, dumb-init for basic process management

## Conclusion

While systemd works in Docker containers, it:
- Requires significant security compromises (--privileged)
- Goes against Docker best practices
- Adds unnecessary complexity and overhead

**Recommendation**: Use supervisord for simple multi-process containers, or better yet, use separate containers (approach 2) which is the Docker-native way.

systemd should be reserved for:
- Legacy migrations where refactoring isn't possible
- Development/testing environments mimicking production systems
- Cases where systemd-specific features are absolutely required
