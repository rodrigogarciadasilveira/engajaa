@echo off
chcp 65001 >nul
title Engajaa — Git Push

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║         Engajaa — Commit e Push          ║
echo  ╚══════════════════════════════════════════╝
echo.

:: Entrar na pasta do projeto
cd /d "%~dp0"

:: ── 1. Inicializar repositório se ainda não existir ─────────────────────────
if not exist ".git" (
    echo [SETUP] Repositório Git não encontrado. Inicializando...
    git init
    git branch -M main
    git remote add origin https://github.com/rodrigogarciadasilveira/engajaa.git
    echo [SETUP] Repositório inicializado e remote configurado.
    echo.
) else (
    :: Garantir que o remote está correto
    git remote get-url origin >nul 2>&1
    if errorlevel 1 (
        echo [SETUP] Adicionando remote origin...
        git remote add origin https://github.com/rodrigogarciadasilveira/engajaa.git
    )
)

:: ── 2. Verificar se há alterações ───────────────────────────────────────────
git status --porcelain > "%TEMP%\git_status.tmp" 2>&1
for %%A in ("%TEMP%\git_status.tmp") do set STATUS_SIZE=%%~zA

if %STATUS_SIZE% equ 0 (
    echo [INFO] Nenhuma alteração detectada. Nada para commitar.
    echo.
    git log --oneline -5 2>nul && echo.
    echo Pressione qualquer tecla para fechar...
    pause >nul
    exit /b 0
)

:: ── 3. Mostrar o que vai ser commitado ──────────────────────────────────────
echo [INFO] Alterações detectadas:
echo.
git status --short
echo.

:: ── 4. Pedir mensagem de commit ─────────────────────────────────────────────
set /p MSG="Digite a mensagem do commit (ou pressione Enter para mensagem automática): "

if "%MSG%"=="" (
    :: Mensagem automática com data/hora
    for /f "tokens=1-3 delims=/ " %%a in ("%DATE%") do set DATA=%%a-%%b-%%c
    for /f "tokens=1-2 delims=: " %%a in ("%TIME%") do set HORA=%%a%%b
    set MSG=chore: atualização %DATA% %HORA%
)

echo.
echo [GIT] Mensagem: %MSG%
echo.

:: ── 5. Stage de todos os arquivos ───────────────────────────────────────────
echo [GIT] Adicionando arquivos...
git add .

:: ── 6. Commit ────────────────────────────────────────────────────────────────
echo [GIT] Criando commit...
git commit -m "%MSG%"
if errorlevel 1 (
    echo [ERRO] Falha ao criar commit.
    pause
    exit /b 1
)

:: ── 7. Push ──────────────────────────────────────────────────────────────────
echo.
echo [GIT] Enviando para GitHub...
git push -u origin main 2>&1
if errorlevel 1 (
    echo.
    echo [AVISO] Push falhou. Possíveis causas:
    echo   - Repositório remoto tem commits que você não tem localmente
    echo   - Verifique se está autenticado no GitHub
    echo.
    echo Tentando pull antes de push...
    git pull --rebase origin main
    git push -u origin main
    if errorlevel 1 (
        echo [ERRO] Não foi possível fazer push. Verifique sua autenticação no GitHub.
        pause
        exit /b 1
    )
)

:: ── 8. Resumo ────────────────────────────────────────────────────────────────
echo.
echo  ┌─────────────────────────────────────────────────────┐
echo  │  Push realizado com sucesso!                        │
echo  │                                                     │
echo  │  Repositório: github.com/rodrigogarciadasilveira/  │
echo  │               engajaa                              │
echo  └─────────────────────────────────────────────────────┘
echo.
echo [INFO] Últimos 5 commits:
git log --oneline -5
echo.
echo Pressione qualquer tecla para fechar...
pause >nul
