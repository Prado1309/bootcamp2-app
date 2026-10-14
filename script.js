// Commit 4 — adiciona "Carregando...", tratamento de erros e proteção do texto vindo da API
const URL_GEOCODING = "https://geocoding-api.open-meteo.com/v1/search";
const URL_PREVISAO = "https://api.open-meteo.com/v1/forecast";

const form = document.getElementById("form-busca");
const campo = document.getElementById("campo-busca");
const botao = document.getElementById("botao-buscar");
const area = document.getElementById("resultado");

// Códigos de clima da Open-Meteo (WMO) -> descrição e ícone
const CLIMA = {
  0: ["Céu limpo", "☀️"],
  1: ["Quase sem nuvens", "🌤️"],
  2: ["Parcialmente nublado", "⛅"],
  3: ["Nublado", "☁️"],
  45: ["Neblina", "🌫️"],
  48: ["Neblina com geada", "🌫️"],
  51: ["Garoa fraca", "🌦️"],
  53: ["Garoa", "🌦️"],
  55: ["Garoa forte", "🌦️"],
  56: ["Garoa congelante", "🌦️"],
  57: ["Garoa congelante forte", "🌦️"],
  61: ["Chuva fraca", "🌧️"],
  63: ["Chuva", "🌧️"],
  65: ["Chuva forte", "🌧️"],
  66: ["Chuva congelante", "🌧️"],
  67: ["Chuva congelante forte", "🌧️"],
  71: ["Neve fraca", "🌨️"],
  73: ["Neve", "🌨️"],
  75: ["Neve forte", "🌨️"],
  77: ["Grãos de neve", "🌨️"],
  80: ["Pancadas de chuva fracas", "🌦️"],
  81: ["Pancadas de chuva", "🌧️"],
  82: ["Pancadas de chuva fortes", "🌧️"],
  85: ["Pancadas de neve", "🌨️"],
  86: ["Pancadas de neve fortes", "🌨️"],
  95: ["Tempestade", "⛈️"],
  96: ["Tempestade com granizo", "⛈️"],
  99: ["Tempestade com granizo forte", "⛈️"],
};

function descreverClima(codigo) {
  return CLIMA[codigo] || ["Condição desconhecida", "🌡️"];
}

// Evita que texto vindo da API seja interpretado como HTML
function escapar(texto) {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}

async function buscarCidade(nome) {
  const url = `${URL_GEOCODING}?name=${encodeURIComponent(nome)}&count=1&language=pt&format=json`;
  const resposta = await fetch(url);
  if (!resposta.ok) throw new Error("API_FORA");
  const dados = await resposta.json();
  if (!dados.results || dados.results.length === 0) throw new Error("CIDADE_NAO_ENCONTRADA");
  return dados.results[0];
}

async function buscarPrevisao(latitude, longitude) {
  const url = `${URL_PREVISAO}?latitude=${latitude}&longitude=${longitude}` +
    `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=auto`;
  const resposta = await fetch(url);
  if (!resposta.ok) throw new Error("API_FORA");
  return resposta.json();
}

function mostrarClima(cidade, previsao) {
  const atual = previsao.current;
  const [descricao, icone] = descreverClima(atual.weather_code);

  area.innerHTML = `
    <h2>${icone} ${escapar(cidade.name)}, ${escapar(cidade.country || "")}</h2>
    <p>${Math.round(atual.temperature_2m)}°C — ${escapar(descricao)}</p>
    <p>Umidade: ${atual.relative_humidity_2m}%</p>
    <p>Vento: ${Math.round(atual.wind_speed_10m)} km/h</p>
  `;
}

function mostrarErro(erro) {
  let mensagem = "Não foi possível carregar o clima agora. Verifique sua conexão e tente de novo.";
  if (erro.message === "CIDADE_NAO_ENCONTRADA") {
    mensagem = "Não encontramos essa cidade. Confira o nome e tente outra busca.";
  } else if (erro.message === "API_FORA") {
    mensagem = "O serviço de clima está indisponível no momento. Tente novamente em instantes.";
  }
  area.innerHTML = `<p class="erro">${mensagem}</p>`;
}

async function carregarClima(nomeCidade) {
  area.innerHTML = '<p class="aviso">Carregando...</p>';
  botao.disabled = true;
  try {
    const cidade = await buscarCidade(nomeCidade);
    const previsao = await buscarPrevisao(cidade.latitude, cidade.longitude);
    mostrarClima(cidade, previsao);
  } catch (erro) {
    mostrarErro(erro);
  } finally {
    botao.disabled = false;
  }
}

form.addEventListener("submit", (evento) => {
  evento.preventDefault();
  const termo = campo.value.trim();
  if (termo) carregarClima(termo);
});