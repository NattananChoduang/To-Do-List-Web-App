// Simple To-Do App (vanilla JS) - script.js
(() => {
  const STORAGE_KEY = 'todos_v2';

  // state
  let todos = loadTodos();
  let filter = 'all';
  let searchTerm = '';
  let sortMode = '';

  // elements
  const todoForm = document.getElementById('todo-form');
  const todoInput = document.getElementById('todo-input');
  const categoryInput = document.getElementById('category-input');
  const dueDateInput = document.getElementById('due-date-input');
  const todoList = document.getElementById('todo-list');
  const countsEl = document.getElementById('counts');
  const filterButtons = document.querySelectorAll('.filter-btn');
  const searchInput = document.getElementById('search-input');
  const clearCompletedBtn = document.getElementById('clear-completed');
  const sortDateBtn = document.getElementById('sort-date');
  const sortStatusBtn = document.getElementById('sort-status');

  // init
  renderTodos();
  attachEventListeners();

  // --- storage
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

  // --- render
  function renderTodos() {
    // filter + search
    let filtered = todos.filter(t => {
      if (filter === 'active' && t.completed) return false;
      if (filter === 'completed' && !t.completed) return false;
      if (searchTerm && !t.title.toLowerCase().includes(searchTerm)) return false;
      return true;
    });

    // sort
    if (sortMode === 'date') {
      filtered = filtered.sort((a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0));
    } else if (sortMode === 'status') {
      filtered = filtered.sort((a, b) => a.completed - b.completed);
    }

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

        // ✅ Animation effect
        li.classList.add('added');
        setTimeout(() => li.classList.remove('added'), 300);

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = !!todo.completed;
        checkbox.className = 'toggle';
        checkbox.addEventListener('change', () => toggleTodo(todo.id));

        const title = document.createElement('span');
        title.className = 'title';
        title.textContent = todo.title;
        title.addEventListener('dblclick', () => startEdit(li, todo));

        // category + due date info
        const meta = document.createElement('div');
        meta.className = 'meta';
        const due = todo.dueDate ? `📅 ${todo.dueDate}` : '📅 -';
        const cat = todo.category ? `🏷 ${todo.category}` : '';
        meta.textContent = `${due} ${cat}`;

        const editBtn = document.createElement('button');
        editBtn.className = 'btn edit';
        editBtn.textContent = '✎';
        editBtn.addEventListener('click', () => startEdit(li, todo));

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn delete';
        deleteBtn.textContent = '✖';
        deleteBtn.addEventListener('click', () => deleteTodo(todo.id, li));

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

  // --- CRUD
  function addTodo(title, category, dueDate) {
    const newTodo = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      title,
      completed: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      category,
      dueDate
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

  function deleteTodo(id, li) {
    // ✅ animation ก่อนลบ
    li.classList.add('removed');
    setTimeout(() => {
      todos = todos.filter(x => x.id !== id);
      saveTodos();
      renderTodos();
    }, 300);
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

  // --- editing inline
  function startEdit(li, todo) {
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
    li.replaceChild(input, titleEl);
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);

    function finish(save) {
      const val = input.value.trim();
      if (save && val) editTodo(todo.id, val);
      else renderTodos();
    }
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') finish(true);
      else if (e.key === 'Escape') finish(false);
    });
    input.addEventListener('blur', () => finish(true));
  }

  // --- utils
  function updateCounts() {
    const total = todos.length;
    const remaining = todos.filter(t => !t.completed).length;
    countsEl.textContent = `${total} งาน — ${remaining} งานที่ยังไม่เสร็จ`;
  }

  // --- event listeners
  function attachEventListeners() {
    todoForm.addEventListener('submit', e => {
      e.preventDefault();
      const title = todoInput.value.trim();
      const category = categoryInput.value;
      const due = dueDateInput.value;
      if (!title) return;
      addTodo(title, category, due);
      todoForm.reset();
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

    sortDateBtn.addEventListener('click', () => {
      sortMode = 'date';
      renderTodos();
    });

    sortStatusBtn.addEventListener('click', () => {
      sortMode = 'status';
      renderTodos();
    });

    window.addEventListener('keydown', e => {
      if (e.key === 'n' && document.activeElement.tagName !== 'INPUT') {
        todoInput.focus();
      }
    });
  }
})();
