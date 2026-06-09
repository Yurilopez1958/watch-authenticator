/**
 * Visual authentication checkpoints for Rolex — what to look for when comparing
 * a watch under examination against a known-authentic reference.
 *
 * Built from publicly documented authentication knowledge (Rolex technical
 * literature, watchmaking references, auction-house condition reports). These
 * are textual guides, NOT photos — pair them with your own verified reference
 * images. None of this guarantees authenticity on its own; final calls require
 * physical inspection in hand.
 */

/** Bilingual string pair (Spanish / English). */
export type Bilingual = { es: string; en: string };

export type AuthCheckpoint = {
  id: string;
  /** Human label of the part / area being checked. */
  label: Bilingual;
  /** Concrete things to verify on a genuine piece. */
  points: readonly Bilingual[];
  /**
   * Optional built-in reference visual for this tell — served from /public, e.g.
   * '/tells/rolex/cyclops.svg'. Prefer copyright-free schematic DIAGRAMS, or a
   * verified photo you own. This ships WITH the product (separate from the
   * user-uploaded authentic/fake reference photos).
   */
  image?: string;
  /** Optional caption describing what the reference visual shows. */
  imageCaption?: Bilingual;
};

/** Brand-wide checkpoints that apply to (almost) every modern Rolex. */
export const ROLEX_AUTH_CHECKPOINTS: readonly AuthCheckpoint[] = [
  {
    id: 'crown-logo',
    label: { es: 'Corona (logotipo coronet)', en: 'Coronet (crown logo)' },
    points: [
      { es: 'Las cinco puntas perfectamente simétricas y equiespaciadas; las dos puntas exteriores se curvan ligeramente hacia fuera.', en: 'Five points perfectly symmetric and evenly spaced; the two outer points curve outward gently.' },
      { es: 'En la esfera, la coronet aplicada queda perfectamente centrada bajo las 12, con bordes nítidos y pulidos.', en: 'On the dial, the applied coronet sits dead-centre under 12 with crisp, polished edges.' },
      { es: 'En la corona de cuerda, la coronet está estampada con nitidez — las réplicas suelen mostrarla poco profunda, empastada o torcida.', en: 'On the winding crown, the coronet is sharply stamped — replicas often show a shallow, mushy, or lopsided crown.' },
    ],
    image: '/tells/rolex/coronet.svg',
    imageCaption: { es: 'Auténtica: cinco puntas simétricas y equiespaciadas, bordes nítidos. Réplica: torcida, puntas desiguales o empastadas.', en: 'Genuine: five symmetric, evenly spaced points with crisp edges. Replica: lopsided, uneven or mushy points.' },
  },
  {
    id: 'cyclops',
    label: { es: 'Lupa de fecha (cyclops)', en: 'Cyclops date lens' },
    points: [
      { es: 'Amplía la fecha ~2,5× y llena la burbuja. Las réplicas suelen ampliar solo ~1,5× y la fecha se ve pequeña.', en: 'Magnifies the date ~2.5×, filling the bubble. Replicas frequently magnify only ~1.5× and leave the date looking small.' },
      { es: 'La fecha queda centrada bajo la lupa, sin desplazarse a izquierda o derecha.', en: 'The date is centred under the lens, not shifted left/right.' },
      { es: 'El tratamiento antirreflejos (en referencias modernas) hace que la lupa se vea casi invisible de frente.', en: 'Anti-reflective coating (on modern refs) makes the lens look almost invisible straight-on.' },
    ],
    image: '/tells/rolex/cyclops.svg',
    imageCaption: { es: 'Auténtica: la lupa amplía ~2,5× y la fecha llena la burbuja. Réplica: ~1,5×, la fecha se ve pequeña.', en: 'Genuine: the lens magnifies ~2.5× and the date fills the bubble. Replica: ~1.5×, the date looks small.' },
  },
  {
    id: 'dial-printing',
    label: { es: 'Impresión y texto de la esfera', en: 'Dial printing & text' },
    points: [
      { es: 'Toda la impresión nítida bajo lupa — sin bordes borrosos, sin sangrado de tinta, espaciado entre letras perfectamente uniforme.', en: 'All printing razor-sharp under loupe — no fuzzy edges, no ink bleed, perfectly even letter spacing.' },
      { es: 'El "SWISS MADE" a las 6 está impreso con finura; la pequeña coronet entre SWISS y MADE (posterior a 2002) es nítida.', en: '"SWISS MADE" at 6 o\'clock is finely printed; the small coronet between SWISS and MADE (post-2002) is crisp.' },
      { es: 'Los índices horarios aplicados son de metal macizo con lume uniforme; la separación entre el índice y el lume es regular.', en: 'Applied hour markers are solid metal with even lume; gaps between marker and lume are uniform.' },
      { es: 'Tipografía y profundidad del texto correctas para el modelo/época (p. ej. esferas gilt antiguas vs. mate modernas).', en: 'Correct font and depth-of-text for the model/era (e.g. older gilt dials vs modern matte).' },
    ],
    image: '/tells/rolex/dial-printing.svg',
    imageCaption: { es: 'Auténtica: impresión nítida de bordes limpios. Réplica: bordes borrosos y sangrado de tinta bajo lupa.', en: 'Genuine: crisp printing with clean edges. Replica: fuzzy edges and ink bleed under a loupe.' },
  },
  {
    id: 'hands',
    label: { es: 'Agujas', en: 'Hands' },
    points: [
      { es: 'Estilo de aguja correcto para el modelo (Mercedes en relojes deportivos, baton en modelos de vestir).', en: 'Correct hand style for the model (Mercedes on tool watches, baton on dress models).' },
      { es: 'El lume de las agujas coincide con el de los índices en color y envejecimiento — una discrepancia sugiere un servicio o una falsificación.', en: 'Lume on the hands matches the markers in colour and ageing — a mismatch suggests a service or a fake.' },
      { es: 'Cantos pulidos limpiamente; el segundero barre con suavidad y queda centrado sin oscilar.', en: 'Edges cleanly polished; the seconds hand sweeps smoothly and sits centred without wobble.' },
    ],
    image: '/tells/rolex/mercedes-hands.svg',
    imageCaption: { es: 'Aguja "Mercedes": círculo bien proporcionado y radios uniformes. Réplica: círculo desproporcionado o radios torcidos.', en: '"Mercedes" hand: well-proportioned circle and even spokes. Replica: off-proportion circle or crooked spokes.' },
  },
  {
    id: 'rehaut',
    label: { es: 'Rehaut (anillo interior del bisel)', en: 'Rehaut (inner bezel ring)' },
    points: [
      { es: 'Desde ~2005, el rehaut lleva grabado con láser "ROLEXROLEXROLEX…" repetido alrededor del anillo.', en: 'Since ~2005, the rehaut is laser-engraved "ROLEXROLEXROLEX…" repeated around the ring.' },
      { es: 'El número de serie está grabado en el rehaut a las 6 y debe coincidir con el serial entre las asas / de la tarjeta de garantía.', en: 'The serial number is engraved on the rehaut at 6 o\'clock and must match the serial between the lugs / on the warranty card.' },
      { es: 'El grabado es uniforme, nítido y perfectamente alineado con los índices de la esfera — un texto torcido o poco profundo es señal de alarma.', en: 'Engraving is even, sharp and perfectly aligned with the dial markers — crooked or shallow text is a red flag.' },
    ],
    image: '/tells/rolex/rehaut.svg',
    imageCaption: { es: 'Grabado regular y nítido, con el serial a las 6 alineado con los índices. Réplica: grabado borroso y serial torcido/desalineado.', en: 'Even, sharp engraving with the serial at 6 aligned to the markers. Replica: blurry engraving and a crooked/misaligned serial.' },
  },
  {
    id: 'case-back',
    label: { es: 'Fondo de caja', en: 'Case back' },
    points: [
      { es: 'Casi todos los fondos Rolex son lisos, planos y atornillados — SIN cristal de exhibición (Rolex no usa fondos transparentes en producción estándar).', en: 'Almost all Rolex case backs are plain, smooth and screwed down — NO display/exhibition glass (Rolex does not use see-through backs on standard production).' },
      { es: 'Sin grabados externos en piezas auténticas (los fondos grabados suelen ser de posventa o falsos), salvo modelos concretos como algunos Sea-Dweller con texto del modelo.', en: 'No external engravings on genuine pieces (engraved backs are usually after-market or fake), except specific models like some Sea-Dwellers with model text.' },
      { es: 'Mecanizado fino y uniforme del estriado del canto donde agarra la herramienta de apertura.', en: 'Fine, even machining of the fluting on the edge that the case-opening tool grips.' },
    ],
    image: '/tells/rolex/caseback.svg',
    imageCaption: { es: 'Auténtico: fondo macizo y atornillado, sin cristal. Un fondo transparente que deja ver el movimiento es muy sospechoso en un Rolex estándar.', en: 'Genuine: solid, screwed-down back, no glass. A see-through back showing the movement is highly suspicious on a standard Rolex.' },
  },
  {
    id: 'serial-engraving',
    label: { es: 'Número de serie y de modelo', en: 'Serial & model number' },
    points: [
      { es: 'Referencias antiguas: serial entre las asas a las 6, número de modelo entre las asas a las 12 — tallado a diamante profundo y limpio, ligeramente brillante.', en: 'Older refs: serial between the lugs at 6, model number between the lugs at 12 — deeply and cleanly diamond-cut, slightly sparkly.' },
      { es: 'Referencias modernas: serial en el rehaut. Los números deben ser nítidos, con un corte facetado que capta la luz, nunca con aspecto arenado/grabado al ácido.', en: 'Modern refs: serial on the rehaut. Numbers should be sharp with a faceted, light-catching cut, never sandblasted/etched-looking.' },
      { es: 'Coteja el serial con los años de producción de la referencia — un serial fuera de rango es una fuerte advertencia.', en: 'Cross-check the serial against the production years of the reference — an out-of-range serial is a strong warning.' },
    ],
  },
  {
    id: 'bracelet-clasp',
    label: { es: 'Brazalete y cierre', en: 'Bracelet & clasp' },
    points: [
      { es: 'Eslabones macizos y con peso — los brazaletes Rolex auténticos se sienten densos; eslabones huecos o ligeros delatan una falsificación.', en: 'Solid, hefty links — genuine Rolex bracelets feel dense; hollow or light links are a giveaway.' },
      { es: 'Cierre estampado con la coronet más el código de cierre y el punzón del metal; la extensión Glidelock / Easylink (si la lleva) funciona con suavidad.', en: 'Clasp stamped with the coronet plus the clasp code and metal stamp; the Glidelock / Easylink extension (where fitted) operates smoothly.' },
      { es: 'Códigos de referencia y de cierre grabados limpiamente en el interior del cierre y coherentes con el modelo.', en: 'Reference and clasp codes engraved cleanly inside the clasp and consistent with the model.' },
    ],
  },
  {
    id: 'weight-feel',
    label: { es: 'Peso y acabado general', en: 'Overall weight & finishing' },
    points: [
      { es: 'Rolex usa aleaciones densas (acero 904L, oro 18k, Pt950) — el reloj debe sentirse notablemente pesado para su tamaño.', en: 'Rolex uses dense alloys (904L steel, 18k gold, Pt950) — the watch should feel substantially heavy for its size.' },
      { es: 'Las superficies satinadas y pulidas se encuentran en aristas perfectamente nítidas; sin transiciones redondeadas ni difusas.', en: 'Brushed and polished surfaces meet at perfectly crisp edges; no rounded or hazy transitions.' },
      { es: 'La acción del bisel (si gira) es firme y con clics precisos; la rosca de la corona atornillada engrana con suavidad.', en: 'Bezel action (where rotating) is firm with precise clicks; screw-down crown threads engage smoothly.' },
    ],
  },
];

