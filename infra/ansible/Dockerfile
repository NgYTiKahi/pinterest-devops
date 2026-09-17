FROM python:3.13-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssh-client tar \
 && rm -rf /var/lib/apt/lists/* \
 && pip install --no-cache-dir ansible-core==2.19.3
WORKDIR /workspace/infra/ansible
ENTRYPOINT ["ansible-playbook"]
