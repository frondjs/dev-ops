#!/bin/bash

usage() {
  cat <<USAGE >&2
usage: $0 [options]

Bootstraps a web app.

OPTIONS:
  --help              Show this message

  --project           The name of the project in url address format.

  --hostname          Web address of the app. (without protocol and www)

  --certbotemail      Email which will be sent to the letsencrypt while obtaining an ssl certificate.

  --osuser            Project directory will be set up under this user's dir.

  --protocol          http or https. https by default.
USAGE
}

is_subdomain() {
  [[ $1 =~ \..*\. ]]
}

is_subdomain_psl() {
  local output=$(psl --print-unreg-domain $1)
  local arr=(${output//:/ })
  local name=${1/${arr[1]}/}
  [[ $name =~ \..*\. ]]
}

timestamp() {
  date +%s
}

user_exists() {
  id -u $1 > /dev/null 2>&1
}

program_exists() {
  type $1 >/dev/null 2>&1
}

is_root() {
  [[ $(id -u) -eq 0 ]]
}

dir_exists() {
  [ -d "$1" ]
}

now() {
  date "+%H:%M:%S"
}

COLOR_BLUE='\033[0;34m'
COLOR_GREEN='\033[0;32m'
COLOR_RED='\033[0;31m'
COLOR_YELLOW='\033[0;33m'
COLOR_END='\033[0m'

info() {
  local msg=$1
  echo -e "${COLOR_BLUE}[Frond] $(now): ${msg}${COLOR_END}"
}

warn() {
  local msg=$1
  echo -e "${COLOR_YELLOW}[Frond] $(now): ${msg}${COLOR_END}"
}

success() {
  local msg=$1
  echo -e "${COLOR_GREEN}[Frond] $(now): ${msg}${COLOR_END}"
}

fail() {
  local msg=$1
  echo -e "${COLOR_RED}[Frond] $(now): ${msg}${COLOR_END}"
  exit 1
}

export DEBIAN_FRONTEND=noninteractive
START_TIME=$(timestamp)

# defaults
WEBUSER=$(whoami)
PROJECT_NAME=""
SERVER_HOSTNAME=""
CERTBOT_EMAIL=""
PROTOCOL="https:"

while true; do
  case "$1" in
    --help)
      usage
      exit 1
      ;;
    --project)
      if [[ -z "$2" ]]; then
        fail "Missing flag: project."
      fi
      PROJECT_NAME="$2"
      shift 2
      ;;
    --hostname)
      if [[ -z "$2" ]]; then
        fail "Missing flag: hostname."
      fi
      SERVER_HOSTNAME="$2"
      shift 2
      ;;
    --certbotemail)
      if [[ -z "$2" ]]; then
        fail "Missing flag: certbotemail."
      fi
      CERTBOT_EMAIL="$2"
      shift 2
      ;;
    --osuser)
      WEBUSER="$2"
      shift 2
      ;;
    --protocol)
      PROTOCOL="$2"
      shift 2
      ;;
    *)
      break
      ;;
  esac
done

PROJECT_PATH="/home/${WEBUSER}/distribution/${PROJECT_NAME}"
WEB_SERVER_PATH="${PROJECT_PATH}/live"

info "Setting up directories and server."
sudo su $WEBUSER <<EOF
cd ~
mkdir -p ${PROJECT_PATH}
EOF

hostnames=$(hostname -I);
anchor_ip=$([[ "$hostnames" =~ 10\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3} ]] && echo $BASH_REMATCH);
if [[ -z "$anchor_ip" ]]; then
  anchor_ip="*"
fi
anchor_ip="${anchor_ip}:"

server_block_www=""
if ! is_subdomain $SERVER_HOSTNAME; then
  read -r -d '' server_block_www << EOM
server {
  listen ${anchor_ip}80;
  listen [::]:80;
  server_name www.${SERVER_HOSTNAME};
  return 301 \$scheme://${SERVER_HOSTNAME}\$request_uri;
}
EOM
fi

if [[ -f "/etc/nginx/conf.d/${SERVER_HOSTNAME}.conf" ]]; then
  warn "Server host file already exist. Skipping server host setup."
else
  sudo cat > /etc/nginx/conf.d/${SERVER_HOSTNAME}.conf <<EOF
${server_block_www}

server {
  listen ${anchor_ip}80;
  listen [::]:80;
  server_name ${SERVER_HOSTNAME};
  autoindex off;
  underscores_in_headers on;
  index index.html;

  error_page 400 401 403 404 410 /4xx.html;
  error_page 500 501 503 550 /5xx.html;

  location = /4xx.html {
    root ${WEB_SERVER_PATH};
  }

  location = /5xx.html {
    root ${WEB_SERVER_PATH};
  }

  add_header X-UA-Compatible "IE=Edge";
  add_header X-XSS-Protection "1; mode=block";
  add_header X-Content-Type-Options nosniff;
  add_header X-Frame-Options deny;
  add_header Referrer-Policy strict-origin-when-cross-origin;

  # user custom config, if exist
  include ${WEB_SERVER_PATH}/nginx.*.conf;

  # forbidden paths
  location ~* /nginx.*.conf {
    deny all;
    return 404;
  }

  # default route
  location / {
    root ${WEB_SERVER_PATH};

    add_header Cache-Control "no-cache, private, no-store, must-revalidate";
    expires off;
    etag off;

    try_files \$uri \$uri/index.html /index.html =404;
  }

  # immutable static assets, caching enabled
  location ~* "/(.*)?([a-zA-Z0-9-_@]+).([a-z0-9]{6,32})(@2x)?.(bmp|ejs|jpeg|pdf|ps|ttf|class|eot|jpg|pict|svg|webp|css|eps|js|pls|svgz|woff|csv|gif|mid|png|swf|woff2|doc|ico|midi|ppt|tif|xls|docx|jar|otf|pptx|tiff|xlsx|webm|mp4|ogg|mp3|json|htm|html|txt|xml|zip)\$" {
    etag off;
    expires max;
    root ${WEB_SERVER_PATH};
    try_files \$uri =404;
  }

  # certain static assets, caching enabled
  location ~* ".(bmp|ejs|jpeg|pdf|ps|ttf|class|eot|jpg|pict|svg|webp|css|eps|js|pls|svgz|woff|csv|gif|mid|png|swf|woff2|doc|ico|midi|ppt|tif|xls|docx|jar|otf|pptx|tiff|xlsx|webm|mp4|ogg|mp3|json|htm|html|txt|xml|zip)\$" {
    root ${WEB_SERVER_PATH};
    try_files \$uri =404;
  }
}
EOF
  nginx -t 2>/dev/null > /dev/null
  if [[ $? != 0 ]]; then
    fail "Nginx configuration test failed."
  fi
  sudo systemctl reload nginx
fi

info "Installing ssl certificate."
certbot_cmd_domains="-d ${SERVER_HOSTNAME} "
if ! is_subdomain $SERVER_HOSTNAME; then
  certbot_cmd_domains+="-d www.${SERVER_HOSTNAME}"
fi

sudo certbot --nginx --non-interactive --redirect --agree-tos \
  --email $CERTBOT_EMAIL --no-eff-email $certbot_cmd_domains

END_TIME=$(timestamp)
success "Project ${PROJECT_NAME} installed successfully. (in $(($END_TIME - $START_TIME)) seconds.)"
exit 0
