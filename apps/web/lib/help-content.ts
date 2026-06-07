// Bilingual, plain-language help for every screen. Written so someone with no
// background can follow the steps. Keyed by the route's first segment.

export type Bi = { es: string; en: string };
export type HelpTopic = {
  title: Bi;
  intro: Bi;
  steps: Bi[];
  tip?: Bi;
};

export const HELP: Record<string, HelpTopic> = {
  home: {
    title: { es: '¿Qué es esta app?', en: 'What is this app?' },
    intro: {
      es: 'Te ayuda a saber si un reloj de lujo es auténtico. Mide el metal, mira fotos, escucha el tic-tac y te da un veredicto claro.',
      en: 'It helps you tell if a luxury watch is genuine. It measures the metal, looks at photos, listens to the ticking, and gives you a clear verdict.',
    },
    steps: [
      { es: 'Toca el botón grande "Empezar" para autenticar un reloj paso a paso.', en: 'Tap the big "Start" button to authenticate a watch step by step.' },
      { es: 'En cada pantalla verás el botón "?" arriba: ábrelo si te pierdes.', en: 'On every screen there is a "?" button at the top: open it if you get lost.' },
      { es: 'Puedes cambiar entre Español e Inglés con el botón ES/EN.', en: 'Switch between Spanish and English with the ES/EN button.' },
      { es: 'El botón Simple/Pro arriba muestra u oculta los controles avanzados (para expertos).', en: 'The Simple/Pro button up top shows or hides advanced controls (for experts).' },
    ],
    tip: { es: 'No necesitas saber de química ni de relojería: déjalo en Simple y la app te guía.', en: 'You do not need chemistry or watch knowledge: leave it on Simple and the app guides you.' },
  },
  authenticate: {
    title: { es: 'Autenticar un reloj', en: 'Authenticate a watch' },
    intro: {
      es: 'Es el asistente principal. Te lleva de la mano: eliges el reloj, mides el metal, haces fotos y recibes el resultado.',
      en: 'This is the main wizard. It walks you through it: pick the watch, measure the metal, take photos, and get the result.',
    },
    steps: [
      { es: 'Paso 1 — Elige la marca y el modelo. Puedes buscar por referencia (los números del reloj).', en: 'Step 1 — Choose the brand and model. You can search by reference (the watch numbers).' },
      { es: 'Paso 2 — Mide el metal con la pistola Niton: caja, brazalete y tapa, una por una.', en: 'Step 2 — Measure the metal with the Niton gun: case, bracelet and case-back, one by one.' },
      { es: 'Paso 3 — Haz fotos de las partes clave cuando te las pida.', en: 'Step 3 — Take photos of the key parts when asked.' },
      { es: 'Paso 4 — Lee el resultado: verde = probablemente auténtico, ámbar = dudoso, rojo = sospechoso.', en: 'Step 4 — Read the result: green = likely genuine, amber = unsure, red = suspicious.' },
    ],
    tip: { es: 'Usa los botones Siguiente / Atrás para moverte. Nada se borra si retrocedes.', en: 'Use Next / Back to move around. Nothing is lost if you go back.' },
  },
  connect: {
    title: { es: 'Conectar la pistola Niton', en: 'Connect the Niton gun' },
    intro: {
      es: 'Aquí enlazas tu medidor de metales Niton para que sus lecturas entren solas en la app.',
      en: 'Here you link your Niton metal analyzer so its readings flow into the app automatically.',
    },
    steps: [
      { es: 'Enciende la pistola Niton y ponla en modo de aleaciones (Alloy), no en quilates.', en: 'Turn on the Niton gun and set it to Alloy mode, not Karat.' },
      { es: 'Conéctala por cable o pega el texto de la lectura en el recuadro.', en: 'Connect it by cable, or paste the reading text into the box.' },
      { es: 'Comprueba que aparecen los elementos (Fe, Cr, Ni…) con su porcentaje.', en: 'Check the elements appear (Fe, Cr, Ni…) with their percentage.' },
    ],
    tip: { es: 'Si mides un Rolex de acero, el níquel (Ni) ronda el 25%. Mucho menos suele ser acero corriente.', en: 'On a steel Rolex, nickel (Ni) is around 25%. Much less is usually ordinary steel.' },
  },
  timegrapher: {
    title: { es: 'Cronocomparador (oír el reloj)', en: 'Chronocomparator (listen to the watch)' },
    intro: {
      es: 'Mide la precisión del reloj escuchando su tic-tac con el micrófono del teléfono. No necesitas nada más.',
      en: 'It measures the watch accuracy by listening to its ticking with the phone microphone. Nothing else needed.',
    },
    steps: [
      { es: 'Busca un sitio en silencio y apoya la tapa del reloj sobre el micrófono del teléfono.', en: 'Find a quiet place and rest the watch case-back on the phone microphone.' },
      { es: 'Pulsa "Empezar a escuchar" y espera 15–30 segundos a que se estabilice.', en: 'Press "Start listening" and wait 15–30 seconds for it to settle.' },
      { es: 'Si no capta nada, sube el control de "Nivel de micro / ganancia".', en: 'If it catches nothing, raise the "Mic level / gain" control.' },
      { es: 'Pulsa "Guardar lectura" para que salga en el informe del reloj.', en: 'Press "Save reading" so it appears in the watch report.' },
    ],
    tip: { es: 'Verde en "Rate" = va muy fino. Ámbar o rojo = adelanta o atrasa demasiado.', en: 'Green "Rate" = running great. Amber or red = gaining or losing too much.' },
  },
  verify: {
    title: { es: 'Verificación rápida', en: 'Quick verify' },
    intro: {
      es: 'Una comprobación corta del metal cuando ya tienes los números de la pistola y solo quieres un veredicto.',
      en: 'A short metal check when you already have the gun numbers and just want a verdict.',
    },
    steps: [
      { es: 'Elige marca, modelo y año del reloj.', en: 'Choose the watch brand, model and year.' },
      { es: 'Escribe los porcentajes de cada metal que dio la pistola.', en: 'Type the percentage of each metal the gun reported.' },
      { es: 'Pulsa "Analizar" y lee el veredicto y los avisos.', en: 'Press "Analyze" and read the verdict and flags.' },
    ],
  },
  gallery: {
    title: { es: 'Galería de referencia', en: 'Reference gallery' },
    intro: {
      es: 'Guardas fotos de relojes auténticos por partes (corona, tapa, brazalete…) para compararlas después.',
      en: 'You save photos of genuine watches by part (crown, case-back, bracelet…) to compare later.',
    },
    steps: [
      { es: 'Elige el reloj de referencia (marca, modelo, año).', en: 'Pick the reference watch (brand, model, year).' },
      { es: 'Sube fotos en cada parte. Puedes subir varias a la vez.', en: 'Upload photos under each part. You can upload several at once.' },
      { es: 'Inicia sesión con tu correo para guardarlas en la nube y verlas en otros dispositivos.', en: 'Sign in with your email to save them to the cloud and see them on other devices.' },
    ],
  },
  market: {
    title: { es: 'Mercado y valoración', en: 'Market & valuation' },
    intro: {
      es: 'Te da un precio orientativo de venta y de compra, y calcula tu oferta como comprador con tu margen.',
      en: 'It gives an orientative resale and buy price, and calculates your dealer offer with your margin.',
    },
    steps: [
      { es: 'Busca el modelo para ver precio de venta, precio mayorista y qué tan rápido se vende.', en: 'Search the model to see resale price, wholesale price and how fast it sells.' },
      { es: 'En la calculadora, pon el coste de servicio y tu margen deseado.', en: 'In the calculator, enter the service cost and your desired margin.' },
      { es: 'La app te dice cuánto ofrecer para ganar al menos lo que pediste.', en: 'The app tells you how much to offer to earn at least what you asked for.' },
    ],
    tip: { es: 'Los precios son orientativos (estimación), no una cotización en vivo.', en: 'Prices are orientative (an estimate), not a live quote.' },
  },
  import: {
    title: { es: 'Importar CSV del Niton', en: 'Import Niton CSV' },
    intro: {
      es: 'Sube el archivo CSV que exporta el programa del Niton y la app analiza cada lectura por ti.',
      en: 'Upload the CSV file the Niton software exports and the app analyzes every reading for you.',
    },
    steps: [
      { es: 'Elige el año de los relojes medidos.', en: 'Choose the year of the measured watches.' },
      { es: 'Sube el archivo CSV o pega su contenido en el recuadro.', en: 'Upload the CSV file or paste its contents in the box.' },
      { es: 'Pulsa "Analizar" y revisa el veredicto de cada fila.', en: 'Press "Analyze" and review each row verdict.' },
    ],
    tip: { es: 'La app convierte sola las unidades (ppm a %) para no equivocar el veredicto.', en: 'The app converts units for you (ppm to %) so the verdict is not skewed.' },
  },
  billing: {
    title: { es: 'Planes y suscripción', en: 'Plans & subscription' },
    intro: {
      es: 'Elige un plan según cuántas autenticaciones y valuaciones haces al mes. Puedes cambiar o cancelar cuando quieras.',
      en: 'Pick a plan based on how many authentications and valuations you do per month. Change or cancel anytime.',
    },
    steps: [
      { es: 'Inicia sesión con tu correo (te llega un enlace).', en: 'Sign in with your email (you get a link).' },
      { es: 'Mira tu uso del mes en las barras de progreso.', en: 'See your monthly usage in the progress bars.' },
      { es: 'Pulsa "Suscribirse" en el plan que quieras para pagar de forma segura.', en: 'Press "Subscribe" on the plan you want to pay securely.' },
      { es: 'Usa "Gestionar suscripción" para cambiar de plan o cancelar.', en: 'Use "Manage subscription" to switch plan or cancel.' },
    ],
    tip: { es: 'Si llegas al límite del mes, sube de plan o espera al día 1 del mes siguiente.', en: 'If you hit the monthly limit, upgrade or wait until the 1st of next month.' },
  },
  developer: {
    title: { es: 'API para dealers', en: 'Dealer API' },
    intro: {
      es: 'Crea claves para usar la autenticación y la valuación desde tu propio sistema.',
      en: 'Create keys to use authentication and valuation from your own system.',
    },
    steps: [
      { es: 'Inicia sesión (en Planes) y crea una clave; cópiala (solo se muestra una vez).', en: 'Sign in (in Plans) and create a key; copy it (shown only once).' },
      { es: 'Mándala en la cabecera Authorization: Bearer wa_live_…', en: 'Send it in the Authorization: Bearer wa_live_… header.' },
      { es: 'Llama a /api/v1/value o /api/v1/authenticate (ver ejemplos).', en: 'Call /api/v1/value or /api/v1/authenticate (see examples).' },
      { es: 'El uso cuenta contra tu plan; puedes revocar una clave cuando quieras.', en: 'Usage counts against your plan; you can revoke a key anytime.' },
    ],
  },
  admin: {
    title: { es: 'Panel de administración', en: 'Admin panel' },
    intro: {
      es: 'Solo para administradores. Ves usuarios, suscripciones, pagos, uso y alertas de seguridad.',
      en: 'Admins only. See users, subscriptions, payments, usage and security alerts.',
    },
    steps: [
      { es: 'En "Usuarios" busca por correo y toca uno para ver su detalle.', en: 'In "Users" search by email and tap one to see details.' },
      { es: 'Puedes bloquear/desbloquear una cuenta sospechosa.', en: 'You can block/unblock a suspicious account.' },
      { es: 'En "Pagos" ves lo cobrado; en "Seguridad" las alertas de cuentas compartidas.', en: 'In "Payments" see revenue; in "Security" the account-sharing alerts.' },
    ],
  },
  settings: {
    title: { es: 'Cumplimiento (marcas representadas)', en: 'Compliance (represented brands)' },
    intro: {
      es: 'Marca las marcas que representas oficialmente. La app te avisará (o bloqueará) al autenticarlas para evitar conflictos.',
      en: 'Mark the brands you officially represent. The app will warn (or block) when authenticating them to avoid conflicts.',
    },
    steps: [
      { es: 'Junto a cada marca elige: No representada, Avisar o Bloquear.', en: 'Next to each brand choose: Not represented, Warn or Block.' },
      { es: 'Se guarda solo en este dispositivo, en privado.', en: 'It is saved only on this device, privately.' },
    ],
  },
};

/** Resolves the help topic for a route path (e.g. "/authenticate" → authenticate). */
export function helpForPath(pathname: string): HelpTopic {
  const seg = pathname.split('/').filter(Boolean)[0] ?? 'home';
  return HELP[seg] ?? HELP.home!;
}
