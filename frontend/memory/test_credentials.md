# Test Credentials — Saúde Fácil Brasil

## Admins (acesso total)

### Admin principal
- Email: `admin@saudefacil.com.br`
- Password: `Admin@2026`
- Role: `ADMIN`

### Admin Fabricio (gestão do banco e usuários)
- Email: `fabricio@brasilsaudefacil.com.br`
- Username (atalho): `fabricio`
- Password: `!#Jinjer0505#!`   ← (J maiúsculo)
- Role: `ADMIN`

## Test patient (criar via /api/auth/register)
- Email: `paciente@teste.com`
- Password: `Teste@123`

## Auth Endpoints
- POST /api/auth/register
- POST /api/auth/login   (aceita "fabricio" como username especial)
- POST /api/auth/google  (MOCKED)
- GET  /api/auth/me      (Bearer token)
- POST /api/auth/logout

## Admin Endpoints (requer Bearer de ADMIN)
- GET    /api/admin/users          — listar usuários, filtra por `?q=`
- POST   /api/admin/users          — criar usuário (qualquer role)
- PATCH  /api/admin/users/{id}     — atualizar nome/role/status
- DELETE /api/admin/users/{id}     — soft delete LGPD (anonimiza)
- POST   /api/providers            — criar profissional
- POST   /api/products             — criar produto da farmácia
- POST   /api/exams                — criar exame
- POST   /api/admin/batch/exams    — importar lote de exames

## Dados pré-carregados
- 3 profissionais: Dr. Guilherme Souza Maia (Cardiologia), Juliana Araújo (Psicologia), Rassinou Dias (Fonoaudiologia)
- 666 exames importados da Tabela CLINICA CORPUS MED DO TRABALHO
- Domínio futuro web: brasilsaudefacil.com.br
