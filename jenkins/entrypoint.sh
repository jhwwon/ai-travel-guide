#!/bin/bash
# Docker 소켓의 GID를 동적으로 가져와서 docker 그룹 GID를 맞춤
DOCKER_GID=$(stat -c '%g' /var/run/docker.sock)
groupmod -g ${DOCKER_GID} docker
usermod -aG docker jenkins
exec su jenkins -s /bin/bash -c "/usr/local/bin/jenkins.sh"
