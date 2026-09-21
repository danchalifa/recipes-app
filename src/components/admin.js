import React, { useCallback, useEffect, useMemo, useState } from "react";

import { deburr } from "../lib/format";
import { IMAGE_HEIGHT, IMAGE_WIDTH, prepareRecipeImage } from "../lib/image";
import "./admin.css";

// Reached only by typing /admin -- it is deliberately absent from the nav, the
// footer and the sitemap. That is a tidiness choice, not a security one: this
// file ships inside the public bundle, so the protection that matters is the
// password check on /api/admin, which runs server side on every request.

const EMPTY = {
  Name: "",
  Name_English: "",
  Prep_Time: "0",
  Cook_Time: "0",
  CatID: "",
  Mom_Recipe_Ind: 0,
  Ingredientes: "",
  Direcciones: "",
  Ingredients_English: "",
  Directions_English: "",
};

const post = async (payload) => {
  const res = await fetch("/api/admin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // The session cookie is HttpOnly; same-origin sends it automatically.
    credentials: "same-origin",
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.error || `Request failed (${res.status})`);
    error.status = res.status;
    throw error;
  }
  return data;
};

const LoginForm = ({ onSuccess }) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await post({ action: "login", password });
      onSuccess();
    } catch (err) {
      setError(err.message);
      setPassword("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="admin-login" onSubmit={submit}>
      <h1 className="admin-login__title">Recetas de Mamá</h1>
      <label className="admin-field">
        <span className="admin-field__label">Password</span>
        <input
          type="password"
          value={password}
          autoFocus
          autoComplete="current-password"
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}
      <button className="admin-button" type="submit" disabled={busy || !password}>
        {busy ? "Checking…" : "Sign in"}
      </button>
    </form>
  );
};

