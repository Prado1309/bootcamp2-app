// Painel do clima — Open-Meteo (clima) + Supabase (favoritos)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://fabisardtivzeopwslgj.supabase.co";
const SUPABASE_KEY = "sb_publishable_BQwJimzNpNegFzRbB7nOwA_3BhbevIh";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const URL_GEOCODING = "https://geocoding-api.open-meteo.com/v1/search";
const URL_PREVISAO = "https://api.open-meteo.com/v1/forecast";

const form = document.getElementById("form-busca");
const campo = document.getElementById("campo-busca");
const botao = document.getElementById("botao-buscar");
const area = document.getElementById("resultado");
const listaFavoritos = document.getElementById("lista-favoritos");
let favoritos = []; // cópia local da lista que veio do banco

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
        <button id="botao-favoritar" type="button" class="botao-favoritar">☆ Favoritar</button>
        <p id="msg-favorito" class="msg-fav" role="status"></p>
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

  // CREATE: clicar em "Favoritar" salva esta cidade no banco
  document.getElementById("botao-favoritar").addEventListener("click", () => salvarFavorito(cidade));
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

// Busca pelo nome digitado
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

// Busca direto pelas coordenadas (usada ao clicar em um favorito)
async function carregarPorCidade(cidade) {
  area.innerHTML = '<p class="aviso">Carregando...</p>';
  botao.disabled = true;
  try {
    const previsao = await buscarPrevisao(cidade.latitude, cidade.longitude);
    mostrarClima(cidade, previsao);
  } catch (erro) {
    mostrarErro(erro);
  } finally {
    botao.disabled = false;
  }
}

// Mostra (ou limpa) uma mensagem de erro acima da lista de favoritos
function avisoFavoritos(texto) {
  let aviso = document.getElementById("aviso-favoritos");
  if (!aviso) {
    aviso = document.createElement("p");
    aviso.id = "aviso-favoritos";
    aviso.className = "erro";
    aviso.setAttribute("role", "alert");
    listaFavoritos.before(aviso);
  }
  aviso.textContent = texto;
  aviso.hidden = !texto;
}

// CREATE — salva a cidade no banco
async function salvarFavorito(cidade) {
  const msg = document.getElementById("msg-favorito");

  const jaExiste = favoritos.some(
    (f) => f.latitude === cidade.latitude && f.longitude === cidade.longitude
  );
  if (jaExiste) {
    msg.textContent = "Essa cidade já está nos favoritos.";
    return;
  }

  const { error } = await supabase.from("favoritos").insert({
    cidade: cidade.name,
    pais: cidade.country || null,
    latitude: cidade.latitude,
    longitude: cidade.longitude,
  });

  if (error) {
    console.error(error);
    msg.textContent = "Não foi possível salvar. Tente novamente.";
    return;
  }
  msg.textContent = "Cidade salva nos favoritos!";
  listarFavoritos();
}

// READ — busca os favoritos no banco e desenha na tela
async function listarFavoritos() {
  const { data, error } = await supabase
    .from("favoritos")
    .select("*")
    .order("criado_em");

  if (error) {
    console.error(error);
    listaFavoritos.innerHTML = "";
    avisoFavoritos("Não foi possível carregar seus favoritos. Tente recarregar a página.");
    return;
  }
  avisoFavoritos("");
  favoritos = data;
  renderizarFavoritos(favoritos);
}

function renderizarFavoritos(lista) {
  if (lista.length === 0) {
    listaFavoritos.innerHTML =
      '<li class="aviso">Nenhuma cidade favorita ainda. Busque uma cidade e clique em Favoritar.</li>';
    return;
  }
  listaFavoritos.innerHTML = lista.map((f) => `
    <li class="favorito">
      <button type="button" class="favorito-abrir" data-id="${f.id}">
        ${escapar(f.cidade)}${f.pais ? ", " + escapar(f.pais) : ""}
      </button>
      <button type="button" class="favorito-excluir" data-id="${f.id}"
              aria-label="Excluir ${escapar(f.cidade)} dos favoritos">✕</button>
    </li>`).join("");
}

// DELETE — remove o favorito do banco e atualiza a lista
async function removerFavorito(id) {
  const { error } = await supabase.from("favoritos").delete().eq("id", id);
  if (error) {
    console.error(error);
    avisoFavoritos("Não foi possível excluir. Tente novamente.");
    return;
  }
  avisoFavoritos("");
  listarFavoritos();
}

// Clicar em um favorito carrega o clima daquela cidade
listaFavoritos.addEventListener("click", (evento) => {
  const excluir = evento.target.closest(".favorito-excluir");
  if (excluir) {
    removerFavorito(Number(excluir.dataset.id));
    return;
  }

  const abrir = evento.target.closest(".favorito-abrir");
  if (abrir) {
    const fav = favoritos.find((f) => f.id === Number(abrir.dataset.id));
    if (fav) {
      carregarPorCidade({
        name: fav.cidade,
        country: fav.pais,
        latitude: fav.latitude,
        longitude: fav.longitude,
      });
    }
  }
});

form.addEventListener("submit", (evento) => {
  evento.preventDefault();
  const termo = campo.value.trim();
  if (termo) carregarClima(termo);
});

// Ao abrir a página, carrega os favoritos salvos
listarFavoritos();