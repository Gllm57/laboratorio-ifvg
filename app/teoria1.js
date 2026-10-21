// Teoría ampliada, días 1–17. Cada día: secciones (h, p, dg opcional), errores comunes y un ejemplo resuelto.
window.THEORY = window.THEORY || {};
Object.assign(window.THEORY, {
  1: {
    secs: [
      { h: 'Qué vas a construir en 50 días', p: 'El objetivo del bootcamp no es memorizar conceptos, sino tener un proceso que puedas repetir cada mañana sin pensar: preparar el gráfico, esperar la ventana, reconocer uno de los tres modelos, ejecutar con el riesgo fijo y registrar el resultado. Cada fase de la ruta añade una pieza de ese proceso.' },
      { h: 'Por qué una sola estrategia', p: 'Cuando cambias de estrategia cada semana nunca acumulas suficientes operaciones para saber si funciona ni para dominarla. Con una sola estrategia cada sesión suma experiencia sobre lo mismo: aprendes en qué días aparece, cómo se ve cuando falla y cuánto ganas o pierdes de media. Esa información es tu ventaja.' },
      { h: 'Los tres pilares', p: 'La estrategia (toma de liquidez + IFVG + objetivo claro) es solo uno de tres pilares. Los otros dos son la gestión de riesgo (arriesgar siempre 0,5–0,7 %) y la psicología (respetar el plan aunque tengas ganas de saltártelo). Fede cuenta que llegó a perder 20 cuentas de fondeo con la misma estrategia por fallar en los otros dos.' },
      { h: 'Cómo usar esta app', p: 'Cada día: lee la teoría, mira los gráficos y aprueba el control. Después haz una ronda de práctica y una sesión en el simulador. La nota de disciplina del simulador es la medida más honesta de tu progreso: dice si seguiste el plan, no si tuviste suerte.' },
    ],
    err: ['Saltar a la estrategia sin entender el contexto ni el riesgo.', 'Medir el progreso en dinero en lugar de en ejecución.', 'Ver muchos videos y no practicar nunca.'],
    ej: 'Rutina mínima de un día: 15 minutos de lección, 10 minutos de práctica (una ronda), 20 minutos de sesión simulada y 5 minutos de diario. Menos de una hora, todos los días.',
  },
  2: {
    secs: [
      { h: 'Comprar y vender', p: 'En trading puedes ganar en ambas direcciones. En una compra (long) entras esperando que el precio suba y cierras más arriba. En una venta (short) entras esperando que baje y cierras más abajo. En futuros vender en corto es tan simple como comprar: un botón.', dg: 'bidask' },
      { h: 'Qué son los futuros del Nasdaq y del S&P 500', p: 'Un contrato de futuros replica el precio de un índice. NQ sigue al Nasdaq 100 y ES al S&P 500. Se negocian casi 24 horas, tienen mucha liquidez y se mueven con fuerza en la apertura de Nueva York, que es justo cuando opera esta estrategia.' },
      { h: 'Trading no es invertir', p: 'Un inversor compra para mantener meses o años. Un trader intradía busca un movimiento de minutos, con la pérdida máxima definida antes de entrar. Cada operación tiene una entrada, un stop loss (dónde te equivocaste) y un take profit (dónde cobras).' },
      { h: 'De dónde sale la ganancia', p: 'Ninguna operación individual es segura. La ganancia aparece en la suma de muchas operaciones: si ganas un poco más de lo que pierdes, y lo haces muchas veces con el mismo riesgo, la cuenta crece. Por eso la consistencia importa más que acertar un trade concreto.' },
    ],
    err: ['Pensar que solo se gana cuando el mercado sube.', 'Entrar sin saber dónde está el stop.', 'Juzgar la estrategia por una sola operación.'],
    ej: 'Vendes 1 MNQ en 20.000 con stop en 20.010 y objetivo en 19.985. Si llega al objetivo ganas 15 puntos × 2 $ = 30 $. Si toca el stop pierdes 10 × 2 $ = 20 $. Sabes las dos cifras antes de entrar.',
  },
  3: {
    secs: [
      { h: 'Esperar es parte del trabajo', p: 'De los 90 minutos de la ventana, la mayor parte se pasa esperando. Primero esperas que abra el mercado, luego que haya una toma de liquidez y luego que una vela cierre invalidando un FVG. Entrar antes de cualquiera de esos pasos es adivinar.', dg: 'patience' },
      { h: 'El cierre de la vela manda', p: 'Muchas entradas malas vienen de entrar cuando la vela todavía se está formando. Una vela de 1 minuto puede parecer que rompe el FVG y cerrar de vuelta dentro. La estrategia confirma con el cierre: espera a que termine el minuto.' },
      { h: 'Días sin setup', p: 'Algunos días el mercado no manipula, o lo hace sin desplazamiento, o no deja un objetivo con R:R 1:1. Esos días no se opera. Fede lo dice claro: si el día tiene malas condiciones no tradea, y está bien. No operar es una decisión correcta, y en el simulador te da la nota máxima.', dg: 'notrade' },
    ],
    err: ['Entrar “porque ya va a girar” sin el cierre de confirmación.', 'Bajar a temporalidades de segundos para buscar algo que hacer.', 'Operar fuera de la ventana para compensar un día sin setup.'],
    ej: 'A las 9:42 el precio barre el mínimo del pre-market. La vela siguiente sube con fuerza pero a las 9:43:40 todavía no cerró sobre el FVG. Esperas. Cierra a las 9:44 por encima: ese es el momento de entrar.',
  },
  4: {
    secs: [
      { h: 'Dos herramientas distintas', p: 'La plataforma de gráficos (por ejemplo TradingView) sirve para analizar: marcar niveles, FVG y cambiar de temporalidad. El broker o la empresa de fondeo es donde se ejecuta la orden. Muchas plataformas permiten hacer las dos cosas, pero conviene saber qué hace cada una.' },
      { h: 'Valor del punto', p: 'Cada contrato de futuros tiene un valor por punto. Es la base para calcular cuánto arriesgas: puntos de stop × valor del punto × contratos. Los contratos micro (MNQ, MES) valen una décima parte y permiten ajustar el riesgo en cuentas pequeñas.', dg: 'platforms' },
      { h: 'El tick', p: 'El precio de los índices se mueve en saltos de 0,25 puntos (un tick). En NQ un tick vale 5 $ y en MNQ 0,50 $. Por eso los precios del simulador terminan en ,00 ,25 ,50 o ,75.' },
      { h: 'Cuenta de fondeo', p: 'Una empresa de fondeo te deja operar su capital si pasas una evaluación respetando un límite de pérdida. Es lo que usa Fede. Lo verás en detalle en el día 40.' },
    ],
    err: ['Calcular el riesgo sin saber el valor del punto del contrato.', 'Usar NQ en una cuenta pequeña y arriesgar de más.', 'Confundir ticks con puntos.'],
    ej: 'Stop de 20 puntos. Con 1 NQ arriesgas 20 × 20 $ = 400 $. Con 1 MNQ arriesgas 20 × 2 $ = 40 $. En una cuenta de 50.000 $ al 0,5 % (250 $), con MNQ puedes usar 6 contratos (240 $).',
  },
  5: {
    secs: [
      { h: 'Resultado frente a proceso', p: 'Una meta de resultado (“ganar 5.000 $ este mes”) depende del mercado. Una meta de proceso (“seguir el plan en 20 sesiones”) depende solo de ti. Las de proceso se pueden cumplir siempre; las de resultado aparecen como consecuencia.', dg: 'goals' },
      { h: 'Metas en cascada', p: 'Del mes a la semana y de la semana a la sesión. Ejemplo: este mes completar la fase 2 y 20 sesiones simuladas; esta semana 5 sesiones con disciplina ≥ 85; hoy una lección, una ronda de práctica y una sesión.' },
      { h: 'Medir para mejorar', p: 'Si no lo registras no sabes si avanzas. La app mide por ti: días completados, precisión en la práctica y nota de disciplina. Fíjate en la tendencia de las últimas 10–20 sesiones, no en un día suelto.' },
    ],
    err: ['Ponerse metas de dinero en la primera semana.', 'Metas vagas (“mejorar”) sin un número.', 'Cambiar la meta cuando no se cumple en lugar de revisar el proceso.'],
    ej: 'Meta semanal buena: “5 sesiones simuladas con disciplina media ≥ 80 y la fase 1 completa”. Es concreta, medible y depende de ti.',
  },
  6: {
    secs: [
      { h: 'El mercado tiene horarios de actividad', p: 'Los futuros abren casi 24 horas, pero el volumen se concentra en tres sesiones: Asia, Londres y Nueva York. La apertura de la bolsa de Nueva York a las 9:30 (hora NY) es el momento de más volatilidad del día para NQ y ES.', dg: 'sessions' },
      { h: 'Las dos ventanas de Fede', p: 'Sesión NY AM de 9:30 a 11:00 y sesión asiática de 20:00 a 21:30, ambas en hora de Nueva York. La estrategia funciona en cualquiera de las dos; elige la que encaje con tu vida. Uno de los mentores de su comunidad opera solo Asia.' },
      { h: 'Antes y después', p: 'Conéctate 15 minutos antes para marcar los niveles del pre-market y revisar noticias. Cuando termina la ventana, cierras los gráficos aunque no hayas operado. Fuera de la ventana el mercado se mueve con menos intención y las señales son peores.' },
      { h: 'Hora de tu país', p: 'Convierte la hora de Nueva York a la tuya y ten en cuenta los cambios de horario de verano, que no ocurren en las mismas fechas en todos los países. Un error de una hora te hace operar en el momento equivocado.' },
    ],
    err: ['Operar a las 12:00 porque “todavía se mueve”.', 'No ajustar el cambio de horario de verano.', 'Llegar justo a las 9:30 sin haber marcado los niveles.'],
    ej: 'Si vives en Madrid (6 horas más que Nueva York la mayor parte del año), la ventana NY AM es de 15:30 a 17:00 y te sientas a analizar a las 15:15.',
  },
  7: {
    secs: [
      { h: 'Anatomía de una vela', p: 'Cada vela resume un periodo: el precio de apertura, el máximo, el mínimo y el cierre. El cuerpo va de la apertura al cierre y las mechas llegan a los extremos. En esta app las velas alcistas son lima (rellenas) y las bajistas lavanda (huecas).', dg: 'candle' },
      { h: 'Qué cuenta cada parte', p: 'Un cuerpo grande con mechas cortas indica desplazamiento: un lado dominó el periodo. Una mecha larga indica rechazo: el precio fue a esa zona y lo devolvieron. Las mechas largas que superan un máximo o mínimo son la huella típica de una toma de liquidez.', dg: 'candlepat' },
      { h: 'Las temporalidades son fractales', p: 'Cinco velas de 1 minuto forman una de 5 minutos. Un IFVG en 1 minuto puede verse como una simple mecha en 5 minutos. Por eso el análisis va de mayor a menor: la temporalidad grande da el contexto y la de 1 minuto da la entrada. Prueba el selector de temporalidad del simulador para verlo.' },
    ],
    err: ['Decidir con la vela a medio formar.', 'Ignorar las mechas: muestran dónde hubo stops.', 'Mirar solo 1 minuto sin contexto.'],
    ej: 'Vela de 1 minuto: abre 20.010, baja a 19.996, sube a 20.016 y cierra 20.014. Es alcista con una mecha inferior de 14 puntos: hubo rechazo de precios bajos.',
  },
  8: {
    secs: [
      { h: 'Máximos y mínimos', p: 'La tendencia se lee con los giros del precio. Alcista: cada máximo es más alto (HH) y cada mínimo también (HL). Bajista: máximos más bajos (LH) y mínimos más bajos (LL). Si no hay ni una cosa ni la otra, es un rango.', dg: 'trend' },
      { h: 'Contexto antes que entrada', p: 'Antes de la apertura mira 4H y 1H. Si la estructura es bajista, los modelos 1 y 2 se buscan en ventas: manipulación hacia arriba y entrada a favor de la caída. El modelo 3 es la excepción: es un retroceso contra la expansión del día.' },
      { h: 'Cuándo cambia la tendencia', p: 'Una tendencia alcista se pone en duda cuando el precio cierra por debajo del último HL. No basta con una mecha. Lo verás en detalle en el día 9 con el quiebre de estructura.' },
    ],
    err: ['Llamar tendencia a dos velas seguidas.', 'Operar en contra de 4H y 1H con los modelos 1 y 2.', 'Marcar máximos y mínimos irrelevantes de 1 minuto como si fueran estructura mayor.'],
    ej: '1H: máximos en 20.100, 20.180, 20.250 y mínimos en 20.020, 20.090, 20.160. Estructura alcista. En la apertura buscas que barra un mínimo y dé un IFVG alcista.',
  },
  9: {
    secs: [
      { h: 'Quiebre de estructura (BOS)', p: 'Un BOS ocurre cuando una vela cierra más allá del último máximo (en alcista) o del último mínimo (en bajista). A favor de la tendencia confirma continuación.', dg: 'bos' },
      { h: 'Cambio de carácter (CHoCH)', p: 'Cuando el cierre rompe en contra (en alcista, por debajo del último HL) se habla de cambio de carácter: la tendencia puede estar girando. Suele llegar después de una toma de liquidez del extremo.', dg: 'choch' },
      { h: 'Quiebre frente a toma de liquidez', p: 'La diferencia es el cierre. Si la vela supera el nivel con la mecha y cierra de vuelta, no es quiebre: es una toma de liquidez (el día 13). Si cierra más allá con cuerpo grande, es quiebre. Confundirlos es uno de los errores más comunes.' },
    ],
    err: ['Tomar una mecha como quiebre.', 'Marcar quiebres en cada mini giro de 1 minuto.', 'Entrar en el quiebre sin esperar el IFVG.'],
    ej: 'Último HL en 20.090. Una vela de 5 minutos baja a 20.082 y cierra en 20.095: no hay quiebre, fue un barrido. La siguiente cierra en 20.070: ahora sí hay quiebre bajista.',
  },
  10: {
    secs: [
      { h: 'Qué es la disciplina en trading', p: 'Es ejecutar el plan igual el lunes después de ganar y el martes después de perder. Es una habilidad que se entrena con rutina, no un rasgo de personalidad.', dg: 'discipline' },
      { h: 'Las tres reglas que más se rompen', p: 'Arriesgar más de lo previsto, tomar más de un trade y operar fuera de la ventana. Las tres vienen de la emoción: ganas de recuperar, euforia o aburrimiento. Las tres están en la nota de disciplina del simulador.' },
      { h: 'Rutina que protege', p: 'Pre-market (niveles, noticias, riesgo calculado), sesión (checklist), post-trading (diario y cerrar gráficos). Cuando cada paso está definido, hay menos espacio para improvisar.' },
    ],
    err: ['Pensar que la disciplina se tiene o no se tiene.', 'Romper “solo un poco” el plan en un día bueno.', 'No registrar las veces que rompes el plan.'],
    ej: 'Ganaste a las 9:48. Te quedan 70 minutos de ventana y ves otro setup a las 10:20. El plan dice un trade por sesión: no lo tomas. Anota en el diario que lo viste; eso también es práctica.',
  },
  11: {
    secs: [
      { h: 'Quién mueve el mercado', p: 'Los bancos y fondos operan volúmenes enormes. Para comprar mucho necesitan que alguien les venda, y la mayor fuente de órdenes contrarias son los stops de otros traders. Por eso el precio suele ir a buscar esos stops antes del movimiento real.', dg: 'smartmoney' },
      { h: 'Oferta y demanda', p: 'Una zona de demanda es donde entraron compras fuertes (el precio salió disparado hacia arriba). Una de oferta, donde entraron ventas fuertes. Esas zonas dejan huellas visibles: desplazamiento, FVG y order blocks.' },
      { h: 'Cómo lo usamos', p: 'No predecimos lo que harán. Esperamos ver la huella (barren liquidez y desplazan en dirección contraria) y nos subimos detrás. Toda la estrategia se basa en esta idea: primero la manipulación, después el movimiento.' },
    ],
    err: ['Creer que las instituciones “cazan tu stop” personalmente.', 'Ver zonas de oferta y demanda en cualquier vela.', 'Entrar antes de ver la huella.'],
    ej: 'El precio cae 15 puntos en 2 minutos, barre los mínimos de la noche y en la vela siguiente sube 25 puntos dejando un hueco. La caída buscó liquidez; la subida es el movimiento con intención.',
  },
  12: {
    secs: [
      { h: 'Dónde están los stops', p: 'Quien compró pone el stop debajo de un mínimo; quien vendió, encima de un máximo. Por eso hay órdenes acumuladas justo más allá de los máximos y mínimos visibles. Eso es la liquidez.', dg: 'liquidity' },
      { h: 'Los niveles que importan', p: 'Para la apertura de NY los más importantes son el máximo y el mínimo del pre-market (lo que hizo el precio antes de las 9:30), el máximo y mínimo del día anterior (PDH y PDL) y los máximos o mínimos iguales. Cuanto más evidente es un nivel, más stops tiene.', dg: 'premarket' },
      { h: 'Liquidez como objetivo', p: 'La liquidez sirve para dos cosas. Del lado que se barre, es la manipulación que inicia el setup. Del lado contrario, si aún no se tomó, es el objetivo natural de tu take profit.' },
    ],
    err: ['Poner tu stop justo en el máximo o mínimo obvio.', 'Marcar demasiados niveles: quédate con los evidentes.', 'Olvidar los niveles del pre-market.'],
    ej: 'Pre-market entre 20.040 y 20.110. A las 9:34 el precio baja a 20.031, barre el mínimo y vuelve arriba. Tu objetivo natural es el máximo del pre-market en 20.110, aún sin tomar.',
  },
  13: {
    secs: [
      { h: 'Definición', p: 'Una toma de liquidez es una falla de desplazamiento: el precio supera un máximo o mínimo, activa los stops y no consigue cerrar más allá (o vuelve a cerrar dentro en muy pocas velas). Es el primer paso de la estrategia.', dg: 'sweep' },
      { h: 'Qué indica la dirección', p: 'Si barre un mínimo, se buscan compras: se llevaron los stops de los compradores y el precio puede subir. Si barre un máximo, se buscan ventas. Lo ideal es que el barrido ocurra en un punto de interés (un FVG de 5 o 15 minutos) y a favor de la tendencia mayor.' },
      { h: 'El extremo es tu stop', p: 'El punto más lejano al que llegó la manipulación marca dónde está equivocada la idea. Si el precio vuelve a superarlo, la manipulación no fue tal. Por eso el stop se coloca justo detrás de ese extremo.' },
      { h: 'Cuándo no vale', p: 'Si el precio supera el nivel y sigue cerrando más allá con cuerpos grandes, no es un barrido: es un quiebre y la liquidez sirvió de combustible. En ese caso no hay setup en esa dirección.' },
    ],
    err: ['Comprar en el mismo momento en que barre, sin IFVG.', 'Confundir un quiebre con un barrido.', 'Poner el stop dentro del rango del barrido.'],
    ej: 'Mínimo del pre-market 20.040. A las 9:36 una vela llega a 20.028 y cierra 20.046. Toma de liquidez del mínimo: buscas compras, con el stop por debajo de 20.028.',
  },
  14: {
    secs: [
      { h: 'Cómo actúa el miedo', p: 'El miedo a perder hace que no entres en un setup válido, que muevas el stop para no ver la pérdida o que cierres antes del objetivo. Todo eso destruye la estadística: cortas las ganancias y alargas las pérdidas.', dg: 'fear' },
      { h: 'El contra trade', p: 'Es entrar en la dirección contraria justo después de perder, por enojo o para “recuperar”. No sale de un análisis, sale de la emoción. Es una de las formas más rápidas de quemar una cuenta.' },
      { h: 'Cómo se reduce', p: 'Riesgo pequeño (0,5 %) para que una pérdida no duela, reglas escritas antes de la sesión y la regla de un trade: después de un stop la sesión termina. Si sientes que tienes que recuperar, cierra la plataforma.' },
    ],
    err: ['Mover el stop en contra para “darle aire”.', 'Entrar al revés tras un stop.', 'Saltar un setup válido después de dos pérdidas.'],
    ej: 'Pierdes a las 9:41. A las 9:50 el precio sube fuerte y sientes que “era al revés”. El plan dice un SL y te vas: cierras. Anota la emoción en el diario.',
  },
  15: {
    secs: [
      { h: 'Riesgo fijo por operación', p: 'Arriesgas un porcentaje fijo de la cuenta en cada trade: 0,5 a 0,7 %. Así ninguna operación decide tu mes y puedes sobrevivir a las rachas malas, que llegan incluso con una buena estrategia.', dg: 'risk' },
      { h: 'Rachas y matemática', p: 'Con 0,5 % por trade, 10 pérdidas seguidas suponen alrededor de −5 %. Con 5 % por trade, la misma racha deja la cuenta cerca de −40 %, y recuperar un −40 % exige ganar un 67 %. El riesgo pequeño no es timidez: es lo que te deja seguir jugando.' },
      { h: 'Relación riesgo-beneficio (R:R)', p: 'Si arriesgas 1 R y apuntas a 1,3 R, necesitas acertar menos de la mitad de las veces para ganar dinero. El mínimo aceptable es 1:1. Por debajo, ni acertando a menudo compensa.', dg: 'rr' },
    ],
    err: ['Subir el riesgo para recuperar una pérdida.', 'Aceptar trades con R:R menor que 1.', 'Calcular el riesgo después de entrar.'],
    ej: 'Cuenta de 50.000 $ al 0,5 %: 250 $ por trade = 1 R. Con R:R 1:1,3 ganas 325 $ cuando aciertas. Con 50 % de acierto en 20 trades: 10 × 325 − 10 × 250 = +750 $.',
  },
  16: {
    secs: [
      { h: 'Qué es un FVG', p: 'Un Fair Value Gap es un hueco que deja un movimiento fuerte de tres velas: la mecha de la primera y la de la tercera no se tocan. En ese rango el precio solo pasó en una dirección, sin negociación equilibrada.', dg: 'fvg' },
      { h: 'Alcista y bajista', p: 'FVG alcista: el mínimo de la vela 3 queda por encima del máximo de la vela 1. FVG bajista: el máximo de la vela 3 queda por debajo del mínimo de la vela 1. La zona del FVG va de una mecha a la otra.', dg: 'fvgbear' },
      { h: 'Para qué sirve', p: 'Como punto de interés: el precio suele volver a visitarlo y reaccionar. Como objetivo: un FVG sin rellenar en la dirección de tu trade es un buen take profit. Y como base del IFVG (día 28), que es el gatillo de entrada.' },
      { h: 'Calidad', p: 'Un FVG creado con desplazamiento (velas grandes, mechas cortas) vale más que uno diminuto en un rango lento. Los FVG de 5 y 15 minutos marcan zonas; los de 1 minuto sirven para la entrada.' },
    ],
    err: ['Medir el hueco entre cuerpos en lugar de entre mechas.', 'Marcar FVG de 1 tick sin desplazamiento.', 'Olvidar los FVG de temporalidades mayores.'],
    ej: 'Vela 1: máximo 20.050. Vela 2: sube de 20.048 a 20.075. Vela 3: mínimo 20.058. Hay un FVG alcista entre 20.050 y 20.058.',
  },
  17: {
    secs: [
      { h: 'El stop loss', p: 'Va detrás del extremo de la manipulación: debajo del mínimo barrido en compras y encima del máximo barrido en ventas, con un margen de uno o dos puntos. Si el precio vuelve allí, la idea estaba equivocada.', dg: 'sltp' },
      { h: 'El take profit', p: 'Va en un objetivo claro en la dirección del trade: liquidez sin tomar (un máximo o mínimo que el precio todavía no superó, como el del pre-market) o un FVG sin rellenar. Si el primer objetivo no da al menos 1:1, no hay trade.' },
      { h: 'Break even', p: 'Cuando el precio alcanza el primer máximo o mínimo intermedio que no es tu objetivo, Fede suele mover el stop a la entrada. Desde ese momento la operación no puede terminar en pérdida. En el simulador tienes el botón “Stop a break even”.', dg: 'be' },
      { h: 'No se toca después', p: 'Una vez dentro, el stop solo se mueve a favor (break even). Alejarlo cuando el precio se acerca convierte una pérdida pequeña en una grande.' },
    ],
    err: ['Stop justo en el nivel barrido, sin margen.', 'TP “a ojo” sin liquidez ni FVG.', 'Mover a break even demasiado pronto, antes de un máximo intermedio.'],
    ej: 'Compra en 20.060 tras barrer 20.028. Stop en 20.026 (34 puntos). Máximo del pre-market sin tomar en 20.110 (50 puntos): R:R 1:1,5. A mitad de camino hay un máximo intermedio en 20.085: al tocarlo, stop a 20.060.',
  },
});
