# -*- coding: utf-8 -*-
"""
EnterprisePro - Inicializador de Base de Datos Simple
"""

import sqlite3
import os

def init_database():
    """Inicializar base de datos con esquemas y datos"""
    try:
        # Crear conexión
        db_path = 'enterprise.db'
        conn = sqlite3.connect(db_path)
        print(f"📊 Conectado a la base de datos: {db_path}")
        
        # Eliminar todas las tablas existentes primero
        cursor = conn.cursor()
        
        # Obtener todos los nombres de las tablas
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
                # Drop all tables except sqlite_sequence
        for table in tables:
            if table[0] != 'sqlite_sequence':
                cursor.execute(f"DROP TABLE IF EXISTS {table[0]};")
                print(f"🗑️  Dropped table: {table[0]}")
        
        conn.commit()
        
        # Leer y ejecutar esquema
        with open('../database/schema.sql', 'r', encoding='utf-8') as f:
            schema_sql = f.read()
        
        conn.executescript(schema_sql)
        print("✅ Esquema de base de datos creado")
        
        # Leer y ejecutar datos de ejemplo
        with open('../database/sample_data.sql', 'r', encoding='utf-8') as f:
            data_sql = f.read()
        
        conn.executescript(data_sql)
        print("✅ Datos de ejemplo insertados")
        
        # Confirmar y cerrar
        conn.commit()
        conn.close()
        
        print("� Inicialización de la base de datos completada!")
        print("📍 Ubicación de la base de datos: ../database/enterprise.db")
        
    except Exception as e:
        print(f"❌ Error al inicializar la base de datos: {e}")
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    init_database()
