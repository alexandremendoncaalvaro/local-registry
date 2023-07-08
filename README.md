# Configurar Registry Local:
https://github.com/Joxit/docker-registry-ui/tree/main/examples/ui-as-standalone

# Configurar BuildX:
https://docs.docker.com/build/building/multi-platform/

Subir imagem no Registry
```bash
docker buildx build --platform linux/amd64,linux/arm64,linux/arm/v7 -t localhost:5000/test:latest --push .
```