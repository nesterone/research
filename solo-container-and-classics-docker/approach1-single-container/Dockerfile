FROM ubuntu:22.04

# Avoid interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install Python and supervisor
RUN apt-get update && \
    apt-get install -y \
    python3 \
    python3-pip \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# Create directory for our services
RUN mkdir -p /opt/services

# Copy the service files
COPY server.py /opt/services/
COPY client.py /opt/services/
RUN chmod +x /opt/services/*.py

# Copy supervisor configuration
COPY supervisord.conf /etc/supervisor/conf.d/services.conf

# Create log directory
RUN mkdir -p /var/log/services

# Expose the server port
EXPOSE 8080

# Start supervisor
CMD ["/usr/bin/supervisord", "-n", "-c", "/etc/supervisor/supervisord.conf"]
