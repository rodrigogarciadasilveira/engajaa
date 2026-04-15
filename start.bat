@echo off
title Engajaa — Start Ambiente

echo.
echo  ╔══════════════════════════════════════╗
echo  ║       Engajaa — Start Ambiente       ║
echo  ╚══════════════════════════════════════╝
echo.

cd /d "%~dp0"

:: Verificar Docker
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Docker Desktop nao esta rodando. Abra o Docker Desktop e tente novamente.
    pause
    exit /b 1
)

echo [1/3] Subindo containers...
docker compose up -d --build
if errorlevel 1 (
    echo [ERRO] Falha ao subir containers.
    pause
    exit /b 1
)

echo.
echo [2/3] Aguardando banco de dados ficar saudavel...
:wait_db
docker compose exec postgres pg_isready -U engajaa -d engajaa_dev >nul 2>&1
if errorlevel 1 (
    timeout /t 2 /nobreak >nul
    goto wait_db
)
echo        Banco OK.

echo.
echo [3/3] Rodando migrations...
docker compose exec api npx prisma migrate deploy
if errorlevel 1 (
    echo [AVISO] Migrations falharam ou ja estao aplicadas.
)

echo.
echo  ┌─────────────────────────────────────────────┐
echo  │  Ambiente Engajaa iniciado com sucesso!     │
echo  │                                             │
echo  │  App    → http://localhost:5175             │
echo  │  API    → http://localhost:3002/health      │
echo  │  MailDev→ http://localhost:1082             │
echo  │  DB     → localhost:5435                    │
echo  └─────────────────────────────────────────────┘
echo.

:: Abrir browser
start http://localhost:5175

echo Pressione qualquer tecla para ver os logs da API (Ctrl+C para sair)...
pause >nul
docker compose logs -f api worker
