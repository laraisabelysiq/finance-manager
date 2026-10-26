# 💰 Finance Manager

Aplicação web para gerenciamento de finanças pessoais, desenvolvida com **HTML, CSS, JavaScript, Node.js, Express e MySQL**. O projeto permite organizar receitas, despesas e categorias, acompanhar o saldo mensal e visualizar informações financeiras por meio de um dashboard interativo.

O Finance Manager foi desenvolvido com o objetivo de reunir, em uma única aplicação, conhecimentos de desenvolvimento front-end, construção de APIs REST, integração com banco de dados, autenticação, segurança e manipulação de dados. Além de representar um projeto importante para meu portfólio, também surgiu como uma solução prática para uma necessidade real: organizar e acompanhar minhas próprias finanças no dia a dia.

## ✨ Funcionalidades

### 🔐 Autenticação e usuários
- Cadastro de usuários com validação dos dados.
- Login com e-mail e senha.
- Autenticação baseada em JSON Web Token (JWT).
- Proteção de rotas privadas.
- Criptografia de senhas com hash utilizando bcrypt.
- Consulta dos dados do usuário autenticado.
- Isolamento dos dados financeiros por usuário.

### 💵 Gerenciamento financeiro
- Cadastro, consulta, edição e exclusão de receitas e despesas.
- Associação de transações a categorias.
- Registro de descrição, valor, data e observações.
- Filtros para facilitar a consulta das movimentações.
- Validação de valores e dos dados informados.
- Organização das transações por data.
- Atualização dos dados financeiros de acordo com as movimentações registradas.

### 🗂️ Categorias
- Criação de categorias personalizadas para receitas e despesas.
- Listagem e consulta de categorias.
- Edição e exclusão de categorias.
- Validação dos nomes e tipos de categoria.
- Prevenção de duplicidade de categorias para o mesmo usuário.
- Verificação de vínculos com transações antes de alterações incompatíveis.

### 📊 Dashboard financeiro
- Visualização do total de receitas do mês.
- Visualização do total de despesas do mês.
- Cálculo do saldo mensal.
- Exibição da quantidade de transações.
- Histórico financeiro mensal.
- Consulta das movimentações recentes.
- Consolidação dos dados a partir das informações armazenadas no banco de dados.

### 🛡️ Validação e tratamento de erros
- Validação dos dados recebidos pela API.
- Tratamento centralizado de erros.
- Verificação de autenticação nas rotas protegidas.
- Limitação do tamanho dos dados enviados nas requisições.
- Limitação da frequência de requisições.
- Cabeçalhos HTTP de segurança.
- Consultas parametrizadas para interação com o banco de dados.

## 🖥️ Interface e experiência de uso

Um dos principais diferenciais do Finance Manager é a integração entre uma interface web funcional e um banco de dados relacional.

Durante o desenvolvimento, ferramentas como o Postman foram importantes para testar os endpoints, verificar as respostas da API e identificar problemas na comunicação entre o front-end, o back-end e o banco de dados. Entretanto, em uma aplicação completa, testar somente por requisições HTTP pode tornar a experiência menos intuitiva, especialmente quando se deseja visualizar o resultado final de uma operação.

Com a interface gráfica do Finance Manager, é possível cadastrar informações, consultar transações, administrar categorias e acompanhar os resultados financeiros de maneira mais visual e próxima da utilização cotidiana. Isso permite avaliar não apenas o funcionamento isolado da API, mas também o comportamento da aplicação como um todo.

Essa abordagem tornou o projeto especialmente útil na prática: além de demonstrar conhecimentos técnicos, o sistema pode ser utilizado no acompanhamento das finanças pessoais e evoluir conforme novas necessidades surgirem.

## 🛠️ Tecnologias utilizadas

### Front-end
- **HTML5:** estruturação das páginas.
- **CSS3:** estilização, organização visual e responsividade.
- **JavaScript:** interatividade, validações no cliente e comunicação com a API.
- **Fetch API:** envio de requisições HTTP ao back-end.
- **LocalStorage:** armazenamento local das informações necessárias à sessão da interface.

