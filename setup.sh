#!/bin/bash
# ============================================
# SAGE AI — Setup completo (PostgreSQL + JDK)
# Suporta Fedora/RHEL (dnf) e Ubuntu/Debian (apt)
# Cole no terminal e digite sua senha quando solicitado
# ============================================

set -e

echo "=========================================="
echo "  SAGE AI — Instalando dependências"
echo "=========================================="

# Detectar gerenciador de pacotes
if command -v dnf &>/dev/null; then
  PKG_MGR="dnf"
elif command -v apt &>/dev/null; then
  PKG_MGR="apt"
else
  echo "❌ Gerenciador de pacotes não suportado (precisa de dnf ou apt)."
  exit 1
fi

echo "  → Gerenciador detectado: $PKG_MGR"

# 1. Instalar JDK + PostgreSQL
echo ""
echo "[1/7] Instalando JDK e PostgreSQL..."
if [ "$PKG_MGR" = "dnf" ]; then
  sudo dnf install -y java-25-openjdk-devel postgresql-server postgresql-contrib
elif [ "$PKG_MGR" = "apt" ]; then
  sudo apt update -y
  sudo apt install -y openjdk-21-jdk postgresql postgresql-contrib
fi

# Verificar se o Java foi instalado
echo ""
echo "[2/7] Verificando instalação do JDK..."
if ! command -v java &>/dev/null; then
  echo "❌ JDK não encontrado no PATH. Verifique a instalação."
  exit 1
fi
java -version 2>&1 | head -1
echo "  → JDK instalado com sucesso."

# 3. Inicializar o banco (ignora se já foi feito)
echo ""
echo "[3/7] Inicializando banco de dados..."
if [ "$PKG_MGR" = "dnf" ]; then
  sudo postgresql-setup --initdb 2>/dev/null || echo "  → Banco já inicializado, pulando."
fi

# 4. Configurar pg_hba.conf para aceitar senha (md5)
echo ""
echo "[4/7] Configurando autenticação por senha (md5)..."
if [ "$PKG_MGR" = "dnf" ]; then
  PG_HBA="/var/lib/pgsql/data/pg_hba.conf"
elif [ "$PKG_MGR" = "apt" ]; then
  PG_HBA=$(find /etc/postgresql -name pg_hba.conf 2>/dev/null | head -1)
fi

if [ -n "$PG_HBA" ] && [ -f "$PG_HBA" ]; then
  sudo cp "$PG_HBA" "${PG_HBA}.bak"
  sudo sed -i 's/^\(local\s\+all\s\+all\s\+\)peer$/\1md5/' "$PG_HBA"
  sudo sed -i 's/^\(host\s\+all\s\+all\s\+127\.0\.0\.1\/32\s\+\)ident$/\1md5/' "$PG_HBA"
  sudo sed -i 's/^\(host\s\+all\s\+all\s\+127\.0\.0\.1\/32\s\+\)scram-sha-256$/\1md5/' "$PG_HBA"
  sudo sed -i 's/^\(host\s\+all\s\+all\s\+::1\/128\s\+\)ident$/\1md5/' "$PG_HBA"
  echo "  → pg_hba.conf atualizado (backup em ${PG_HBA}.bak)"
else
  echo "  ⚠️  pg_hba.conf não encontrado. Configure manualmente se necessário."
fi

# 5. Iniciar e habilitar PostgreSQL
echo ""
echo "[5/7] Iniciando PostgreSQL..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 6. Criar senha e database
echo ""
echo "[6/7] Configurando usuário e database..."
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';" 2>/dev/null
sudo -u postgres psql -c "CREATE DATABASE sageai;" 2>/dev/null || echo "  → Database sageai já existe, pulando."

# 7. Reiniciar para aplicar pg_hba.conf + preparar backend
echo ""
echo "[7/7] Reiniciando PostgreSQL e preparando backend..."
sudo systemctl restart postgresql

# Garantir permissão do Maven Wrapper
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MVNW="$SCRIPT_DIR/backend/mvnw"
if [ -f "$MVNW" ]; then
  chmod +x "$MVNW"
  echo "  → Permissão de execução aplicada ao mvnw"
fi

echo ""
echo "=========================================="
echo "  ✅ Setup completo!"
echo "  PostgreSQL rodando na porta 5432"
echo "  Database: sageai"
echo "  Usuário: postgres / Senha: postgres"
echo ""
echo "  Para rodar o BACKEND:"
echo "    cd backend && ./mvnw spring-boot:run"
echo ""
echo "  Para rodar o FRONTEND:"
echo "    Abra o VS Code na pasta SAGE AI e use"
echo "    a extensão Live Server (porta 5500)."
echo "    Ou: npx -y serve . -l 5500"
echo ""
echo "  ⚠️  CORS: o backend aceita requests de"
echo "    http://localhost:5500 e http://127.0.0.1:5500"
echo "=========================================="
