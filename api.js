const API_URL = "https://jsonplaceholder.typicode.com/posts";
const MAX_TITLE = 100;

const loadBtn = document.querySelector("#load-btn");
const statusEl = document.querySelector("#status");
const form = document.querySelector("#note-form");
const titleInput = document.querySelector("#title-input");
const bodyInput = document.querySelector("#body-input");
const submitBtn = document.querySelector("#submit-btn");
const notesList = document.querySelector("#notes-list");

let notes = [];
let busy = false;
let localCount = 0;

// Show a message in the status area; type is "loading", "success" or "error"
function showStatus(message, type) {
  statusEl.textContent = message;
  statusEl.className = type;
}

// Disable every button while a request is running
function setBusy(isBusy) {
  busy = isBusy;
  loadBtn.disabled = isBusy;
  submitBtn.disabled = isBusy;
  for (const btn of notesList.querySelectorAll(".delete-btn")) {
    btn.disabled = isBusy;
  }
}

// Reusable request: calls fetch, checks response.ok and throws on errors
async function request(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const error = new Error(`Request failed with status ${response.status}`);
    error.status = response.status;
    throw error;
  }
  const data = await response.json().catch(function () {
    return {};
  });
  return { status: response.status, data: data };
}

// GET: load 10 notes
async function loadNotes() {
  setBusy(true);
  showStatus("Loading notes...", "loading");
  try {
    const result = await request(`${API_URL}?_limit=10`);
    notes = result.data.map(function (note) {
      return { ...note, key: String(note.id) };
    });
    renderNotes();
    showStatus(`Loaded ${notes.length} notes from the server.`, "success");
  } catch (error) {
    showStatus("Sorry, we could not load your notes. Please try again.", "error");
  } finally {
    setBusy(false);
  }
}

// POST: create a note
async function createNote(title, body) {
  setBusy(true);
  showStatus("Saving note...", "loading");
  try {
    const result = await request(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title, body: body, userId: 1 }),
    });
    // JSONPlaceholder gives every new note the same id (101), so each note
    // created on this page also gets its own unique "key" for the list.
    localCount++;
    notes.unshift({ ...result.data, key: `local-${localCount}`, local: true });
    renderNotes();
    form.reset();
    showStatus(`Note created (status ${result.status}, id ${result.data.id}).`, "success");
  } catch (error) {
    showStatus("Sorry, we could not save your note. Please try again.", "error");
  } finally {
    setBusy(false);
  }
}

// DELETE: remove a note
// JSONPlaceholder does not really store notes we create, so the server has
// no record of them and may answer 404 when we delete one. For a note created
// on this page, a 404 therefore still means "gone", so we remove it anyway.
async function deleteNote(note) {
  setBusy(true);
  showStatus("Deleting note...", "loading");
  try {
    let message;
    try {
      const result = await request(`${API_URL}/${note.id}`, { method: "DELETE" });
      message = `Note deleted (status ${result.status}).`;
    } catch (error) {
      if (!(note.local && error.status === 404)) {
        throw error;
      }
      message = "Note removed (the practice API never saved it, status 404).";
    }
    notes = notes.filter(function (item) {
      return item.key !== note.key;
    });
    renderNotes();
    showStatus(message, "success");
  } catch (error) {
    showStatus("Sorry, we could not delete that note. Please try again.", "error");
  } finally {
    setBusy(false);
  }
}

// Build one note card (textContent only, never innerHTML for user text)
function createNoteItem(note) {
  const item = document.createElement("li");
  item.className = "note-card";

  const title = document.createElement("h3");
  title.textContent = note.title;

  const body = document.createElement("p");
  body.textContent = note.body || "(no body)";

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "delete-btn";
  deleteBtn.textContent = "Delete";
  deleteBtn.disabled = busy;
  deleteBtn.addEventListener("click", function () {
    deleteNote(note);
  });

  item.append(title, body, deleteBtn);
  return item;
}

// Rebuild the list, or show the empty state
function renderNotes() {
  notesList.textContent = "";
  if (notes.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = 'No notes yet. Click "Load notes" or add one above.';
    notesList.append(empty);
    return;
  }
  for (const note of notes) {
    notesList.append(createNoteItem(note));
  }
}

loadBtn.addEventListener("click", loadNotes);

form.addEventListener("submit", function (event) {
  event.preventDefault();
  const title = titleInput.value.trim();

  if (title === "") {
    showStatus("Please enter a title.", "error");
    return;
  }
  if (title.length > MAX_TITLE) {
    showStatus("The title must be 100 characters or fewer.", "error");
    return;
  }

  createNote(title, bodyInput.value.trim());
});

renderNotes();