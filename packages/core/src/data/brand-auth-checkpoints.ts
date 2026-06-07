import type { AuthCheckpoint } from './rolex-auth-checkpoints';
import { ROLEX_AUTH_CHECKPOINTS } from './rolex-auth-checkpoints';

/**
 * Visual authentication checkpoints per brand. Textual guides built from
 * publicly documented authentication knowledge — pair with your own verified
 * reference photos. None of this guarantees authenticity; final calls require
 * physical inspection.
 */

const OMEGA_CHECKPOINTS: readonly AuthCheckpoint[] = [
  {
    id: 'omega-logo',
    label: { es: 'Logotipo y marca Omega', en: 'Omega logo & branding' },
    points: [
      { es: 'El símbolo Ω y el logotipo "OMEGA" están aplicados/impresos con nitidez; la omega griega tiene patas simétricas y uniformes.', en: 'The Ω symbol and "OMEGA" wordmark are crisply applied/printed; the Greek omega has even, symmetric legs.' },
      { es: 'En modelos Co-Axial la esfera indica "Co-Axial" / "Master Chronometer" con tipografía y espaciado correctos para la época.', en: 'On Co-Axial models the dial reads "Co-Axial" / "Master Chronometer" with correct fonts and spacing for the era.' },
      { es: 'Sin erratas ni interletrado irregular — un delator clásico de réplica.', en: 'No spelling slips or uneven kerning — a classic replica giveaway.' },
    ],
  },
  {
    id: 'omega-caseback',
    label: { es: 'Medallón del fondo de caja', en: 'Case back medallion' },
    points: [
      { es: 'Seamaster: el medallón del caballito de mar (Hippocampus) está finamente repujado, con relieve nítido y proporciones correctas.', en: 'Seamaster: the Seahorse (Hippocampus) medallion is finely embossed with sharp relief and correct proportions.' },
      { es: 'Speedmaster Moonwatch: el grabado del fondo "FLIGHT-QUALIFIED BY NASA…" / "THE FIRST WATCH WORN ON THE MOON" es profundo y está estampado de forma uniforme.', en: 'Speedmaster Moonwatch: case back engraving "FLIGHT-QUALIFIED BY NASA…" / "THE FIRST WATCH WORN ON THE MOON" is deep and evenly stamped.' },
      { es: 'Los modelos con fondo de zafiro muestran movimientos bellamente acabados (ver comprobación del movimiento) — un movimiento turbio o tosco es señal de alarma.', en: 'Sapphire-back models show beautifully finished movements (see movement check) — a cloudy or rough movement is a red flag.' },
    ],
  },
  {
    id: 'omega-movement',
    label: { es: 'Movimiento (Co-Axial / Master Chronometer)', en: 'Movement (Co-Axial / Master Chronometer)' },
    points: [
      { es: 'Escape Co-Axial (de tres niveles) y volante de regulación libre en los calibres modernos — visiblemente distinto de un áncora suiza estándar.', en: 'Co-Axial escapement (three-level) and free-sprung balance on modern calibers — visibly different from a standard Swiss lever.' },
      { es: 'Côtes de Genève "Arabesque" con un patrón radial/ondulado característico; puentes rodiados o chapados en oro Sedna.', en: 'Arabesque Côtes de Genève in a distinctive radial/wave pattern; rhodium- or Sedna-gold-plated bridges.' },
      { es: 'Los movimientos Master Chronometer son antimagnéticos hasta 15.000 gauss (METAS) — un listón más alto que el COSC; el rotor y los puentes están grabados limpiamente.', en: 'Master Chronometer movements are anti-magnetic to 15,000 gauss (METAS) — a higher bar than COSC; the rotor and bridges are cleanly engraved.' },
      { es: 'El número de calibre debe coincidir con la referencia (p. ej. 3861 Moonwatch, 8800/8900 hora-fecha, 9300/9900 cronógrafo).', en: 'Caliber number should match the reference (e.g. 3861 Moonwatch, 8800/8900 time-date, 9300/9900 chronograph).' },
    ],
  },
  {
    id: 'omega-bracelet',
    label: { es: 'Brazalete, cierre y válvula de helio', en: 'Bracelet, clasp & helium valve' },
    points: [
      { es: 'Cierre grabado con el logo Ω; los sistemas de trinquete/extensión funcionan con suavidad y sin holgura.', en: 'Clasp engraved with the Ω logo; ratchet/extension systems operate smoothly with no play.' },
      { es: 'Seamaster Diver 300M: la válvula de escape de helio a las 10 enrosca/funciona correctamente.', en: 'Seamaster Diver 300M: the helium escape valve at 10 o\'clock screws/operates correctly.' },
      { es: 'Eslabones y enganches macizos; el reloj tiene un peso sustancial y de calidad.', en: 'Solid end-links and links; the watch has a substantial, quality heft.' },
    ],
  },
  {
    id: 'omega-bezel-dial',
    label: { es: 'Detalle de bisel y esfera', en: 'Bezel & dial detail' },
    points: [
      { es: 'Biseles de cerámica/aluminio: numerales e índices nítidos; en el Diver 300M la esfera con patrón de olas está grabada con láser, con líneas finas y uniformes.', en: 'Ceramic/aluminium bezels: numerals and indices are sharp; on the Diver 300M the wave-pattern dial is laser-engraved with fine, even lines.' },
      { es: 'Los índices aplicados tienen lume uniforme; la rueda de fecha (si la lleva) queda centrada en la ventanilla.', en: 'Applied indices have even lume; the date wheel (where present) aligns centrally in the window.' },
      { es: 'Las agujas tipo lollipop/broad-arrow corresponden al modelo y tienen lume coherente con los índices.', en: 'Lollipop/broad-arrow hands match the model and have lume consistent with the markers.' },
    ],
  },
];

