FROM ubuntu:22.04

# Avoid interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install Python and systemd
RUN apt-get update && \
    apt-get install -y \
    python3 \
    systemd \
    systemd-sysv \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Remove unnecessary systemd services that can cause issues in containers
RUN cd /lib/systemd/system/sysinit.target.wants/ && \
    ls | grep -v systemd-tmpfiles-setup | xargs rm -f $1 \
    && rm -f /lib/systemd/system/multi-user.target.wants/* \
    && rm -f /etc/systemd/system/*.wants/* \
    && rm -f /lib/systemd/system/local-fs.target.wants/* \
    && rm -f /lib/systemd/system/sockets.target.wants/*udev* \
    && rm -f /lib/systemd/system/sockets.target.wants/*initctl* \
    && rm -f /lib/systemd/system/basic.target.wants/* \
    && rm -f /lib/systemd/system/anaconda.target.wants/* \
    && rm -f /lib/systemd/system/plymouth* \
    && rm -f /lib/systemd/system/systemd-update-utmp*

# Create directory for our services
RUN mkdir -p /opt/services

# Copy the service files
COPY server.py /opt/services/
COPY client.py /opt/services/
RUN chmod +x /opt/services/*.py

# Copy systemd service unit files
COPY server.service /etc/systemd/system/
COPY client.service /etc/systemd/system/

# Enable the services
RUN systemctl enable server.service && \
    systemctl enable client.service

# Expose the server port
EXPOSE 8080

# Set stop signal to SIGRTMIN+3 (systemd's shutdown signal)
STOPSIGNAL SIGRTMIN+3

# Use systemd as init system
CMD ["/lib/systemd/systemd"]