/**
 * Movement-specific authentication points keyed by caliber number. These
 * supplement the per-caliber `notes` already on each Movement record.
 */
export const ROLEX_MOVEMENT_CHECKPOINTS: Readonly<Record<string, readonly Bilingual[]>> = {
  // Modern Chronergy family
  '3230': [
    { es: 'Escape Chronergy (esqueletizado, áncora asimétrica) en níquel-fósforo.', en: 'Chronergy escapement (skeletonised, asymmetric pallet fork) in nickel-phosphorus.' },
    { es: 'Espiral Parachrom azul con curva Rolex (overcoil); amortiguadores Paraflex en el volante.', en: 'Blue Parachrom hairspring with Rolex overcoil; Paraflex shock absorbers on the balance.' },
    { es: 'Côtes de Genève en los puentes; perlado en la platina; rotor Rolex grabado.', en: 'Côtes de Genève on the bridges; perlage on the baseplate; engraved Rolex rotor.' },
  ],
  '3235': [
    { es: 'Escape Chronergy; +70 h de reserva de marcha gracias a un barrilete rediseñado.', en: 'Chronergy escapement; +70 h power reserve from a redesigned barrel.' },
    { es: 'Espiral Parachrom azul, volante Microstella de regulación libre, protección antichoque Paraflex.', en: 'Blue Parachrom hairspring, freesprung Microstella balance, Paraflex shock protection.' },
    { es: 'Acabado de alta precisión: puentes con Côtes de Genève, platina con perlado.', en: 'High-precision finishing: Côtes de Genève bridges, perlage baseplate.' },
  ],
  '3255': [
    { es: 'Misma plataforma Chronergy que el 3235 con el módulo de día/fecha del Day-Date.', en: 'Same Chronergy platform as 3235 with the day/date module of the Day-Date.' },
    { es: 'Salto instantáneo de día y fecha a medianoche.', en: 'Instantaneous day and date jump at midnight.' },
  ],
  '3285': [
    { es: 'Movimiento GMT Chronergy con aguja de 24 horas de ajuste independiente y salto de la hora local.', en: 'Chronergy GMT movement with independently-set 24-hour hand and local-hour jump.' },
    { es: 'Espiral Parachrom azul; 70 h de reserva.', en: 'Blue Parachrom hairspring; 70 h reserve.' },
  ],
  // Classic 3135 family
  '3135': [
    { es: 'Movimiento de fecha de 4 Hz, caballo de batalla (1988–2020). Puente de volante completo (apoyo en dos puntos) — una clave frente a clones baratos que usan un gallo de volante.', en: 'Workhorse 4 Hz date movement (1988–2020). Full balance bridge (two-point support) — a key tell vs cheaper clones that use a balance cock.' },
    { es: 'Tuercas de regulación Microstella en el volante; espiral Breguet/Parachrom según la época.', en: 'Microstella regulating nuts on the balance; Breguet/Parachrom hairspring depending on era.' },
    { es: 'Côtes de Genève, perlado y un rotor grabado de buen peso.', en: 'Côtes de Genève, perlage, and a heavy engraved rotor.' },
  ],
  '3130': [{ es: 'Hermano solo-hora del 3135 (sin fecha) — mismo puente de volante completo y volante Microstella.', en: 'Time-only sibling of the 3135 (no date) — same full balance bridge and Microstella balance.' }],
  '3186': [{ es: 'Calibre del GMT-Master II con espiral Parachrom; aguja de 24 horas independiente.', en: 'GMT-Master II caliber with Parachrom hairspring; independent 24-hour hand.' }],
  // Chronographs
  '4130': [
    { es: 'Cronógrafo Daytona de manufactura: embrague vertical + rueda de pilares, con muchas menos piezas que un cronógrafo modular.', en: 'In-house Daytona chronograph: vertical clutch + column wheel, far fewer parts than a modular chrono.' },
    { es: 'Volante Microstella con puente completo; sin segundero continuo a las 6 (el pequeño segundero se ubica donde corresponde al diseño).', en: 'Microstella balance with full bridge; no running-seconds at 6 (the small seconds sits where expected for the layout).' },
  ],
  '4131': [{ es: 'Sucesor del 4130 con escape Chronergy; disposición de puentes calada en referencias de oro/Pt con fondo de zafiro.', en: 'Successor to 4130 with Chronergy escapement; openworked bridge layout on sapphire-back gold/Pt refs.' }],
  // Vintage
  '1570': [{ es: 'Calibre vintage de fecha a 19.800 alt/h (1965–88). Parada de segundero desde ~1972. Puentes con Côtes de Genève, acabado gilt en los primeros ejemplares.', en: 'Vintage 19,800 vph date caliber (1965–88). Hacking seconds from ~1972. Côtes de Genève bridges, gilt finishing on early examples.' }],
  '1520': [{ es: 'Vintage solo-hora a 19.800 alt/h, hermano no cronómetro del 1530. Acabado sencillo y robusto.', en: 'Vintage time-only 19,800 vph, non-chronometer sibling of the 1530. Simple, robust finishing.' }],
  '3035': [{ es: 'Primer calibre con fecha de ajuste rápido a 28.800 alt/h (1977–88). Apoyo de volante tipo puente.', en: 'First 28,800 vph quickset-date caliber (1977–88). Bridge-style balance support.' }],
  '3085': [{ es: 'Primer movimiento del GMT-Master II con aguja de 24 horas realmente independiente ("Fat Lady" 16760).', en: 'First GMT-Master II movement with truly independent 24-hour hand ("Fat Lady" 16760).' }],
  '4030': [{ es: 'El movimiento "Zenith" del Daytona — base El Primero modificada a 28.800 alt/h; ~50% de piezas fabricadas por Rolex, acabado Rolex y volante Microstella.', en: 'The "Zenith" Daytona movement — modified El Primero base run at 28,800 vph; ~50% Rolex-made parts, Rolex finishing and Microstella balance.' }],
  '727': [{ es: 'Base Valjoux 72 de cuerda manual — sin rotor. Cronógrafo de rueda de pilares; la propia cuerda manual es una comprobación de autenticidad primaria en 6263/6265.', en: 'Hand-wound Valjoux 72 base — no rotor. Column-wheel chronograph; the manual winding itself is a primary authenticity check for 6263/6265.' }],
};

/** Returns the movement-specific checkpoints for a caliber, if any. */
export function getMovementCheckpoints(caliber: string): readonly Bilingual[] {
  const key = caliber.replace(/^cal\.?\s*/i, '').trim();
  return ROLEX_MOVEMENT_CHECKPOINTS[key] ?? [];
}
