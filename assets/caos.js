// Portada: un campo que se ordena solo. La mano lo altera; al retirarla, se recupera.
(function () {
  var canvas = document.getElementById('caos');
  var ctx = canvas && canvas.getContext('2d');
  if (!ctx) return;

  var quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var BOSQUE = [18, 48, 41], BROTE = [195, 211, 174], PLASTICO = [90, 115, 255];
  var RADIO = 150, ancho, alto, dpr, puntos = [], t = 0, pausa = false;
  var mano = { x: 0, y: 0, activa: false };

  function campo(x, y) {
    var e = 0.0021;
    return Math.sin(x * e + t) * 1.7 + Math.cos(y * e * 1.4 - t * 0.7) * 1.7 +
           Math.sin((x + y) * e * 0.55 + t * 0.4) * 1.3;
  }

  function nacer(p) {
    p.x = Math.random() * ancho;
    p.y = Math.random() * alto;
    p.vida = 80 + Math.random() * 260;
    return p;
  }

  function medir() {
    var r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    ancho = r.width; alto = r.height;
    canvas.width = ancho * dpr; canvas.height = alto * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = 'rgb(' + BOSQUE + ')';
    ctx.fillRect(0, 0, ancho, alto);
    var n = Math.min(2600, Math.round(ancho * alto / 620));
    puntos = [];
    for (var i = 0; i < n; i++) {
      var p = nacer({ dx: 0, dy: 0, herida: 0 });
      p.vida = Math.random() * 340;
      puntos.push(p);
    }
  }

  function paso() {
    t += 0.0016;
    ctx.fillStyle = 'rgba(' + BOSQUE + ',0.055)';
    ctx.fillRect(0, 0, ancho, alto);
    ctx.lineWidth = 1;
    for (var i = 0; i < puntos.length; i++) {
      var p = puntos[i], a = campo(p.x, p.y), x0 = p.x, y0 = p.y;
      if (mano.activa) {
        var mx = p.x - mano.x, my = p.y - mano.y, d = Math.sqrt(mx * mx + my * my);
        if (d < RADIO && d > 0.01) {
          var f = (1 - d / RADIO) * 2.6;
          p.dx += (mx / d) * f; p.dy += (my / d) * f;
          p.herida = Math.min(1, p.herida + 0.22);
        }
      }
      p.x += Math.cos(a) * 0.85 + p.dx;
      p.y += Math.sin(a) * 0.85 + p.dy;
      p.dx *= 0.93; p.dy *= 0.93;
      p.herida *= 0.988;
      var h = p.herida, c = [0, 1, 2].map(function (k) {
        return Math.round(BROTE[k] + (PLASTICO[k] - BROTE[k]) * h);
      });
      ctx.strokeStyle = 'rgba(' + c + ',' + (0.36 + h * 0.55) + ')';
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(p.x, p.y); ctx.stroke();
      if (--p.vida < 0 || p.x < -4 || p.x > ancho + 4 || p.y < -4 || p.y > alto + 4) {
        nacer(p); p.vida = 80 + Math.random() * 260; p.herida = 0;
      }
    }
  }

  function bucle() {
    if (!pausa) paso();
    requestAnimationFrame(bucle);
  }

  function mover(e) {
    var r = canvas.getBoundingClientRect();
    mano.x = e.clientX - r.left; mano.y = e.clientY - r.top; mano.activa = true;
  }

  medir();
  // Unos pasos previos para que la portada nunca aparezca vacía.
  var previos = quieto ? 420 : 160;
  for (var i = 0; i < previos; i++) paso();

  var redimension;
  window.addEventListener('resize', function () {
    clearTimeout(redimension);
    redimension = setTimeout(function () {
      medir();
      for (var j = 0; j < previos; j++) paso();
    }, 180);
  });

  if (quieto) return;

  var portada = canvas.parentNode;
  portada.addEventListener('pointermove', mover);
  portada.addEventListener('pointerdown', mover);
  ['pointerleave', 'pointerup', 'pointercancel'].forEach(function (ev) {
    portada.addEventListener(ev, function () { mano.activa = false; });
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { pausa = !e[0].isIntersecting; }).observe(canvas);
  }
  requestAnimationFrame(bucle);
})();
