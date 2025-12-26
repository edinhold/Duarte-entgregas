# 🚀 Guia de Instalação em VPS - Duarte Entregas

Este guia detalha o processo de implantação do aplicativo **Duarte Entregas** em uma VPS (Virtual Private Server) rodando Ubuntu 22.04 LTS ou superior.

---

## 📋 Requisitos Mínimos
- **Sistema Operacional:** Ubuntu 22.04 LTS (ou Debian 11+)
- **CPU:** 1 Core (mínimo)
- **RAM:** 1GB (2GB recomendado para build)
- **Domínio:** Um domínio ou subdomínio apontando para o IP da sua VPS.

---

## 🛠️ Passo 1: Preparação do Servidor

Acesse sua VPS via SSH e atualize os pacotes do sistema:
```bash
sudo apt update && sudo apt upgrade -y
```

Instale o **Nginx** e ferramentas essenciais:
```bash
sudo apt install -y nginx git curl build-essential
```

---

## 🟢 Passo 2: Instalação do Node.js

Recomendamos o uso do **Node.js 20.x (LTS)**:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

Verifique a instalação:
```bash
node -v && npm -v
```

---

## 📦 Passo 3: Configuração do Aplicativo

Clone o repositório ou suba os arquivos para `/var/www/duarte-entregas`:
```bash
sudo mkdir -p /var/www/duarte-entregas
sudo chown -R $USER:$USER /var/www/duarte-entregas
cd /var/www/duarte-entregas
# Clone o seu código aqui: git clone <url_do_repositorio> .
```

Instale as dependências:
```bash
npm install
```

### ⚠️ Configuração da Gemini API
Para que as funcionalidades de IA e precificação funcionem, você deve configurar a chave de API no ambiente. Se estiver usando uma ferramenta de build (como Vite ou Webpack), crie um arquivo `.env`:
```bash
echo "API_KEY=SUA_CHAVE_AQUI" > .env
```

Gere os arquivos de produção:
```bash
npm run build
```

---

## 🌐 Passo 4: Configuração do Nginx

Crie um arquivo de configuração para o site:
```bash
sudo nano /etc/nginx/sites-available/duarte-entregas
```

Cole o conteúdo abaixo (ajuste o `server_name` para seu domínio):
```nginx
server {
    listen 80;
    server_name seu-dominio.com.br;
    root /var/www/duarte-entregas/dist; # Ou o nome da sua pasta de build

    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache de assets estáticos
    location ~* \.(?:ico|css|js|gif|jpe?g|png|woff2?|eot|otf|ttf|svg|map)$ {
        expires 6M;
        access_log off;
        add_header Cache-Control "public";
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml hide;
}
```

Ative o site e reinicie o Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/duarte-entregas /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🔒 Passo 5: Segurança e SSL (HTTPS)

Configure o Firewall:
```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

Instale o **Certbot** para obter o certificado SSL gratuito (Let's Encrypt):
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d seu-dominio.com.br
```

---

## 🛠️ Manutenção e Atualização

Sempre que fizer alterações no código, execute na VPS:
```bash
git pull
npm install
npm run build
# O Nginx servirá os arquivos novos automaticamente após o build
```

---

## 🆘 Troubleshooting
1. **Erro 403 Forbidden:** Verifique se as permissões da pasta `/var/www/duarte-entregas` estão corretas. O usuário `www-data` precisa ter acesso de leitura.
2. **Mapa não carrega:** Certifique-se de que a VPS tem acesso à internet para carregar os tiles do Leaflet/CartoDB.
3. **Erro de API Key:** Verifique se a variável `process.env.API_KEY` está sendo injetada corretamente durante o processo de build.

---
*Documentação gerada em: 2024 - Duarte Entregas Systems*