/* =================================================================
   VENNUS — Customer service chat widget
   -----------------------------------------------------------------
   A floating bubble on every page. First message asks for a name
   and email and starts a conversation; after that it's just a
   message box. Staff replies appear here automatically (polled
   every 6s while the widget is open) — and, if the store has an
   email provider configured, in the customer's inbox too.

   Requires js/vennus-api.js to be loaded first (for VENNUS_API).
   Self-contained: injects its own markup and styles, so there is
   nothing to add to your HTML files beyond the script tag.
   ================================================================= */

(function () {
  const STORE_KEY = "vennus_chat_thread";   // { id, token }

  function getThread() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || "null"); }
    catch { return null; }
  }
  function saveThread(t) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(t)); } catch {}
  }

  function injectStyles() {
    const css = `
      .vn-chat-bubble {
        position: fixed; right: 24px; bottom: 24px; z-index: 150;
        width: 56px; height: 56px; border-radius: 50%;
        background: var(--umber, #3B2C20); color: var(--blanc, #FAF7F1);
        display: flex; align-items: center; justify-content: center;
        cursor: pointer; box-shadow: 0 6px 20px rgba(0,0,0,.18);
        border: none; transition: transform .2s ease;
      }
      .vn-chat-bubble:hover { transform: scale(1.06); }
      .vn-chat-bubble svg { width: 24px; height: 24px; stroke: currentColor; fill: none; stroke-width: 1.4; }
      .vn-chat-panel {
        position: fixed; right: 24px; bottom: 92px; z-index: 150;
        width: min(340px, calc(100vw - 48px)); height: min(460px, calc(100vh - 160px));
        background: var(--blanc, #FAF7F1); border: 1px solid rgba(59,44,32,.14);
        box-shadow: 0 14px 40px rgba(0,0,0,.18);
        display: none; flex-direction: column; overflow: hidden;
        font-family: var(--font-body, 'Jost', sans-serif);
      }
      .vn-chat-panel.open { display: flex; }
      .vn-chat-head {
        background: var(--umber, #3B2C20); color: var(--blanc, #FAF7F1);
        padding: 14px 16px; font-family: var(--font-display, serif); font-size: 1.05rem;
        display: flex; justify-content: space-between; align-items: center;
      }
      .vn-chat-head button { background: none; border: none; color: inherit; font-size: 1.1rem; cursor: pointer; line-height: 1; }
      .vn-chat-body { flex: 1; overflow-y: auto; padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; }
      .vn-chat-msg { max-width: 82%; padding: 9px 12px; font-size: .85rem; line-height: 1.45; border-radius: 2px; }
      .vn-chat-msg.customer { align-self: flex-end; background: var(--umber, #3B2C20); color: var(--blanc, #FAF7F1); }
      .vn-chat-msg.staff { align-self: flex-start; background: var(--craie, #EDE3D3); color: var(--umber, #3B2C20); }
      .vn-chat-hint { font-size: .78rem; color: var(--beton, #8D8477); text-align: center; padding: 20px 10px; }
      .vn-chat-form { border-top: 1px solid rgba(59,44,32,.14); padding: 12px; display: flex; flex-direction: column; gap: 8px; }
      .vn-chat-form input, .vn-chat-form textarea {
        border: 1px solid rgba(59,44,32,.14); padding: 8px 10px; font-size: .85rem; font-family: inherit; background: #fff;
      }
      .vn-chat-form textarea { min-height: 44px; resize: none; }
      .vn-chat-row { display: flex; gap: 8px; }
      .vn-chat-row textarea { flex: 1; }
      .vn-chat-send {
        background: var(--umber, #3B2C20); color: var(--blanc, #FAF7F1); border: none;
        padding: 0 16px; font-size: .8rem; cursor: pointer;
      }
      .vn-chat-send:hover { background: var(--chai, #B8865A); }
    `;
    const style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
  }

  function bubbleIcon() {
    return `<svg viewBox="0 0 24 24"><path d="M4 5h16v11H8l-4 4V5z"/></svg>`;
  }

  function buildDOM() {
    const bubble = document.createElement("button");
    bubble.className = "vn-chat-bubble";
    bubble.setAttribute("aria-label", "Chat with us");
    bubble.innerHTML = bubbleIcon();

    const panel = document.createElement("div");
    panel.className = "vn-chat-panel";
    panel.innerHTML = `
      <div class="vn-chat-head"><span>Ask Vennus</span><button type="button" aria-label="Close chat">&times;</button></div>
      <div class="vn-chat-body" id="vnChatBody"></div>
      <div class="vn-chat-form" id="vnChatForm"></div>
    `;

    document.body.appendChild(bubble);
    document.body.appendChild(panel);
    return { bubble, panel };
  }

  function renderStartForm(container, onStart) {
    container.innerHTML = `
      <input type="text" id="vnName" placeholder="Your name">
      <input type="email" id="vnEmail" placeholder="Your email" required>
      <textarea id="vnMsg" placeholder="How can we help?"></textarea>
      <button type="button" class="vn-chat-send" id="vnStartBtn">Send</button>
    `;
    container.querySelector("#vnStartBtn").addEventListener("click", async () => {
      const name = container.querySelector("#vnName").value.trim();
      const email = container.querySelector("#vnEmail").value.trim();
      const message = container.querySelector("#vnMsg").value.trim();
      if (!email || !message) return;
      onStart(name, email, message);
    });
  }

  function renderReplyForm(container, onSend) {
    container.innerHTML = `
      <div class="vn-chat-row">
        <textarea id="vnReply" placeholder="Type a message…"></textarea>
        <button type="button" class="vn-chat-send" id="vnSendBtn">Send</button>
      </div>
    `;
    const send = () => {
      const el = container.querySelector("#vnReply");
      const val = el.value.trim();
      if (!val) return;
      el.value = "";
      onSend(val);
    };
    container.querySelector("#vnSendBtn").addEventListener("click", send);
    container.querySelector("#vnReply").addEventListener("keydown", e => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
    });
  }

  function renderMessages(body, messages) {
    body.innerHTML = messages.map(m =>
      `<div class="vn-chat-msg ${m.sender}">${escapeHtml(m.body)}</div>`).join("")
      || '<p class="vn-chat-hint">Send a message and we\'ll get back to you.</p>';
    body.scrollTop = body.scrollHeight;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
  }

  async function init() {
    injectStyles();
    const { bubble, panel } = buildDOM();
    const body = panel.querySelector("#vnChatBody");
    const formWrap = panel.querySelector("#vnChatForm");
    const closeBtn = panel.querySelector(".vn-chat-head button");

    let pollTimer = null;

    function stopPolling() { if (pollTimer) clearInterval(pollTimer); }

    async function loadThread(thread) {
      try {
        const res = await fetch(`${VENNUS_API}/api/public/chat/${thread.id}?access_token=${thread.token}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        renderMessages(body, data.messages);
      } catch {
        body.innerHTML = '<p class="vn-chat-hint">Couldn\'t load your conversation right now — try again shortly.</p>';
      }
    }

    function startPolling(thread) {
      stopPolling();
      pollTimer = setInterval(() => loadThread(thread), 6000);
    }

    function showThreadUI(thread) {
      renderReplyForm(formWrap, async (message) => {
        try {
          await fetch(`${VENNUS_API}/api/public/chat/${thread.id}/message`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ access_token: thread.token, message })
          });
          loadThread(thread);
        } catch { /* the message box already cleared; a retry is one click away */ }
      });
      loadThread(thread);
      startPolling(thread);
    }

    function showStartUI() {
      body.innerHTML = '<p class="vn-chat-hint">Have a question about a piece, an order, or anything else? We usually reply within a day.</p>';
      renderStartForm(formWrap, async (name, email, message) => {
        try {
          const res = await fetch(`${VENNUS_API}/api/public/chat/start`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, message })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Could not send your message.");
          const thread = { id: data.conversation_id, token: data.access_token };
          saveThread(thread);
          if (window.vennusTrack) window.vennusTrack("chat_started");
          showThreadUI(thread);
        } catch {
          body.innerHTML = '<p class="vn-chat-hint">Something went wrong sending that — please try again in a moment.</p>';
        }
      });
    }

    bubble.addEventListener("click", () => {
      panel.classList.toggle("open");
      if (!panel.classList.contains("open")) { stopPolling(); return; }
      const thread = getThread();
      thread ? showThreadUI(thread) : showStartUI();
    });
    closeBtn.addEventListener("click", () => { panel.classList.remove("open"); stopPolling(); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
