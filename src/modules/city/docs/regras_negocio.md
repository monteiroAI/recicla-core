As verticais abrigam regras de negócio específicas e operam com base em 3 "entidades"  a mobile, o backend e o frontent.
A camada mobile tem como base o backend comum a todas as verticais mas com um frontend específico, com telas dedicada a coleta de evidências que caracterizam a Vertical
A camada backend-core bebe na fonte de recycle 
    compartilha o uso do postGreSQL,    
    das API's ficais quando se aplicam, 
    da API de conexão mobile e 
    backend-core e da 
    blockchain
A camada frontend também faz uso do engine do dashboard: design único, com KPI's específicos de cada vertical;
Esses dashboards irão variar quanto a estilo e conteúdo de gráficos, mas sempre receberão dados obtidos do banco de dados único recycle-db (recicla-db)

Contudo, ao verificar a estrutura e regras de negócio da vertical City vemos que:
a) o Dashboard é municipal
b) o fluxo mrv (medição, registro e verificação) se aplica à coleta publica, geralmente operada por uma empresa privada, concessionária do serviço via licitação - a Dealership
c) os dados que fluem no mrv desembocam em um ou mais Consolidator  (1 galpão da Dealership + 1 Cooperative Keepers por exemplo) 
d) Então o Dashboard Dealership poderá ser específico de cada Dealership ou Cooperative e o Dashboard City representará OVERAL CONSOLIDATORS. 
e) e a Dealership deverá ter um Dashboard com KPI's sobre média de coleta por rota, tonelagem por caminhão, Tonelagem total do dia, do mês, do ano, por tipo de resíduo Classe II - recyclable or organics. As entregas devem indicar o Local recebedor e as pesagens registadas...(algo que pertence ao Mobile ou IoT) 

Consequencias: 

1) Dealership pode ou não ter um galpão próprio e a cidade pode ou não ter Cooperatives em atividade
2) Se tiver, o fluxo pode ser medido, registrado e verificado, contabilizando as toneladas de matéria-secunda retornada para a indústria, renda e emprego gerados e a evitação de emissões de CO2 equivalente. 
3) Se não tiver, o fluxo para Aterro Sanitário deve também ser medido, registrado e verificado, contabilizando as perdas em renda potencial não gerada no municipio e danos ambientais pela emissão de metano, além das perdas em créditos ambientais não realizadas;



