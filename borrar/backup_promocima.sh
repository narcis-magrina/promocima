#!/bin/bash
# ─────────────────────────────────────────────────────────────
#  Backup Promocima — Supabase
#  Uso: ./backup_promocima.sh
# ─────────────────────────────────────────────────────────────

PROJECT_REF="lsdmmnxkrrliutleyehp"
DB_PASSWORD="Promocima20!"
BACKUP_DIR="$HOME/backups-promocima"
FECHA=$(date +"%Y-%m-%d_%H-%M")
ARCHIVO="$BACKUP_DIR/backup_$FECHA.sql"

# Crear carpeta de backups si no existe
mkdir -p "$BACKUP_DIR"

echo "🔄 Iniciando backup de Promocima..."
echo "📁 Destino: $ARCHIVO"
echo ""

# Ejecutar dump via pg_dump directo
PGPASSWORD="$DB_PASSWORD" pg_dump \
  -h aws-0-eu-west-1.pooler.supabase.com \
  -p 6543 \
  -U "postgres.$PROJECT_REF" \
  -d postgres \
  --no-owner --no-acl \
  -f "$ARCHIVO"

# Comprobar resultado
if [ $? -eq 0 ]; then
  TAMANYO=$(du -sh "$ARCHIVO" | cut -f1)
  echo ""
  echo "✅ Backup completado correctamente"
  echo "📦 Tamaño: $TAMANYO"
  echo "📄 Fichero: $ARCHIVO"

  # Borrar backups con más de 30 días
  find "$BACKUP_DIR" -name "backup_*.sql" -mtime +30 -delete
  echo "🧹 Backups antiguos (>30 días) eliminados"
else
  echo ""
  echo "❌ Error al realizar el backup"
  exit 1
fi
