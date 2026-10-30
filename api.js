const API_URL = "https://jsonplaceholder.typicode.com/posts";

const loadBtn = document.querySelector("#load-btn");
const statusEl = document.querySelector("#status");
const notesList = document.querySelector("#notes-list");

let notes = [];
let busy = false;

// Show a message in the status area; type is "loading", "success" or "error"
function showStatus(message, type) {
  statusEl.textContent = message;
  statusEl.className = type;
}

// Disable the buttons while a request is running
function setBusy(isBusy) {
  busy = isBusy;
  loadBtn.disabled = isBusy;
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

// Build one note card (textContent only, never innerHTML for user text)
function createNoteItem(note) {
  const item = document.createElement("li");
  item.className = "note-card";

  const title = document.createElement("h3");
  title.textContent = note.title;

  const body = document.createElement("p");
  body.textContent = note.body || "(no body)";

  item.append(title, body);
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

renderNotes();