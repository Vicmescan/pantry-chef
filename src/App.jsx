import { useState } from 'react'
import './App.css'
import { translateIngredient } from './ingredientTranslations'

const API_BASE = 'https://www.themealdb.com/api/json/v1/1'

function normalize(text) {
  return text.toLowerCase().trim()
}

function App() {
  const [ingredientInput, setIngredientInput] = useState('')
  const [ingredients, setIngredients] = useState([])
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

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
        const param = translateIngredient(ing).replace(/\s+/g, '_')
        const res = await fetch(`${API_BASE}/filter.php?i=${encodeURIComponent(param)}`)
        const data = await res.json()
        if (data.meals) {
          for (const meal of data.meals) {
            const existing = candidates.get(meal.idMeal)
            if (existing) {
              existing.matchCount += 1
            } else {
              candidates.set(meal.idMeal, { ...meal, matchCount: 1 })
            }
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
          const res = await fetch(`${API_BASE}/lookup.php?i=${c.idMeal}`)
          const data = await res.json()
          return data.meals ? data.meals[0] : null
        })
      )

      // 4. Calcular qué ingredientes faltan respecto a lo que tiene el usuario.
      // TheMealDB devuelve los ingredientes en inglés, así que comparamos
      // contra la traducción de lo que el usuario ha introducido.
      const userSet = ingredients.map((ing) => translateIngredient(normalize(ing)))
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
      setError('Hubo un error al buscar recetas. Comprueba tu conexión e inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <header className="header">
        <h1>🍳 ¿Qué cocino con esto?</h1>
        <p>Añade los ingredientes que tienes en casa y te buscaremos recetas que los aprovechen.</p>
      </header>

      <div className="input-row">
        <input
          type="text"
          value={ingredientInput}
          onChange={(e) => setIngredientInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ej: pollo, arroz, tomate..."
        />
        <button onClick={addIngredient}>Añadir</button>
      </div>

      {ingredients.length > 0 && (
        <div className="chips">
          {ingredients.map((ing) => (
            <span className="chip" key={ing}>
              {ing}
              <button className="chip-remove" onClick={() => removeIngredient(ing)} aria-label={`Quitar ${ing}`}>
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
        {loading ? 'Buscando...' : 'Buscar recetas'}
      </button>

      {error && <p className="error">{error}</p>}

      {searched && !loading && results.length === 0 && !error && (
        <p className="empty">No hemos encontrado recetas con esos ingredientes. Prueba a añadir o quitar alguno.</p>
      )}

      <div className="results">
        {results.map((recipe) => (
          <div className="card" key={recipe.id}>
            <img src={recipe.thumb} alt={recipe.name} />
            <div className="card-body">
              <h3>{recipe.name}</h3>
              <p className="meta">{recipe.area} · {recipe.category}</p>

              {recipe.missing.length === 0 ? (
                <p className="badge badge-ok">✅ ¡Tienes todo lo necesario!</p>
              ) : (
                <p className="badge badge-warning">
                  Te faltan {recipe.missing.length} de {recipe.totalIngredients} ingredientes
                </p>
              )}

              {recipe.missing.length > 0 && (
                <details>
                  <summary>Ver ingredientes que faltan</summary>
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
                    Ver receta original
                  </a>
                )}
                {recipe.youtube && (
                  <a href={recipe.youtube} target="_blank" rel="noreferrer">
                    Ver vídeo
                  </a>
                )}
                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(recipe.name + ' receta')}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Buscar en Google
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
