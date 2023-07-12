# Container Registry Local
Este repositório contém um exemplo de como configurar um Container Registry com interface gráfica em um PC local e como atualizar automaticamente containers em dispositivos rodando na mesma rede.  

# Arquitetura
Esta é a arquitetura que montei pro meu cenário e que usarei de base para as explicações, sinta-se a vontade para testar da forma que preferir.  
Por exemplo, caso use um PC no lugar no Raspberry.  

![arquitetura](readme/arquitetura.drawio.svg)

## O que é Container Registry?
Um Container Registry é basicamente um local de armazenamento e distribuição para imagens de container. Se você está familiarizado com o conceito de controle de versão de código, como o GitHub, pode pensar em um Container Registry como um "GitHub para imagens de containers".

Os containers são uma maneira popular de empacotar e distribuir software. Eles encapsulam um software em um pacote completo que contém tudo que o software precisa para ser executado, incluindo o código, as bibliotecas do sistema, as dependências etc. Isso torna o software muito portátil e reprodutível, porque ele não depende do sistema onde está sendo executado.

Uma "imagem" de container é uma espécie de modelo que você usa para criar containers. Ela contém o software e todas as suas dependências. Portanto, quando você executa um container, o que você está realmente fazendo é criar uma instância de uma imagem de container.

Um Container Registry é onde essas imagens de container são armazenadas. Ele permite que você faça upload de suas imagens de container para que outras pessoas (ou outras partes do seu sistema) possam baixá-las e executá-las. Assim como um repositório de código, ele geralmente oferece recursos como controle de versão e permissões de acesso.

Um exemplo de Container Registry é o Docker Hub, mas existem muitos outros, incluindo o Google Container Registry e o Amazon Elastic Container Registry.

Este repositório permite que você configure o seu próprio Container Registry, rodando em sua máquina local, e fornecendo as imagens como base para containers em outros dispositivos na sua rede.

