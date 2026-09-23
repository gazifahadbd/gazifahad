(() => {
  const menuFor = (button) => button
    .closest('.block-header-layout-mobile')
    ?.querySelector('.block-header-layout-mobile__dropdown');

  document.addEventListener('click', (event) => {
    const button = event.target.closest('.block-header__hamburger-menu');
    if (button) {
      const menu = menuFor(button);
      const isOpen = Boolean(menu?.classList.toggle('block-header-layout-mobile__dropdown--open'));
      button.classList.toggle('burger--open', isOpen);
      button.setAttribute('aria-expanded', String(isOpen));
      return;
    }

    const localLink = event.target.closest('.block-header-layout-mobile__dropdown a[href^="/"]');
    if (localLink) {
      const menu = localLink.closest('.block-header-layout-mobile__dropdown');
      menu?.classList.remove('block-header-layout-mobile__dropdown--open');
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    document.querySelectorAll('.block-header-layout-mobile__dropdown--open').forEach((menu) => {
      menu.classList.remove('block-header-layout-mobile__dropdown--open');
    });
    document.querySelectorAll('.block-header__hamburger-menu[aria-expanded="true"]').forEach((button) => {
      button.classList.remove('burger--open');
      button.setAttribute('aria-expanded', 'false');
      button.focus();
    });
  });
})();
