# EnterprisePro Configuration
DEBUG = True
SECRET_KEY = 'enterprise-pro-secret-key-2024'
DATABASE_URL = 'enterprise.db'

# JWT Configuration
JWT_ALGORITHM = 'HS256'
JWT_ACCESS_TOKEN_EXPIRES = 28800  # 8 hours
JWT_REFRESH_TOKEN_EXPIRES = 604800  # 7 days

# CORS Configuration
CORS_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:5000',
    'http://localhost:5000'
]

# Application Settings
APP_NAME = 'EnterprisePro'
APP_VERSION = '1.0.0'
COMPANY_NAME = 'Your Company Name'

# Database Settings
DB_POOL_SIZE = 10
DB_MAX_OVERFLOW = 20
DB_POOL_TIMEOUT = 30

# Security Settings
PASSWORD_MIN_LENGTH = 6
PASSWORD_REQUIRE_SPECIAL = False
PASSWORD_REQUIRE_NUMBERS = False
PASSWORD_REQUIRE_UPPERCASE = False

# Upload Settings (for future use)
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'doc', 'docx', 'xls', 'xlsx'}

# Email Settings (for future use)
MAIL_SERVER = 'smtp.gmail.com'
MAIL_PORT = 587
MAIL_USE_TLS = True
MAIL_USERNAME = ''
MAIL_PASSWORD = ''
MAIL_DEFAULT_SENDER = ''

# Pagination
DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100

# Cache Settings (for future use)
CACHE_TYPE = 'simple'
CACHE_DEFAULT_TIMEOUT = 300

# Logging
LOG_LEVEL = 'INFO'
LOG_FORMAT = '%(asctime)s [%(levelname)s] %(name)s: %(message)s'