### Back-end
- **Node.js:** ambiente de execução JavaScript.
- **Express 5:** criação do servidor e das rotas da API REST.
- **MySQL:** armazenamento e gerenciamento dos dados relacionais.
- **mysql2:** conexão e execução de consultas no banco de dados.
- **JWT (jsonwebtoken):** autenticação baseada em tokens.
- **bcrypt:** geração e verificação de hashes de senhas.
- **dotenv:** gerenciamento de variáveis de ambiente.
- **cors:** configuração de acesso entre origens.
- **helmet:** configuração de cabeçalhos HTTP de segurança.
- **express-rate-limit:** limitação de requisições.
- **express-validator:** validação de dados de autenticação.
- **nodemon:** reinicialização automática do servidor durante o desenvolvimento.

### Ferramentas de desenvolvimento
- Visual Studio Code
- Git e GitHub
- Postman
- XAMPP
- phpMyAdmin
- Navegador web com suporte a JavaScript

## 🏗️ Arquitetura do projeto

O sistema utiliza uma arquitetura cliente-servidor. O front-end envia requisições HTTP para a API REST, desenvolvida com Node.js e Express, que valida as operações e acessa o banco de dados MySQL.

Essa separação permite manter a interface, as regras de negócio e a persistência dos dados organizadas em camadas distintas.

```text
Finance Manager
│
├── Front-end
│   ├── HTML
│   ├── CSS
│   └── JavaScript
│       └── Fetch API
│
├── Back-end
│   ├── Node.js
│   ├── Express
│   ├── Routes
│   ├── Controllers
│   ├── Services
│   ├── Middlewares
│   ├── Validators
│   └── Configuração do banco de dados
│
└── MySQL
    ├── Users
    ├── Categories
    └── Transactions
```

## 📁 Estrutura de pastas

```text
finance-manager/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── categories.controller.js
│   │   │   ├── dashboard.controller.js
│   │   │   └── transactions.controller.js
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.js
│   │   │   ├── error.middleware.js
│   │   │   └── validate.middleware.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── categories.routes.js
│   │   │   ├── dashboard.routes.js
│   │   │   └── transactions.routes.js
│   │   ├── services/
│   │   │   └── auth.service.js
│   │   ├── utils/
│   │   ├── validators/
│   │   │   └── auth.validators.js
│   │   ├── app.js
│   │   └── server.js
│   ├── tests/
│   ├── .env.example
│   ├── .gitignore
│   └── package.json
│
├── database/
│   ├── schema.sql
│   └── seeds.sql
│
├── docs/
│   └── api.md
│
├── frontend/
│   ├── assets/
│   ├── css/
│   │   ├── auth.css
│   │   ├── categorias.css
│   │   ├── dashboard.css
│   │   ├── reset.css
│   │   ├── style.css
│   │   └── transacoes.css
│   ├── js/
│   │   ├── api.js
│   │   ├── auth.js
│   │   ├── categorias.js
│   │   ├── config.js
│   │   ├── dashboard.js
│   │   ├── transacoes.js
│   │   └── utils.js
│   ├── pages/
│   │   ├── cadastro.html
│   │   ├── categorias.html
│   │   ├── dashboard.html
│   │   ├── login.html
│   │   └── transacoes.html
│   └── index.html
│
└── README.md
```

## 🗄️ Banco de dados

O projeto utiliza MySQL para armazenar os dados da aplicação. O esquema está disponível em `database/schema.sql`.

As principais tabelas são:

| Tabela | Descrição |
|---|---|
| `users` | Armazena os usuários cadastrados e os hashes de suas senhas. |
| `categories` | Armazena as categorias de receitas e despesas vinculadas aos usuários. |
| `transactions` | Armazena as movimentações financeiras, seus valores, datas e categorias. |

O banco utiliza chaves primárias, chaves estrangeiras, restrições de integridade e índices para organizar os relacionamentos e auxiliar na consulta dos dados. As transações estão vinculadas tanto ao usuário quanto à categoria correspondente, ajudando a preservar a consistência das informações.

## ⚙️ Como executar o projeto

### 1. Pré-requisitos

Antes de iniciar, instale:

