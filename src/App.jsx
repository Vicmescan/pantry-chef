import { useState, useEffect } from 'react'
import './App.css'

const API_BASE = 'https://www.themealdb.com/api/json/v1/1'
const STORAGE_KEY = 'recetas-app:ingredients'

// Cachés en memoria para no repetir peticiones ya hechas en búsquedas
// anteriores (p. ej. al añadir/quitar un ingrediente y volver a buscar,
// la mayoría de candidatos y detalles se reutilizan).
const filterCache = new Map() // ingrediente (param API) -> meals[]
const lookupCache = new Map() // idMeal -> detalle de la receta

function normalize(text) {
  return text.toLowerCase().trim()
}

function loadStoredIngredients() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function App() {
  const [ingredientInput, setIngredientInput] = useState('')
  const [ingredients, setIngredients] = useState(loadStoredIngredients)
  const [knownIngredients, setKnownIngredients] = useState([])
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    fetch(`${API_BASE}/list.php?i=list`)
      .then((res) => res.json())
      .then((data) => {
        const names = (data.meals || [])
          .map((m) => normalize(m.strIngredient))
          .sort()
        setKnownIngredients(names)
      })
      .catch(() => setKnownIngredients([]))
  }, [])

  const addIngredient = () => {
    const value = normalize(ingredientInput)
    if (value && !ingredients.includes(value)) {
      setIngredients([...ingredients, value])
    }
    setIngredientInput('')
  }

  const removeIngredient = (ing) => {
    setIngredients(ingredients.filter((i) => i !== ing))
  }

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ingredients))
  }, [ingredients])

  const suggestions = knownIngredients.filter((ing) => !ingredients.includes(ing))

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addIngredient()
    }
  }

  const search = async () => {
    if (ingredients.length === 0) return
    setLoading(true)
    setError('')
    setSearched(true)
    setResults([])

    try {
      // 1. Buscar candidatos: recetas que contengan al menos uno de los ingredientes
      const candidates = new Map()

      for (const ing of ingredients) {
        const param = ing.replace(/\s+/g, '_')
        let meals = filterCache.get(param)
        if (meals === undefined) {
          const res = await fetch(`${API_BASE}/filter.php?i=${encodeURIComponent(param)}`)
          const data = await res.json()
          meals = data.meals || []
          filterCache.set(param, meals)
        }
        for (const meal of meals) {
          const existing = candidates.get(meal.idMeal)
          if (existing) {
            existing.matchCount += 1
          } else {
            candidates.set(meal.idMeal, { ...meal, matchCount: 1 })
          }
        }
      }

      if (candidates.size === 0) {
        setResults([])
        return
      }

      // 2. Priorizar las recetas que coinciden con más ingredientes y limitar peticiones.
      // El límite es generoso para no descartar recetas sencillas (pocos ingredientes,
      // bajo matchCount) que en realidad se pueden hacer enteras con lo que tenemos.
      const topCandidates = Array.from(candidates.values())
        .sort((a, b) => b.matchCount - a.matchCount)
        .slice(0, 60)

      // 3. Obtener el detalle (lista completa de ingredientes) de cada candidata
      const detailed = await Promise.all(
        topCandidates.map(async (c) => {
          if (lookupCache.has(c.idMeal)) return lookupCache.get(c.idMeal)
          const res = await fetch(`${API_BASE}/lookup.php?i=${c.idMeal}`)
          const data = await res.json()
          const meal = data.meals ? data.meals[0] : null
          lookupCache.set(c.idMeal, meal)
          return meal
        })
      )

      // 4. Calcular qué ingredientes faltan respecto a lo que tiene el usuario
      const userSet = ingredients.map(normalize)
      const processed = detailed
        .filter(Boolean)
        .map((meal) => {
          const recipeIngredients = []
          for (let i = 1; i <= 20; i++) {
            const ing = meal[`strIngredient${i}`]
            const measure = meal[`strMeasure${i}`]
            if (ing && ing.trim()) {
              recipeIngredients.push({
                name: normalize(ing),
                display: ing.trim(),
                measure: measure ? measure.trim() : '',
              })
            }
          }

          const missing = recipeIngredients.filter(
            (ri) => !userSet.some((u) => ri.name.includes(u) || u.includes(ri.name))
          )

          return {
            id: meal.idMeal,
            name: meal.strMeal,
            thumb: meal.strMealThumb,
            source: meal.strSource,
            youtube: meal.strYoutube,
            category: meal.strCategory,
            area: meal.strArea,
            totalIngredients: recipeIngredients.length,
            have: recipeIngredients.length - missing.length,
            missing,
          }
        })
        .sort((a, b) => a.missing.length - b.missing.length || b.have - a.have)

      setResults(processed)
    } catch (err) {
      setError('There was an error searching for recipes. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <header className="header">
        <h1>🍳 What can I cook with this?</h1>
        <p>Add the ingredients you have at home and we&apos;ll find recipes that use them.</p>
      </header>

      <div className="input-row">
        <input
          type="text"
          value={ingredientInput}
          onChange={(e) => setIngredientInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="E.g: chicken, rice, tomato..."
          list="ingredient-suggestions"
        />
        <datalist id="ingredient-suggestions">
          {suggestions.map((ing) => (
            <option key={ing} value={ing} />
          ))}
        </datalist>
        <button onClick={addIngredient}>Add</button>
      </div>

      {ingredients.length > 0 && (
        <div className="chips">
          {ingredients.map((ing) => (
            <span className="chip" key={ing}>
              {ing}
              <button className="chip-remove" onClick={() => removeIngredient(ing)} aria-label={`Remove ${ing}`}>
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <button
        className="search-button"
        onClick={search}
        disabled={ingredients.length === 0 || loading}
      >
        {loading ? 'Searching...' : 'Search recipes'}
      </button>

      {error && <p className="error">{error}</p>}

      {searched && !loading && results.length === 0 && !error && (
        <p className="empty">We couldn&apos;t find any recipes with these ingredients. Try adding or removing one.</p>
      )}

      <div className="results">
        {results.map((recipe) => (
          <div className="card" key={recipe.id}>
            <img src={recipe.thumb} alt={recipe.name} />
            <div className="card-body">
              <h3>{recipe.name}</h3>
              <p className="meta">{recipe.area} · {recipe.category}</p>

              {recipe.missing.length === 0 ? (
                <p className="badge badge-ok">✅ You have everything you need!</p>
              ) : (
                <p className="badge badge-warning">
                  Missing {recipe.missing.length} of {recipe.totalIngredients} ingredients
                </p>
              )}

              {recipe.missing.length > 0 && (
                <details>
                  <summary>See missing ingredients</summary>
                  <ul>
                    {recipe.missing.map((m, idx) => (
                      <li key={`${m.name}-${idx}`}>
                        {m.display}{m.measure ? ` — ${m.measure}` : ''}
                      </li>
                    ))}
                  </ul>
                </details>
              )}

              <div className="links">
                {recipe.source && (
                  <a href={recipe.source} target="_blank" rel="noreferrer">
                    View original recipe
                  </a>
                )}
                {recipe.youtube && (
                  <a href={recipe.youtube} target="_blank" rel="noreferrer">
                    Watch video
                  </a>
                )}
                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(recipe.name + ' recipe')}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Search on Google
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App