const PATEK_CHECKPOINTS: readonly AuthCheckpoint[] = [
  {
    id: 'patek-seal',
    label: { es: 'Sello Patek Philippe y acabados', en: 'Patek Philippe Seal & finishing' },
    points: [
      { es: 'Desde 2009 cada movimiento lleva el Sello Patek Philippe (que sustituye al Sello de Ginebra) — un exigente estándar interno.', en: 'Since 2009 every movement carries the Patek Philippe Seal (replacing the Geneva Seal) — an exacting in-house standard.' },
      { es: 'Movimiento acabado a mano: anglage (biselado y pulido de los cantos de los puentes), Côtes de Genève, grabados rellenos de oro, avellanados pulidos. Un acabado industrial/plano es una fuerte señal de falsificación.', en: 'Hand-finished movement: anglage (bevelled, polished bridge edges), Côtes de Genève, gold-filled engravings, polished countersinks. Industrial/flat finishing is a strong fake signal.' },
      { es: 'En modelos con fondo de zafiro, comprueba el rotor firmado (oro de 21K/22K) y el número de calibre.', en: 'On sapphire-back models inspect for the signed rotor (21K/22K gold) and the caliber number.' },
    ],
  },
  {
    id: 'patek-dial-logo',
    label: { es: 'Esfera, logotipo e impresión', en: 'Dial, logo & printing' },
    points: [
      { es: 'El logotipo de la cruz de Calatrava está finamente aplicado/impreso, con brazos nítidos y simétricos.', en: 'The Calatrava cross logo is finely applied/printed with crisp, symmetric arms.' },
      { es: 'Los índices aplicados y el texto "PATEK PHILIPPE GENEVE" son nitidísimos; numerales baton/Breguet correctos para el modelo.', en: 'Applied markers and "PATEK PHILIPPE GENEVE" text are razor-sharp; baton/Breguet numerals correct for the model.' },
      { es: 'Las esferas de guilloché y esmalte (si las lleva) muestran patrones impecables y uniformes — las réplicas emborronan el trabajo fino.', en: 'Guilloché and enamel dials (where fitted) show flawless, even patterns — replicas blur the fine work.' },
    ],
  },
  {
    id: 'patek-case-hallmarks',
    label: { es: 'Caja, punzones y grabado', en: 'Case, hallmarks & engraving' },
    points: [
      { es: 'El canto de la caja y las asas muestran punzones nítidos (pureza del oro, marcas de contraste) y los números de referencia/movimiento grabados profundos y limpios.', en: 'Case-side and lugs show crisp hallmarks (gold purity, assay marks) and the reference/movement numbers deeply, cleanly engraved.' },
      { es: 'Punzón de Ginebra / marcas Sigma en esferas antiguas cuando corresponda.', en: 'Geneva hallmark / Sigma marks on older dials where applicable.' },
      { es: 'Superficies pulidas/satinadas nítidas; en el Nautilus las "orejas" y el bisel tipo ojo de buey son perfectamente simétricos con un satinado limpio.', en: 'Sharp polished/satined surfaces; on the Nautilus the "ears" and porthole bezel are perfectly symmetric with crisp brushing.' },
    ],
  },
  {
    id: 'patek-nautilus-aquanaut',
    label: { es: 'Particularidades del Nautilus / Aquanaut', en: 'Nautilus / Aquanaut specifics' },
    points: [
      { es: 'Esfera con relieve horizontal (degradado) y líneas de relieve finas y uniformes; la textura es precisa, nunca superficial ni emborronada.', en: 'Horizontally-embossed (gradient) dial with fine, even relief lines; the texture is precise, never shallow or muddy.' },
      { es: 'Los eslabones del brazalete integrado son macizos, con transiciones de satinado/pulido perfectamente alineadas.', en: 'Integrated bracelet links are solid with perfectly aligned brushing/polishing transitions.' },
      { es: 'El calibre coincide (p. ej. 26-330 S C en 5711/5167; 240 PS IRM C LU en 5712).', en: 'Caliber matches (e.g. 26-330 S C in 5711/5167; 240 PS IRM C LU in 5712).' },
    ],
  },
  {
    id: 'patek-bracelet-strap',
    label: { es: 'Brazalete / correa y hebilla', en: 'Bracelet / strap & buckle' },
    points: [
      { es: 'Cierre desplegable grabado con la cruz de Calatrava; acción precisa y sensación de solidez.', en: 'Fold-over clasp engraved with the Calatrava cross; precise action and solid feel.' },
      { es: 'La correa de composite "Tropical" del Aquanaut tiene un patrón en relieve nítido que combina con la esfera.', en: 'Aquanaut "Tropical" composite strap has a crisp embossed pattern matching the dial.' },
      { es: 'Peso general sustancial en las referencias de metal precioso.', en: 'Overall substantial weight for precious-metal references.' },
    ],
  },
];

