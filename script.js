// Painel do clima — consome a Open-Meteo (sem chave de API)
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

function arredondar(valor) {
  return Math.round(valor);
}

// 1) Converte o nome da cidade em coordenadas
async function buscarCidade(nome) {
  const url = `${URL_GEOCODING}?name=${encodeURIComponent(nome)}&count=1&language=pt&format=json`;
  const resposta = await fetch(url);
  if (!resposta.ok) throw new Error("API_FORA");
  const dados = await resposta.json();
  if (!dados.results || dados.results.length === 0) throw new Error("CIDADE_NAO_ENCONTRADA");
  return dados.results[0];
}

// 2) Busca o clima atual e a previsão dos próximos dias
async function buscarPrevisao(latitude, longitude) {
  const params = new URLSearchParams({
    latitude,
    longitude,
    current: "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code",
    daily: "weather_code,temperature_2m_max,temperature_2m_min",
    timezone: "auto",
    forecast_days: 5,
  });
  const resposta = await fetch(`${URL_PREVISAO}?${params}`);
  if (!resposta.ok) throw new Error("API_FORA");
  return resposta.json();
}

function mostrarClima(cidade, previsao) {
  const atual = previsao.current;
  const [descricao, icone] = descreverClima(atual.weather_code);
  const local = [cidade.admin1, cidade.country].filter(Boolean).join(", ");

  const dias = previsao.daily.time.map((data, i) => {
    const [desc, ico] = descreverClima(previsao.daily.weather_code[i]);
    const nome = new Date(`${data}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "short" });
    return `
      <li class="dia">
        <div class="nome">${i === 0 ? "hoje" : nome}</div>
        <div class="icone" role="img" aria-label="${escapar(desc)}">${ico}</div>
        <div class="minmax">
          <strong>${arredondar(previsao.daily.temperature_2m_max[i])}°</strong>
          <span class="min">${arredondar(previsao.daily.temperature_2m_min[i])}°</span>
        </div>
      </li>`;
  }).join("");

  area.innerHTML = `
    <article class="agora">
      <div class="icone" role="img" aria-label="${escapar(descricao)}">${icone}</div>
      <div>
        <h2>${escapar(cidade.name)}</h2>
        <p class="local">${escapar(local)}</p>
        <div class="temp">${arredondar(atual.temperature_2m)}°C</div>
        <div class="descricao">${escapar(descricao)}</div>
      </div>
      <ul class="detalhes">
        <li><span>Sensação</span> ${arredondar(atual.apparent_temperature)}°C</li>
        <li><span>Umidade</span> ${atual.relative_humidity_2m}%</li>
        <li><span>Vento</span> ${arredondar(atual.wind_speed_10m)} km/h</li>
      </ul>
    </article>
    <h3 class="previsao-titulo">Próximos 5 dias</h3>
    <ul class="previsao">${dias}</ul>
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