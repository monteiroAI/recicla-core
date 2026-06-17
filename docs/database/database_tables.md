2. MODELAGEM COMPLETA DO BANCO DE DADOS (16 TABELAS DO CORE + mrvCORP)

Esta é a blueprint exata das 16 tabelas ativas no PostgreSQL, com todas as suas chaves primárias (PK), chaves estrangeiras (FK), índices de performance (INDEX) e restrições de unicidade (UNIQUE).

👤 DOMÍNIO I: PERFIS, ATORES E IDENTIDADE (CORE ID)



1. users

Objetivo: Cadastro mestre de todos os usuários humanos do ecossistema.

Campos e Tipos:

id: UUID PRIMARY KEY DEFAULT gen_random_uuid()

name: VARCHAR(255) NOT NULL

email: VARCHAR(255) UNIQUE NOT NULL

password_hash: VARCHAR(255) NOT NULL

bairro: VARCHAR(100) NOT NULL — Elemento mestre para o Geo-Acoplamento

municipio: VARCHAR(100) NOT NULL — Filtro federado regional para o PMGIRS

created_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW()

updated_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW()



2. roles

Objetivo: Tabela de perfis para o controle baseado em funções (RBAC).

Campos e Tipos:

id: UUID PRIMARY KEY DEFAULT gen_random_uuid()

name: VARCHAR(50) UNIQUE NOT NULL — Valores fixos: 'admin', 'driver', 'auditor', 'operator', 'corporate_client', 'keeper'

description: TEXT



3. user_roles

Objetivo: Tabela associativa Muchos-a-Muchos que elimina o acoplamento direto entre usuários e acessos.

Campos e Tipos:

user_id: UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE

role_id: UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE

Constraints: PRIMARY KEY (user_id, role_id)

🏢 DOMÍNIO II: ENTIDADES OPERACIONAIS E MATÉRIA-SECUNDA (CORE LOGISTICS)



4. entities

Objetivo: Cadastro corporativo de CNPJs envolvidos (Geradores Corporativos mrvCORP, Cooperativas, Pontos de Triagem e Destinações Finais).

Campos e Tipos:



id: UUID PRIMARY KEY DEFAULT gen_random_uuid()

cnpj: VARCHAR(14) UNIQUE NOT NULL

corporate_name: VARCHAR(255) NOT NULL

trade_name: VARCHAR(255)

type: VARCHAR(50) NOT NULL — Valores: 'generator', 'cooperative', 'destination'

address_street: VARCHAR(255)

address_number: VARCHAR(20)

latitude: NUMERIC(10,8)

longitude: NUMERIC(11,8)



5. materials

Objetivo: Catálogo paramétrico de resíduos triados elegíveis para crédito ambiental.

Campos e Tipos:

id: UUID PRIMARY KEY DEFAULT gen_random_uuid()

code: VARCHAR(50) UNIQUE NOT NULL — Exemplo: 'PET_01', 'ALUM_GP', 'ORGANIC_01'

name: VARCHAR(100) NOT NULL

category: VARCHAR(50) NOT NULL — Valores: 'plastic', 'metal', 'paper', 'glass', 'organic'

unit_of_measure: VARCHAR(10) DEFAULT 'KG'



6. products

Objetivo: Produtos manufaturados ou fardos industriais gerados após a reciclagem ou refino da Matéria-Secunda.

Campos e Tipos:

id: UUID PRIMARY KEY DEFAULT gen_random_uuid()

material_id: UUID NOT NULL REFERENCES materials(id)

name: VARCHAR(150) NOT NULL

sku: VARCHAR(100) UNIQUE NOT NULL

stock_quantity: NUMERIC(12,3) DEFAULT 0.000

📜 DOMÍNIO III: CAPTURA DOCUMENTAL E EVIDÊNCIAS DE ENTRADA (mrvCORP B2B)



7. corporate_service_orders

Objetivo: Registro de Ordens de Serviço (OS) corporativas que iniciam a demanda física de coleta.

Campos e Tipos:

id: UUID PRIMARY KEY DEFAULT gen_random_uuid()

generator_id: UUID NOT NULL REFERENCES entities(id)

order_number: VARCHAR(100) UNIQUE NOT NULL

scheduled_date: TIMESTAMP NOT NULL

status: VARCHAR(50) DEFAULT 'pending' — Valores: 'pending', 'in_transit', 'completed', 'cancelled'



8. corporate_fiscal_documents

Objetivo: Repositório de metadados de Notas Fiscais (NF-e) e Manifestos de Transporte Eletrônicos (MTR-e) do governo.

