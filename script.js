// Simple To-Do App (vanilla JS) - script.js
(() => {
  const STORAGE_KEY = 'todos_v1';

  // state
  let todos = loadTodos();
  let filter = 'all';
  let searchTerm = '';

  // elements
  const todoForm = document.getElementById('todo-form');
  const todoInput = document.getElementById('todo-input');
  const todoList = document.getElementById('todo-list');
  const countsEl = document.getElementById('counts');
  const filterButtons = document.querySelectorAll('.filter-btn');
  const searchInput = document.getElementById('search-input');
  const clearCompletedBtn = document.getElementById('clear-completed');

  // --- init
  renderTodos();
  attachEventListeners();

  // --- storage helpers
  function loadTodos() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Failed to load todos', e);
      return [];
    }
  }
  function saveTodos() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }

  // --- rendering
  function renderTodos() {
    // filter
    const filtered = todos.filter(t => {
      if (filter === 'active' && t.completed) return false;
      if (filter === 'completed' && !t.completed) return false;
      if (searchTerm && !t.title.toLowerCase().includes(searchTerm)) return false;
      return true;
    });

    // render list
    todoList.innerHTML = '';
    const frag = document.createDocumentFragment();

    if (filtered.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.style.color = '#6b7280';
      empty.style.padding = '14px';
      empty.textContent = 'ยังไม่มีงานที่ตรงกับเงื่อนไข';
      frag.appendChild(empty);
    } else {
      filtered.forEach(todo => {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        li.dataset.id = todo.id;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = !!todo.completed;
        checkbox.className = 'toggle';
        checkbox.addEventListener('change', () => toggleTodo(todo.id));

        const title = document.createElement('span');
        title.className = 'title';
        title.textContent = todo.title;
        title.title = 'ดับเบิลคลิกหรือกด ✎ เพื่อแก้ไข';
        title.addEventListener('dblclick', () => startEdit(li, todo));

        const meta = document.createElement('div');
        meta.className = 'meta';
        meta.textContent = formatDate(todo.createdAt);

        const editBtn = document.createElement('button');
        editBtn.className = 'btn edit';
        editBtn.setAttribute('aria-label', 'edit');
        editBtn.textContent = '✎';
        editBtn.addEventListener('click', () => startEdit(li, todo));

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn delete';
        deleteBtn.setAttribute('aria-label', 'delete');
        deleteBtn.textContent = '✖';
        deleteBtn.addEventListener('click', () => deleteTodo(todo.id));

        li.appendChild(checkbox);
        li.appendChild(title);
        li.appendChild(meta);
        li.appendChild(editBtn);
        li.appendChild(deleteBtn);

        frag.appendChild(li);
      });
    }

    todoList.appendChild(frag);
    updateCounts();
  }

  // --- actions
  function addTodo(title) {
    const newTodo = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      title,
      completed: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    todos.unshift(newTodo);
    saveTodos();
    renderTodos();
  }

  function toggleTodo(id) {
    const t = todos.find(x => x.id === id);
    if (!t) return;
    t.completed = !t.completed;
    t.updatedAt = Date.now();
    saveTodos();
    renderTodos();
  }

  function deleteTodo(id) {
    todos = todos.filter(x => x.id !== id);
    saveTodos();
    renderTodos();
  }

  function editTodo(id, newTitle) {
    const t = todos.find(x => x.id === id);
    if (!t) return;
    t.title = newTitle;
    t.updatedAt = Date.now();
    saveTodos();
    renderTodos();
  }

  function clearCompleted() {
    todos = todos.filter(t => !t.completed);
    saveTodos();
    renderTodos();
  }

  // --- editing UI
  function startEdit(li, todo) {
    // guard: if already in edit mode, return
    if (li.querySelector('input.edit-input')) return;

    const titleEl = li.querySelector('.title');
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'edit-input';
    input.value = todo.title;
    input.style.flex = '1';
    input.style.padding = '6px';
    input.style.borderRadius = '6px';
    input.style.border = '1px solid #e6e9ee';

    // replace title with input
    li.replaceChild(input, titleEl);
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);

    // handlers
    function finish(save) {
      const val = input.value.trim();
      if (save && val) editTodo(todo.id, val);
      else renderTodos(); // cancel or invalid -> re-render to restore
      cleanup();
    }
    function onKey(e) {
      if (e.key === 'Enter') finish(true);
      else if (e.key === 'Escape') finish(false);
    }
    function onBlur() {
      finish(true);
    }
    input.addEventListener('keydown', onKey);
    input.addEventListener('blur', onBlur);

    function cleanup() {
      input.removeEventListener('keydown', onKey);
      input.removeEventListener('blur', onBlur);
    }
  }

  // --- utils
  function formatDate(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleString('th-TH', {hour:'2-digit',minute:'2-digit',day:'2-digit',month:'short',year:'numeric'});
  }

  function updateCounts() {
    const total = todos.length;
    const remaining = todos.filter(t => !t.completed).length;
    countsEl.textContent = `${total} งาน — ${remaining} งานที่ยังไม่เสร็จ`;
  }

  // --- event listeners
  function attachEventListeners() {
    todoForm.addEventListener('submit', e => {
      e.preventDefault();
      const val = todoInput.value.trim();
      if (!val) return;
      addTodo(val);
      todoInput.value = '';
    });

    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filter = btn.dataset.filter;
        renderTodos();
      });
    });

    searchInput.addEventListener('input', e => {
      searchTerm = e.target.value.trim().toLowerCase();
      renderTodos();
    });

    clearCompletedBtn.addEventListener('click', () => {
      const confirmed = confirm('ต้องการลบทุกงานที่ทำเสร็จแล้วจริงหรือไม่?');
      if (confirmed) clearCompleted();
    });

    // keyboard shortcut: focus input with "n"
    window.addEventListener('keydown', (e) => {
      if (e.key === 'n' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        todoInput.focus();
      }
    });
  }

})();
