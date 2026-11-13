try {
  var t = localStorage.getItem('rt300-theme')
  var dark = t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches
  document.documentElement.classList.toggle('dark', dark)
  document.querySelector('meta[name="theme-color"]').setAttribute('content', dark ? '#050a14' : '#0a1a3d')
} catch (e) {}