const AP_CHECKPOINTS: readonly AuthCheckpoint[] = [
  {
    id: 'ap-tapisserie',
    label: { es: 'Esfera Tapisserie', en: 'Tapisserie dial' },
    points: [
      { es: 'El guilloché "Grande/Petite Tapisserie" es nitidísimo, con pirámides perfectamente cuadradas y uniformes — lo más difícil de replicar para las falsificaciones.', en: 'The "Grande/Petite Tapisserie" guilloché is razor-sharp with perfectly square, even pyramids — the single hardest thing for fakes to replicate.' },
      { es: 'Los índices horarios de oro blanco aplicados y el logo AP son nítidos, con lume uniforme.', en: 'Applied white-gold hour markers and AP logo are crisp with even lume.' },
      { es: 'Texto de la esfera y alineación del monograma "AP" correctos para el modelo/época.', en: 'Correct dial text and "AP" monogram alignment for the model/era.' },
    ],
  },
  {
    id: 'ap-octagonal-bezel',
    label: { es: 'Bisel octogonal y tornillos', en: 'Octagonal bezel & screws' },
    points: [
      { es: 'Los ocho tornillos hexagonales del bisel están perfectamente alineados (todas las ranuras en la misma dirección) y bien acabados.', en: 'The eight hexagonal screws on the bezel are perfectly aligned (all slots facing the same way) and finely finished.' },
      { es: 'Las aristas del octógono del bisel están nítidamente achaflanadas; cara superior satinada con biseles pulidos.', en: 'The bezel octagon edges are crisply chamfered; brushed top with polished bevels.' },
    ],
  },
  {
    id: 'ap-movement',
    label: { es: 'Acabado del movimiento', en: 'Movement finishing' },
    points: [
      { es: 'Acabado de alto nivel: Côtes de Genève, perlado, biseles pulidos y un rotor firmado de oro de 22K/21K (p. ej. Cal. 4302/3120/7121/2121).', en: 'High-grade finishing: Côtes de Genève, perlage, polished bevels and a 22K/21K gold signed rotor (e.g. Cal. 4302/3120/7121/2121).' },
      { es: 'El calibre debe coincidir con la referencia (2121 en el 15202 vintage; 7121 en el 16202; 4302 en 15500/15510).', en: 'Caliber must match the reference (2121 in vintage 15202; 7121 in 16202; 4302 in 15500/15510).' },
      { es: 'Los movimientos de la familia 2121 son ultrafinos — un movimiento grueso en un "Jumbo" es incorrecto.', en: 'The 2121-family movements are ultra-thin — a thick movement in a "Jumbo" is wrong.' },
    ],
  },
  {
    id: 'ap-bracelet',
    label: { es: 'Brazalete integrado y cierre', en: 'Integrated bracelet & clasp' },
    points: [
      { es: 'Eslabones que se estrechan con transiciones satinado/pulido impecables; el brazalete fluye sin costuras desde la caja.', en: 'Tapered links with flawless brushed/polished transitions; the bracelet flows seamlessly from the case.' },
      { es: 'Cierre desplegable firmado AP con acción precisa; eslabones macizos y con peso.', en: 'AP-signed folding clasp with precise action; solid, heavy links.' },
      { es: 'Los grabados del fondo y del cierre (referencia, AP, punzones) son profundos y limpios.', en: 'Case-back and clasp engravings (reference, AP, hallmarks) are deep and clean.' },
    ],
  },
];

