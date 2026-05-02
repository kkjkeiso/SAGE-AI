#!/bin/bash

# Exporta a senha para o psql não pedir interativamente
export PGPASSWORD="postgres"

# Executa o comando para apagar o schema public e recriá-lo, o que deleta todas as tabelas, dados, chats, usuários, etc.
psql -h localhost -U postgres -d sageai -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO postgres; GRANT ALL ON SCHEMA public TO public;"
