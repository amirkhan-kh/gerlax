# Deploy — Eskiz VPS + domain

Server (hozirgi): `189.74.98.199` · Ubuntu 22.04 · 1 vCPU / 1GB RAM  
SSH: `ssh root@189.74.98.199` (parol Eskiz emailida)

## 1) Domain olish

1. [eskiz.uz](https://eskiz.uz) yoki [bill.eskiz.uz](https://bill.eskiz.uz) → **Domenlar** / Domain registration.
2. `.uz` / `.com` domen tanlang va to‘lang (masalan `agency.uz`).
3. DNS boshqaruvi ochiladi (Eskiz panel yoki registrar).

## 2) Domeni shu serverga bog‘lash (A record)

DNS zonada:

| Type | Name / Host | Value | TTL |
|------|-------------|-------|-----|
| A | `@` (yoki bo‘sh) | `189.74.98.199` | 300 |
| A | `www` | `189.74.98.199` | 300 |

Saqlang. Tarqalishi 5 daqiqa – 24 soat. Tekshiruv:

```bash
dig +short YOUR_DOMAIN.uz A
# 189.74.98.199 chiqishi kerak
```

## 3) Serverga deploy

```bash
# Macdan (parol so‘raydi)
ssh root@189.74.98.199

# Serverda bir marta:
apt update && apt install -y docker.io docker-compose-v2 git
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

git clone <REPO_URL> /opt/booking-agency
cd /opt/booking-agency
cp .env.prod.example .env.prod
nano .env.prod   # parol, SECRET_KEY, PUBLIC_URL, CORS_ORIGINS

docker compose -f docker-compose.prod.yml up -d --build
```

HTTP: `http://189.74.98.199` yoki `http://YOUR_DOMAIN.uz`

## 4) HTTPS (domen DNS tayyor bo‘lgach)

```bash
apt install -y certbot
certbot certonly --webroot -w /opt/booking-agency/deploy/certbot/www \
  -d YOUR_DOMAIN.uz -d www.YOUR_DOMAIN.uz
# keyin nginx.conf ga 443 block qo‘shiladi / yangilanadi
```

Login seed: `admin@agency.uz` / `admin123` — productionda almashtiring.