const CARTIER_CHECKPOINTS: readonly AuthCheckpoint[] = [
  {
    id: 'cartier-secret-signature',
    label: { es: 'Firma secreta y esfera', en: 'Secret signature & dial' },
    points: [
      { es: 'Cartier oculta "Cartier" dentro de un numeral romano (a menudo la "X" de las 10 o el "VII" de las 7) — una firma secreta microimpresa; compruébala con lupa.', en: 'Cartier hides "Cartier" within a Roman numeral (often the "X" at 10 or "VII" at 7) — a micro-printed secret signature; check under a loupe.' },
      { es: 'Esfera de numerales romanos: los numerales están impresos con precisión, el minutero tipo ferrocarril es nítido y las agujas espada de acero pavonado tienen un templado uniforme.', en: 'Roman-numeral dial: numerals are precisely printed, the railway minute track is crisp, and the blued-steel sword hands are evenly tempered.' },
      { es: 'En Santos/Tank, el logotipo "Cartier" y la impresión son nítidos con la tipografía correcta.', en: 'On Santos/Tank, the "Cartier" wordmark and printing are sharp with correct fonts.' },
    ],
  },
  {
    id: 'cartier-cabochon-crown',
    label: { es: 'Corona y cabujón', en: 'Crown & cabochon' },
    points: [
      { es: 'La corona de cuerda lleva un cabujón facetado de zafiro/espinela azul (sintético en modelos de acero) — bien engastado, uniforme y transparente.', en: 'The winding crown holds a faceted blue sapphire/spinel cabochon (synthetic on steel models) — well-set, even, and clear.' },
      { es: 'La acción de la corona es suave; el cabujón está centrado y sin restos de pegamento.', en: 'Crown action is smooth; the cabochon is centred with no glue residue.' },
    ],
  },
  {
    id: 'cartier-case-screws',
    label: { es: 'Caja, tornillos y acabado', en: 'Case, screws & finishing' },
    points: [
      { es: 'Santos: los ocho tornillos vistos del bisel y el brazalete son reales, alineados y bien acabados (no fundidos/decorativos).', en: 'Santos: the eight exposed screws on the bezel and bracelet are real, aligned and finely finished (not cast/decorative).' },
      { es: 'Superficies satinadas/pulidas nítidas; en el Tank los brancards (laterales de la caja) son limpios y simétricos.', en: 'Crisp brushed/polished surfaces; on the Tank the brancards (case sides) are clean and symmetric.' },
      { es: 'Los grabados del fondo y de las asas (referencia, serial, "Swiss Made") son profundos y uniformes.', en: 'Case-back and lug engravings (reference, serial, "Swiss Made") are deep and even.' },
    ],
  },
  {
    id: 'cartier-movement',
    label: { es: 'Movimiento (referencias mecánicas)', en: 'Movement (mechanical refs)' },
    points: [
      { es: 'Calibres de manufactura Cartier "MC" (1847 MC, 1904 MC, 430 MC, etc.) — acabado con Côtes de Genève y rotor firmado en los automáticos.', en: 'Manufacture Cartier "MC" calibers (1847 MC, 1904 MC, 430 MC, etc.) — finishing with Côtes de Genève and a signed rotor on automatics.' },
      { es: 'El calibre debe coincidir con la referencia y ser mecánico cuando así se anuncia (un movimiento de cuarzo en un reloj vendido como automático es un delator obvio).', en: 'Caliber should match the reference and be mechanical where claimed (a quartz movement in a watch sold as automatic is an obvious tell).' },
    ],
  },
  {
    id: 'cartier-bracelet',
    label: { es: 'Brazalete y SmartLink / cierre', en: 'Bracelet & SmartLink / clasp' },
    points: [
      { es: 'El cambio de correa QuickSwitch y el ajuste SmartLink del Santos funcionan limpiamente; los eslabones son macizos.', en: 'Santos QuickSwitch strap-change and SmartLink adjustment operate cleanly; links are solid.' },
      { es: 'El cierre desplegable está firmado por Cartier, con acción precisa y buen peso.', en: 'Deployant/folding clasp is Cartier-signed with precise action and good heft.' },
    ],
  },
];

/** Single source of truth — must include every supported brand (incl. Rolex). */
export const BRAND_CHECKPOINTS: Readonly<Record<string, readonly AuthCheckpoint[]>> = {
  rolex: ROLEX_AUTH_CHECKPOINTS,
  omega: OMEGA_CHECKPOINTS,
  'patek-philippe': PATEK_CHECKPOINTS,
  'audemars-piguet': AP_CHECKPOINTS,
  cartier: CARTIER_CHECKPOINTS,
};

/** Returns the visual authentication checkpoints for a brand id (or []). */
export function getBrandCheckpoints(brandId: string): readonly AuthCheckpoint[] {
  return BRAND_CHECKPOINTS[brandId] ?? [];
}
