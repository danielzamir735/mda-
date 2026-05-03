(function () {
  try {
    var s = localStorage.getItem('emt-settings');
    var theme = s ? JSON.parse(s).state.theme : 'dark';
    if (theme !== 'light') document.documentElement.classList.add('dark');
  } catch (_) {
    document.documentElement.classList.add('dark');
  }
})();
