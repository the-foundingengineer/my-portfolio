(function () {
    const isProjectPage = location.pathname.includes('/projects/');
    const base = isProjectPage ? '../' : '';

    // ---------- Labs accent for diagram flow dots + cursor trail ----------
    const isLabsPage = !!document.querySelector('.text-glow-labs');
    if (isLabsPage) {
        document.documentElement.style.setProperty('--flow-color', '#7dffb3');
    }

    // ---------- Cursor trail (pencil-stroke that fades on stop) ----------
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        const canvas = document.createElement('canvas');
        canvas.id = 'cursor-trail';
        canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:30;';
        document.body.appendChild(canvas);
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const trailColor = isLabsPage ? '125,255,179' : '195,230,255';
        const MAX_AGE = 500;

        function resize() {
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            canvas.style.width = window.innerWidth + 'px';
            canvas.style.height = window.innerHeight + 'px';
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
        resize();
        window.addEventListener('resize', resize);

        let points = [];
        window.addEventListener('mousemove', (e) => {
            points.push({ x: e.clientX, y: e.clientY, t: performance.now() });
        }, { passive: true });

        function frame() {
            const now = performance.now();
            points = points.filter((p) => now - p.t < MAX_AGE);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let i = 1; i < points.length; i++) {
                const p0 = points[i - 1];
                const p1 = points[i];
                const life = Math.max(0, 1 - (now - p1.t) / MAX_AGE);
                if (life <= 0) continue;
                ctx.beginPath();
                ctx.moveTo(p0.x, p0.y);
                ctx.lineTo(p1.x, p1.y);
                ctx.strokeStyle = `rgba(${trailColor},${(life * 0.55).toFixed(3)})`;
                ctx.lineWidth = Math.max(0.4, life * 3);
                ctx.lineCap = 'round';
                ctx.shadowColor = `rgba(${trailColor},0.6)`;
                ctx.shadowBlur = 5;
                ctx.stroke();
            }
            requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
    }

    // ---------- Scroll reveal ----------
    const revealTargets = document.querySelectorAll('main > section, .diagram-node');
    revealTargets.forEach((el) => {
        el.classList.add('reveal');
        if (el.classList.contains('diagram-node')) {
            const idx = Array.from(el.parentElement.children).indexOf(el);
            el.style.transitionDelay = `${idx * 70}ms`;
        }
    });
    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12 });
        revealTargets.forEach((el) => io.observe(el));
    } else {
        revealTargets.forEach((el) => el.classList.add('revealed'));
    }

    // ---------- Tilt on project cards ----------
    document.querySelectorAll('#client-work a, #labs a').forEach((card) => {
        card.classList.add('tilt-card');
        card.addEventListener('mousemove', (e) => {
            const r = card.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width - 0.5;
            const y = (e.clientY - r.top) / r.height - 0.5;
            card.style.transform = `perspective(700px) rotateX(${(-y * 6).toFixed(2)}deg) rotateY(${(x * 6).toFixed(2)}deg)`;
        });
        card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });

    // ---------- Command palette ----------
    const commands = [
        { label: 'Home', hint: 'go to hero', href: base + 'index.html#home' },
        { label: 'Client Work', hint: 'proven revenue projects', href: base + 'index.html#client-work' },
        { label: 'Labs', hint: 'experimental / web3', href: base + 'index.html#labs' },
        { label: 'Stack', hint: 'skills', href: base + 'index.html#skills' },
        { label: 'Track Record', hint: 'work history', href: base + 'index.html#log' },
        { label: 'Contact', hint: 'get a growth audit', href: base + 'index.html#contact' },
        { label: 'Reva', hint: 'AI lead-to-booking engine', href: base + 'projects/reva.html' },
        { label: 'Fink.com.ng', hint: 'cohort learning platform', href: base + 'projects/fink.html' },
        { label: 'Bam & Gad Solicitors', hint: 'law firm site', href: base + 'projects/bamandgad.html' },
        { label: 'gbemiga', hint: 'designer portfolio', href: base + 'projects/gbemiga.html' },
        { label: 'Aegis Protocol', hint: 'AI agent trust layer', href: base + 'projects/aegis.html' },
        { label: 'toldya', hint: 'P2P prediction markets', href: base + 'projects/toldya.html' },
        { label: 'Shadowdrop', hint: 'encrypted escrow marketplace', href: base + 'projects/shadowdrop.html' },
        { label: 'Paywise', hint: 'concept — commodity pricing', href: base + 'projects/paywise.html' },
    ];

    const trigger = document.createElement('button');
    trigger.id = 'cmdk-trigger';
    trigger.type = 'button';
    trigger.setAttribute('aria-label', 'Open command palette');
    trigger.className = 'fixed bottom-6 right-6 z-50 hidden md:flex items-center gap-2 bg-surface-container-highest/90 backdrop-blur border border-outline-variant/30 px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-gray-400 hover:text-primary hover:border-primary/50 transition-colors';
    trigger.innerHTML = '<span class="material-symbols-outlined text-sm">terminal</span> jump_to <span class="border border-outline-variant/40 px-1.5 py-0.5 text-[10px]">CTRL K</span>';
    document.body.appendChild(trigger);

    const overlay = document.createElement('div');
    overlay.id = 'cmdk-overlay';
    overlay.className = 'fixed inset-0 z-[100] hidden items-start justify-center pt-32 bg-black/70 backdrop-blur-sm px-4';
    overlay.innerHTML = `
        <div class="w-full max-w-lg bg-surface-container-low border border-primary/30 shadow-2xl">
            <div class="flex items-center gap-2 border-b border-outline-variant/20 px-4 py-3">
                <span class="text-primary font-mono">&gt;</span>
                <input id="cmdk-input" type="text" placeholder="jump to..." class="bg-transparent border-none focus:ring-0 text-on-surface w-full font-mono placeholder:text-outline-variant/40" autocomplete="off"/>
                <span class="text-[10px] font-mono text-gray-600 border border-outline-variant/30 px-1.5 py-0.5">ESC</span>
            </div>
            <ul id="cmdk-results" class="max-h-80 overflow-y-auto font-mono text-sm"></ul>
        </div>`;
    document.body.appendChild(overlay);

    const input = overlay.querySelector('#cmdk-input');
    const resultsEl = overlay.querySelector('#cmdk-results');
    let activeIndex = 0;
    let filtered = commands;

    function renderResults() {
        resultsEl.innerHTML = filtered.map((c, i) => `
            <li data-index="${i}" class="px-4 py-3 flex justify-between items-center cursor-pointer ${i === activeIndex ? 'bg-primary/10 text-primary' : 'text-gray-300'}">
                <span>${c.label}</span>
                <span class="text-[10px] text-gray-500 uppercase">${c.hint}</span>
            </li>`).join('') || '<li class="px-4 py-3 text-gray-500">no matches</li>';
    }

    function openPalette() {
        overlay.classList.remove('hidden');
        overlay.classList.add('flex');
        input.value = '';
        filtered = commands;
        activeIndex = 0;
        renderResults();
        setTimeout(() => input.focus(), 10);
    }
    function closePalette() {
        overlay.classList.add('hidden');
        overlay.classList.remove('flex');
    }
    function go(cmd) { if (cmd) window.location.href = cmd.href; }

    trigger.addEventListener('click', openPalette);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closePalette(); });
    input.addEventListener('input', () => {
        const q = input.value.toLowerCase();
        filtered = commands.filter((c) => c.label.toLowerCase().includes(q) || c.hint.toLowerCase().includes(q));
        activeIndex = 0;
        renderResults();
    });
    resultsEl.addEventListener('click', (e) => {
        const li = e.target.closest('li[data-index]');
        if (li) go(filtered[Number(li.dataset.index)]);
    });
    document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            overlay.classList.contains('hidden') ? openPalette() : closePalette();
        }
        if (!overlay.classList.contains('hidden')) {
            if (e.key === 'Escape') closePalette();
            if (e.key === 'ArrowDown') { e.preventDefault(); activeIndex = Math.min(activeIndex + 1, filtered.length - 1); renderResults(); }
            if (e.key === 'ArrowUp') { e.preventDefault(); activeIndex = Math.max(activeIndex - 1, 0); renderResults(); }
            if (e.key === 'Enter') { e.preventDefault(); go(filtered[activeIndex]); }
        }
    });

})();
