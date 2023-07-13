# Container Registry Local
Este repositório contém um exemplo de como configurar um Container Registry com interface gráfica em um PC local e como atualizar automaticamente containers em dispositivos rodando na mesma rede.  

# Arquitetura
Esta é a arquitetura que montei pro meu cenário e que usarei de base para as explicações, lembre-se que é necessário adequar para o seu cenário específico, que irá conter endereços IP diferentes e talvez até outros dispositivos com Linux no lugar dos Raspberry Pi.  

![arquitetura](readme/arquitetura.drawio.svg)

## Imagens e Containers
No contexto de Containers entenda a imagem de forma similar aquelas imagens ISO que usamos para instalação de Softwares e Sistemas Operacionais, e os Containers em si seriam o equivalente ao Software instalado e rodando, porém em um ambiente encapsulado bastante enxuto.

## O que é Container Registry?
Um Container Registry é como uma biblioteca para as imagens de containers. Cada container inclui tudo necessário para rodar uma aplicação específica - código, bibliotecas e dependências do sistema. Quando você precisa dessa aplicação, é só buscar a imagem no Registry e colocá-lo para rodar como um container no seu sistema. Dessa forma, o Container Registry é uma ferramenta essencial para armazenar, distribuir e implantar aplicações, garantindo consistência em todas as partes do sistema.

Este repositório permite que você configure o seu próprio Container Registry, rodando em sua máquina local, e fornecendo as imagens como base para containers em outros dispositivos na sua rede.

