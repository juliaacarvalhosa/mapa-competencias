if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(error => {
      console.warn('Falha ao preparar o mapa para consulta offline.', error);
    });
  });
}