# Instalação
## Configurar Container Registry
### Pré-Requisitos PC (Servidor Local)
![Windows 11](https://flat.badgen.net/badge/icon/windows11?icon=windows&label) ![WSL2 Ubuntu](https://flat.badgen.net/badge/WSL2/Ubuntu/orange) ![Docker](https://flat.badgen.net/badge/icon/docker?icon=docker&label) ![Docker Compose](https://flat.badgen.net/badge/icon/docker-compose?icon=docker&label) ![Git](https://flat.badgen.net/badge/icon/git?icon=git&label)  

Clone este repositório em algum local dentro do WSL:
```bash
git clone https://github.com/alexandremendoncaalvaro/local-registry.git && cd local-registry
```
Execute este comando a partir da pasta do repositório (local-registry):
```bash
docker-compose -f ./registry/local-registry.yml up -d
```
Se tudo correr como esperado, acesse o Registry no navegador pelo endereço http://localhost:8090

## Configurar Raspberry Pi
### Pré-Requisitos Raspberry Pi
![Raspberry Pi OS](https://img.shields.io/badge/-Raspberry_Pi_OS-C51A4A?style=for-the-badge&logo=Raspberry-Pi) ![Docker](https://flat.badgen.net/badge/icon/docker?icon=docker&label) ![Git](https://flat.badgen.net/badge/icon/git?icon=git&label)  
Para instalar o Docker no Raspberry Pi, você pode usar o seguinte comando:
```bash
curl -sSL https://get.docker.com | sh
```
E para instalar o Git:
```bash
sudo apt-get install git
```
## Redirecionamento NAT
### NAT (Network Address Translation)
Este é um processo pelo qual os endereços IP são mapeados de um grupo para outro, geralmente com o objetivo de fornecer conectividade à Internet para vários hosts em uma rede local (LAN) por meio de um único endereço IP público. O NAT permite que um único dispositivo, como um roteador, atue como um agente entre a Internet (ou "rede pública") e uma rede local (ou "rede privada"). Isso significa que apenas um endereço IP único é necessário para representar um grupo inteiro de computadores para a Internet.

No caso do nosso exemplo, utilizamos o redirecionamento NAT no Windows para que as requisições que cheguem de outros dispositivos da rede na porta 5000 sejam corretamente redirecionadas para o nosso Container Registry.

### Configurar redirecionamentos
Considerando que o Registry esteja na porta 5000, execute o comando a seguir no Powershell (modo Administrador):  
```powershell
$portaRegistry = 5000
$ipWindows = "0.0.0.0"
$ipWsl = (wsl hostname -I).Trim()
netsh interface portproxy add v4tov4 listenaddress=$ipWindows listenport=$portaRegistry connectport=$portaRegistry connectaddress=$ipWsl
```

### Conferir portas redirecionadas  
```powershell
netsh interface portproxy show all
```

### Remover algum redirecionamento  
```powershell
netsh interface portproxy delete v4tov4 listenport=5000 listenaddress=0.0.0.0 protocol=tcp
```
> Supondo que queira remover o que fizemos para o Registry a partir do 0.0.0.0

## Instale o Portainer CE no Raspberry Pi
Portainer é uma interface de usuário baseada na web para gerenciamento de containers Docker. Para instalá-lo no Raspberry Pi, execute os seguintes comandos:
```bash
docker volume create portainer_data
docker run -d -p 8000:8000 -p 9443:9443 --name portainer --restart=always -v /var/run/docker.sock:/var/run/docker.sock -v portainer_data:/data portainer/portainer-ce:latest
```
Abra o Portainer no navegador do PC conectado a mesma rede utilizando o endereço IP do Raspberry Pi que irá receber a configuração e a porta 9443.  
Por exemplo: **https://192.168.0.42:9443**  

> Importante acessar com **https**

A primeira vez vai pedir pra criar usuário e senha. Sim, tem que ter 12 caracteres pelo menos! 😤  

Após logar você precisa conectar ao ambiente local (Clique em Get Started):
![portainer get started](https://2914113074-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FiZWHJxqQsgWYd9sI88sO%2Fuploads%2Fsig45vFliINvOKGKVStk%2F2.15-install-server-setup-wizard.png?alt=media&token=cd21d9e8-0632-40db-af9a-581365f98209)

Agora você pode selecionar o ambiente criado (local) e ter acesso ao Dashboard e recursos.  

### Instalação do Watchtower no Raspberry Pi
Watchtower é uma aplicação que monitorará suas imagens do Docker em busca de atualizações. Quando uma atualização para uma imagem é detectada, o Watchtower atualizará automaticamente o container. 

Para instalá-lo, vamos incluí-lo em uma Stack do Portainer. Veja o item a seguir.

### Configure a Stack no Portainer no Raspberry Pi
Para rodar sua aplicação no Raspberry, configure uma Stack no Portainer para apontar pra imagem no seu Container Registry.  

Supondo que o seu PC com Windows esteja com o IP **192.168.0.100**  
Aqui está como seria uma definição de stack, adaptado para o cenário de exemplo deste documento:  
```yml
version: '3'
services:
  test-server:
    image: 192.168.0.100:5000/test-server
    ports:
      - "8080:8080"
  watchtower:
    image: containrrr/watchtower
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    command: --interval 30
```
O Watchtower irá conferir por atualizações no Registry e atualizar automaticamente os containers do Raspberry Pi.

# Imagens Multiplataforma
Para gerar imagens a partir do seu WSL que funcionem no Raspberry Pi é necessário configurar o BuildX.  

## Configurar BuildX:
O Docker Buildx é uma extensão do Docker que usa o novo BuildKit do Docker para melhorar a experiência de construção de imagens Docker. Ele permite que você crie imagens Docker que são compatíveis com várias plataformas diferentes, como Linux, Windows, ARM, etc.  

### Verifique se o Docker está configurado para usar o BuildKit:
O Docker Buildx precisa do Docker BuildKit para funcionar. Você pode habilitar o BuildKit adicionando a seguinte linha ao arquivo de configuração do Docker:
```json
{
    "features": { "buildkit": true }
}
```
> Geralmente localizado em ~/.docker/daemon.json se o docker for instalado direto no WSL e nas configurações "Docker Engine" se usar o Docker Desktop pelo Windows  

Em seguida, reinicie o Docker.

### Instale o Docker Buildx:
O Docker Buildx é incluído como uma extensão experimental no Docker 19.03 e versões posteriores. Se o Docker estiver habilitado para funcionalidades experimentais, você já terá o Buildx. Caso contrário, você precisará instalá-lo. Você pode verificar se já tem o Buildx rodando docker buildx version. Se você precisar instalá-lo, pode seguir as instruções na [página oficial do Docker Buildx](https://github.com/docker/buildx#installing).

### Crie um novo builder:
O Docker Buildx usa o conceito de "builders" para definir diferentes ambientes de compilação. Você precisará criar um novo builder que é capaz de compilar imagens multiplataforma. No WSL execute:
```bash
docker buildx create --use --name mybuilder
```
Este comando cria um novo builder chamado "mybuilder" e configura o Docker para usá-lo para futuros comandos docker buildx.

### Adicione a plataforma ARM ao seu builder:
Para compilar imagens que são compatíveis com Raspberry Pi (que usa a arquitetura ARM), você precisará adicionar essa plataforma ao seu builder:
```bash
docker buildx inspect mybuilder --bootstrap
```
Isto inicializará o builder e imprimirá as plataformas suportadas. Se você não vê linux/arm/v7 e linux/arm64 na lista, precisará adicionar suporte a essas plataformas.

###  Compile a sua imagem Docker:
Agora que você configurou o seu builder para suportar múltiplas plataformas, pode usá-lo para compilar a sua imagem Docker. Aqui está um exemplo de como fazer isso. A partir da pasta deste repositório no WSL, execute o seguinte comando:
```bash
docker buildx build --platform linux/amd64,linux/arm64,linux/arm/v7 -t localhost:5000/test-server:latest --push .
```
Este comando diz ao Docker para compilar a imagem Docker no diretório atual (.) para três plataformas (linux/amd64, linux/arm64, linux/arm/v7), marcar a imagem resultante como **test-server:latest**, e depois enviar (push) a imagem para o Container Registry (localhost:5000).

Se tudo correr como esperado, acesse o Registry no navegador pelo endereço http://localhost:8090 e verifique se a imagem aparece na lista.

Cada vez que você quiser aplicar as modificações feitas no seu projeto aos Raspberry Pi e outros dispositivos vinculados, basta executar o comando de build (com --push) novamente. Com isso a imagem será atualizada no Container Registry e o Watchtower nos dispositivos irá conferir e encontar a atualização, e com isso atualizar o container do projeto! ***"Mas não é magia... é tecnologia!"*** rsrsrsrs

Por favor, note que este é apenas um exemplo e para as suas aplicações você precisará substituir **test-server:latest** pelo nome e tag que você deseja usar para a sua imagem Docker, e . pelo caminho para o diretório que contém o seu Dockerfile.

# Referências
https://github.com/Joxit/docker-registry-ui/tree/main/examples/ui-as-standalone
https://docs.docker.com/build/building/multi-platform/

# Por último, mas não menos importante
Certifique-se de que o seu Dockerfile e o seu código são compatíveis com todas as plataformas para as quais você está compilando. Algumas imagens do Docker e alguns códigos podem não funcionar em todas as plataformas. Em particular, se você estiver compilando para a plataforma ARM (Raspberry Pi), deverá garantir que todas as imagens do Docker que você está usando têm variantes ARM e que o seu código é compatível com ARM.

Caso você encontre problemas durante a instalação e configuração, aqui estão algumas dicas gerais para a solução de problemas:

- Verifique se todos os pré-requisitos estão instalados corretamente.
- Assegure-se de que você tem as permissões adequadas para executar todos os comandos.
- Caso esteja recebendo erros durante a compilação, verifique se o seu Dockerfile está escrito corretamente.
- Para problemas de rede, assegure-se de que todas as portas necessárias estão abertas e corretamente configuradas.
- Para problemas mais específicos, por favor consulte as documentações apropriadas ou busque por soluções online.
