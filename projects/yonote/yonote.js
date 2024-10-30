document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const addBox = document.querySelector(".add-box");
    const popupBox = document.querySelector(".popup-box");
    const closeIcon = document.querySelector(".close-icon");
    const titleInput = document.querySelector(".title-input");
    const addBtn = document.querySelector(".add-btn");
    const cancelBtn = document.querySelector(".cancel-btn");
    const notesContainer = document.querySelector(".notes-container");
    const searchInput = document.querySelector(".search-box");
    const categorySelect = document.querySelector(".category-select");
    const sortSelect = document.querySelector(".sort-select");
    const noteCategorySelect = document.querySelector(".note-category");
    const notePrioritySelect = document.querySelector(".note-priority");

    // New DOM Elements for Category Management
    const categoryManager = document.querySelector(".category-manager");
    const newCategoryInput = document.querySelector(".new-category-input");
    const addCategoryBtn = document.querySelector(".add-category-btn");
    const categoryList = document.querySelector(".category-list");

    // Initialize categories from localStorage or use defaults
    let categories = JSON.parse(localStorage.getItem("categories")) || ["Personal", "Work", "Shopping", "Ideas", "Goals", "Important"];
    let notes = JSON.parse(localStorage.getItem("notes") || "[]");
    let isUpdate = false, updateId;

    // Enhanced Quill Editor Configuration
    const editor = new Quill('#editor', {
        theme: 'snow',
        modules: {
            toolbar: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                ['blockquote', 'code-block'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                [{ 'script': 'sub'}, { 'script': 'super' }],
                [{ 'indent': '-1'}, { 'indent': '+1' }],
                [{ 'color': [] }, { 'background': [] }],
                [{ 'align': [] }],
                ['link', 'image', 'video'],
                ['clean']
            ],
            clipboard: { matchVisual: false }
        },
        placeholder: 'Write your note...'
    });

    // Create note element (from original code)
    function createNoteElement(note, id) {
        const noteDiv = document.createElement('div');
        noteDiv.classList.add('note', 'bg-white', 'rounded-lg', 'shadow-sm', 'hover:shadow-md', 
                            'transition-shadow', 'duration-200', 'overflow-hidden');
        noteDiv.dataset.id = id; // Important for drag-and-drop functionality
        
        if (note.priority) noteDiv.classList.add(`priority-${note.priority}`);
        const categoryClass = note.category ? `category-${note.category.toLowerCase()}` : '';
        
        noteDiv.innerHTML = `
            <div class="p-4">
                <div class="flex items-center justify-between mb-2">
                    <h3 class="text-lg font-semibold text-gray-800 truncate">${DOMPurify.sanitize(note.title)}</h3>
                    <div class="flex items-center space-x-2">
                        ${note.category ? 
                            `<span class="px-2 py-1 text-xs rounded-full ${categoryClass}">
                                ${DOMPurify.sanitize(note.category)}
                            </span>` : ''
                        }
                        <button class="text-gray-400 hover:text-gray-600" onclick="showMenu(this)">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                    </div>
                </div>
                
                <div class="text-gray-600 line-clamp-3 mb-4">
                    ${DOMPurify.sanitize(note.description)}
                </div>
                
                <div class="flex items-center justify-between text-sm text-gray-500">
                    <span>${note.date}</span>
                    <div class="flex items-center space-x-3">
                        <button onclick="togglePin(${id})" class="hover:text-gray-700">
                            <i class="fas fa-thumbtack ${note.pinned ? 'text-blue-600' : ''}"></i>
                        </button>
                        <button onclick="updateNote(${id})" class="hover:text-gray-700">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deleteNote(${id})" class="hover:text-red-600">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        return noteDiv;
    }

    // Show notes (modified to handle pinned notes)
    function showNotes(filteredNotes = notes) {
        notesContainer.innerHTML = '';
        document.querySelector('.notes-count').textContent = filteredNotes.length;

        if (!filteredNotes.length) {
            notesContainer.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <img src="https://raw.githubusercontent.com/Shubhamnpk/Yo-guru/refs/heads/main/img/icons/nonote.png" alt="No notes" class="mx-auto w-48 mb-4">
                    <p class="text-gray-500 text-lg">No notes found create a new note</p>
                </div>
            `;
            return;
        }

        // Sort notes: pinned first, then by date
        const sortedNotes = [...filteredNotes].sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return new Date(b.date) - new Date(a.date);
        });

        sortedNotes.forEach((note, id) => {
            notesContainer.appendChild(createNoteElement(note, id));
        });
    }

    // Initialize categories in both selects
    function initializeCategories() {
        const categoryOptions = categories.map(category => 
            `<option value="${category.toLowerCase()}">${category}</option>`
        ).join('');
        
        categorySelect.innerHTML = `
            <option value="all">All Categories</option>
            ${categoryOptions}
        `;
        
        noteCategorySelect.innerHTML = `
            <option value="">Select Category</option>
            ${categoryOptions}
        `;
    }

    // Category Management Functions
    function addCategory(categoryName) {
        if (!categoryName.trim()) return;
        
        categoryName = categoryName.trim();
        const normalizedName = categoryName.charAt(0).toUpperCase() + categoryName.slice(1).toLowerCase();
        
        if (categories.includes(normalizedName)) {
            alert('This category already exists!');
            return;
        }

        categories.push(normalizedName);
        localStorage.setItem("categories", JSON.stringify(categories));
        initializeCategories();
        updateCategoryList();
    }

    function deleteCategory(categoryName) {
        if (confirm(`Are you sure you want to delete the "${categoryName}" category?`)) {
            categories = categories.filter(cat => cat !== categoryName);
            notes = notes.map(note => {
                if (note.category === categoryName) {
                    note.category = "";
                }
                return note;
            });
            
            localStorage.setItem("categories", JSON.stringify(categories));
            localStorage.setItem("notes", JSON.stringify(notes));
            initializeCategories();
            updateCategoryList();
            showNotes();
        }
    }

    // Import/Export Functions
    function exportNotes() {
        const exportData = {
            notes: notes,
            categories: categories
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = 'notes-backup.json';
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }

    function importNotes(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                
                if (confirm('This will replace your current notes and categories. Continue?')) {
                    notes = importedData.notes || [];
                    categories = importedData.categories || [];
                    
                    localStorage.setItem("notes", JSON.stringify(notes));
                    localStorage.setItem("categories", JSON.stringify(categories));
                    
                    initializeCategories();
                    updateCategoryList();
                    showNotes();
                    
                    alert('Import successful!');
                }
            } catch (error) {
                alert('Error importing file. Please make sure it\'s a valid notes backup file.');
            }
        };
        reader.readAsText(file);
    }

    // Event Listeners
    addBox.addEventListener("click", () => {
        popupBox.classList.remove('hidden');
        titleInput.focus();
    });

    closeIcon.addEventListener("click", () => {
        isUpdate = false;
        titleInput.value = "";
        editor.setText('');
        noteCategorySelect.value = "";
        notePrioritySelect.value = "normal";
        popupBox.classList.add('hidden');
    });

    cancelBtn.addEventListener("click", () => {
        closeIcon.click();
    });

    // Save note
    addBtn.addEventListener("click", e => {
        e.preventDefault();
        
        const title = titleInput.value.trim();
        const description = editor.root.innerHTML.trim();
        const category = noteCategorySelect.value;
        const priority = notePrioritySelect.value;

        if (!title && !description) {
            alert("Please enter a title or description");
            return;
        }

        const noteInfo = {
            title,
            description,
            date: new Date().toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            }),
            category,
            priority,
            pinned: isUpdate ? notes[updateId].pinned : false
        };

        if (!isUpdate) {
            notes.unshift(noteInfo);
        } else {
            isUpdate = false;
            notes[updateId] = noteInfo;
        }

        localStorage.setItem("notes", JSON.stringify(notes));
        closeIcon.click();
        showNotes();
    });

    // Search functionality
    searchInput.addEventListener("input", e => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredNotes = notes.filter(note => {
            const inTitle = note.title.toLowerCase().includes(searchTerm);
            const inDescription = note.description.toLowerCase().includes(searchTerm);
            return inTitle || inDescription;
        });
        showNotes(filteredNotes);
    });

    // Category filter
    categorySelect.addEventListener("change", e => {
        const category = e.target.value;
        const filteredNotes = category === "all" 
            ? notes 
            : notes.filter(note => note.category.toLowerCase() === category);
        showNotes(filteredNotes);
    });

    // Sort notes
    sortSelect.addEventListener("change", e => {
        const sortBy = e.target.value;
        const sortedNotes = [...notes].sort((a, b) => {
            switch(sortBy) {
                case "title":
                    return a.title.localeCompare(b.title);
                case "date-new":
                    return new Date(b.date) - new Date(a.date);
                case "date-old":
                    return new Date(a.date) - new Date(b.date);
                case "priority":
                    const priorityOrder = { high: 3, medium: 2, normal: 1 };
                    return priorityOrder[b.priority] - priorityOrder[a.priority];
                default:
                    return 0;
            }
        });
        showNotes(sortedNotes);
    });

    // Update note
    window.updateNote = function(noteId) {
        const note = notes[noteId];
        updateId = noteId;
        isUpdate = true;
        
        addBox.click();
        titleInput.value = note.title;
        editor.root.innerHTML = note.description;
        noteCategorySelect.value = note.category;
        notePrioritySelect.value = note.priority || 'normal';
        
        addBtn.innerText = "Update Note";
    };

    // Delete note
    window.deleteNote = function(noteId) {
        if (!confirm("Are you sure you want to delete this note?")) return;
        notes.splice(noteId, 1);
        localStorage.setItem("notes", JSON.stringify(notes));
        showNotes();
    };

    // Toggle pin
    window.togglePin = function(noteId) {
        notes[noteId].pinned = !notes[noteId].pinned;
        localStorage.setItem("notes", JSON.stringify(notes));
        showNotes();
    };

    // Show context menu
    window.showMenu = function(elem) {
        const menu = document.getElementById('context-menu');
        const noteElement = elem.closest('.note');
        
        menu.classList.remove('hidden');
        menu.style.top = `${elem.getBoundingClientRect().bottom + window.scrollY}px`;
        menu.style.left = `${elem.getBoundingClientRect().left}px`;
        
        // Close menu when clicking outside
        const closeMenu = (e) => {
            if (!menu.contains(e.target) && !elem.contains(e.target)) {
                menu.classList.add('hidden');
                document.removeEventListener('click', closeMenu);
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', closeMenu);
        }, 0);
    };

    // Initialize drag and drop
    new Sortable(notesContainer, {
        animation: 150,
        onEnd: function() {
            const noteElements = document.querySelectorAll('.note');
            const newNotes = Array.from(noteElements).map(el => {
                const id = parseInt(el.dataset.id);
                return notes.find((note, index) => index === id);
            });
            notes = newNotes;
            localStorage.setItem("notes", JSON.stringify(notes));
        }
    });

    // Auto-save functionality
    let autoSaveTimeout;
    editor.on('text-change', function() {
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = setTimeout(() => {
            if (isUpdate) {
                const note = notes[updateId];
                if (note) {
                    note.description = editor.root.innerHTML;
                    localStorage.setItem("notes", JSON.stringify(notes));
                }
            }
        }, 1000);
    });

    // Word count and character count
    function updateWordCount() {
        const text = editor.getText().trim();
        const wordCount = text ? text.split(/\s+/).length : 0;
        const charCount = text.length;
        document.querySelector('.editor-stats').innerHTML = 
            `Words: ${wordCount} | Characters: ${charCount}`;
    }

    editor.on('text-change', updateWordCount);

    // Keyboard shortcuts
        window.addEventListener('keydown', function(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                addBtn.click();
            }
            // Escape key to close popups
            if (e.key === 'Escape') {
                closeIcon.click();
                document.querySelector('.category-manager')?.classList.add('hidden');
            }
            // Ctrl/Cmd + N to create new note
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                addBox.click();
            }
        });

    // Category Manager Event Listeners
    addCategoryBtn?.addEventListener('click', () => {
        addCategory(newCategoryInput.value);
        newCategoryInput.value = '';
    });

    newCategoryInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addCategory(newCategoryInput.value);
            newCategoryInput.value = '';
        }
    });

    function updateCategoryList() {
        if (!categoryList) return;
        
        categoryList.innerHTML = categories.map(category => `
            <div class="flex items-center justify-between p-2 border-b">
                <span>${category}</span>
                <div class="flex space-x-2">
                    <button onclick="editCategory('${category}')" 
                            class="text-blue-500 hover:text-blue-700">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteCategory('${category}')" 
                            class="text-red-500 hover:text-red-700">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Edit category functionality
    window.editCategory = function(oldCategory) {
        const newName = prompt('Enter new category name:', oldCategory);
        if (newName && newName !== oldCategory) {
            const normalizedName = newName.trim();
            
            if (categories.includes(normalizedName)) {
                alert('This category already exists!');
                return;
            }

            const categoryIndex = categories.indexOf(oldCategory);
            if (categoryIndex !== -1) {
                categories[categoryIndex] = normalizedName;
                
                // Update all notes with this category
                notes = notes.map(note => {
                    if (note.category === oldCategory) {
                        note.category = normalizedName;
                    }
                    return note;
                });

                localStorage.setItem("categories", JSON.stringify(categories));
                localStorage.setItem("notes", JSON.stringify(notes));
                
                initializeCategories();
                updateCategoryList();
                showNotes();
            }
        }
    };

    // Context menu options
    function addContextMenuOption(note, menu) {
        const moveToCategory = document.createElement('div');
        moveToCategory.className = 'context-menu-category';
        moveToCategory.innerHTML = `
            <select class="w-full p-2 border rounded">
                <option value="">Move to Category</option>
                ${categories.map(cat => `
                    <option value="${cat}" ${note.category === cat ? 'selected' : ''}>
                        ${cat}
                    </option>
                `).join('')}
            </select>
        `;

        moveToCategory.querySelector('select').addEventListener('change', (e) => {
            note.category = e.target.value;
            localStorage.setItem("notes", JSON.stringify(notes));
            showNotes();
            menu.classList.add('hidden');
        });

        menu.appendChild(moveToCategory);
    }

    // Global functions for HTML access
    window.deleteCategory = deleteCategory;
    window.exportNotes = exportNotes;
    window.importNotes = function(input) {
        if (input.files && input.files[0]) {
            importNotes(input.files[0]);
        }
    };

    // Print functionality
    window.printNote = function(noteId) {
        const note = notes[noteId];
        const printWindow = window.open('', '', 'width=800,height=600');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${note.title}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    .note-header { border-bottom: 1px solid #ccc; padding-bottom: 10px; margin-bottom: 20px; }
                    .note-content { line-height: 1.6; }
                    .note-footer { margin-top: 20px; color: #666; font-size: 0.9em; }
                </style>
            </head>
            <body>
                <div class="note-header">
                    <h1>${note.title}</h1>
                    ${note.category ? `<div>Category: ${note.category}</div>` : ''}
                </div>
                <div class="note-content">${note.description}</div>
                <div class="note-footer">Created: ${note.date}</div>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    };

    // Search highlighting
    function highlightSearchText(text, searchTerm) {
        if (!searchTerm) return text;
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    // Initialize everything
    function initialize() {
        initializeCategories();
        updateCategoryList();
        showNotes();
        updateWordCount();
        
        // Set up autosave indicator
        const autoSaveIndicator = document.createElement('div');
        autoSaveIndicator.className = 'autosave-indicator text-sm text-gray-500 mt-2 hidden';
        autoSaveIndicator.textContent = 'Saving...';
        document.querySelector('.editor-container').appendChild(autoSaveIndicator);
    }

    // Run initialization
    initialize();
});