// =====================================================================
// itsmellieeee — page animations
// Progressive: the HTML already contains every real number, so if JS fails
// the page is still complete. JS just animates things in.
// =====================================================================
(function () {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ---- TODO outlines: ON by default; open index.html?clean to hide them for a preview ----
    if (!new URLSearchParams(location.search).has("clean")) {
        document.body.classList.add("show-todos");
    }

    // ---- footer year ----
    const year = document.getElementById("year");
    if (year) year.textContent = new Date().getFullYear();

    // ---- nav: shrink + frosted background after scrolling ----
    const nav = document.getElementById("mainNav");
    const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    // close the mobile menu after tapping a link
    document.querySelectorAll("#navLinks a").forEach((a) =>
        a.addEventListener("click", () => {
            const menu = document.getElementById("navLinks");
            if (menu.classList.contains("show")) bootstrap.Collapse.getOrCreateInstance(menu).hide();
        })
    );

    // ---- number formatting: 113200 -> "113.2K", 2500000 -> "2.5M" ----
    const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });
    function format(el, value) {
        const decimals = parseInt(el.dataset.decimals || "0", 10);
        const suffix = el.dataset.suffix || "";
        const text = decimals > 0 ? value.toFixed(decimals) : compact.format(Math.round(value));
        return text + suffix;
    }

    // ---- count-up animation for stats ----
    function countUp(el) {
        const target = parseFloat(el.dataset.count);
        if (isNaN(target)) return;
        if (reduceMotion) { el.textContent = format(el, target); return; }
        const duration = 1800;
        const start = performance.now();
        const tick = (now) => {
            const t = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - t, 4); // fast start, gentle landing
            el.textContent = format(el, target * eased);
            if (t < 1) requestAnimationFrame(tick);
            else el.textContent = format(el, target);
        };
        requestAnimationFrame(tick);
    }

    // how many decimal places the value was written with ("6.0" -> 1, "78" -> 0)
    function decimalsOf(raw) {
        const part = String(raw || "").split(".")[1];
        return part ? part.length : 0;
    }

    // ---- audience bars ----
    function fillBar(bar) {
        const v = parseFloat(bar.dataset.value) || 0;
        bar.querySelector(".bar-fill").style.setProperty("--w", v + "%");
        const num = bar.querySelector(".bar-num");
        const dp = decimalsOf(bar.dataset.value); // 12.9 stays 12.9, 6.0 stays 6.0
        animateNumber(num, v, (n) => n.toFixed(dp) + "%");
    }

    // ---- donut chart ----
    function fillDonut(donut) {
        const v = parseFloat(donut.dataset.value) || 0;
        const num = donut.querySelector(".donut-num");
        animateNumber(num, v, (n) => {
            donut.style.setProperty("--p", n);
            return n.toFixed(decimalsOf(donut.dataset.value)) + "%";
        });
    }

    function animateNumber(el, target, render) {
        if (reduceMotion) { el.textContent = render(target); return; }
        const duration = 1400, start = performance.now();
        const tick = (now) => {
            const t = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            el.textContent = render(target * eased);
            if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }

    // ---- reveal on scroll (fires once per element) ----
    const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            el.classList.add("in");
            el.querySelectorAll("[data-count]").forEach(countUp);
            el.querySelectorAll(".bar").forEach(fillBar);
            el.querySelectorAll(".donut").forEach(fillDonut);
            io.unobserve(el);
        });
    }, { threshold: 0.18, rootMargin: "0px 0px -40px 0px" });

    // HTML holds the real values (so the page works without JS); reset them to zero so they can animate in
    if (!reduceMotion) {
        document.querySelectorAll("[data-count]").forEach((el) => (el.textContent = format(el, 0)));
        document.querySelectorAll(".bar").forEach((b) => {
            b.querySelector(".bar-fill").style.setProperty("--w", "0%");
            b.querySelector(".bar-num").textContent = "0%";
        });
        document.querySelectorAll(".donut").forEach((d) => {
            d.style.setProperty("--p", 0);
            d.querySelector(".donut-num").textContent = "0%";
        });
    }
    document.querySelectorAll(".reveal, .reveal-pop").forEach((el) => io.observe(el));

    // ---- parallax: hero puzzle pieces follow the mouse slightly ----
    const floaters = document.querySelectorAll(".hero .floater");
    if (!reduceMotion && window.matchMedia("(pointer: fine)").matches) {
        let raf = null;
        window.addEventListener("mousemove", (e) => {
            if (raf) return;
            raf = requestAnimationFrame(() => {
                const x = (e.clientX / window.innerWidth - 0.5) * 2;
                const y = (e.clientY / window.innerHeight - 0.5) * 2;
                floaters.forEach((f) => {
                    const d = parseFloat(f.dataset.depth || "0.2");
                    f.style.setProperty("--px", (x * d * 40).toFixed(1) + "px");
                    f.style.setProperty("--py", (y * d * 40).toFixed(1) + "px");
                });
                raf = null;
            });
        });
    }

    // ---- 3D tilt on featured cards (desktop only) ----
    if (!reduceMotion && window.matchMedia("(pointer: fine)").matches) {
        document.querySelectorAll(".tilt").forEach((card) => {
            card.addEventListener("mousemove", (e) => {
                const r = card.getBoundingClientRect();
                const x = (e.clientX - r.left) / r.width - 0.5;
                const y = (e.clientY - r.top) / r.height - 0.5;
                card.style.transition = "transform .1s";
                card.style.transform = `perspective(900px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateY(-6px)`;
            });
            card.addEventListener("mouseleave", () => {
                card.style.transition = "transform .6s cubic-bezier(.16,1,.3,1)";
                card.style.transform = "";
            });
        });
    }

    // ---- copy email button ----
    document.querySelectorAll("[data-copy]").forEach((btn) =>
        btn.addEventListener("click", async () => {
            const label = btn.querySelector("span");
            try {
                await navigator.clipboard.writeText(btn.dataset.copy);
                label.textContent = "Copied!";
            } catch {
                label.textContent = btn.dataset.copy;
            }
            setTimeout(() => (label.textContent = "Copy email"), 2000);
        })
    );

    // ---- safety net: if anything never scrolled into view (e.g. printing), show it ----
    window.addEventListener("beforeprint", () => {
        document.querySelectorAll(".reveal, .reveal-pop").forEach((el) => el.classList.add("in"));
        document.querySelectorAll("[data-count]").forEach((el) => (el.textContent = format(el, parseFloat(el.dataset.count))));
    });
})();
