# Mapa de Competências

Aplicação Django em desenvolvimento. A página inicial já renderiza o piloto original com CSS, JavaScript e dados separados. A persistência relacional, o importador e os endpoints do plano ainda estão pendentes.

Para iniciar o ambiente de desenvolvimento: `docker compose up --build`.
Endpoint inicial de verificação: http://localhost:8000/health/.

## Docker local

Copie `.env.example` para `.env` e ajuste a senha antes de inicializar o volume pela primeira vez.

```powershell
Copy-Item .env.example .env
docker compose up --build -d
docker compose exec web python manage.py migrate
docker compose logs -f web
```

O serviço `web` aguarda o PostgreSQL ficar saudável. O banco mantém os dados no volume `postgres_data` e não expõe sua porta ao host. Para encerrar preservando os dados, execute `docker compose down`.

O build e a execução dos containers ainda não foram validados nesta sessão. O mapa está disponível em `/` após reconstruir a imagem; `/health/` verifica o serviço.

Validação local isolada: `python manage.py test tests --settings=config.settings.test`. O teste verifica a resposta da página e a inclusão dos assets e dados; não substitui testes de interação no navegador.

Produção exige DJANGO_SECRET_KEY, configuração de hosts, HTTPS e serviço de arquivos estáticos. O Compose atual é destinado a desenvolvimento.

