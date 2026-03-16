import { useState } from "react";

const tokenKey = "favorite_addresses_token";

function getInitialToken() {
  return localStorage.getItem(tokenKey) || "";
}

async function api(path, token, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(path, { ...options, headers });
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok) {
    throw new Error(payload?.message || `HTTP ${response.status}`);
  }

  return payload;
}

function AddressList({ items }) {
  if (!items.length) {
    return (
      <ul className="list">
        <li>Aucun resultat.</li>
      </ul>
    );
  }

  return (
    <ul className="list">
      {items.map((item) => (
        <li key={item.id}>
          <strong>{item.name}</strong>
          <span>{item.description || "Pas de description"}</span>
          <br />
          <small>
            lat: {item.lat}, lng: {item.lng}
          </small>
        </li>
      ))}
    </ul>
  );
}

export default function App() {
  const [token, setToken] = useState(getInitialToken);
  const [status, setStatus] = useState(
    getInitialToken() ? "Token detecte dans le navigateur. Tu peux charger ton profil." : "Pret."
  );
  const [statusError, setStatusError] = useState(false);

  const [me, setMe] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [searchItems, setSearchItems] = useState([]);

  const [register, setRegister] = useState({ email: "", password: "" });
  const [login, setLogin] = useState({ email: "", password: "" });
  const [addressForm, setAddressForm] = useState({
    name: "",
    searchWord: "",
    description: "",
  });
  const [searchForm, setSearchForm] = useState({ lat: "", lng: "", radius: "" });
  const isAuthenticated = Boolean(token);

  function setStatusPayload(payload, isError = false) {
    setStatus(typeof payload === "string" ? payload : JSON.stringify(payload, null, 2));
    setStatusError(isError);
  }

  async function handleRegister(event) {
    event.preventDefault();
    try {
      const payload = await api("/api/users", token, {
        method: "POST",
        body: JSON.stringify(register),
      });
      setStatusPayload({ action: "register", payload });
      setRegister({ email: "", password: "" });
    } catch (error) {
      setStatusPayload({ action: "register", error: error.message }, true);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    try {
      const payload = await api("/api/users/tokens", token, {
        method: "POST",
        body: JSON.stringify(login),
      });
      const nextToken = payload?.token || "";
      localStorage.setItem(tokenKey, nextToken);
      setToken(nextToken);
      setStatusPayload({ action: "login", payload });
      setLogin({ email: "", password: "" });
    } catch (error) {
      setStatusPayload({ action: "login", error: error.message }, true);
    }
  }

  async function handleMe() {
    if (!isAuthenticated) {
      setStatusPayload({ action: "me", error: "Authentification requise." }, true);
      return;
    }

    try {
      const payload = await api("/api/users/me", token);
      setMe(payload.item);
      setStatusPayload({ action: "me", ok: true });
    } catch (error) {
      setMe(null);
      setStatusPayload({ action: "me", error: error.message }, true);
    }
  }

  function handleLogout() {
    localStorage.removeItem(tokenKey);
    setToken("");
    setMe(null);
    setAddresses([]);
    setSearchItems([]);
    setStatusPayload("Token supprime localement.");
  }

  async function refreshAddresses() {
    if (!isAuthenticated) {
      throw new Error("Authentification requise.");
    }

    const payload = await api("/api/addresses", token);
    setAddresses(payload.items || []);
    return payload;
  }

  async function handleCreateAddress(event) {
    event.preventDefault();
    if (!isAuthenticated) {
      setStatusPayload({ action: "createAddress", error: "Authentification requise." }, true);
      return;
    }

    try {
      const payload = await api("/api/addresses", token, {
        method: "POST",
        body: JSON.stringify(addressForm),
      });
      setStatusPayload({ action: "createAddress", payload });
      setAddressForm({ name: "", searchWord: "", description: "" });
      await refreshAddresses();
    } catch (error) {
      setStatusPayload({ action: "createAddress", error: error.message }, true);
    }
  }

  async function handleRefreshAddresses() {
    if (!isAuthenticated) {
      setStatusPayload({ action: "listAddresses", error: "Authentification requise." }, true);
      return;
    }

    try {
      const payload = await refreshAddresses();
      setStatusPayload({ action: "listAddresses", count: payload.items?.length || 0 });
    } catch (error) {
      setStatusPayload({ action: "listAddresses", error: error.message }, true);
    }
  }

  async function handleSearch(event) {
    event.preventDefault();
    if (!isAuthenticated) {
      setStatusPayload({ action: "searchByRadius", error: "Authentification requise." }, true);
      return;
    }

    const lat = Number(searchForm.lat);
    const lng = Number(searchForm.lng);
    const radius = Number(searchForm.radius);

    try {
      if (!lat || !lng || !radius || radius < 0) {
        throw new Error("lat, lng et radius doivent etre des nombres non nuls.");
      }

      const payload = await api("/api/addresses/searches", token, {
        method: "POST",
        body: JSON.stringify({
          radius,
          from: { lat, lng },
        }),
      });

      setSearchItems(payload.items || []);
      setStatusPayload({ action: "searchByRadius", count: payload.items?.length || 0 });
    } catch (error) {
      setStatusPayload({ action: "searchByRadius", error: error.message }, true);
    }
  }

  return (
    <div id="app">
      <header className="hero">
        <h1>My Favorite Addresses</h1>
        <p>Inscris-toi, connecte-toi, sauvegarde des adresses et filtre-les par distance.</p>
      </header>

      <main className="layout">
        <section className="card auth">
          <h2>Authentification</h2>
          <form className="stack" onSubmit={handleRegister}>
            <h3>Creer un compte</h3>
            <input
              name="email"
              type="email"
              placeholder="Email"
              value={register.email}
              onChange={(event) => setRegister((prev) => ({ ...prev, email: event.target.value }))}
              required
            />
            <input
              name="password"
              type="password"
              placeholder="Mot de passe"
              minLength="4"
              value={register.password}
              onChange={(event) =>
                setRegister((prev) => ({ ...prev, password: event.target.value }))
              }
              required
            />
            <button type="submit">Creer</button>
          </form>

          <form className="stack" onSubmit={handleLogin}>
            <h3>Se connecter</h3>
            <input
              name="email"
              type="email"
              placeholder="Email"
              value={login.email}
              onChange={(event) => setLogin((prev) => ({ ...prev, email: event.target.value }))}
              required
            />
            <input
              name="password"
              type="password"
              placeholder="Mot de passe"
              value={login.password}
              onChange={(event) => setLogin((prev) => ({ ...prev, password: event.target.value }))}
              required
            />
            <button type="submit">Connexion</button>
          </form>

          <div className="stack">
            <button type="button" onClick={handleMe} disabled={!isAuthenticated}>
              Charger mon profil
            </button>
            <button type="button" className="ghost" onClick={handleLogout}>
              Deconnexion
            </button>
          </div>
          <pre className="output">{me ? JSON.stringify(me, null, 2) : "Aucun utilisateur charge."}</pre>
        </section>

        {isAuthenticated ? (
          <>
            <section className="card">
              <h2>Mes adresses</h2>
              <form className="stack" onSubmit={handleCreateAddress}>
                <input
                  name="name"
                  placeholder="Nom de l'adresse"
                  value={addressForm.name}
                  onChange={(event) =>
                    setAddressForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  required
                />
                <input
                  name="searchWord"
                  placeholder="Recherche (ex: Paris, 10 Downing Street)"
                  value={addressForm.searchWord}
                  onChange={(event) =>
                    setAddressForm((prev) => ({ ...prev, searchWord: event.target.value }))
                  }
                  required
                />
                <textarea
                  name="description"
                  rows="3"
                  placeholder="Description (optionnelle)"
                  value={addressForm.description}
                  onChange={(event) =>
                    setAddressForm((prev) => ({ ...prev, description: event.target.value }))
                  }
                />
                <button type="submit">Ajouter l'adresse</button>
              </form>

              <div className="stack">
                <button type="button" onClick={handleRefreshAddresses}>
                  Rafraichir les adresses
                </button>
                <AddressList items={addresses} />
              </div>
            </section>

            <section className="card">
              <h2>Recherche par rayon</h2>
              <form className="stack" onSubmit={handleSearch}>
                <input
                  name="lat"
                  type="number"
                  step="any"
                  placeholder="Latitude"
                  value={searchForm.lat}
                  onChange={(event) =>
                    setSearchForm((prev) => ({ ...prev, lat: event.target.value }))
                  }
                  required
                />
                <input
                  name="lng"
                  type="number"
                  step="any"
                  placeholder="Longitude"
                  value={searchForm.lng}
                  onChange={(event) =>
                    setSearchForm((prev) => ({ ...prev, lng: event.target.value }))
                  }
                  required
                />
                <input
                  name="radius"
                  type="number"
                  step="any"
                  min="0"
                  placeholder="Rayon (km)"
                  value={searchForm.radius}
                  onChange={(event) =>
                    setSearchForm((prev) => ({ ...prev, radius: event.target.value }))
                  }
                  required
                />
                <button type="submit">Rechercher</button>
              </form>
              <AddressList items={searchItems} />
            </section>
          </>
        ) : (
          <section className="card gated">
            <h2>Fonctionnalites protegees</h2>
            <p>Connecte-toi pour afficher les actions reservees aux utilisateurs authentifies.</p>
          </section>
        )}
      </main>

      <section className="card status">
        <h2>Status API</h2>
        <pre className="output" style={{ color: statusError ? "#b91c1c" : "#1f2937" }}>
          {status}
        </pre>
      </section>
    </div>
  );
}
