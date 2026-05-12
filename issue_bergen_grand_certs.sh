#!/usr/bin/env bash
# FILE: issue_bergen_grand_certs.sh
# DATE: 2026-05-12
# PURPOSE: Issue Bergen Grand production and dev certificates through webroot.

set -euo pipefail

email="${CERTBOT_EMAIL:-yevhen.yezerskyy@gmail.com}"

docker run --rm \
  -v bergen-certbot-www:/var/www/certbot \
  -v bergen-certbot-etc:/etc/letsencrypt \
  certbot/certbot:latest certonly \
    --webroot \
    -w /var/www/certbot \
    --non-interactive \
    --agree-tos \
    --email "$email" \
    --cert-name bergen-grand.com \
    -d bergen-grand.com \
    -d www.bergen-grand.com \
    -d bergen-grand.de \
    -d www.bergen-grand.de

docker run --rm \
  -v bergen-certbot-www:/var/www/certbot \
  -v bergen-certbot-etc:/etc/letsencrypt \
  certbot/certbot:latest certonly \
    --webroot \
    -w /var/www/certbot \
    --non-interactive \
    --agree-tos \
    --email "$email" \
    --cert-name dev.bergen-grand.com \
    -d dev.bergen-grand.com \
    -d dev.bergen-grand.de