# Instalação
## Pré-Requisitos
### PC (Servidor Local)
![](https://img.shields.io/badge/Windows_11-0078D6?logo=windows&logoColor=white)
![](https://img.shields.io/badge/Ubuntu-WSL2-E95420?logo=ubuntu&logoColor=white)  
![Docker](https://flat.badgen.net/badge/icon/docker?icon=docker&label) ![Docker Compose](https://flat.badgen.net/badge/icon/docker-compose?icon=docker&label) ![Git](https://flat.badgen.net/badge/icon/git?icon=git&label)  

### Raspberry Pi
![](https://img.shields.io/badge/-Raspberry_Pi_OS-C51A4A?logo=Raspberry-Pi&logoColor=white)  
![Docker](https://flat.badgen.net/badge/icon/docker?icon=docker&label) ![Git](https://flat.badgen.net/badge/icon/git?icon=git&label)  

## Configurar Container Registry
Clone este repositório em uma pasta de sua preferência dentro do WSL:  
![](https://img.shields.io/badge/PC-0078D6?logo=windows&logoColor=white) ![](https://img.shields.io/badge/Terminal-Ubuntu_WSL2-E95420)
```bash
git clone https://github.com/alexandremendoncaalvaro/local-registry.git && cd local-registry
```
Execute este comando a partir da pasta do repositório (local-registry):  
![](https://img.shields.io/badge/PC-0078D6?logo=windows&logoColor=white) ![](https://img.shields.io/badge/Terminal-Ubuntu_WSL2-E95420)
```bash
docker compose -f ./registry/local-registry.yml up -d
```
> 
Se tudo correr como esperado, acesse o Registry no navegador pelo endereço http://localhost:8090

# Imagens Multiplataforma
O seu PC funciona com uma arquitetura x86 ou x64, enquanto o Raspberry Pi funciona com uma arquitetura ArmV7. 
Para gerar as imagens a partir do WSL no seu PC que funcionem para a arquitetura do Raspberry Pi é necessário configurar o BuildX.  

## Configurar BuildX:
O Docker Buildx é uma extensão do Docker que usa o novo BuildKit do Docker para melhorar a experiência de construção de imagens Docker. Ele permite que você crie imagens Docker que são compatíveis com várias plataformas diferentes, como Linux, Windows, ARM, etc.  

### Verifique se o Docker está configurado para usar o BuildKit:
O Docker Buildx precisa do Docker BuildKit para funcionar. Você pode habilitar o BuildKit adicionando a seguinte linha ao arquivo de configuração do Docker:
```json
{
    "features": { "buildkit": true },
}
```
> Geralmente localizado em **~/.docker/daemon.json** ou em **/etc/docker/daemon.json** se o docker for instalado direto no WSL e nas configurações "Docker Engine" se usar o Docker Desktop pelo Windows  

Em seguida, reinicie o Docker.

### Instale o Docker Buildx:
O Docker Buildx é incluído como uma extensão experimental no Docker 19.03 e versões posteriores. Se o Docker estiver habilitado para funcionalidades experimentais, você já terá o Buildx. Caso contrário, você precisará instalá-lo. Você pode verificar se já tem o Buildx rodando:  
![](https://img.shields.io/badge/PC-0078D6?logo=windows&logoColor=white) ![](https://img.shields.io/badge/Terminal-Ubuntu_WSL2-E95420)
```bash
docker buildx version
```
Se você precisar instalá-lo, pode seguir as instruções na [página oficial do Docker Buildx](https://github.com/docker/buildx#installing).

### Crie um novo builder:
O Docker Buildx usa o conceito de "builders" para definir diferentes ambientes de compilação. Você precisará criar um novo builder que é capaz de compilar imagens multiplataforma:  
![](https://img.shields.io/badge/PC-0078D6?logo=windows&logoColor=white) ![](https://img.shields.io/badge/Terminal-Ubuntu_WSL2-E95420)
```bash
docker buildx create --use --name mybuilder --driver-opt network=host
```
Este comando cria um novo builder chamado "mybuilder" e configura o Docker para usá-lo para futuros comandos docker buildx.
> A opção **--driver-opt network=host** habilita para que o push possa ser feito para localhost

### Adicione a plataforma ARM ao seu builder:
Para compilar imagens que são compatíveis com Raspberry Pi (que usa a arquitetura ARM), você precisará adicionar essa plataforma ao seu builder:  
![](https://img.shields.io/badge/PC-0078D6?logo=windows&logoColor=white) ![](https://img.shields.io/badge/Terminal-Ubuntu_WSL2-E95420)
```bash
docker buildx inspect mybuilder --bootstrap
```
Isto inicializará o builder e imprimirá as plataformas suportadas. Se você não vê linux/arm/v7 e linux/arm64 na lista, precisará adicionar suporte a essas plataformas.

###  Compile a sua imagem Docker:
Agora que você configurou o seu builder para suportar múltiplas plataformas, pode usá-lo para compilar a sua imagem Docker. Aqui está um exemplo de como fazer isso. A partir da pasta deste repositório no WSL, execute o seguinte comando:  
![](https://img.shields.io/badge/PC-0078D6?logo=windows&logoColor=white) ![](https://img.shields.io/badge/Terminal-Ubuntu_WSL2-E95420)
```bash
docker buildx build --platform linux/amd64,linux/arm64,linux/arm/v7 -t localhost:5000/test-server:latest --push .
```
Este comando diz ao Docker para compilar a imagem Docker no diretório atual (.) para três plataformas (linux/amd64, linux/arm64, linux/arm/v7), marcar a imagem resultante como **test-server:latest**, e depois enviar (push) a imagem para o Container Registry que está na mesma máquina, e por isso é localhost (192.168.0.100:5000).

Se tudo correr como esperado, acesse o Registry no navegador  
![](https://img.shields.io/badge/PC-0078D6?logo=windows&logoColor=white) ![](https://img.shields.io/badge/Browser-0078D6)  
pelo endereço: http://localhost:8090  
e verifique se a imagem aparece na lista.

## Redirecionamento NAT
### NAT (Network Address Translation)
Este é um processo pelo qual os endereços IP são mapeados de um grupo para outro.  
Por exemplo: O roteador de Internet da sua casa tem um endereço IP único para poder ser encontrado e conversar com outros dispositivos e servidores. Porém, na rede interna da sua casa cada dispositivo tem um IP diferente.
Imagine que um amigo seu queira acessar um site hospedado no seu computador. Você vai precisar expor a porta do serviço onde este site está rodando (Exemplo: 8080) e criar um redirecionamento para que sempre que uma requisição chegue no Endereço IP do seu roteador em uma determinada porta (Exemplo: 80), ela seja encaminhada para a porta no seu computador.  

> [Requisição] >>> [IP do Roteador (Porta 80)] >>>NAT>>> [IP do PC (Porta 8080)]


No nosso caso, utilizamos o redirecionamento NAT no Windows para que as requisições que cheguem de outros dispositivos da rede na porta 5000 sejam corretamente redirecionadas para o nosso Container Registry (na porta 5000 do WSL).

### Configurar redirecionamentos
Considerando que o Registry esteja na porta 5000, execute o comando a seguir no Powershell (modo Administrador):  
![](https://img.shields.io/badge/PC-0078D6?logo=windows&logoColor=white) ![](https://img.shields.io/badge/Terminal-PowerShell-0078D6)
```powershell
$portaRegistry = 5000
$ipWindows = "0.0.0.0"
$ipWsl = ((wsl hostname -I).Trim() -split ' ')[0]
netsh interface portproxy add v4tov4 listenaddress=$ipWindows listenport=$portaRegistry connectport=$portaRegistry connectaddress=$ipWsl
```
> Se rodar o comando com uma configuração já existente de IP e porta ele será sobreescrito  

### Conferir portas redirecionadas  
![](https://img.shields.io/badge/PC-0078D6?logo=windows&logoColor=white) ![](https://img.shields.io/badge/Terminal-PowerShell-0078D6)
```powershell
netsh interface portproxy show all
```

### Caso precise remover algum redirecionamento  
![](https://img.shields.io/badge/PC-0078D6?logo=windows&logoColor=white) ![](https://img.shields.io/badge/Terminal-PowerShell-0078D6)
```powershell
netsh interface portproxy delete v4tov4 listenport=5000 listenaddress=0.0.0.0 protocol=tcp
```
> Supondo que queira remover o que fizemos para o Registry a partir do 0.0.0.0

## Instale o Portainer CE no Raspberry Pi
Portainer é uma interface de usuário baseada na web para gerenciamento de containers Docker. Para instalá-lo no Raspberry Pi, execute os seguintes comandos:  
![](https://img.shields.io/badge/-Raspberry_Pi-C51A4A?logo=Raspberry-Pi&logoColor=white) ![](https://img.shields.io/badge/Terminal-Bash-C51A4A)
```bash
docker volume create portainer_data
docker run -d -p 8000:8000 -p 9443:9443 --name portainer --restart=always -v /var/run/docker.sock:/var/run/docker.sock -v portainer_data:/data portainer/portainer-ce:latest
```

### Configure o acesso do Docker ao Registry
O Docker do Raspberry Pi precisa ser configurado para aceitar acesso ao nosso Registry.  
Abra o arquivo daemon.json:  
![](https://img.shields.io/badge/-Raspberry_Pi-C51A4A?logo=Raspberry-Pi&logoColor=white) ![](https://img.shields.io/badge/Terminal-Bash-C51A4A)
```bash
sudo nano /etc/docker/daemon.json
```
> se não existir ele será criado automaticamente pelo nano
e insira a configuração com o endereço IP do PC:  
```json
{
  "insecure-registries" : ["192.168.0.100:5000"]
}

```

### No Navegador de internet do PC
![](https://img.shields.io/badge/PC-0078D6?logo=windows&logoColor=white) ![](https://img.shields.io/badge/Browser-0078D6)  
Abra o Portainer no navegador utilizando o endereço IP do Raspberry Pi que irá receber a configuração e a porta 9443.  
Por exemplo: **https://192.168.0.42:9443**  

> Importante acessar com **https** e se aparecer o aviso "Sua conexão não é privada" clique em avançado e "Continue até localhost (não seguro)".

A primeira vez vai pedir pra criar usuário e senha (Sim, tem que ter 12 caracteres pelo menos! 😤)  

![](https://2914113074-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FiZWHJxqQsgWYd9sI88sO%2Fuploads%2FG988U9V4JNmqPglD13A6%2F2.15-install-server-setup-user.png?alt=media&token=435a7916-0e9f-4d88-bf22-cc5fa467d9b0)

Após logar você precisa conectar ao ambiente local (Clique em Get Started):
![](https://2914113074-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FiZWHJxqQsgWYd9sI88sO%2Fuploads%2Fsig45vFliINvOKGKVStk%2F2.15-install-server-setup-wizard.png?alt=media&token=cd21d9e8-0632-40db-af9a-581365f98209)

Agora você pode clicar no ambiente criado (local) e na próxima tela ter acesso ao Dashboard e recursos.  

![](https://miro.medium.com/v2/resize:fit:786/format:webp/1*6-cC4uEPcDSFlzt0yO2Q7w.png)

### Instalação do Watchtower no Raspberry Pi
Watchtower é uma aplicação que monitorará suas imagens do Docker em busca de atualizações. Quando uma atualização para uma imagem é detectada, o Watchtower atualizará automaticamente o container. 

Para instalá-lo, vamos incluí-lo em uma Stack do Portainer. Veja o item a seguir.

### Configure a Stack no Portainer no Raspberry Pi
Para rodar sua aplicação no Raspberry, configure uma Stack no Portainer para apontar pra imagem no seu Container Registry.  

Vá na opção Stacks e adicione uma nova Stack. Preencha um nome e os dados no Web Editor, conforme instruções a seguir.  
Supondo que o seu PC com Windows esteja com o IP **192.168.0.100**  
Aqui está como seria uma definição de stack, adaptado para o cenário de exemplo deste documento:  
![](https://img.shields.io/badge/PC-0078D6?logo=windows&logoColor=white) ![](https://img.shields.io/badge/Browser-0078D6) ![](https://img.shields.io/badge/Portainer>Stack-666666) 
```yml
version: '3'
services:
  test-server:
    image: 192.168.0.100:5000/test-server
    ports:
      - "8080:8080"
    restart: unless-stopped
  watchtower:
    image: containrrr/watchtower
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    command: --interval 30
    restart: unless-stopped
```
O Watchtower (no Raspberry Pi) irá conferir por atualizações no Registry (no seu PC) e atualizar automaticamente os containers do Raspberry Pi.

# Finalizando
Agora, cada vez que você quiser aplicar as modificações feitas no seu projeto aos Raspberry Pi e outros dispositivos vinculados, basta executar o comando de build (com --push) novamente. Com isso a imagem será atualizada no Container Registry e o Watchtower nos dispositivos irá conferir e encontar a atualização, e com isso atualizar o container do projeto! ***"Mas não é magia... é tecnologia!"*** rsrsrsrs

Por favor, note que este é apenas um exemplo e para as suas aplicações você precisará acessar a pasta do seu projeto e substituir **test-server:latest** pelo nome e tag que você deseja usar para a sua imagem Docker, e . pelo caminho para o diretório que contém o seu Dockerfile.

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

# Extras
## Instalar Docker no WSL2

### Configurando o WSL

O primeiro passo é verificar se o seu sistema operacional Windows 10/ 11 é compatível com a versão 2 do WSL (WSL 2). Para fazer isso, abra o PowerShell como administrador e execute o seguinte comando:  
![](https://img.shields.io/badge/PC-0078D6?logo=windows&logoColor=white) ![](https://img.shields.io/badge/Terminal-PowerShell-0078D6)
```bash
wsl --set-default-version 2
```
Se você recebeu uma mensagem informando que a atualização para a WSL 2 requer uma atualização do kernel, você precisará instalar a atualização do kernel do sistema operacional Linux do WSL 2. Siga as instruções fornecidas pela Microsoft para instalar a atualização do kernel.

Depois que o WSL 2 estiver configurado, você pode instalar uma distribuição Linux a partir da Microsoft Store. Por exemplo, você pode instalar o Ubuntu.

### Instalando o Docker Engine

Depois que a distribuição Linux estiver instalada, abra o terminal Linux e execute os seguintes comandos para instalar o Docker Engine. No caso do Ubuntu, os comandos seriam:  
![](https://img.shields.io/badge/PC-0078D6?logo=windows&logoColor=white) ![](https://img.shields.io/badge/Terminal-Ubuntu_WSL2-E95420)
```bash
sudo apt-get update
sudo apt-get install apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
sudo apt-get update
sudo apt-get install docker-ce
sudo service docker start
```

Para verificar se o Docker foi instalado corretamente, execute:  
![](https://img.shields.io/badge/PC-0078D6?logo=windows&logoColor=white) ![](https://img.shields.io/badge/Terminal-Ubuntu_WSL2-E95420)
```bash
sudo docker run hello-world
```
Este comando deve retornar uma mensagem indicando que o serviço docker está funcionando.

Nota: Como padrão, o comando Docker requer privilégios de superusuário. Se você quiser evitar a digitação de sudo sempre que executar o comando docker, adicione seu usuário ao grupo docker:  
![](https://img.shields.io/badge/PC-0078D6?logo=windows&logoColor=white) ![](https://img.shields.io/badge/Terminal-Ubuntu_WSL2-E95420)
```bash
sudo usermod -aG docker ${USER}
```

Depois disso, você precisará fazer logout e login novamente para que essa mudança tenha efeito.

Depois de configurar o WSL e instalar o Docker Engine, você poderá executar comandos Docker diretamente do terminal WSL. Lembre-se de que os contêineres Docker que você executa precisarão ser baseados em imagens Linux, já que você está executando o Docker em um ambiente Linux.

Para uma experiência mais automatizada no WSL, você pode adicionar o comando de inicialização do Docker ao arquivo .bashrc ou .zshrc (dependendo do shell que você está usando). Isso iniciará o Docker toda vez que você abrir uma nova janela de terminal.

Para fazer isso, abra o arquivo .bashrc ou .zshrc com um editor de texto de sua escolha (por exemplo, nano ou vim):  
![](https://img.shields.io/badge/PC-0078D6?logo=windows&logoColor=white) ![](https://img.shields.io/badge/Terminal-Ubuntu_WSL2-E95420)
```bash
sudo nano ~/.bashrc
```

Adicione a seguinte linha ao final do arquivo:
```bash
sudo service docker start
```

Agora, sempre que você abrir um novo terminal, o Docker será iniciado automaticamente.

## Instalar Docker no Raspberry Pi
Execute os seguintes comandos para instalar o Docker Engine no Raspberry Pi:  
![](https://img.shields.io/badge/-Raspberry_Pi-C51A4A?logo=Raspberry-Pi&logoColor=white) ![](https://img.shields.io/badge/Terminal-Bash-C51A4A)
```bash
for pkg in docker.io docker-doc docker-compose podman-docker containerd runc; do sudo apt-get remove $pkg; done
sudo apt-get update
sudo apt-get install ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/raspbian/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo \
"deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/raspbian \
"$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo groupadd docker
sudo usermod -aG docker $USER
newgrp docker
```

Para verificar se o Docker foi instalado corretamente, execute:  
![](https://img.shields.io/badge/-Raspberry_Pi-C51A4A?logo=Raspberry-Pi&logoColor=white) ![](https://img.shields.io/badge/Terminal-Bash-C51A4A)
```bash
docker run hello-world
```
Este comando deve retornar uma mensagem indicando que o serviço docker está funcionando.
