document.addEventListener('DOMContentLoaded', function () {
  const reviewerSelect = document.getElementById('reviewerSelect');
  const usuario = JSON.parse(localStorage.getItem('usuario'));

  if (!usuario) {
    console.error('No hay usuario en sesión');
    return;
  }

  if (reviewerSelect) {
    reviewerSelect.innerHTML = '';

    const option = document.createElement('option');
    option.value = usuario.idusuario;   
    option.textContent = usuario.nombre; 
    option.selected = true;

    reviewerSelect.appendChild(option);

    reviewerSelect.disabled = true; 
  }
});
