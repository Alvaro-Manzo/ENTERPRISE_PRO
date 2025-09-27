#!/bin/bash
# Script de inicio para EnterprisePro

echo "🏢 Iniciando EnterprisePro..."

# Verificar si Python3 está instalado
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 no está instalado. Por favor instala Python3."
    exit 1
fi

# Verificar si pip3 está instalado
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 no está instalado. Por favor instala pip3."
    exit 1
fi

# Instalar dependencias
echo "📦 Instalando dependencias..."
pip3 install -r requirements.txt

# Inicializar base de datos
echo "💾 Inicializando base de datos..."
cd backend
python3 init_db.py

# Ejecutar servidor
echo "🚀 Iniciando servidor..."
echo ""
echo "✅ EnterprisePro estará disponible en: http://127.0.0.1:5000"
echo ""
echo "👤 Usuarios de prueba:"
echo "   Admin:     admin@enterprise.com / admin123"
echo "   Manager:   manager.tech@enterprise.com / manager123"
echo "   Employee:  developer1@enterprise.com / emp123"
echo ""
echo "🔑 Presiona Ctrl+C para detener el servidor"
echo ""

python3 app.py
