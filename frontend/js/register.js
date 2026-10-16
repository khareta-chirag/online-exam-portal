const form = document.getElementById('registerForm');
const message = document.getElementById('message');
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  message.textContent = 'Creating account...';
  try {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: document.getElementById('name').value, email: document.getElementById('email').value, password: document.getElementById('password').value })
    });
    saveSession(data);
    location.href = 'dashboard.html';
  } catch (error) { message.textContent = error.message; }
});
