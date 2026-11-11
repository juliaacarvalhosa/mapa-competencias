FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
COPY pyproject.toml .
RUN python -c "import tomllib, subprocess; subprocess.check_call(['pip', 'install', '--no-cache-dir', *tomllib.load(open('pyproject.toml', 'rb'))['project']['dependencies']])"
COPY . .
RUN useradd --create-home appuser
USER appuser
EXPOSE 8000
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]

