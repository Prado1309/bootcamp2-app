// Commit 3 — busca a cidade, busca o clima atual e mostra na página
const URL_GEOCODING = "https://geocoding-api.open-meteo.com/v1/search";
const URL_PREVISAO = "https://api.open-meteo.com/v1/forecast";

const form = document.getElementById("form-busca");
const campo = document.getElementById("campo-busca");
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

async function buscarCidade(nome) {
  const url = `${URL_GEOCODING}?name=${encodeURIComponent(nome)}&count=1&language=pt&format=json`;
  const resposta = await fetch(url);
  const dados = await resposta.json();
  return dados.results[0];
}

async function buscarPrevisao(latitude, longitude) {
  const url = `${URL_PREVISAO}?latitude=${latitude}&longitude=${longitude}` +
    `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=auto`;
  const resposta = await fetch(url);
  return resposta.json();
}

function mostrarClima(cidade, previsao) {
  const atual = previsao.current;
  const [descricao, icone] = descreverClima(atual.weather_code);

  area.innerHTML = `
    <h2>${icone} ${cidade.name}, ${cidade.country}</h2>
    <p>${Math.round(atual.temperature_2m)}°C — ${descricao}</p>
    <p>Umidade: ${atual.relative_humidity_2m}%</p>
    <p>Vento: ${Math.round(atual.wind_speed_10m)} km/h</p>
  `;
}

async function carregarClima(nomeCidade) {
  const cidade = await buscarCidade(nomeCidade);
  const previsao = await buscarPrevisao(cidade.latitude, cidade.longitude);
  mostrarClima(cidade, previsao);
}

form.addEventListener("submit", (evento) => {
  evento.preventDefault();
  const termo = campo.value.trim();
  if (termo) carregarClima(termo);
});