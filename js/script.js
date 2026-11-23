(() => {
    'use strict';

    const menuToggle = document.querySelector('.menu-toggle');
    const navList = document.querySelector('.nav-list');
    const navLinks = navList ? navList.querySelectorAll('.nav-link') : [];
    const mobileMenuMedia = window.matchMedia('(max-width: 860px)');
    const touchCardMedia = window.matchMedia('(max-width: 767px), (hover: none) and (pointer: coarse)');
    const cards = Array.from(document.querySelectorAll('.card-1, .card-2, .card-3, .card-4'));
    const currentYear = document.querySelector('[data-current-year]');

    if (currentYear) currentYear.textContent = String(new Date().getFullYear());

    const setMenuState = (isOpen, { restoreFocus = false } = {}) => {
        if (!menuToggle || !navList) return;

        const shouldOpen = Boolean(isOpen && mobileMenuMedia.matches);

        menuToggle.setAttribute('aria-expanded', String(shouldOpen));
        menuToggle.setAttribute('aria-label', shouldOpen ? 'Fechar menu' : 'Abrir menu');
        navList.classList.toggle('is-open', shouldOpen);
        navList.setAttribute('aria-hidden', String(mobileMenuMedia.matches && !shouldOpen));
        navList.inert = mobileMenuMedia.matches && !shouldOpen;
        document.body.classList.toggle('menu-open', shouldOpen);

        if (restoreFocus) menuToggle.focus();
    };

    if (menuToggle && navList) {
        // O menu permanece acessível no desktop e inicia fechado em telas menores.
        setMenuState(false);

        menuToggle.addEventListener('click', () => {
            const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
            setMenuState(!isOpen);

            if (!isOpen) {
                const firstLink = navList.querySelector('.nav-link');
                firstLink?.focus({ preventScroll: true });
            } else {
                menuToggle.focus();
            }
        });

        navLinks.forEach((link) => {
            link.addEventListener('click', () => {
                setMenuState(false);
                const target = document.querySelector(link.getAttribute('href'));
                if (target) {
                    target.setAttribute('tabindex', '-1');
                    target.focus({ preventScroll: true });
                }
            });
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
                setMenuState(false, { restoreFocus: true });
            }
        });

        mobileMenuMedia.addEventListener('change', (event) => {
            if (!event.matches) {
                setMenuState(false);
                navList.removeAttribute('aria-hidden');
                navList.inert = false;
            } else {
                setMenuState(false);
            }
        });
    }

    const syncCardAccessibility = () => {
        cards.forEach((card) => {
            const overlay = card.querySelector('.overlay');
            const isActive = card.classList.contains('is-active');
            const isHidden = touchCardMedia.matches && !isActive;

            card.setAttribute('aria-expanded', String(isActive));
            if (overlay) {
                overlay.setAttribute('aria-hidden', String(isHidden));
                overlay.inert = isHidden;
            }
        });
    };

    const setActiveCard = (selectedCard) => {
        cards.forEach((card) => {
            const overlay = card.querySelector('.overlay');
            const wasActive = card.classList.contains('is-active');
            const isActive = card === selectedCard && !wasActive;

            if (wasActive && !isActive && overlay?.contains(document.activeElement)) {
                card.focus({ preventScroll: true });
            }

            card.classList.toggle('is-active', isActive);
        });
        syncCardAccessibility();
    };

    syncCardAccessibility();
    touchCardMedia.addEventListener('change', () => setActiveCard(null));

    cards.forEach((card) => {
        card.addEventListener('click', (event) => {
            if (!touchCardMedia.matches || event.target.closest('a')) return;
            setActiveCard(card);
        });

        card.addEventListener('keydown', (event) => {
            if (!touchCardMedia.matches || event.target !== card) return;
            if (event.key !== 'Enter' && event.key !== ' ') return;

            event.preventDefault();
            setActiveCard(card);
        });
    });

    // Animações progressivas são desativadas quando o usuário prefere movimento reduzido.
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || !window.gsap || !window.ScrollTrigger) return;

    const { gsap, ScrollTrigger } = window;
    gsap.registerPlugin(ScrollTrigger);

    // Entrada suave do conteúdo principal.
    gsap.from('.texto-hero-container > *', {
        y: 28,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power2.out',
        delay: 0.15,
        clearProps: 'all'
    });

    gsap.utils.toArray('.text-sobre-container, .text-servicos-container, .text-assinar-container').forEach((element) => {
        gsap.from(element, {
            y: 38,
            opacity: 0,
            duration: 0.85,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: element,
                start: 'top 82%',
                once: true
            }
        });
    });

    // Em mobile, os cards ficam sticky e recuam suavemente quando o próximo se aproxima.
    // Não aplicar filtros de brilho no elemento inteiro: isso escurece também a imagem e o overlay.
    const responsiveAnimations = gsap.matchMedia();
    responsiveAnimations.add('(max-width: 767px), (hover: none) and (pointer: coarse)', () => {
        const mobileCards = gsap.utils.toArray('.card-1, .card-2, .card-3, .card-4');

        mobileCards.forEach((card) => {
            gsap.set(card, { transformOrigin: 'center top' });
        });

        mobileCards.slice(0, -1).forEach((card, index) => {
            gsap.to(card, {
                scale: 0.96,
                y: -14,
                ease: 'none',
                scrollTrigger: {
                    trigger: mobileCards[index + 1],
                    start: 'top 78%',
                    end: 'top 32%',
                    scrub: 0.5,
                    invalidateOnRefresh: true
                }
            });
        });
    });

    // Recalcula os pontos de disparo depois que as imagens de fundo e os assets carregarem.
    window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
})();
