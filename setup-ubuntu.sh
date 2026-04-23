#!/bin/bash

set -euo pipefail

sudo apt update
sudo apt install -y openjdk-25-jdk maven postgresql postgresql-contrib

if ! pg_lsclusters --no-header 2>/dev/null | grep -q .; then
  PG_MAJOR="$(psql -V | awk '{print $3}' | cut -d. -f1)"
  sudo pg_createcluster "$PG_MAJOR" main --start
fi

PG_VERSION="$(pg_lsclusters --no-header | awk 'NR==1 {print $1}')"
PG_CLUSTER="$(pg_lsclusters --no-header | awk 'NR==1 {print $2}')"
PG_HBA="/etc/postgresql/${PG_VERSION}/${PG_CLUSTER}/pg_hba.conf"

sudo cp "$PG_HBA" "${PG_HBA}.bak"

cat <<'EOF' | sudo tee /tmp/pg_hba_tmp >/dev/null
local   all   postgres                                trust
host    all   postgres        127.0.0.1/32            trust
host    all   postgres        ::1/128                 trust
EOF

sudo sh -c 'cat /tmp/pg_hba_tmp "$1" > "$1.new" && mv "$1.new" "$1"' _ "$PG_HBA"

sudo systemctl enable --now postgresql
sudo pg_ctlcluster "$PG_VERSION" "$PG_CLUSTER" restart

sudo -u postgres psql -d postgres -c "ALTER USER postgres WITH PASSWORD 'postgres';"
sudo -u postgres psql -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'sageai';" | grep -q 1 || sudo -u postgres createdb sageai

sudo cp "${PG_HBA}.bak" "$PG_HBA"

sudo sed -i 's/^\(local[[:space:]]\+all[[:space:]]\+all[[:space:]]\+\)peer$/\1scram-sha-256/' "$PG_HBA"
sudo sed -i 's/^\(local[[:space:]]\+all[[:space:]]\+postgres[[:space:]]\+\)peer$/\1scram-sha-256/' "$PG_HBA"
sudo sed -i 's/^\(host[[:space:]]\+all[[:space:]]\+all[[:space:]]\+127\.0\.0\.1\/32[[:space:]]\+\)md5$/\1scram-sha-256/' "$PG_HBA"
sudo sed -i 's/^\(host[[:space:]]\+all[[:space:]]\+all[[:space:]]\+127\.0\.0\.1\/32[[:space:]]\+\)scram-sha-256$/\1scram-sha-256/' "$PG_HBA"
sudo sed -i 's/^\(host[[:space:]]\+all[[:space:]]\+all[[:space:]]\+::1\/128[[:space:]]\+\)md5$/\1scram-sha-256/' "$PG_HBA"
sudo sed -i 's/^\(host[[:space:]]\+all[[:space:]]\+all[[:space:]]\+::1\/128[[:space:]]\+\)scram-sha-256$/\1scram-sha-256/' "$PG_HBA"

grep -q '^local   all   postgres                                scram-sha-256$' "$PG_HBA" || sudo sed -i '1ilocal   all   postgres                                scram-sha-256' "$PG_HBA"
grep -q '^host    all   postgres        127.0.0.1/32            scram-sha-256$' "$PG_HBA" || sudo sed -i '2ihost    all   postgres        127.0.0.1/32            scram-sha-256' "$PG_HBA"
grep -q '^host    all   postgres        ::1/128                 scram-sha-256$' "$PG_HBA" || sudo sed -i '3ihost    all   postgres        ::1/128                 scram-sha-256' "$PG_HBA"

sudo pg_ctlcluster "$PG_VERSION" "$PG_CLUSTER" restart

java -version
psql -h 127.0.0.1 -U postgres -d sageai -c '\conninfo'
