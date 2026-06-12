### 🏢 ITEM 02: Adaptação das Rotas do Servidor (`server.ts`) para o Fluxo B2B
* **Data de Geração:** 12/06/2026 (13:14h)
* **Status:** 🟢 100% CONCLUÍDO (Fase C: Queries Regionalizadas)
* **Resultado:** server.ts unificado e blindado contra erros de colisão de chaves do Postgres. Pronto para alimentar a esteira do gêmeo digital regional (Santo André & Mauá) até a geração completa de métricas nos Dashboards.


roteiro para gerar dados para simulação de integração Mobile+Recicla_core  para a vertical CORP




No momento temos para a vertical CORP as regras de negócio (recicla.core) e a correspondente MOBILE que no seu mobile/core já tem as soluções de camera, localization, network, services e types.



O que seria ideal: 



para a vertical CORP, tudo se inicia na S.O. (serviceOrder) 

Dela nasce a Missão que pode ter 1  ou várias Viagens

Uma missão iniciada dispara a rotina de coleta de evidências até a sua conclusão. E o sistema já sabe com empacotar essas evidências (com o rótulo da O.S.) e com elas carregar o backend, culiminando na sua permanência no postGreSQL. 



Então, para SIMULATION, podemos seguir esse caminho: 

Criamos 1 Operator (vamos chama-lo COLTRADES)

Esse Operador tem 3 clientes 

Cliente 1 - Industria Metalurgica - Metalfino - gera resíduos Classe I

Cliente 2 - Supermercado Gigafruta - gera resíduos Classe II - recicláveis (papel/papelão, garrafas pet, latas de aluminio, plasticos laminados..,) e resíduos orgânicos (frutas, folhas, restos de alimentos de lanchonete,..) 

Cliente 3 - Industria manufatura - Armaco - gera resíduos classe II - recicláveis - aparas de metal, embalagens de papel, papelão e plásticos, 


A COLTRADES faz a coleta na Metalfino e transporta para a PASSIVA, empresa que faz o tratamento do resíduo perigoso e depois o destina para depósitos autorizados. 


O supermercado Gigafruta com a COLTRADES que estabelece 2 coletas por semana sendo 1 para resíduos secos e 1 para resíduos orgânicos.  Esses resíduos são transportados pela COLTRADES para uma Cooperativa de Catadores e um Páteo de Compostagem. 


E a Armaco tem um contrato com 1 coleta semanal e também destina seus rsíduos para a Cooperativa de Catadores. 

Para a simulação, a Coltrades fará a emissão de S.O. (servicesOrders) para cada missão, gerando assim as evidências que serão coletadas pelo Mobile e ao final de cada missão, serão transferidas para o backbone para garantir permanência dos dados. 

A simulação cobrirá o período de 30 dias, com dados alimentando de modo dinâmico os dashboards de cada empresa geradora (Metalfino, Gigafrutas e Armaco)

Esses dados irão também alimentar o dashboard da COLTRADE com vistas por cliente e consolidado




