# Saúde Fácil Brasil — Mobile App

## Visão
Marketplace mobile (Expo + React Native) para conectar pacientes a profissionais, clínicas, farmácias e laboratórios brasileiros.

## Stack
- Frontend: Expo SDK 54, React Native, Expo Router (file-based)
- Backend: FastAPI + Motor (MongoDB)
- Auth: JWT (Bearer) com bcrypt + Google login MOCKED
- Pagamento: MOCKED (Pix/Cartão/Boleto) — ready para Stripe

## Telas implementadas
1. Splash (logo gradiente azul/verde)
2. Login (e-mail + senha + botões Google/Facebook MOCKED)
3. Cadastro (nome, e-mail, senha, termos)
4. Home (saudação, busca, categorias, banner, mais procurados)
5. Profissionais (lista + filtros por tipo + busca)
6. Agendar Consulta (médico, calendário 7 dias, slots 30 min, modalidade)
7. Farmácia (catálogo grid, busca, adicionar)
8. Exames (lista, busca, adicionar)
9. Carrinho (itens, qty, subtotal, taxa, total)
10. Pagamento (Pix/Cartão/Boleto + resumo)
11. Tabs: Início, Agendamentos, Pedidos, Perfil

## Backend endpoints (/api)
- /auth/{register,login,google,me,logout}
- /providers (GET, POST admin), /providers/{id}, /providers/{id}/slots, /providers/{id}/reviews
- /appointments (GET, POST)
- /products (GET, POST admin)
- /exams (GET, POST admin)
- /orders (GET, POST), /orders/{id}, /orders/{id}/pay
- /reviews (POST)
- /notifications (GET)

## Regras de negócio implementadas
- TimeSlot virtual (08–18h, 30 min) sem overlap por provider
- Pedido só vira PAID após pay endpoint
- Comissões: Lab 40%, Pharm 8%, Consult 10% (registradas no item)
- Soft fields para LGPD (status: ACTIVE/BLOCKED/DELETED)
- Audit log na criação de usuários
- Notificações em pagamento confirmado

## MOCKED (substituir em produção)
- Google login (recebe email/full_name do frontend, sem verificar ID token)
- Pagamento (cria Payment "PAID" sem gateway real)
- Reset de senha não implementado nesta versão MVP

## Auto-seed
- Admin (definido em .env)
- Sem dados de demonstração (escolha do usuário)

## Como testar
1. Abrir app → splash → login
2. Cadastrar paciente
3. Logar como admin (admin@saudefacil.com.br / Admin@2026) e criar profissionais/produtos/exames via POST endpoints
4. Voltar como paciente para agendar/comprar
