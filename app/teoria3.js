// Teoría ampliada, días 35–50.
window.THEORY = window.THEORY || {};
Object.assign(window.THEORY, {
  35: {
    secs: [
      { h: 'Tres pasos y nada más', p: 'Toma de liquidez, IFVG y objetivo claro. La idea de fondo: no hace falta nada más que esto. Todo lo demás (order blocks, SMT, CISD, cuartos) es contexto opcional.', dg: 'simple' },
      { h: 'El costo de añadir reglas', p: 'Cada indicador o confluencia extra es una casilla más que puede no cumplirse, y una excusa más para dudar. Con demasiadas reglas, o no entras nunca o eliges qué regla mirar según lo que quieres hacer.' },
      { h: 'Simple es medible', p: 'Si tu proceso tiene 3 pasos, en 50 trades sabes con precisión qué funciona. Si tiene 12, nunca sabrás cuál de ellos falló.' },
    ],
    err: ['Añadir indicadores tras una mala semana.', 'Exigir 5 confluencias para entrar.', 'Cambiar el checklist sin datos del diario.'],
    ej: 'Pregunta en voz alta antes de entrar: “¿Barrió? ¿Hay IFVG? ¿Hay objetivo a 1:1 o más?” Tres síes: entras. Un no: esperas.',
  },
  36: {
    secs: [
      { h: 'Qué es el backtesting', p: 'Probar la estrategia sobre datos pasados, vela a vela, como si fuera en vivo. Sirve para dos cosas: saber cómo se comporta la estrategia (acierto, R:R, rachas) y entrenar el ojo para reconocer los modelos.', dg: 'backtest' },
      { h: 'Cómo hacerlo bien', p: 'Usa el modo repetición de tu plataforma desde antes de las 9:30. Avanza una vela a la vez, sin mirar a la derecha. Aplica el checklist exacto y registra cada trade y cada día sin trade. El simulador de esta app funciona así y además te puntúa.' },
      { h: 'Muestra mínima', p: 'Con 10 trades el resultado es casi azar. Con 50–100 empiezas a ver la realidad: tu porcentaje de acierto, tu R medio y la racha perdedora más larga que debes estar preparado para aguantar.' },
    ],
    err: ['Mirar el futuro antes de decidir.', 'Saltarse los días malos en el backtest.', 'Sacar conclusiones con 15 trades.'],
    ej: '60 trades en backtest: 33 ganadores a +1,3 R y 27 perdedores a −1 R. Resultado: 33 × 1,3 − 27 = +15,9 R, unos 0,27 R por trade. Racha perdedora máxima: 5.',
  },
  37: {
    secs: [
      { h: 'Días para no operar', p: 'Cuando estás cansado, enfermo, enojado o eufórico. Cuando hay una noticia de alto impacto dentro de la ventana. Cuando ya tomaste tu trade. Cuando el mercado no da condiciones.', dg: 'notrade' },
      { h: 'Cómo reconocer un mal día de mercado', p: 'El precio lateraliza en un rango estrecho, no hay barrido claro de los niveles del pre-market y los movimientos son de velas pequeñas sin desplazamiento. Ningún FVG se respeta ni se invalida con fuerza.' },
      { h: 'No operar es una posición', p: 'Cerrar el día en cero cuando no hubo setup es una victoria de disciplina. En el simulador, terminar sin operar un día sin condiciones da 100 puntos.' },
    ],
    err: ['Bajar los requisitos al final de la ventana.', 'Operar por aburrimiento.', 'Considerar perdido un día sin trades.'],
    ej: 'De 9:30 a 10:40 el precio se mueve entre 20.050 y 20.070, sin tocar los niveles del pre-market. A las 10:45 una vela grande rompe hacia abajo sin barrido previo. No cumple el paso 1: no hay trade.',
  },
  38: {
    secs: [
      { h: 'Los tres modelos', p: 'La apertura decide el modelo. Si manipula y da entrada, modelo 1. Si expande en lugar de manipular, esperas retroceso y continuación: modelo 2. Si expande sin dar continuación, esperas el retroceso en contra: modelo 3.', dg: 'models' },
      { h: 'Modelo 1 · Manipulación (9:30–10:00)', p: 'En la apertura el precio barre la liquidez (normalmente el máximo o mínimo del pre-market), reacciona en un punto de interés y da IFVG. Es la variante más clara y la que más se repite. Idealmente a favor del sesgo.', dg: 'm1' },
      { h: 'Modelo 2 · Continuación (10:00–10:30, hasta 11:00)', p: 'La apertura expande. Luego el precio retrocede a un FVG de 5 minutos, barre un mínimo o máximo interno y da IFVG a favor de la expansión. Te subes a la corriente.', dg: 'm2' },
      { h: 'Modelo 3 · Retroceso', p: 'La apertura expande con fuerza y no deja una entrada de continuación. Como compradores y vendedores no se equilibraron, el precio suele volver hacia los FVG sin rellenar. Esperas el barrido del extremo y un IFVG en contra de la expansión.', dg: 'm3' },
      { h: 'Una variable por sesión', p: 'Si ya se dio la variable 1 y operaste, no buscas la 2. El plan es un trade por sesión, sea cual sea el modelo.' },
    ],
    err: ['Buscar el modelo 2 después de operar el 1.', 'Tomar el modelo 3 sin expansión previa clara.', 'Operar el modelo 2 en contra de la expansión.'],
    ej: 'A las 9:31 el precio sube 70 puntos sin pausa (expansión). A las 9:55 retrocede, barre un mínimo interno y da IFVG alcista a las 10:08: modelo 2, compra hacia el máximo de la expansión.',
  },
  39: {
    secs: [
      { h: 'El patrón base', p: 'Liquidez → manipulación → desplazamiento → objetivo. Se repite cada día, en todas las temporalidades. Lo que cambia es dónde ocurre la manipulación y qué tan lejos está el objetivo.', dg: 'repeat' },
      { h: 'Entrenar el reconocimiento', p: 'La forma más rápida de aprender a ver el patrón es repetirlo cientos de veces. Las prácticas de identificación (FVG, liquidez, IFVG) y el simulador generan escenarios nuevos cada vez. Una ronda al día durante un mes cambia por completo tu velocidad.' },
      { h: 'Ejemplos recientes', p: 'Revisa ejemplos de los últimos días, no de hace años: el comportamiento del mercado cambia y tu ojo se entrena con lo actual.' },
    ],
    err: ['Estudiar solo ejemplos perfectos.', 'No revisar los días en que el patrón falló.', 'Practicar una vez por semana.'],
    ej: 'Durante 20 días seguidos, marca en el gráfico real de NQ dónde estuvo el barrido, el IFVG y el objetivo, aunque no hayas operado. Compara con lo que habrías hecho.',
  },
  40: {
    secs: [
      { h: 'Cómo funciona el fondeo', p: 'Pagas una evaluación. Si alcanzas un objetivo de beneficio sin superar el límite de pérdida, te dan una cuenta con su capital y compartes las ganancias. Las reglas varían por empresa: lee siempre las condiciones.', dg: 'funded' },
      { h: 'El límite de pérdida', p: 'Muchas cuentas usan un drawdown con trailing: el límite sube cuando tu saldo sube. Por eso el riesgo bajo es clave: con 0,5 % por trade necesitas muchas pérdidas seguidas para tocarlo.' },
      { h: 'Replicar cuentas', p: 'Se pueden operar varias cuentas con un replicador: una cuenta líder ejecuta y las demás copian. El esfuerzo es el mismo que con una cuenta, pero los resultados (buenos y malos) se multiplican. Solo tiene sentido cuando ya eres consistente.' },
      { h: 'Costos', p: 'Evaluaciones, activaciones y datos son costos reales. El trading con fondeo es un negocio de retorno de inversión: cuenta lo que gastas en cuentas perdidas, no solo los retiros.' },
    ],
    err: ['Comprar evaluaciones sin consistencia previa en simulado.', 'No leer las reglas del drawdown.', 'Subir el riesgo para pasar la prueba rápido.'],
    ej: 'Cuenta de 50.000 $ con 2.500 $ de límite. A 250 $ por trade necesitas 10 pérdidas seguidas sin ganancias intermedias para tocarlo. A 1.000 $ por trade bastan 3.',
  },
  41: {
    secs: [
      { h: 'El proceso completo en futuros', p: 'Contexto de 4H y 1H → niveles del pre-market, PDH y PDL → espera de la apertura → reconocimiento del modelo → ejecución con el riesgo fijo → gestión (break even) → registro.', dg: 'm1' },
      { h: 'Qué medir', p: 'Para cada día: modelo, hora de entrada, R:R planeado, resultado en R, si moviste a break even y si el día tenía condiciones. Así puedes comparar modelos y horarios.' },
      { h: 'NQ frente a ES', p: 'NQ se mueve más en puntos y suele dar setups más limpios en la apertura; ES es más lento. Si operas ambos, compáralos por separado en el diario.' },
    ],
    err: ['Mezclar resultados de NQ y ES sin distinguirlos.', 'Registrar solo los días con trade.', 'Cambiar de activo cada semana.'],
    ej: 'Usa el simulador como backtest guiado: 20 sesiones seguidas, sin saltarte ninguna, y revisa en el diario qué modelo te dio más R.',
  },
  42: {
    secs: [
      { h: 'Lo mismo que en el backtest', p: 'Un trade real ganador sigue los mismos pasos que en la práctica: espera, confirmación, ejecución y gestión. La diferencia está en tu cabeza: el dinero real acelera el pulso.', dg: 'm2' },
      { h: 'Ejecución sin dudas', p: 'Cuando la vela cierra y confirma el IFVG, entras. Dudar 30 segundos puede empeorar el precio y el R:R. Tener los contratos calculados antes te permite ejecutar en segundos.' },
      { h: 'Después del TP', p: 'Cierras la plataforma. La euforia después de ganar es el momento perfecto para un segundo trade malo.' },
    ],
    err: ['Cerrar antes del TP por miedo a devolver.', 'Mover el TP más lejos en plena operación.', 'Seguir mirando el gráfico después del TP.'],
    ej: 'IFVG bajista a las 10:06, venta en 20.112, stop 20.131, TP en el mínimo interno 20.088 (1:1,3). A las 10:14 toca el mínimo intermedio en 20.100: break even. A las 10:19, TP.',
  },
  43: {
    secs: [
      { h: 'Etapas', p: 'Simulado con disciplina alta y sostenida → primera cuenta (fondeo o pequeña real) con el mismo plan → primeros retiros → más cuentas replicadas.', dg: 'scale' },
      { h: 'Cuándo pasar de etapa', p: 'Con datos: por ejemplo, 30 sesiones con disciplina media ≥ 85 y resultado positivo en R. No por una buena semana.' },
      { h: 'Escalar sin subir el riesgo', p: 'El riesgo por trade se mantiene en 0,5–0,7 % en cada cuenta. Lo que crece es el capital total operado, no la exposición de cada cuenta.' },
    ],
    err: ['Escalar después de una racha corta.', 'Abrir muchas cuentas a la vez sin consistencia.', 'Usar todo el retiro en nuevas cuentas sin reservar nada.'],
    ej: 'Etapa 1: 30 sesiones simuladas con 87 de disciplina media y +6 R. Etapa 2: una evaluación de fondeo con 0,5 % por trade. Etapa 3: tras dos retiros, una segunda cuenta replicada.',
  },
  44: {
    secs: [
      { h: 'La estrategia en forex', p: 'Los conceptos son los mismos: toma de liquidez, IFVG y objetivo claro en las mismas ventanas. Cambian la volatilidad (los pares de divisas se mueven menos) y la forma de medir la posición.', dg: 'm3' },
      { h: 'Pips y lotes', p: 'En forex el precio se mide en pips (en EUR/USD, 0,0001). Un lote estándar vale unos 10 $ por pip en EUR/USD. Lotes = riesgo $ ÷ (pips de stop × valor del pip por lote).' },
      { h: 'Diferencias prácticas', p: 'Los objetivos pueden tardar más en llegar y los spreads importan más en stops pequeños. Mantén el mismo filtro: si el objetivo no da 1:1, no hay trade.' },
    ],
    err: ['Usar el tamaño de NQ en forex.', 'Ignorar el spread en stops de pocos pips.', 'Esperar la misma velocidad que en el Nasdaq.'],
    ej: '50.000 $ al 0,5 % = 250 $. Stop de 12,5 pips en EUR/USD: 250 ÷ (12,5 × 10 $) = 2 lotes estándar.',
  },
  45: {
    secs: [
      { h: 'Un trade perdedor bien ejecutado', p: 'Mira también las pérdidas, no solo las ganancias. Un stop con el plan cumplido no requiere cambios: es la estadística haciendo su parte.', dg: 'loss' },
      { h: 'El repaso semanal', p: 'Una vez por semana: R total, número de trades por modelo, disciplina media, errores repetidos y una mejora concreta para la semana siguiente. Se hace con calma, no justo después de una pérdida.' },
      { h: 'Separar resultado y ejecución', p: 'Una semana negativa con disciplina 95 es una buena semana de trabajo. Una positiva con disciplina 60 es una señal de alarma.' },
    ],
    err: ['Revisar la semana en caliente.', 'Cambiar varias cosas a la vez.', 'Ignorar las semanas buenas en el repaso.'],
    ej: 'Semana: 5 trades, −0,6 R, disciplina 94. Error repetido: entrar 1 minuto antes del cierre. Mejora: esperar siempre el cierre con el cursor fuera del botón.',
  },
  46: {
    secs: [
      { h: 'Tratarlo como un negocio', p: 'Cuando el trading genera ingresos, conviene ordenar costos, ingresos e impuestos. Un ejemplo es una LLC en Estados Unidos; la estructura correcta depende de tu país y tu situación.', dg: 'business' },
      { h: 'Qué ordenar', p: 'Cuenta bancaria separada para el negocio, registro de cada costo (evaluaciones, datos, plataformas, formación) y de cada retiro con su comprobante.' },
      { h: 'Asesoría', p: 'Antes de abrir una sociedad o declarar ingresos, consulta a un contador de tu país. Esta app no da asesoramiento legal ni fiscal.' },
    ],
    err: ['Mezclar dinero personal y del trading.', 'No guardar comprobantes de retiros.', 'Copiar la estructura legal de otra persona sin asesoría.'],
    ej: 'Hoja mensual: ingresos por retiros, costos de evaluaciones y herramientas, resultado neto. Con ella vas al contador.',
  },
  47: {
    secs: [
      { h: 'De mayor a menor', p: '4H y 1H dan la dirección y la liquidez grande. 15m y 5m muestran los puntos de interés (FVG y order blocks) donde esperar la reacción. 1m da la toma de liquidez y el IFVG para entrar.', dg: 'topdown' },
      { h: 'Cuando no coinciden', p: 'Si 4H es alcista y 1H bajista, el día es menos claro: espera más confirmación o no operes. Los mejores setups ocurren cuando la manipulación de 1m llega a un FVG de 5 o 15 minutos a favor de la tendencia mayor.' },
      { h: 'Practícalo en el simulador', p: 'Cambia la temporalidad del gráfico entre 1m, 5m y 15m y mira el contexto en 1H y 4H. La orden se ejecuta en el minuto actual en cualquier temporalidad.' },
    ],
    err: ['Analizar solo 1 minuto.', 'Buscar la entrada en 15 minutos.', 'Marcar FVG de todas las temporalidades a la vez.'],
    ej: '4H alcista; FVG de 15m entre 20.020 y 20.035; a las 9:37 el precio entra en esa zona, barre el mínimo del pre-market en 20.028 y en 1m da IFVG alcista. Todo alineado.',
  },
  48: {
    secs: [
      { h: 'La motivación fluctúa', p: 'Habrá semanas planas y retrocesos. Si tu práctica depende de las ganas, se cae en la primera mala racha. Lo que se mantiene son los hábitos.', dg: 'motivation' },
      { h: 'Hábitos pequeños', p: 'Una lección, una ronda de práctica y una sesión al día, a la misma hora. Es poco, pero repetido cada día suma cientos de sesiones en pocos meses.' },
      { h: 'Rodearte bien', p: 'Aprende con gente que ya hizo el camino. Comparte tu diario, pide revisión de tus trades y compara tu proceso, no tus resultados.' },
    ],
    err: ['Esperar a tener ganas para practicar.', 'Compararte con resultados ajenos en redes.', 'Abandonar tras dos semanas malas.'],
    ej: 'Racha en la app: aunque solo hagas 10 minutos, completa al menos una ronda de práctica cada día.',
  },
  49: {
    secs: [
      { h: 'Un plan antes del primer retiro', p: 'Decide de antemano cómo repartes cada retiro: una parte para vivir, otra para reinvertir en cuentas (escalar) y otra para ahorro o inversión a largo plazo.', dg: 'profits' },
      { h: 'Retirar con regularidad', p: 'El dinero retirado ya no puede perderse en el mercado. Retirar de forma periódica protege lo ganado y reduce la tentación de subir el riesgo.' },
      { h: 'Que el dinero no cambie el riesgo', p: 'Tener más en la cuenta no es motivo para arriesgar más por trade. El porcentaje se mantiene; las cifras crecen solas con el capital.' },
    ],
    err: ['Gastar todo el primer retiro.', 'Reinvertirlo todo sin reserva.', 'Subir el riesgo porque la cuenta creció.'],
    ej: 'Retiro de 2.000 $: 800 $ para gastos (40 %), 800 $ para dos nuevas evaluaciones (40 %) y 400 $ al ahorro (20 %).',
  },
  50: {
    secs: [
      { h: 'Qué sabes ahora', p: 'Leer estructura y liquidez, reconocer FVG e IFVG, distinguir los tres modelos, calcular el riesgo y gestionar la operación. Y sabes que nada de eso funciona sin el plan.', dg: 'roadmap' },
      { h: 'Qué sigue', p: 'Repetición. Sesiones simuladas cada día hasta llegar al nivel Experto: 30 sesiones con disciplina media ≥ 85 en las últimas 20, el examen de la estrategia aprobado y todas las prácticas por encima del 85 %.' },
      { h: 'Del simulado al real', p: 'Primero consistencia medida en simulado; después una cuenta pequeña o de fondeo con el mismo riesgo. Si la disciplina cae al pasar a real, vuelve al simulado: es parte del proceso, no un fracaso.' },
    ],
    err: ['Pasar a dinero real sin datos de consistencia.', 'Abandonar el diario al terminar el bootcamp.', 'Buscar otra estrategia ahora que ya sabes esta.'],
    ej: 'Plan de 30 días: una sesión simulada diaria, una ronda de práctica y repaso semanal. Al final, revisa si cumples los requisitos del nivel Experto.',
  },
});