Campos e Tipos:



id: UUID PRIMARY KEY DEFAULT gen_random_uuid()

service_order_id: UUID NOT NULL REFERENCES corporate_service_orders(id)

document_type: VARCHAR(20) NOT NULL — Valores: 'NFE', 'MTRE'

access_key: VARCHAR(44) UNIQUE NOT NULL — Chave do governo de 44 dígitos numéricos

declared_weight: NUMERIC(12,3) NOT NULL — Peso oficial em quilos registrado na nota



9. corporate_entity_integrations

Objetivo: Configurações de conexão, chaves de API e webhooks para integração com ERPs externos de clientes B2B.

Campos e Tipos:

id: UUID PRIMARY KEY DEFAULT gen_random_uuid()

entity_id: UUID NOT NULL REFERENCES entities(id)

api_key_hash: VARCHAR(255) NOT NULL

endpoint_url: VARCHAR(255)

is_active: BOOLEAN DEFAULT TRUE

🚀 DOMÍNIO IV: EXECUÇÃO EM TEMPO REAL E TELEMETRIA DE CAMPO (CORE RUNTIME)



10. corporate_missions

Objetivo: O coração do backend. É a tabela mestre onde o motor atualiza e expõe o status da transação.

Campos e Tipos:

id: UUID PRIMARY KEY DEFAULT gen_random_uuid()

service_order_id: UUID NOT NULL REFERENCES corporate_service_orders(id)

current_compliance_status: VARCHAR(30) NOT NULL DEFAULT 'Em Verificação' — Valores: 'Atendido', 'Em Verificação', 'Suspeito', 'Rejeitado'

created_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW()

updated_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW()



11. corporate_mission_trips

Objetivo: Armazenar os pacotes de telemetria contínua enviados em tempo real pelo aplicativo MOBILE.

Campos e Tipos:

id: UUID PRIMARY KEY DEFAULT gen_random_uuid()

mission_id: UUID NOT NULL REFERENCES corporate_missions(id) ON DELETE CASCADE

latitude: NUMERIC(10,8) NOT NULL

longitude: NUMERIC(11,8) NOT NULL

speed: NUMERIC(5,2)

recorded_at: TIMESTAMP WITH TIME ZONE NOT NULL

Índice de Performance: CREATE INDEX idx_trips_mission ON corporate_mission_trips(mission_id);



12. corporate_mission_evidence

Objetivo: Cartucho de provas coletadas pelo MOBILE (Fotos de balanças, assinaturas e payloads).

Campos e Tipos:

id: UUID PRIMARY KEY DEFAULT gen_random_uuid()

mission_id: UUID NOT NULL REFERENCES corporate_missions(id) ON DELETE CASCADE

evidence_type: VARCHAR(50) NOT NULL — Valores: 'scale_photo', 'signature', 'raw_payload'

file_hash: VARCHAR(64) NOT NULL — Hash SHA-256 gerado do binário para impedir adulteração retroativa

meta_data: JSONB — Guarda o payload bruto do GPS e dados EXIF da imagem (Câmera, precisão, data e hora da captura física)

🪙 DOMÍNIO V: CRÉDITOS CLIMÁTICOS, MICROPAGAMENTOS E AUDITORIA FORENSE (PMGIRS)



13. distribution_matrices

Objetivo: Armazenar os coeficientes das matrizes de distribuição de lote. É aqui que roda o cruzamento matemático do Lote Macro versus o Delta Fracionado de balança (operações 3 e 8) que dispara os micropagamentos para os catadores.

Campos e Tipos:

id: UUID PRIMARY KEY DEFAULT gen_random_uuid()

operation_code: VARCHAR(100) NOT NULL — Código identificador da pesagem

recipient_type: VARCHAR(50) NOT NULL — Tipo de recebedor na base da cadeia

fractional_delta: NUMERIC(12,3) NOT NULL — O resíduo matemático calculado da pesagem

payout_rate: NUMERIC(10,2) NOT NULL — O valor financeiro por unidade

Constraints e Índices:

UNIQUE (operation_code, recipient_type) — Restrição de unicidade para evitar duplicidade de pagamento

CREATE INDEX idx_matrix_operation ON distribution_matrices(operation_code);



14. material_co2_factors

Objetivo: O cérebro científico climático do mrvCORP. Converte o peso de Matéria-Secunda coletada em Toneladas de Carbono Evitado.

Campos e Tipos:

id: UUID PRIMARY KEY DEFAULT gen_random_uuid()

material_id: UUID NOT NULL REFERENCES materials(id)

