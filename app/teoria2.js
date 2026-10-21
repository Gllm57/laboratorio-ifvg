// Teoría ampliada, días 18–34.
window.THEORY = window.THEORY || {};
Object.assign(window.THEORY, {
  18: {
    secs: [
      { h: 'Qué es un order block', p: 'Es la última vela contraria antes de un desplazamiento fuerte. Antes de una subida explosiva, la última vela bajista (OB alcista); antes de una caída, la última vela alcista (OB bajista). Marca la zona donde entraron las órdenes que iniciaron el movimiento.', dg: 'ob' },
      { h: 'Cuándo es fiable', p: 'Cuando el movimiento que sale de él rompe estructura y deja un FVG. Un order block sin desplazamiento es solo una vela más.' },
      { h: 'Su lugar en esta estrategia', p: 'Aquí el order block es un punto de interés de apoyo, como un FVG de 5 o 15 minutos: una zona donde esperar la reacción. La entrada no se toma por tocarlo, sino por el IFVG que aparece después de la toma de liquidez.' },
    ],
    err: ['Entrar solo porque el precio toca un order block.', 'Marcar como OB cualquier vela contraria.', 'Ignorar si el OB ya fue mitigado (visitado).'],
    ej: 'Vela bajista de 20.040 a 20.032 y después cuatro velas que suben hasta 20.090 dejando FVG. Esa vela bajista (20.032–20.042) es un order block alcista. Si el precio vuelve allí, barre un mínimo y da IFVG, hay setup.',
  },
  19: {
    secs: [
      { h: 'La fórmula', p: 'Contratos = (cuenta × riesgo %) ÷ (puntos de stop × valor del punto). Siempre se redondea hacia abajo para no superar el riesgo previsto.', dg: 'calc' },
      { h: 'Tabla rápida', p: 'Con 250 $ de riesgo (50.000 $ al 0,5 %), así cambian los contratos según la distancia del stop. Cuanto más lejos el stop, menos contratos; el riesgo en dólares no cambia.', dg: 'risktable' },
      { h: 'Tipos de entrada', p: 'A mercado: entras al cierre de la vela que confirma el IFVG. Es la más simple y la que usa el simulador. Límite: dejas una orden en el retesteo del IFVG para mejorar el precio, con el riesgo de que no se llene. Fede a veces agrega un contrato en el retesteo, sin superar el riesgo total.' },
    ],
    err: ['Redondear hacia arriba.', 'Mantener los contratos fijos aunque el stop cambie de tamaño.', 'Sumar contratos sin recalcular el riesgo total.'],
    ej: '100.000 $ al 0,6 % = 600 $. Stop de 18 puntos en NQ: 18 × 20 $ = 360 $ por contrato → 1 contrato (360 $). Con MNQ: 18 × 2 $ = 36 $ → 16 contratos (576 $).',
  },
  20: {
    secs: [
      { h: 'Premium y descuento', p: 'Toma un rango (de un mínimo a un máximo relevantes) y marca el 50 %. La mitad de arriba es premium: precio caro, zona para vender. La de abajo es descuento: precio barato, zona para comprar.', dg: 'equilibrium' },
      { h: 'Por qué importa', p: 'Las instituciones compran barato y venden caro. Una compra desde descuento, tras barrer un mínimo, tiene más recorrido hasta la liquidez de arriba que una compra en premium. Mejora el R:R de forma natural.' },
      { h: 'Base del modelo 3', p: 'Cuando la apertura expande con fuerza sin retroceder, deja desequilibrio: FVG sin rellenar y un rango lejos de su equilibrio. El modelo 3 aprovecha que el precio vuelve a equilibrar hacia esos FVG.' },
    ],
    err: ['Comprar en premium sin una razón fuerte.', 'Medir el rango con niveles irrelevantes.', 'Usar el 50 % como entrada sin toma de liquidez ni IFVG.'],
    ej: 'Rango del día de 20.000 a 20.120: equilibrio en 20.060. Una venta tras barrer el máximo en 20.122 está en premium y apunta a los FVG cerca de 20.060.',
  },
  21: {
    secs: [
      { h: 'Decidir antes, ejecutar después', p: 'Las emociones aparecen cuando tienes que decidir con dinero en juego. La solución es decidir antes de la sesión: qué buscas, cuánto arriesgas y cuándo paras. Durante la sesión solo verificas.', dg: 'checklist' },
      { h: 'El checklist como filtro', p: 'Cada casilla es sí o no: horario, toma de liquidez, IFVG, objetivo con R:R ≥ 1, riesgo calculado y que sea tu primer trade. Si una casilla está en rojo, no hay operación. El simulador te muestra este checklist en vivo.', dg: 'flow' },
      { h: 'Una vez dentro', p: 'No mires el resultado en dólares, mira el gráfico. El stop y el take profit ya decidieron por ti. Solo una acción está permitida: mover a break even en el máximo o mínimo intermedio.' },
    ],
    err: ['Ver el P&L en dólares durante la operación.', 'Saltarse una casilla “porque se ve claro”.', 'Decidir el riesgo con la operación ya abierta.'],
    ej: 'Barrió, hay IFVG, son las 9:52, pero el objetivo más cercano da 1:0,8. Una casilla en rojo: no entras. Sin discusión interna.',
  },
  22: {
    secs: [
      { h: 'Qué es el sesgo diario', p: 'Es la dirección más probable del día según el contexto. Se forma con la estructura de 4H y 1H y con la liquidez pendiente más cercana, sobre todo el máximo y el mínimo del día anterior (PDH y PDL).', dg: 'dailybias' },
      { h: 'Cómo construirlo', p: '1) Estructura de 4H y 1H: ¿HH y HL o LH y LL? 2) ¿Qué está más cerca y sin tomar, PDH o PDL? 3) ¿El precio está en premium o en descuento del rango del día anterior? Si las tres respuestas apuntan al mismo lado, el sesgo es claro.' },
      { h: 'Cómo usarlo', p: 'Con sesgo alcista esperas que la apertura barra un mínimo y buscas compras (modelos 1 y 2 a favor). Si el precio hace lo contrario con fuerza, no pelees: el setup en 1 minuto manda. Un día sin sesgo claro es candidato a no operar.' },
    ],
    err: ['Aferrarse al sesgo cuando el precio lo invalida.', 'Usar solo 1 minuto para definirlo.', 'Forzar un sesgo todos los días.'],
    ej: '4H alcista, PDH en 20.200 sin tomar, precio en 20.120 (descuento del rango de ayer). Sesgo alcista con objetivo en PDH.',
  },
  23: {
    secs: [
      { h: 'La racha engaña', p: 'Después de varios ganadores el cerebro concluye que “ya lo entiendes” y sube el riesgo o relaja las reglas. Pero cada operación tiene la misma probabilidad que antes: la racha no la cambia.', dg: 'overconfidence' },
      { h: 'Señales de alerta', p: 'Quieres arriesgar más “porque estás en racha”, entras sin completar el checklist, tomas un segundo trade o empiezas a operar fuera de la ventana. Si notas una, para y revisa el diario.' },
      { h: 'Cómo se escala bien', p: 'Fede no arriesga más por trade: escala con más cuentas de fondeo replicadas. El riesgo por operación es el mismo con 1 cuenta que con 40. Escalar es una decisión de negocio que se toma con datos, no con euforia.' },
    ],
    err: ['Duplicar contratos tras una buena semana.', 'Dejar de hacer el diario cuando todo va bien.', 'Tomar setups “B” porque estás confiado.'],
    ej: 'Llevas 6 de 7 ganadores. Al día siguiente el setup tiene R:R 1:0,9. Antes lo hubieras descartado; hoy te tienta. Lo descartas igual: esa es la diferencia entre racha y sistema.',
  },
  24: {
    secs: [
      { h: 'El calendario económico', p: 'Cada día revisa las publicaciones de alto impacto: inflación (CPI), empleo (NFP), decisiones de tipos (FOMC) y discursos de la Fed. Muchas salen a las 8:30 hora de Nueva York, antes de la apertura; el FOMC sale a las 14:00.', dg: 'news' },
      { h: 'Qué hacen al mercado', p: 'Generan picos de volatilidad que barren liquidez de ambos lados en segundos. Pueden saltar tu stop con deslizamiento (te ejecutan peor de lo previsto). Fede habla de datos “high” y “low” según el impacto esperado.' },
      { h: 'Reglas prácticas', p: 'No tengas una posición abierta en el momento de un dato de alto impacto. Si el dato sale a las 8:30, la apertura de las 9:30 suele ser más ordenada, pero con más rango. En días de FOMC la mañana suele ser lenta; muchos traders prefieren no operar.' },
    ],
    err: ['No mirar el calendario.', 'Entrar segundos antes de un dato.', 'Pensar que el stop siempre se ejecuta en el precio exacto durante una noticia.'],
    ej: 'CPI a las 8:30: a las 8:31 el NQ sube 60 puntos y baja 80 en dos minutos. A las 9:15 marcas los nuevos máximos y mínimos del pre-market, que ahora incluyen ese pico.',
  },
  25: {
    secs: [
      { h: 'La pérdida es un costo del negocio', p: 'Incluso con una estrategia positiva vas a perder muchas veces. Una pérdida con el plan cumplido es un buen trade: hiciste lo correcto y la probabilidad no salió esta vez.', dg: 'loss' },
      { h: 'Qué hacer después del stop', p: 'Captura del gráfico, registro en el diario con la emoción del momento, revisión breve (¿cumplía el checklist?) y cerrar la plataforma. El análisis profundo se hace en el repaso semanal, con la cabeza fría.' },
      { h: 'Buen trade y mal trade', p: 'Un trade se evalúa por el proceso. Ganar rompiendo reglas es un mal trade, aunque sume dinero, porque refuerza un hábito que tarde o temprano te costará caro. La nota de disciplina del simulador sigue esta lógica.' },
    ],
    err: ['Alejar el stop para evitar la pérdida.', 'Buscar el siguiente trade para recuperar.', 'Cambiar de estrategia después de dos pérdidas.'],
    ej: 'Setup perfecto: barrido, IFVG, R:R 1:1,4, riesgo 0,5 %. Toca el stop. Nota de disciplina: 100. Resultado: −1 R. Es exactamente lo que tiene que pasar alrededor de la mitad de las veces.',
  },
  26: {
    secs: [
      { h: 'Divergencia entre índices', p: 'NQ y ES suelen moverse juntos. Cuando uno hace un mínimo más bajo y el otro no (hace un mínimo más alto), hay una divergencia llamada SMT. Indica que el barrido de uno no está confirmado por el otro.', dg: 'smt' },
      { h: 'Cómo leerla', p: 'NQ barre su mínimo y ES no: señal alcista. NQ barre su máximo y ES no: señal bajista. Vale igual al revés (ES barre y NQ no). Se compara en la misma vela y en la misma temporalidad.' },
      { h: 'Su papel', p: 'Es una confluencia que refuerza la toma de liquidez, sobre todo en el modelo 1 en la apertura. No es una entrada: sigues necesitando el IFVG y el objetivo claro.' },
    ],
    err: ['Comparar velas de horas distintas.', 'Entrar solo por la SMT.', 'Buscar SMT en cada mínimo de 1 minuto.'],
    ej: '9:35: NQ marca 19.980, por debajo del mínimo del pre-market en 19.990. ES se queda en 5.612, por encima de su mínimo en 5.608. SMT alcista: si llega el IFVG alcista, el setup es más sólido.',
  },
  27: {
    secs: [
      { h: 'Los 15 minutos antes de abrir', p: 'Con la preparación hecha, a las 9:30 solo tienes que esperar y verificar. Sin ella, decides con prisa y con el mercado más rápido del día.', dg: 'premarket' },
      { h: 'Lista de preparación', p: '1) Contexto de 4H y 1H y sesgo del día. 2) Máximo y mínimo del pre-market, PDH y PDL. 3) FVG de 5 y 15 minutos cerca del precio. 4) Calendario económico. 5) Riesgo en dólares y contratos para distintos tamaños de stop. 6) Estado mental: si no estás bien, no hay sesión.' },
      { h: 'Escenarios', p: 'Escribe dos frases: “Si barre el mínimo del pre-market y da IFVG alcista, compro hacia el máximo del pre-market” y lo mismo al revés. Así reconoces el modelo cuando aparece en lugar de improvisar.' },
    ],
    err: ['Marcar 15 niveles: quédate con 4–6.', 'No calcular el riesgo antes de abrir.', 'Operar cansado o enojado.'],
    ej: 'Plan escrito a las 9:15: “Sesgo bajista (4H LH-LL). Si barre el máximo del pre-market en 20.140 y da IFVG bajista, vendo hacia el mínimo en 20.060. Riesgo 250 $.”',
  },
  28: {
    secs: [
      { h: 'Qué es un IFVG', p: 'Un Inverse Fair Value Gap es un FVG que el mercado no respeta: una vela cierra al otro lado de la zona y la invalida. A partir de ahí la zona cambia de función: un FVG bajista invalidado pasa a ser soporte, y uno alcista invalidado pasa a ser resistencia.', dg: 'ifvg' },
      { h: 'Alcista y bajista', p: 'IFVG alcista: había un FVG bajista (de la caída que hizo la manipulación) y una vela cierra por encima de él → compras. IFVG bajista: había un FVG alcista y una vela cierra por debajo → ventas.', dg: 'ifvgbear' },
      { h: 'Por qué es el gatillo', p: 'El FVG de la manipulación muestra la intención de los vendedores (o compradores). Cuando el precio lo atraviesa con desplazamiento y cierra del otro lado, esa intención falló: el mercado cambió de dirección. Es la confirmación que necesitas después de la toma de liquidez.' },
      { h: 'Calidad del IFVG', p: 'Mejor si hay un único FVG en el camino, si la vela que lo invalida tiene cuerpo grande y si ocurre justo después del barrido. Si hay muchos FVG apilados y el precio los atraviesa con velas pequeñas, la señal es débil.' },
    ],
    err: ['Entrar con la mecha que toca el FVG, sin cierre.', 'Usar un IFVG sin toma de liquidez previa.', 'Confundir la dirección: un FVG bajista invalidado es para comprar.'],
    ej: 'Tras barrer 20.028, queda un FVG bajista entre 20.044 y 20.052. A las 9:39 una vela cierra en 20.058: IFVG alcista. Entrada en 20.058, stop en 20.026.',
  },
  29: {
    secs: [
      { h: 'La sesión no termina con el trade', p: 'Lo que haces después decide si mañana operas mejor. El post-trading convierte cada sesión en información.', dg: 'posttrade' },
      { h: 'Qué registrar', p: 'Captura con entrada, SL y TP; modelo; si cumpliste cada casilla del checklist; resultado en R; y una línea sobre cómo te sentiste. En el simulador, la nota de disciplina y el diario se guardan solos: añade siempre la nota de emociones.' },
      { h: 'Desconectar', p: 'Cierra los gráficos al terminar la ventana. Mirar el mercado después (“¿qué hubiera pasado?”) alimenta el arrepentimiento y las ganas de operar fuera de horario.' },
    ],
    err: ['No registrar las sesiones sin trade.', 'Anotar solo el resultado en dinero.', 'Quedarse mirando el gráfico toda la tarde.'],
    ej: 'Diario: “Lunes · Modelo 2 · short 10:12 · TP +1,2 R · disciplina 100 · Ansioso antes de entrar, dudé 30 segundos.” Treinta segundos de escritura, información para meses.',
  },
  30: {
    secs: [
      { h: 'El tiempo también tiene estructura', p: 'La idea, popularizada por ICT, es que los ciclos de tiempo (año, mes, semana, día, sesión) se dividen en cuatro partes con funciones típicas: acumulación, manipulación, distribución y continuación o reversión.', dg: 'quarters' },
      { h: 'Aplicado a la sesión', p: 'En la ventana de 90 minutos, la primera parte suele acumular o arrancar, la segunda trae la manipulación (el barrido), la tercera el movimiento con intención y la cuarta continúa o devuelve. Encaja con lo que ves en el modelo 1: manipulación cerca de la apertura y expansión después.' },
      { h: 'Cómo usarla', p: 'Como contexto para saber cuándo esperar la manipulación, no como gatillo. Si a las 10:30 todavía no hubo barrido ni expansión, el día tiene menos probabilidades de dar un buen setup.' },
    ],
    err: ['Usarla como señal de entrada.', 'Forzar cada día a encajar en los cuartos.', 'Olvidar la estructura de precio por mirar el reloj.'],
    ej: 'De 9:30 a 9:52 el precio acumula; a las 9:55 barre el mínimo; de 10:00 a 10:20 expande. Encaja con el esquema y con un modelo 1 algo tardío.',
  },
  31: {
    secs: [
      { h: 'El plan completo', p: 'Activo: NQ o ES. Horario: 9:30–11:00 o 20:00–21:30 (hora NY). Setup: toma de liquidez + IFVG + objetivo claro (modelo 1, 2 o 3). Riesgo: 0,5–0,7 % por trade, R:R mínimo 1:1. Frecuencia: un trade por sesión; un TP y te vas, un SL y te vas.', dg: 'plan' },
      { h: 'Gestión dentro del trade', p: 'Stop detrás del extremo de la manipulación. Break even al tocar el primer máximo o mínimo intermedio. Sin cierres parciales improvisados ni cambios de objetivo.' },
      { h: 'Reglas de parada', p: 'Además del plan diario, define límites semanales: por ejemplo, si pierdes 3 R en la semana, paras hasta el lunes y revisas el diario. Protege la cuenta y la cabeza.' },
    ],
    err: ['Tener el plan en la cabeza y no escrito.', 'Cambiar el plan cada semana.', 'No definir qué pasa tras varias pérdidas.'],
    ej: 'Escribe tu plan en una tarjeta y léelo antes de cada sesión. Si un día rompes una regla, la regla no se cambia: se anota y se repasa.',
  },
  32: {
    secs: [
      { h: 'Dos niveles de estructura', p: 'La estructura externa son los máximos y mínimos principales que definen la tendencia y los objetivos grandes. La interna son los pequeños giros dentro de cada tramo.', dg: 'structure' },
      { h: 'Para qué sirve distinguirlas', p: 'Un quiebre interno no cambia la tendencia externa. En el modelo 2 el retroceso barre un mínimo interno y continúa a favor de la expansión: si confundes ese barrido interno con un cambio de tendencia, te pierdes el mejor trade del día.' },
      { h: 'Liquidez interna y externa', p: 'La liquidez interna (dentro del rango) suele ser la manipulación; la externa (máximos y mínimos del rango) suele ser el objetivo. Esta lógica de “barrer dentro e ir a por fuera” se repite en los tres modelos.' },
    ],
    err: ['Ver un cambio de tendencia en cada mini quiebre.', 'Poner el TP en liquidez interna irrelevante.', 'Ignorar la estructura externa de 1H.'],
    ej: 'Expansión de 9:30 a 9:45 hasta 20.150. Retroceso con un mínimo interno en 20.110, barrido a 20.104, IFVG alcista y subida hacia el máximo externo en 20.150. Modelo 2.',
  },
  33: {
    secs: [
      { h: 'El diario es tu base de datos', p: 'Sin diario cada sesión se olvida. Con diario puedes contestar preguntas como: ¿qué modelo ejecuto mejor?, ¿pierdo más los lunes?, ¿mis peores trades vienen después de una ganancia?', dg: 'journal' },
      { h: 'Medir en R', p: '1 R es lo que arriesgaste. Un trade que gana el doble de lo arriesgado es +2 R. Medir en R permite comparar trades con distinto tamaño de cuenta o de contrato y ver la calidad real de tu ejecución.' },
      { h: 'Revisión semanal', p: 'Cada fin de semana: R total, disciplina media, cuántos trades por modelo y el error más repetido. Elige una sola mejora para la semana siguiente.' },
    ],
    err: ['Registrar solo las ganancias.', 'Medir en dólares.', 'Tener datos y no revisarlos nunca.'],
    ej: 'Tras 20 sesiones ves: modelo 1, 9 trades, +5,1 R; modelo 3, 6 trades, −2,4 R. Decisión: durante un mes solo modelos 1 y 2, y practicar el 3 en el simulador.',
  },
  34: {
    secs: [
      { h: 'Qué significa CISD', p: 'Change in State of Delivery: cambio en la forma en que el precio se entrega. Se marca la apertura de la serie de velas que hizo la manipulación; cuando una vela cierra más allá de esa apertura, el precio cambió de dirección.', dg: 'cisd' },
      { h: 'Relación con el IFVG', p: 'Suelen coincidir: la vela que invalida el FVG de la manipulación suele cerrar también por encima de la apertura de las velas bajistas. Si ves las dos cosas a la vez, la confirmación es más fuerte.' },
      { h: 'Cuándo ayuda', p: 'Cuando la manipulación no dejó un FVG claro. El CISD te da una referencia alternativa del cambio de intención, aunque la estrategia de Fede se centra en el IFVG.' },
    ],
    err: ['Marcar la apertura de una vela cualquiera.', 'Usar el CISD sin toma de liquidez.', 'Complicar el análisis añadiendo CISD a todo.'],
    ej: 'Cuatro velas bajistas llevaron el precio de 20.080 a 20.040 barriendo un mínimo. La primera abrió en 20.080. Una vela cierra en 20.083: CISD alcista, y además invalidó el FVG.',
  },
});
