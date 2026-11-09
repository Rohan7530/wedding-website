(function () {
    'use strict';

    var doc = document;
    var html = doc.documentElement;
    var body = doc.body;
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Nikah: 20 Nov 2026, 11:45 AM IST (UTC+5:30)
    var NIKAH_AT = Date.UTC(2026, 10, 20, 6, 15, 0);

    /* ---------------- Falling petals ---------------- */

    var petals = (function () {
        var canvas = doc.getElementById('petals');
        var ctx = canvas.getContext('2d');
        var colours = ['#9b1b2c', '#c22a3d', '#d9566a', '#e8a0a8', '#c49a45', '#e7cd8e'];
        var list = [];
        var running = false;
        var enabled = !reduceMotion;
        var width = 0, height = 0, dpr = 1, rafId = 0;

        function resize() {
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        function ambientCount() {
            return width < 700 ? 14 : 26;
        }

        function makePetal(burst) {
            return {
                x: Math.random() * width,
                y: burst ? -20 - Math.random() * height * 0.6 : Math.random() * -height,
                size: 6 + Math.random() * 8,
                vy: burst ? 1.6 + Math.random() * 2.2 : 0.45 + Math.random() * 0.9,
                vx: -0.3 + Math.random() * 0.6,
                rot: Math.random() * Math.PI * 2,
                vr: -0.03 + Math.random() * 0.06,
                flip: Math.random() * Math.PI * 2,
                vf: 0.02 + Math.random() * 0.04,
                sway: Math.random() * Math.PI * 2,
                colour: colours[(Math.random() * colours.length) | 0],
                burst: !!burst
            };
        }

        function drawPetal(p) {
            var r = p.size;
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.scale(1, 0.35 + 0.65 * Math.abs(Math.sin(p.flip)));
            ctx.beginPath();
            ctx.moveTo(0, -r);
            ctx.bezierCurveTo(r * 0.95, -r * 0.9, r * 0.85, r * 0.55, 0, r);
            ctx.bezierCurveTo(-r * 0.85, r * 0.55, -r * 0.95, -r * 0.9, 0, -r);
            ctx.fillStyle = p.colour;
            ctx.globalAlpha = 0.85;
            ctx.fill();
            ctx.restore();
        }

        function frame() {
            ctx.clearRect(0, 0, width, height);
            for (var i = list.length - 1; i >= 0; i--) {
                var p = list[i];
                p.sway += 0.012;
                p.x += p.vx + Math.sin(p.sway) * 0.6;
                p.y += p.vy;
                p.rot += p.vr;
                p.flip += p.vf;
                if (p.y > height + 20) {
                    if (p.burst || !enabled) {
                        list.splice(i, 1);
                        continue;
                    }
                    p.y = -20;
                    p.x = Math.random() * width;
                }
                drawPetal(p);
            }
            if (list.length) {
                rafId = window.requestAnimationFrame(frame);
            } else {
                running = false;
                ctx.clearRect(0, 0, width, height);
            }
        }

        function start() {
            if (running || doc.hidden) return;
            running = true;
            rafId = window.requestAnimationFrame(frame);
        }

        function stop() {
            running = false;
            window.cancelAnimationFrame(rafId);
        }

        function fillAmbient() {
            var ambient = list.filter(function (p) { return !p.burst; }).length;
            for (var i = ambient; i < ambientCount(); i++) list.push(makePetal(false));
        }

        resize();
        window.addEventListener('resize', resize);
        doc.addEventListener('visibilitychange', function () {
            if (doc.hidden) stop(); else if (list.length) start();
        });

        return {
            begin: function () {
                if (enabled) { fillAmbient(); start(); }
            },
            burst: function (count) {
                if (reduceMotion) return;
                for (var i = 0; i < count; i++) list.push(makePetal(true));
                start();
            },
            setEnabled: function (on) {
                enabled = on;
                if (on) { fillAmbient(); start(); }
                // when off, ambient petals drift away on their own
            },
            isEnabled: function () { return enabled; }
        };
    })();

    var petalToggle = doc.getElementById('petal-toggle');
    function syncPetalToggle() {
        var on = petals.isEnabled();
        petalToggle.setAttribute('aria-pressed', String(on));
        petalToggle.setAttribute('aria-label', on ? 'Falling petals on' : 'Falling petals off');
    }
    petalToggle.addEventListener('click', function () {
        petals.setEnabled(!petals.isEnabled());
        syncPetalToggle();
    });
    syncPetalToggle();

    /* ---------------- Invitation gate ---------------- */

    var gate = doc.getElementById('gate');
    var gateButton = doc.getElementById('open-gate');

    function revealSite() {
        body.classList.add('is-ready');
        petals.begin();
        startSlideshow();
    }

    function openGate() {
        if (gate.classList.contains('is-opening')) return;
        gate.classList.add('is-opening');
        html.classList.remove('gate-lock');
        petals.burst(window.innerWidth < 700 ? 45 : 90);
        window.setTimeout(revealSite, reduceMotion ? 0 : 700);
        window.setTimeout(function () {
            gate.hidden = true;
            gate.style.display = 'none';
        }, reduceMotion ? 700 : 2400);
    }

    // The invitation greets guests on every visit, so a refresh starts
    // from the top of the page behind closed doors.
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    html.classList.add('gate-lock');
    gateButton.addEventListener('click', openGate);
    doc.addEventListener('keydown', function onKey(e) {
        if (e.key === 'Escape' && !gate.hidden) {
            openGate();
            doc.removeEventListener('keydown', onKey);
        }
    });
    window.setTimeout(function () { gateButton.focus({ preventScroll: true }); }, 50);

    /* ---------------- Navigation ---------------- */

    var nav = doc.getElementById('nav');
    var navToggle = doc.getElementById('nav-toggle');
    var navLinks = doc.getElementById('nav-links');

    function onScroll() {
        nav.classList.toggle('is-solid', window.scrollY > window.innerHeight * 0.6);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    function setMenu(open) {
        navToggle.setAttribute('aria-expanded', String(open));
        navLinks.classList.toggle('is-open', open);
    }
    navToggle.addEventListener('click', function () {
        setMenu(navToggle.getAttribute('aria-expanded') !== 'true');
    });
    navLinks.addEventListener('click', function (e) {
        if (e.target.closest('a')) setMenu(false);
    });

    /* ---------------- Hero slideshow ---------------- */

    var slides = Array.prototype.slice.call(doc.querySelectorAll('#hero-slides img'));
    var dotsWrap = doc.getElementById('hero-dots');
    var current = 0;
    var slideTimer = 0;

    slides.forEach(function (img, i) {
        var dot = doc.createElement('button');
        dot.type = 'button';
        dot.setAttribute('aria-label', 'Show photo ' + (i + 1));
        dot.setAttribute('aria-pressed', String(i === 0));
        dot.addEventListener('click', function () {
            showSlide(i);
            restartSlideshow();
        });
        dotsWrap.appendChild(dot);
    });
    var dots = Array.prototype.slice.call(dotsWrap.children);

    function showSlide(i) {
        slides[current].classList.remove('is-active');
        dots[current].setAttribute('aria-pressed', 'false');
        current = (i + slides.length) % slides.length;
        slides[current].removeAttribute('loading');
        slides[current].classList.add('is-active');
        dots[current].setAttribute('aria-pressed', 'true');
    }

    function startSlideshow() {
        if (reduceMotion || slideTimer) return;
        slideTimer = window.setInterval(function () { showSlide(current + 1); }, 5500);
    }

    function restartSlideshow() {
        window.clearInterval(slideTimer);
        slideTimer = 0;
        startSlideshow();
    }

    /* ---------------- Countdown ---------------- */

    var countdown = doc.getElementById('countdown');
    var units = {};
    Array.prototype.forEach.call(countdown.querySelectorAll('[data-unit]'), function (el) {
        units[el.getAttribute('data-unit')] = el;
    });

    function pad(n) { return (n < 10 ? '0' : '') + n; }

    function tick() {
        var diff = NIKAH_AT - Date.now();
        if (diff <= 0) {
            countdown.classList.add('is-done');
            countdown.querySelector('.countdown-label').innerHTML = 'Alhamdulillah, <em>we said Qubool Hai</em>';
            return false;
        }
        var s = Math.floor(diff / 1000);
        units.days.textContent = pad(Math.floor(s / 86400));
        units.hours.textContent = pad(Math.floor(s % 86400 / 3600));
        units.minutes.textContent = pad(Math.floor(s % 3600 / 60));
        units.seconds.textContent = pad(s % 60);
        return true;
    }
    if (tick()) {
        var countdownTimer = window.setInterval(function () {
            if (!tick()) window.clearInterval(countdownTimer);
        }, 1000);
    }

    /* ---------------- Scroll reveal ---------------- */

    var revealables = doc.querySelectorAll('.reveal, .g-item');
    if ('IntersectionObserver' in window) {
        var revealObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
        Array.prototype.forEach.call(revealables, function (el, i) {
            if (el.classList.contains('g-item')) {
                el.style.transitionDelay = (i % 4) * 0.08 + 's';
            }
            revealObserver.observe(el);
        });
    } else {
        Array.prototype.forEach.call(revealables, function (el) { el.classList.add('is-visible'); });
    }

    /* ---------------- Gallery lightbox ---------------- */

    var items = Array.prototype.slice.call(doc.querySelectorAll('#gallery-grid .g-item'));
    var lightbox = doc.getElementById('lightbox');
    var lbImg = lightbox.querySelector('.lb-img');
    var lbCount = lightbox.querySelector('.lb-count');
    var lbIndex = 0;
    var lastFocus = null;

    function setLightboxImage(i) {
        lbIndex = (i + items.length) % items.length;
        var link = items[lbIndex];
        var thumb = link.querySelector('img');
        lbImg.classList.add('is-swapping');
        var next = new Image();
        next.onload = next.onerror = function () {
            lbImg.src = link.href;
            lbImg.alt = thumb.alt;
            lbImg.classList.remove('is-swapping');
        };
        next.src = link.href;
        lbCount.textContent = (lbIndex + 1) + ' / ' + items.length;
    }

    function openLightbox(i) {
        lastFocus = doc.activeElement;
        lightbox.hidden = false;
        html.style.overflow = 'hidden';
        setLightboxImage(i);
        window.requestAnimationFrame(function () { lightbox.classList.add('is-open'); });
        lightbox.querySelector('.lb-close').focus();
    }

    function closeLightbox() {
        lightbox.classList.remove('is-open');
        html.style.overflow = '';
        window.setTimeout(function () { lightbox.hidden = true; }, 350);
        if (lastFocus) lastFocus.focus();
    }

    items.forEach(function (link, i) {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            openLightbox(i);
        });
    });
    lightbox.querySelector('.lb-close').addEventListener('click', closeLightbox);
    lightbox.querySelector('.lb-prev').addEventListener('click', function () { setLightboxImage(lbIndex - 1); });
    lightbox.querySelector('.lb-next').addEventListener('click', function () { setLightboxImage(lbIndex + 1); });
    lightbox.addEventListener('click', function (e) {
        if (e.target === lightbox) closeLightbox();
    });
    doc.addEventListener('keydown', function (e) {
        if (lightbox.hidden) return;
        if (e.key === 'Escape') closeLightbox();
        else if (e.key === 'ArrowLeft') setLightboxImage(lbIndex - 1);
        else if (e.key === 'ArrowRight') setLightboxImage(lbIndex + 1);
        else if (e.key === 'Tab') {
            // keep focus inside the viewer
            var focusables = lightbox.querySelectorAll('button');
            var first = focusables[0];
            var last = focusables[focusables.length - 1];
            if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
        }
    });

    var touchX = null;
    lightbox.addEventListener('touchstart', function (e) { touchX = e.touches[0].clientX; }, { passive: true });
    lightbox.addEventListener('touchend', function (e) {
        if (touchX === null) return;
        var dx = e.changedTouches[0].clientX - touchX;
        if (Math.abs(dx) > 50) setLightboxImage(lbIndex + (dx < 0 ? 1 : -1));
        touchX = null;
    });

    /* ---------------- Films ---------------- */

    var reels = Array.prototype.slice.call(doc.querySelectorAll('.reel'));

    reels.forEach(function (reel) {
        var video = reel.querySelector('video');
        var soundBtn = reel.querySelector('.reel-sound');

        soundBtn.addEventListener('click', function () {
            var turnOn = video.muted;
            // only one film plays with sound at a time
            reels.forEach(function (other) {
                var v = other.querySelector('video');
                v.muted = true;
                other.querySelector('.reel-sound').setAttribute('aria-pressed', 'false');
                other.querySelector('.reel-sound').setAttribute('aria-label', 'Turn sound on');
            });
            if (turnOn) {
                video.muted = false;
                video.play().catch(function () {});
                soundBtn.setAttribute('aria-pressed', 'true');
                soundBtn.setAttribute('aria-label', 'Turn sound off');
            }
        });

        video.addEventListener('click', function () {
            if (video.paused) video.play().catch(function () {}); else video.pause();
        });
    });

    if ('IntersectionObserver' in window && !reduceMotion) {
        var videoObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                var video = entry.target;
                if (entry.isIntersecting) {
                    video.play().catch(function () {});
                } else {
                    video.pause();
                }
            });
        }, { threshold: 0.45 });
        reels.forEach(function (reel) { videoObserver.observe(reel.querySelector('video')); });
    }

    /* ---------------- Calendar buttons ---------------- */

    function icsEscape(text) {
        return text.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n');
    }

    Array.prototype.forEach.call(doc.querySelectorAll('.event'), function (ev) {
        var title = ev.getAttribute('data-title');
        var start = ev.getAttribute('data-start');
        var end = ev.getAttribute('data-end');
        var location = ev.getAttribute('data-location');
        var details = 'With love, Aftab & Suhana. Dress code: Indo-Western.';

        var google = ev.querySelector('[data-cal="google"]');
        google.href = 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
            '&text=' + encodeURIComponent(title) +
            '&dates=' + start + '/' + end +
            '&details=' + encodeURIComponent(details) +
            '&location=' + encodeURIComponent(location);

        ev.querySelector('[data-cal="ics"]').addEventListener('click', function () {
            var stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
            var ics = [
                'BEGIN:VCALENDAR',
                'VERSION:2.0',
                'PRODID:-//Aftab & Suhana//Wedding//EN',
                'CALSCALE:GREGORIAN',
                'BEGIN:VEVENT',
                'UID:' + start + '-' + title.split(' ')[0].toLowerCase() + '@aftab-suhana',
                'DTSTAMP:' + stamp,
                'DTSTART:' + start,
                'DTEND:' + end,
                'SUMMARY:' + icsEscape(title),
                'LOCATION:' + icsEscape(location),
                'DESCRIPTION:' + icsEscape(details),
                'END:VEVENT',
                'END:VCALENDAR'
            ].join('\r\n');
            var blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
            var url = URL.createObjectURL(blob);
            var a = doc.createElement('a');
            a.href = url;
            a.download = title.split(' ')[0].toLowerCase() + '-aftab-suhana.ics';
            body.appendChild(a);
            a.click();
            a.remove();
            window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
        });
    });
})();