factor: NUMERIC(8,4) NOT NULL — Multiplicador de pegada de carbono (kg resíduo -> CO2e)

source_protocol: VARCHAR(100) DEFAULT 'GHG Protocol 2026'



15. national_gravimetries

Objetivo: Dados base de gravimetria oficial para validação e auditoria dos planos municipais de gestão integrada (PMGIRS).

Campos e Tipos:

id: UUID PRIMARY KEY DEFAULT gen_random_uuid()

region: VARCHAR(50) NOT NULL

material_category: VARCHAR(50) NOT NULL

percentage: NUMERIC(5,2) NOT NULL



16. auditor_activity_logs

Objetivo: A "Caixa Preta" imutável do sistema. Registra qualquer alteração humana, bypass de regras ou reclassificação de status feita por administradores.

Campos e Tipos:

id: BIGSERIAL PRIMARY KEY

user_id: UUID REFERENCES users(id)

action: VARCHAR(100) NOT NULL

target_table: VARCHAR(50) NOT NULL

previous_state: JSONB — Snapshot completo da linha antes da alteração

new_state: JSONB — Snapshot completo da linha depois da alteração

ip_address: VARCHAR(45)

created_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW()



📱 3. MECANISMO DE INTEGRAÇÃO DO APP "MOBILE" (ACOPLAMENTO SEGURO)

Para que o desenvolvimento do MOBILE continue fluindo de forma isolada e perfeita, o backend do recicla expõe e consome contratos estruturados em JSON que conversam diretamente com as tabelas acima:

Handshake e Autenticação (/api/v1/auth/login): O aplicativo móvel envia as credenciais. O backend busca na tabela users, valida o password_hash, busca na user_roles e retorna o token JWT injetando as regras de permissão baseadas na função (roles). Ele também captura as strings de bairro e municipio para amarrar o escopo regional do dispositivo.



Streaming de Trajetória (/api/v1/missions/:id/trips): 

Enquanto o veículo se desloca no mundo real, o MOBILE envia arrays contínuos de coordenadas. O backend insere esses dados em lote (bulk insert) diretamente na tabela corporate_mission_trips. O motor de compliance calcula a distância geométrica em segundos contra as coordenadas físicas da entidade geradora (entities.latitude / longitude).



Injeção Forense de Balança (/api/v1/missions/:id/evidence): 

No momento da pesagem física de campo (como os dados rastreados de operações de balança 3 e 8), o MOBILE dispara o upload da foto. O backend do recicla lê o arquivo, gera o hash SHA-256 e o persiste na tabela corporate_mission_evidence. Em seguida, aciona o gatilho matemático na tabela distribution_matrices para processar o fracionamento do lote macro e liberar os dados para o dashboard regional de micropagamentos.

#=============================================================================================

Sobre a sua estratégia de documentação: Sim, eu recomendo fortemente. Manter o arquivo .sql puro guardado dentro do próprio repositório (com versão em texto estruturado) é uma das melhores práticas de engenharia de software (Infrastructure as Code). Se o banco sumir novamente por qualquer ciclo de vida do Docker, você não gasta nem 2 segundos para reconstruí-lo.

📂 A Melhor Pasta para Esse Fim
O melhor lugar para guardar esse arquivo de inicialização é criar uma pasta chamada database na raiz do projeto (no mesmo nível de onde fica a pasta docs).

A estrutura ideal de diretórios do seu workspace (recicla-core) deve ficar assim:

Plaintext
recicla/
├── database/
│   └── init.sql          <-- O script mestre que acabamos de rodar (em texto puro)
├── docs/
│   └── database_tables.md <-- A blueprint explicativa (Regras de negócio, domínios e JSONs)
├── docker-compose.yml
├── dockerfile
└── package.json
🧠 Por que essa abordagem é a ideal?
Separação de Conceitos: A pasta docs/ continua pura, guardando apenas explicações conceituais em Markdown (.md) para humanos lerem. A pasta database/ guarda o código relacional bruto (.sql) que as ferramentas interpretam.

Automação Pronta para a AWS (Futuro): Quando você mover esse ecossistema para a nuvem ou quiser que o contêiner Docker local crie as tabelas automaticamente do zero sempre que for iniciado, basta espelhar esse arquivo dentro do docker-compose.yml na seção do Postgres, apontando para a pasta nativa dele:

YAML
volumes:
  - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
Qualquer script .sql colocado nessa pasta /docker-entrypoint-initdb.d/ interna do contêiner é executado de forma automatizada na primeira inicialização do banco.