# Painel do Clima

## Autor
Gabriel Oliveira do Prado — Matrícula 22502696

## Descrição
Aplicação web que mostra o clima atual e a previsão dos próximos 5 dias para qualquer cidade pesquisada. Útil para quem quer consultar o tempo de forma rápida e visual.

## API utilizada
- Open-Meteo — https://open-meteo.com/en/docs (sem chave de API)
- Endpoints consumidos:
  - Geocodificação: `https://geocoding-api.open-meteo.com/v1/search`
  - Previsão do tempo: `https://api.open-meteo.com/v1/forecast`

## Funcionalidades
- Buscar o clima de uma cidade pelo nome
- Ver temperatura atual, sensação térmica, umidade, vento e condição do tempo
- Ver previsão de 5 dias com temperaturas máxima e mínima
- Receber mensagens de erro claras quando a cidade não existe ou a API está fora do ar

## Como executar localmente
1. Clone: `git clone https://github.com/seu-usuario/bootcamp2-app.git`
2. Abra o arquivo `index.html` no navegador

## Links
- **Aplicação no ar (GitHub Pages):** https://Prado1309.github.io/bootcamp2-app/
- **Repositório:** https://github.com/seu-usuario/bootcamp2-app