// The photo is not part of the recipe record: the card and the hero both build
// their src from the RowID, so uploading one means committing
// public/recipe-images/<RowID>.webp and nothing else. That is why this sits
// beside the form fields rather than inside `values`.
const PhotoField = ({ rowId, image, onImage, busy }) => {
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);
  // A recipe that has never had a photo 404s here; the box then shows the
  // placeholder instead of a broken image.
  const [existingFailed, setExistingFailed] = useState(false);

  const existing = rowId && !existingFailed ? `/recipe-images/${rowId}.webp` : null;

  const choose = async (event) => {
    const file = event.target.files && event.target.files[0];
    // Clearing the input means picking the same file twice in a row still fires
    // a change event, which is what happens after a failed attempt.
    event.target.value = "";
    if (!file) return;

    setWorking(true);
    setError("");
    try {
      onImage(await prepareRecipeImage(file));
    } catch (err) {
      setError(err.message);
      onImage(null);
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="admin-photo">
      <span className="admin-field__label">Photo</span>

      <div className="admin-photo__row">
        <div className="admin-photo__frame">
          {image ? (
            <img className="admin-photo__image" src={image.preview} alt="" />
          ) : existing ? (
            <img
              className="admin-photo__image"
              src={existing}
              alt=""
              onError={() => setExistingFailed(true)}
            />
          ) : (
            <span className="admin-photo__empty">No photo</span>
          )}
        </div>

        <div className="admin-photo__controls">
          <label className="admin-button admin-button--ghost admin-photo__pick">
            {working
              ? "Preparing…"
              : image || existing
              ? "Choose a different photo"
              : "Choose a photo"}
            <input
              type="file"
              accept="image/*"
              onChange={choose}
              disabled={busy || working}
            />
          </label>

          {image && (
            <button
              className="admin-button admin-button--ghost"
              type="button"
              onClick={() => {
                onImage(null);
                setError("");
              }}
            >
              Undo
            </button>
          )}

          <p className="admin-photo__note">
            Saved at <strong>{IMAGE_WIDTH} × {IMAGE_HEIGHT}</strong> (16:9), WebP,
            about 20 KB — the same as every other photo on the site. Upload
            anything larger and it is cropped from the centre and resized here in
            the browser, so <strong>1440 × 810</strong> or bigger, landscape,
            gives the sharpest result. Below {IMAGE_WIDTH} × {IMAGE_HEIGHT} it
            will look soft.
          </p>

          {image && (
            <p className="admin-photo__meta">
              From {image.sourceWidth} × {image.sourceHeight} →{" "}
              {IMAGE_WIDTH} × {IMAGE_HEIGHT}, {Math.round(image.bytes / 1024)} KB.
              {image.lowResolution
                ? " That original is smaller than the display size, so this will look soft."
                : ""}{" "}
              It uploads when you save.
            </p>
          )}

          {error && (
            <p className="admin-error" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const RecipeForm = ({
  categories,
  values,
  onChange,
  onSubmit,
  onCancel,
  busy,
  isNew,
  image,
  onImage,
}) => {
  const set = (field) => (event) => {
    const target = event.target;
    onChange({
      ...values,
      [field]: target.type === "checkbox" ? (target.checked ? 1 : 0) : target.value,
    });
  };

  return (
    <form className="admin-form" onSubmit={onSubmit}>
      <div className="admin-form__header">
        <h2>{isNew ? "New recipe" : `Editing #${values.RowID}`}</h2>
        <button className="admin-button admin-button--ghost" type="button" onClick={onCancel}>
          Back to list
        </button>
      </div>

      <div className="admin-grid">
        <label className="admin-field">
          <span className="admin-field__label">Nombre (Spanish) *</span>
          <input value={values.Name} onChange={set("Name")} required />
        </label>
        <label className="admin-field">
          <span className="admin-field__label">Name (English)</span>
          <input value={values.Name_English} onChange={set("Name_English")} />
        </label>
      </div>

      <div className="admin-grid">
        {/* Type and Type_English are derived from this on the server, so they can
            never drift out of sync with categories.json. */}
        <label className="admin-field">
          <span className="admin-field__label">Category *</span>
          <select value={values.CatID} onChange={set("CatID")} required>
            <option value="">Choose…</option>
            {categories.map((category) => (
              <option key={category.CatID} value={category.CatID}>
                {category.Type} — {category.Type_English}
              </option>
            ))}
          </select>
        </label>
        <label className="admin-field">
          <span className="admin-field__label">Prep (min)</span>
          <input type="number" min="0" value={values.Prep_Time} onChange={set("Prep_Time")} />
        </label>
        <label className="admin-field">
          <span className="admin-field__label">Cook (min)</span>
          <input type="number" min="0" value={values.Cook_Time} onChange={set("Cook_Time")} />
        </label>
      </div>

      <label className="admin-check">
        <input
          type="checkbox"
          checked={Boolean(values.Mom_Recipe_Ind)}
          onChange={set("Mom_Recipe_Ind")}
        />
        <span>One of Mamá&rsquo;s own recipes</span>
      </label>

      <PhotoField rowId={isNew ? null : values.RowID} image={image} onImage={onImage} busy={busy} />

      <div className="admin-grid">
        <label className="admin-field">
          <span className="admin-field__label">Ingredientes * (one per line)</span>
          <textarea rows="10" value={values.Ingredientes} onChange={set("Ingredientes")} required />
        </label>
        <label className="admin-field">
          <span className="admin-field__label">Ingredients, English (one per line)</span>
          <textarea
            rows="10"
            value={values.Ingredients_English}
            onChange={set("Ingredients_English")}
          />
        </label>
      </div>

      <div className="admin-grid">
        <label className="admin-field">
          <span className="admin-field__label">Direcciones *</span>
          <textarea rows="8" value={values.Direcciones} onChange={set("Direcciones")} required />
        </label>
        <label className="admin-field">
          <span className="admin-field__label">Directions, English</span>
          <textarea
            rows="8"
            value={values.Directions_English}
            onChange={set("Directions_English")}
          />
        </label>
      </div>

      <button className="admin-button" type="submit" disabled={busy}>
        {busy ? "Saving…" : isNew ? "Add recipe" : "Save changes"}
      </button>
    </form>
  );
};

const AdminPage = () => {
  const [status, setStatus] = useState("checking");
  const [recipes, setRecipes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sha, setSha] = useState(null);
  const [editing, setEditing] = useState(null);
  const [values, setValues] = useState(EMPTY);
  const [image, setImage] = useState(null);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [error, setError] = useState("");

  const loadList = useCallback(async () => {
    const data = await post({ action: "list" });
    setRecipes(data.recipes);
    setSha(data.sha);
  }, []);

  const start = useCallback(async () => {
    try {
      await loadList();
      const res = await fetch("/api/types");
      setCategories(await res.json());
      setStatus("ready");
    } catch (err) {
      setError(err.message);
      setStatus("ready");
    }
  }, [loadList]);

  useEffect(() => {
    let cancelled = false;
    post({ action: "session" })
      .then((data) => {
        if (cancelled) return;
        if (data.authenticated) start();
        else setStatus("locked");
      })
      .catch(() => {
        if (!cancelled) setStatus("locked");
      });
    return () => {
      cancelled = true;
    };
  }, [start]);

  const filtered = useMemo(() => {
    const needle = deburr(query).toLowerCase().trim();
    if (!needle) return recipes;
    return recipes.filter((recipe) =>
      deburr(`${recipe.Name} ${recipe.Name_English || ""}`)
        .toLowerCase()
        .includes(needle)
    );
  }, [recipes, query]);

  const openNew = () => {
    setEditing("new");
    setValues(EMPTY);
    setImage(null);
    setNotice(null);
    setError("");
  };

  const openEdit = async (id) => {
    setBusy(true);
    setError("");
    setNotice(null);
    setImage(null);
    try {
      const data = await post({ action: "load", id });
      setValues(data.values);
      setSha(data.sha);
      setEditing(id);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await post({
        action: "save",
        id: editing === "new" ? null : editing,
        sha,
        recipe: values,
        image: image ? image.base64 : undefined,
      });
      setNotice(
        // The photo is a separate commit, so it can fail on its own. Saying so is
        // better than a success message over a recipe that quietly has no photo.
        result.imageError
          ? `${result.created ? "Added" : "Saved"}, but the photo did not upload: ${
              result.imageError
            }`
          : `${result.created ? "Added" : "Saved"} — live on the site in about a minute.`
      );
      setEditing(null);
      setImage(null);
      await loadList();
    } catch (err) {
      setError(err.message);
      // A 409 means the file moved on; the stale SHA has to be refreshed before
      // the author can retry, otherwise every retry fails the same way.
      if (err.status === 409) await loadList().catch(() => {});
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    await post({ action: "logout" }).catch(() => {});
    setStatus("locked");
    setRecipes([]);
    setEditing(null);
  };

  if (status === "checking") {
    return <p className="admin-state">Loading…</p>;
  }

  if (status === "locked") {
    return (
      <div className="admin-page admin-page--centered">
        <LoginForm
          onSuccess={() => {
            setStatus("ready");
            start();
          }}
        />
      </div>
    );
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1>Recipe admin</h1>
        <button className="admin-button admin-button--ghost" type="button" onClick={signOut}>
          Sign out
        </button>
      </header>

      {notice && (
        <p className="admin-notice" role="status">
          {notice}
        </p>
      )}
      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}

      {editing ? (
        <RecipeForm
          categories={categories}
          values={values}
          onChange={setValues}
          onSubmit={save}
          onCancel={() => {
            setEditing(null);
            setImage(null);
          }}
          busy={busy}
          isNew={editing === "new"}
          image={image}
          onImage={setImage}
        />
      ) : (
        <>
          <div className="admin-toolbar">
            <input
              className="admin-search"
              value={query}
              placeholder={`Filter ${recipes.length} recipes…`}
              onChange={(event) => setQuery(event.target.value)}
            />
            <button className="admin-button" type="button" onClick={openNew}>
              New recipe
            </button>
          </div>

          <ul className="admin-list">
            {filtered.map((recipe) => (
              <li key={recipe.RowID}>
                <button type="button" disabled={busy} onClick={() => openEdit(recipe.RowID)}>
                  <span className="admin-list__name">{recipe.Name}</span>
                  <span className="admin-list__meta">
                    #{recipe.RowID} · {recipe.Type}
                  </span>
                </button>
              </li>
            ))}
            {filtered.length === 0 && <li className="admin-list__empty">No matches.</li>}
          </ul>
        </>
      )}
    </div>
  );
};

export default AdminPage;
