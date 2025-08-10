#!/bin/bash
# PesoTracker Backup Manager - Ultra Simple
# Uso: ./pesotracker-backup.sh

# Configuración
BACKUP_BASE="/mnt/backup/pesotracker"
RESTORE_DIR="/mnt/backup/restore"
PROJECT_DIR="$(pwd)"
CONTAINER_DB="api-pesotracker-db"
CONTAINER_API="api-pesotracker"

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar mensajes
log() {
    echo -e "${GREEN}[$(date '+%H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# Verificar Docker
check_docker() {
    if ! docker ps >/dev/null 2>&1; then
        error "Docker no está corriendo. Inicia Docker primero."
        exit 1
    fi
}

# Función BACKUP
do_backup() {
    log "🚀 Iniciando backup automático..."
    
    # Crear carpetas
    BACKUP_DATE=$(date +"%Y-%m-%d_%H-%M-%S")
    BACKUP_DIR="$BACKUP_BASE/$BACKUP_DATE"
    mkdir -p "$BACKUP_DIR"
    
    log "📁 Carpeta: $BACKUP_DIR"
    
    # 1. Backup DB
    log "💾 Exportando base de datos..."
    if docker exec "$CONTAINER_DB" pg_dump -U postgres peso_tracker > "$BACKUP_DIR/peso_tracker.sql"; then
        log "✅ Base de datos exportada"
    else
        error "❌ Error al exportar base de datos"
        return 1
    fi
    
    # 2. Backup uploads
    log "📸 Copiando imágenes..."
    mkdir -p "$BACKUP_DIR/uploads"
    if docker cp "$CONTAINER_API:/app/uploads/." "$BACKUP_DIR/uploads/" 2>/dev/null; then
        log "✅ Imágenes copiadas"
    else
        warn "⚠️  No hay imágenes o error al copiar"
        mkdir -p "$BACKUP_DIR/uploads"  # Crear carpeta vacía
    fi
    
    # 3. Info del backup
    DB_SIZE=$(ls -lh "$BACKUP_DIR/peso_tracker.sql" 2>/dev/null | awk '{print $5}' || echo "0")
    UPLOAD_COUNT=$(find "$BACKUP_DIR/uploads" -type f 2>/dev/null | wc -l || echo "0")
    TOTAL_SIZE=$(du -sh "$BACKUP_DIR" 2>/dev/null | awk '{print $1}' || echo "0")
    
    cat > "$BACKUP_DIR/info.txt" << EOF
PesoTracker Backup
==================
Fecha: $BACKUP_DATE
Base de datos: $DB_SIZE
Imágenes: $UPLOAD_COUNT archivos
Tamaño total: $TOTAL_SIZE
EOF
    
    log "🎉 BACKUP COMPLETO!"
    log "📊 DB: $DB_SIZE | Imágenes: $UPLOAD_COUNT | Total: $TOTAL_SIZE"
    log "📁 Ubicación: $BACKUP_DIR"
    
    # Limpiar backups viejos (opcional)
    log "🧹 Limpiando backups antiguos (>30 días)..."
    find "$BACKUP_BASE" -type d -name "20*" -mtime +30 -exec rm -rf {} + 2>/dev/null || true
}

# Función RESTORE
do_restore() {
    log "🔄 Iniciando restore automático..."
    
    # Verificar carpeta restore
    if [ ! -d "$RESTORE_DIR" ] || [ -z "$(ls -A "$RESTORE_DIR" 2>/dev/null)" ]; then
        error "❌ Carpeta $RESTORE_DIR vacía o no existe"
        echo ""
        echo "Para usar restore:"
        echo "1. Copia un backup: cp -r $BACKUP_BASE/2025-XX-XX_XX-XX-XX/* $RESTORE_DIR/"
        echo "2. Ejecuta restore nuevamente"
        return 1
    fi
    
    # Verificar archivos necesarios
    if [ ! -f "$RESTORE_DIR/peso_tracker.sql" ]; then
        error "❌ No se encuentra peso_tracker.sql en $RESTORE_DIR"
        return 1
    fi
    
    warn "⚠️  ATENCIÓN: Esto va a REEMPLAZAR todos los datos actuales"
    echo -n "¿Continuar? (y/N): "
    read -r confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        log "❌ Restore cancelado"
        return 0
    fi
    
    # 1. Parar aplicación
    log "🛑 Parando aplicación..."
    docker-compose down >/dev/null 2>&1
    
    # 2. Iniciar solo PostgreSQL
    log "🚀 Iniciando PostgreSQL..."
    docker-compose up -d postgres >/dev/null 2>&1
    sleep 5
    
    # Esperar a que PostgreSQL esté listo
    log "⏳ Esperando PostgreSQL..."
    for i in {1..30}; do
        if docker exec "$CONTAINER_DB" pg_isready -U postgres >/dev/null 2>&1; then
            break
        fi
        sleep 1
        if [ $i -eq 30 ]; then
            error "❌ PostgreSQL no responde"
            return 1
        fi
    done
    
    # 3. Restaurar DB
    log "💾 Restaurando base de datos..."
    docker exec "$CONTAINER_DB" psql -U postgres -c "DROP DATABASE IF EXISTS peso_tracker;" >/dev/null 2>&1
    docker exec "$CONTAINER_DB" psql -U postgres -c "CREATE DATABASE peso_tracker;" >/dev/null 2>&1
    
    if docker exec -i "$CONTAINER_DB" psql -U postgres peso_tracker < "$RESTORE_DIR/peso_tracker.sql" >/dev/null 2>&1; then
        log "✅ Base de datos restaurada"
    else
        error "❌ Error al restaurar base de datos"
        return 1
    fi
    
    # 4. Restaurar uploads
    log "📸 Restaurando imágenes..."
    rm -rf uploads/* 2>/dev/null
    if [ -d "$RESTORE_DIR/uploads" ]; then
        cp -r "$RESTORE_DIR/uploads/"* uploads/ 2>/dev/null || true
        chmod -R 755 uploads/ 2>/dev/null
        UPLOAD_COUNT=$(find uploads/ -type f 2>/dev/null | wc -l || echo "0")
        log "✅ $UPLOAD_COUNT imágenes restauradas"
    else
        log "ℹ️  No hay imágenes que restaurar"
    fi
    
    # 5. Reiniciar aplicación completa
    log "🚀 Reiniciando aplicación..."
    docker-compose up -d >/dev/null 2>&1
    
    # 6. Limpiar carpeta restore
    log "🧹 Limpiando carpeta restore..."
    rm -rf "$RESTORE_DIR"/*
    
    log "🎉 RESTORE COMPLETO!"
    log "✅ Aplicación disponible en http://localhost:3000"
}

# Función para listar backups
list_backups() {
    log "📋 Backups disponibles:"
    echo ""
    
    if [ ! -d "$BACKUP_BASE" ] || [ -z "$(ls -A "$BACKUP_BASE" 2>/dev/null)" ]; then
        warn "No hay backups disponibles"
        return 0
    fi
    
    for backup in "$BACKUP_BASE"/*/; do
        if [ -d "$backup" ]; then
            backup_name=$(basename "$backup")
            if [ -f "$backup/info.txt" ]; then
                echo -e "${BLUE}📦 $backup_name${NC}"
                cat "$backup/info.txt" | sed 's/^/   /'
                echo ""
            else
                echo -e "${BLUE}📦 $backup_name${NC} (sin info)"
            fi
        fi
    done
}

# Función principal - Menú
main_menu() {
    clear
    echo -e "${GREEN}"
    echo "╔══════════════════════════════════════╗"
    echo "║        PesoTracker Backup            ║"
    echo "║           Manager v1.0               ║"
    echo "╚══════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""
    echo "¿Qué quieres hacer?"
    echo ""
    echo "1) 📤 Crear backup"
    echo "2) 📥 Restaurar backup"  
    echo "3) 📋 Ver backups disponibles"
    echo "4) 🚪 Salir"
    echo ""
    echo -n "Opción (1-4): "
    
    read -r option
    echo ""
    
    case $option in
        1)
            check_docker
            do_backup
            ;;
        2)
            check_docker
            do_restore
            ;;
        3)
            list_backups
            ;;
        4)
            log "👋 ¡Hasta luego!"
            exit 0
            ;;
        *)
            error "Opción inválida. Usa 1, 2, 3 o 4"
            ;;
    esac
    
    echo ""
    echo -n "Presiona Enter para continuar..."
    read -r
}

# Crear carpetas necesarias
mkdir -p "$BACKUP_BASE" "$RESTORE_DIR"

# Loop principal
while true; do
    main_menu
done