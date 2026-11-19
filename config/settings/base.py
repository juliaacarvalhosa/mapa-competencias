import os
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse
BASE_DIR = Path(__file__).resolve().parents[2]
SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "local-development-only")
MAP_EDIT_PASSWORD = os.environ.get("MAP_EDIT_PASSWORD", "mapa2026")
DEBUG = False
ALLOWED_HOSTS = os.environ.get("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1,.vercel.app").split(",")
INSTALLED_APPS = ["django.contrib.contenttypes", "django.contrib.staticfiles", "mapa"]
MIDDLEWARE = ["django.middleware.security.SecurityMiddleware", "django.middleware.common.CommonMiddleware", "django.middleware.csrf.CsrfViewMiddleware", "django.middleware.clickjacking.XFrameOptionsMiddleware"]
ROOT_URLCONF = "config.urls"
TEMPLATES = [{"BACKEND": "django.template.backends.django.DjangoTemplates", "DIRS": [], "APP_DIRS": True, "OPTIONS": {"context_processors": ["django.template.context_processors.request"]}}]
WSGI_APPLICATION = "config.wsgi.application"
database_url = os.environ.get("DATABASE_URL")
if database_url:
    parsed_database_url = urlparse(database_url)
    database_query = parse_qs(parsed_database_url.query)
    DATABASES = {"default": {"ENGINE": "django.db.backends.postgresql", "NAME": parsed_database_url.path.lstrip("/"), "USER": unquote(parsed_database_url.username or ""), "PASSWORD": unquote(parsed_database_url.password or ""), "HOST": parsed_database_url.hostname, "PORT": str(parsed_database_url.port or 5432), "OPTIONS": {"sslmode": database_query.get("sslmode", ["require"])[0]}}}
else:
    DATABASES = {"default": {"ENGINE": "django.db.backends.postgresql", "NAME": os.environ.get("POSTGRES_DB", "mapa"), "USER": os.environ.get("POSTGRES_USER", "mapa"), "PASSWORD": os.environ.get("POSTGRES_PASSWORD", ""), "HOST": os.environ.get("POSTGRES_HOST", "db"), "PORT": "5432"}}
LANGUAGE_CODE = "pt-br"
TIME_ZONE = "America/Sao_Paulo"
USE_TZ = True
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

