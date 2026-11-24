const pantallaInicio = document.querySelector("#pantalla-inicio");
const pantallaQuiz = document.querySelector("#pantalla-quiz");
const pantallaResultados = document.querySelector("#pantalla-resultados");
const btnComenzar = document.querySelector("#btn-comenzar");
const btnSiguiente = document.querySelector("#btn-siguiente");
const btnReiniciar = document.querySelector("#btn-reiniciar");

let preguntas = [];
let indiceActual = 0;
let puntaje = 0;
let respuestas = [];
let tiempoRestante = 60;
let intervalo = null;
let respondida = false;

async function cargarPreguntas() {
  try {
    const respuesta = await fetch("./preguntas.json");
    if (!respuesta.ok) throw new Error("No se pudo cargar preguntas.json");
    preguntas = await respuesta.json();
    document.querySelector("#total-inicio").textContent = preguntas.length;
    document.querySelector("#puntaje-maximo").textContent = `/ ${preguntas.length}`;
  } catch (error) {
    alert("No fue posible cargar las preguntas. Abre el proyecto con Live Server en Visual Studio Code.");
    console.error(error);
  }
}

function mostrarPantalla(pantalla) {
  [pantallaInicio, pantallaQuiz, pantallaResultados].forEach(p => p.classList.add("oculto"));
  pantalla.classList.remove("oculto");
}

function comenzarExamen() {
  indiceActual = 0;
  puntaje = 0;
  respuestas = [];
  document.querySelector("#puntaje").textContent = puntaje;
  mostrarPantalla(pantallaQuiz);
  mostrarPregunta();
}

function mostrarPregunta() {
  detenerTemporizador();
  respondida = false;
  tiempoRestante = 60;
  const pregunta = preguntas[indiceActual];

  document.querySelector("#progreso-texto").textContent = `Pregunta ${indiceActual + 1} de ${preguntas.length}`;
  document.querySelector("#progreso").style.width = `${(indiceActual / preguntas.length) * 100}%`;
  document.querySelector("#tiempo").textContent = tiempoRestante;
  document.querySelector("#texto-pregunta").textContent = pregunta.pregunta;
  document.querySelector("#retroalimentacion").textContent = "";
  btnSiguiente.disabled = true;
  btnSiguiente.textContent = indiceActual === preguntas.length - 1 ? "Ver resultados" : "Siguiente";

  const contenedor = document.querySelector("#opciones");
  contenedor.innerHTML = "";
  pregunta.opciones.forEach((opcion, indice) => {
    const boton = document.createElement("button");
    boton.className = "opcion";
    boton.textContent = `${String.fromCharCode(65 + indice)}. ${opcion.texto}`;
    boton.addEventListener("click", () => seleccionarRespuesta(indice));
    contenedor.appendChild(boton);
  });
  iniciarTemporizador();
}

function seleccionarRespuesta(indiceSeleccionado) {
  if (respondida) return;
  respondida = true;
  detenerTemporizador();

  const pregunta = preguntas[indiceActual];
  const esCorrecta = indiceSeleccionado === pregunta.respuestaCorrecta;
  if (esCorrecta) puntaje++;

  respuestas.push({
    pregunta: pregunta.pregunta,
    seleccionada: pregunta.opciones[indiceSeleccionado].texto,
    correcta: pregunta.opciones[pregunta.respuestaCorrecta].texto,
    esCorrecta,
    tiempoAgotado: false
  });

  actualizarOpciones(indiceSeleccionado);
  const retro = document.querySelector("#retroalimentacion");
  retro.textContent = esCorrecta
    ? "¡Correcto! Has ganado 1 punto."
    : `Respuesta incorrecta. La opción correcta era: ${pregunta.opciones[pregunta.respuestaCorrecta].texto}.`;
  retro.style.color = esCorrecta ? "#19834a" : "#c43e39";
  document.querySelector("#puntaje").textContent = puntaje;
  btnSiguiente.disabled = false;
}

function actualizarOpciones(indiceSeleccionado) {
  const pregunta = preguntas[indiceActual];
  document.querySelectorAll(".opcion").forEach((boton, indice) => {
    boton.disabled = true;
    if (indice === pregunta.respuestaCorrecta) boton.classList.add("correcta");
    else if (indice === indiceSeleccionado) boton.classList.add("incorrecta");
  });
}

function iniciarTemporizador() {
  intervalo = setInterval(() => {
    tiempoRestante--;
    document.querySelector("#tiempo").textContent = tiempoRestante;
    if (tiempoRestante <= 0) {
      detenerTemporizador();
      if (!respondida) tiempoAgotado();
    }
  }, 1000);
}

function detenerTemporizador() {
  if (intervalo) clearInterval(intervalo);
  intervalo = null;
}

function tiempoAgotado() {
  respondida = true;
  puntaje--;
  const pregunta = preguntas[indiceActual];
  respuestas.push({
    pregunta: pregunta.pregunta,
    seleccionada: "Sin respuesta (tiempo agotado)",
    correcta: pregunta.opciones[pregunta.respuestaCorrecta].texto,
    esCorrecta: false,
    tiempoAgotado: true
  });
  document.querySelectorAll(".opcion").forEach((boton, indice) => {
    boton.disabled = true;
    if (indice === pregunta.respuestaCorrecta) boton.classList.add("correcta");
  });
  document.querySelector("#retroalimentacion").textContent =
    `¡Se acabó el tiempo! Se resta 1 punto. La respuesta correcta era: ${pregunta.opciones[pregunta.respuestaCorrecta].texto}.`;
  document.querySelector("#retroalimentacion").style.color = "#c43e39";
  document.querySelector("#puntaje").textContent = puntaje;
  btnSiguiente.disabled = false;
}

function avanzar() {
  if (!respondida) return;
  if (indiceActual < preguntas.length - 1) {
    indiceActual++;
    mostrarPregunta();
  } else {
    finalizarExamen();
  }
}

function finalizarExamen() {
  detenerTemporizador();
  mostrarPantalla(pantallaResultados);
  document.querySelector("#progreso").style.width = "100%";
  document.querySelector("#puntaje-final").textContent = puntaje;
  const porcentaje = Math.round((respuestas.filter(r => r.esCorrecta).length / preguntas.length) * 100);
  document.querySelector("#mensaje-final").textContent =
    `Obtuviste ${porcentaje}% de respuestas correctas. Tu puntaje incluye las penalizaciones por tiempo agotado.`;

  const resumen = document.querySelector("#resumen");
  resumen.innerHTML = "";
  respuestas.forEach((respuesta, indice) => {
    const item = document.createElement("div");
    item.className = "item-resumen";
    const titulo = document.createElement("strong");
    titulo.textContent = `${indice + 1}. ${respuesta.pregunta}`;
    const estado = document.createElement("p");
    estado.className = respuesta.esCorrecta ? "estado-correcto" : "estado-incorrecto";
    estado.textContent = respuesta.esCorrecta ? "Correcta" : "Incorrecta";
    const elegida = document.createElement("p");
    elegida.textContent = `Tu respuesta: ${respuesta.seleccionada}`;
    const correcta = document.createElement("p");
    correcta.textContent = `Respuesta correcta: ${respuesta.correcta}`;
    item.append(titulo, estado, elegida, correcta);
    resumen.appendChild(item);
  });
}

btnComenzar.addEventListener("click", comenzarExamen);
btnSiguiente.addEventListener("click", avanzar);
btnReiniciar.addEventListener("click", () => {
  detenerTemporizador();
  comenzarExamen();
});

cargarPreguntas();