- [Node.js](https://nodejs.org/) — versão 20 ou superior.
- [Git](https://git-scm.com/).
- [XAMPP](https://www.apachefriends.org/) ou outra instalação compatível com MySQL/MariaDB.
- [Visual Studio Code](https://code.visualstudio.com/).
- Uma extensão de servidor local para executar o front-end, como o Live Server.

### 2. Clonar o repositório

No terminal, execute:

```bash
git clone https://github.com/laraisabelysiq/finance-manager.git
cd finance-manager
```

### 3. Configurar o banco de dados

1. Abra o XAMPP e inicie o Apache e o MySQL.
2. Acesse o phpMyAdmin pelo endereço `http://localhost/phpmyadmin`.
3. Abra a opção de importação ou utilize a aba SQL.
4. Execute o script `database/schema.sql`, responsável por criar o banco `finance_manager` e suas tabelas.

O projeto utiliza MySQL. Caso sua instalação do XAMPP utilize MariaDB, verifique a compatibilidade com os recursos do esquema e a versão instalada.

### 4. Configurar as variáveis de ambiente

Entre na pasta `backend` e crie uma cópia do arquivo `.env.example`, nomeando-a `.env`.

Configure os valores de acordo com seu ambiente local:

```env
NODE_ENV=development
PORT=3000

FRONTEND_URL=http://localhost:5500

DB_HOST=localhost
DB_PORT=3306
DB_USER=seu_usuario_mysql
DB_PASSWORD=sua_senha_mysql
DB_NAME=finance_manager

JWT_SECRET=gere_uma_chave_aleatoria_segura
JWT_EXPIRES_IN=1h

BCRYPT_SALT_ROUNDS=12
```

Ajuste o usuário, a senha e a porta do banco de acordo com a configuração local do MySQL. O usuário configurado precisa ter as permissões necessárias sobre o banco `finance_manager`.

O valor de `JWT_SECRET` deve ser uma chave aleatória, longa e exclusiva para o ambiente. Nunca publique o arquivo `.env` nem compartilhe senhas ou segredos reais.

**Importante:** o valor de `FRONTEND_URL` deve corresponder à origem utilizada para abrir o front-end. Por exemplo, `http://localhost:5500` e `http://127.0.0.1:5500` são origens diferentes para a configuração de CORS.

### 5. Instalar as dependências

No terminal, dentro da pasta `backend`, execute:

```bash
npm install
```

### 6. Iniciar o back-end

Ainda na pasta `backend`, execute:

```bash
npm run dev
```

O servidor ficará disponível, por padrão, em:

```text
http://localhost:3000
```

Para iniciar sem o Nodemon, utilize:

```bash
npm start
```

### 7. Executar o front-end

Abra a pasta `frontend` no Visual Studio Code e execute o arquivo `index.html` com o Live Server.

O endereço padrão do Live Server costuma ser:

```text
http://localhost:5500
```

Caso o servidor utilize outra porta ou origem, ajuste `FRONTEND_URL` no `.env` do back-end para corresponder ao endereço do front-end e reinicie a API.

Confira também `frontend/js/config.js` para garantir que `API_BASE_URL` aponta para a API local:

```javascript
window.APP_CONFIG = Object.freeze({
    API_BASE_URL: "http://localhost:3000/api",
    TOKEN_KEY: "finance_manager_token",
    USER_KEY: "finance_manager_user",
});
```

### 8. Criar uma conta e começar a utilizar

Com o back-end e o front-end em execução:

1. Acesse a página de cadastro.
2. Crie uma conta.
3. Entre com suas credenciais.
4. Cadastre as categorias necessárias.
5. Registre receitas e despesas.
6. Consulte o dashboard para acompanhar os resultados.

Para verificar o funcionamento da API e a conexão com o banco de dados, também é possível acessar:

```text
GET http://localhost:3000/api/health
GET http://localhost:3000/api/health/db
```

As duas rotas são destinadas à verificação do ambiente e da conectividade.

## 🔌 Principais endpoints da API

A API REST utiliza JSON para receber e retornar dados.

### Autenticação — `/api/auth`

| Método | Endpoint | Descrição | Autenticação |
|---|---|---|---|
| `POST` | `/register` | Cadastra um usuário. | Não |
| `POST` | `/login` | Autentica um usuário. | Não |
| `GET` | `/me` | Consulta o usuário autenticado. | Sim |

### Categorias — `/api/categories`

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/` | Lista as categorias do usuário. |
| `GET` | `/:id` | Consulta uma categoria. |
| `POST` | `/` | Cria uma categoria. |
| `PUT` | `/:id` | Atualiza uma categoria. |
| `DELETE` | `/:id` | Exclui uma categoria. |

### Transações — `/api/transactions`

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/` | Lista e filtra transações. |
| `GET` | `/:id` | Consulta uma transação. |
| `POST` | `/` | Registra uma transação. |
| `PUT` | `/:id` | Atualiza uma transação. |
| `DELETE` | `/:id` | Exclui uma transação. |

### Dashboard — `/api/dashboard`

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/summary` | Retorna o resumo financeiro mensal. |
| `GET` | `/monthly` | Retorna o histórico financeiro mensal. |
| `GET` | `/expenses-by-category` | Agrupa as despesas por categoria. |

As rotas de categorias, transações e dashboard exigem autenticação. Nas requisições protegidas, o token JWT deve ser enviado no cabeçalho `Authorization`:

```http
Authorization: Bearer SEU_TOKEN_JWT
```

Os endpoints de consulta do dashboard aceitam parâmetros para selecionar o mês ou o período histórico, conforme a operação. A listagem de transações também oferece parâmetros de consulta para filtros e limite de resultados.

## 🧪 Testes e validação

Durante o desenvolvimento, o Postman foi utilizado para testar os endpoints, validar os códigos de resposta, conferir o comportamento da autenticação e verificar a integração com o banco de dados.

Além dos testes diretos à API, a interface foi utilizada para validar o fluxo completo de uso, desde o cadastro e o login até o gerenciamento das movimentações e a atualização do dashboard.

Essa combinação permite verificar tanto as respostas técnicas da API quanto a experiência real de utilização da aplicação.

## 🔒 Segurança

O projeto adota medidas de segurança e integridade, incluindo:

- Senhas armazenadas por meio de hash com bcrypt.
- Autenticação JWT para rotas protegidas.
- Separação dos dados de acordo com o usuário autenticado.
- Consultas parametrizadas ao banco de dados.
- Validação dos dados recebidos.
- Restrições e relacionamentos no banco de dados.
- Cabeçalhos HTTP de segurança com Helmet.
- Limitação da frequência de requisições.
- Configuração de CORS para a origem autorizada.
- Variáveis de ambiente para configurações sensíveis.

O projeto foi desenvolvido para execução local e estudo. Antes de disponibilizá-lo publicamente como serviço ou utilizá-lo em produção, é necessário revisar a configuração de segurança, a estratégia de backups, a infraestrutura de hospedagem e o tratamento de dados sensíveis.

## 🎯 Objetivos e aprendizados

O Finance Manager representa uma etapa importante da minha evolução como desenvolvedora, pois reúne diferentes áreas do desenvolvimento web em um único projeto funcional.

Ao longo de sua construção, foram trabalhados conceitos como:

- Desenvolvimento de interfaces com HTML, CSS e JavaScript.
- Integração entre front-end e back-end.
- Criação e organização de uma API REST.
- Programação assíncrona e requisições HTTP.
- Modelagem de banco de dados relacional.
- Operações CRUD e integridade referencial.
- Autenticação e autorização.
- Validação de dados e tratamento de erros.
- Configuração de ambiente e ferramentas de desenvolvimento.
- Testes de endpoints e validação do fluxo completo da aplicação.

Mais do que reunir tecnologias, o projeto proporcionou a experiência de construir uma aplicação com uma finalidade concreta, conectando decisões técnicas a uma necessidade cotidiana.

## 🚀 Possíveis melhorias futuras

O projeto pode continuar evoluindo com funcionalidades como:

- Exportação de relatórios financeiros em CSV ou PDF.
- Definição de metas de economia e limites de gastos.
- Planejamento de despesas recorrentes.
- Comparação entre períodos.
- Testes automatizados para rotas e regras de negócio.
- Melhorias de acessibilidade e experiência em dispositivos móveis.
- Recursos adicionais de backup e recuperação de dados.

## 👩‍💻 Autoria

Desenvolvido por **Lara Isabely Alves Siqueira** como projeto de estudo e portfólio em desenvolvimento web, com aplicação prática no gerenciamento de finanças pessoais.

O Finance Manager é, até o momento, o projeto mais completo do meu portfólio, por integrar interface, API, banco de dados, autenticação, validações e visualização de informações em uma aplicação que também atende a uma necessidade real do dia a dia.

---