// script.js – versão com tratamento recursivo de objetos/arrays

document.addEventListener('DOMContentLoaded', () => {
  const form            = document.getElementById('cnpj-form');
  const input           = document.getElementById('cnpj-input');
  const container       = document.getElementById('result-container');
  const statusContainer = document.getElementById('status-container');

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const cnpj = input.value.replace(/\D/g, '');
    // limpa tudo antes de cada consulta
    container.innerHTML = '';
    statusContainer.innerHTML = '';

    if (cnpj.length !== 14) {
      container.innerHTML = `<p class="error">CNPJ deve ter 14 dígitos numéricos.</p>`;
      return;
    }

    container.innerHTML = `<p>Carregando...</p>`;

    try {
      const resp = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
      if (!resp.ok) throw new Error(`Erro ${resp.status}: ${resp.statusText}`);
      const data = await resp.json();
      // limpa mensagens antigas
      container.innerHTML = '';
      statusContainer.innerHTML = '';

      // === monta o indicador de situação cadastral ===
      const situacao = (data.situacao_cadastral || '').toLowerCase() === 'ativa';
      const motivo   = data.motivo_situacao_cadastral || '(sem informação)';
      const indicador = document.createElement('div');
      indicador.classList.add('status-indicator', situacao ? 'active' : 'inactive');

      const texto = document.createElement('span');
      texto.id = 'status-text';
      texto.textContent = situacao
        ? 'Cadastral: ATIVA'
        : `Cadastral: INATIVA (Motivo: ${motivo})`;

      statusContainer.append(indicador, texto);
      // ===============================================

      // renderiza todos os campos normalmente
      renderObject(data, container);

    } catch (err) {
      statusContainer.innerHTML = '';
      container.innerHTML = `<p class="error">Falha na requisição: ${err.message}</p>`;
    }
  });

  // Função que renderiza qualquer objeto/array recursivamente:
  function renderObject(obj, parent, keyPrefix = '') {
    Object.entries(obj).forEach(([key, value]) => {
      const fieldKey = keyPrefix ? `${keyPrefix}.${key}` : key;

      if (Array.isArray(value)) {
        renderArray(fieldKey, value, parent);
      } else if (value !== null && typeof value === 'object') {
        // agrupa objeto aninhado como um sub-fieldset
        const fs = document.createElement('fieldset');
        fs.classList.add('result-array-item');
        const legend = document.createElement('legend');
        legend.textContent = key;
        fs.appendChild(legend);
        renderObject(value, fs, '');
        parent.appendChild(fs);
      } else {
        // valor primitivo
        const field = document.createElement('div');
        field.classList.add('result-field');

        const label = document.createElement('label');
        label.textContent = key;

        const inputValue = document.createElement('input');
        inputValue.type = 'text';
        inputValue.readOnly = true;
        inputValue.value = value ?? '';

        field.append(label, inputValue);
        parent.appendChild(field);
      }
    });
  }

  function renderArray(key, arr, parent) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('result-array');

    const label = document.createElement('div');
    label.classList.add('array-label');
    label.textContent = key;
    wrapper.appendChild(label);

    if (arr.length === 0) {
      const empty = document.createElement('p');
      empty.textContent = '(vazio)';
      wrapper.appendChild(empty);
    } else if (arr.every(item => typeof item !== 'object')) {
      // array de primitivos
      const field = document.createElement('div');
      field.classList.add('result-field');
      const inputValue = document.createElement('input');
      inputValue.type = 'text';
      inputValue.readOnly = true;
      inputValue.value = arr.join(', ');
      field.append(inputValue);
      wrapper.appendChild(field);
    } else {
      // array de objetos (CNAEs, sócios, etc)
      arr.forEach((item, idx) => {
        const fs = document.createElement('fieldset');
        fs.classList.add('result-array-item');
        const legend = document.createElement('legend');
        legend.textContent = `${key} [${idx + 1}]`;
        fs.appendChild(legend);
        renderObject(item, fs);
        wrapper.appendChild(fs);
      });
    }

    parent.appendChild(wrapper);
  }

});
