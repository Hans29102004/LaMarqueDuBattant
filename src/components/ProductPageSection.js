import React, { useRef, useState, useEffect, useCallback } from "react";
import { filtrer } from "./filterArticles";
import ProductQuickView from "./ProductQuickView";
import FilterBar from "./FilterBar";
import ProductCard from "./ProductCard";
import { useSearchParams } from "react-router-dom";
import useArticles from '../hooks/useArticles';
import getImagePath from "./getImagePath";

export default function ProductPageSection() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);
  // Utilisation du hook useArticles pour charger les articles
  const { articles, loading, error } = useArticles();
  const [showFilterBar, setShowFilterBar] = useState(false);
  // Nouvel état pour la liste filtrée
  const [filteredArticles, setFilteredArticles] = useState([]);
  
  // État centralisé pour tous les filtres
  const [filters, setFilters] = useState({
    categorie: '',
    remises: [],
    tailles: [],
    sexe: '',
    priceMin: undefined,
    priceMax: undefined
  });
  
  // Mise à jour d'un filtre spécifique et synchronisation avec l'URL
  const updateFilter = useCallback((filterName, value) => {
    setFilters(prev => {
      const newFilters = {
        ...prev,
        [filterName]: value
      };
      
      // Mettre à jour l'URL avec les nouveaux filtres
      const params = new URLSearchParams();
      
      // Ajouter chaque filtre non vide à l'URL
      Object.entries(newFilters).forEach(([key, val]) => {
        if (Array.isArray(val) && val.length > 0) {
          // Pour les tableaux (remises, tailles), on les joint par des virgules
          params.set(key, val.join(','));
        } else if (val !== undefined && val !== null && val !== '') {
          // Pour les valeurs simples non vides
          params.set(key, val);
        }
      });
      
      // Mettre à jour l'URL sans recharger la page
      setSearchParams(params);
      
      return newFilters;
    });
  }, [setSearchParams]);
  
  // Appliquer les filtres quand ils changent
  useEffect(() => {
    if (articles && articles.length > 0) {
      const filtered = filtrer({
        categorie: filters.categorie,
        remises: filters.remises,
        tailles: filters.tailles,
        sexe: filters.sexe,
        prixMin: filters.priceMin,
        prixMax: filters.priceMax
      }, articles);
      
      setFilteredArticles(filtered);
    }
  }, [filters, articles]);
  
  // Initialiser les filtres depuis l'URL au chargement
  useEffect(() => {
    // Créer un nouvel objet URLSearchParams à partir de searchParams
    const params = new URLSearchParams(searchParams.toString());
    
    // Fonction pour parser les valeurs des paramètres
    const parseParam = (value) => {
      if (value === 'undefined' || value === '') return undefined;
      if (value === 'true') return true;
      if (value === 'false') return false;
      if (!isNaN(Number(value))) return Number(value);
      return value;
    };
    
    // Mettre à jour les filtres avec les valeurs de l'URL
    const newFilters = { ...filters };
    let hasChanges = false;
    
    // Liste des clés de filtre valides
    const validFilterKeys = ['categorie', 'sexe', 'remises', 'tailles', 'priceMin', 'priceMax'];
    
    // Mettre à jour chaque filtre valide présent dans l'URL
    validFilterKeys.forEach(key => {
      // Vérifier si le paramètre est présent dans l'URL (même s'il est vide)
      if (params.has(key)) {
        if (key === 'remises' || key === 'tailles') {
          // Pour les tableaux, séparer par les virgules
          const newValue = params.get(key) ? params.get(key).split(',').map(v => v.trim()) : [];
          if (JSON.stringify(newValue) !== JSON.stringify(newFilters[key])) {
            newFilters[key] = newValue;
            hasChanges = true;
          }
        } else if (key === 'priceMin' || key === 'priceMax') {
          // Pour les prix, convertir en nombre
          const paramValue = params.get(key);
          const newValue = paramValue !== null && paramValue !== '' ? Number(paramValue) : undefined;
          if (newValue !== newFilters[key]) {
            newFilters[key] = newValue;
            hasChanges = true;
          }
        } else if (key === 'categorie' || key === 'sexe') {
          // Pour les chaînes simples
          const newValue = params.get(key) || '';
          if (newValue !== newFilters[key]) {
            newFilters[key] = newValue;
            hasChanges = true;
          }
        }
      } else if (key === 'categorie' || key === 'sexe') {
        // Si le paramètre n'est pas présent dans l'URL, on le réinitialise
        if (newFilters[key] !== '') {
          newFilters[key] = '';
          hasChanges = true;
        }
      } else if (key === 'remises' || key === 'tailles') {
        // Si le paramètre n'est pas présent dans l'URL, on réinitialise le tableau
        if (newFilters[key].length > 0) {
          newFilters[key] = [];
          hasChanges = true;
        }
      } else if (key === 'priceMin' || key === 'priceMax') {
        // Si le paramètre n'est pas présent dans l'URL, on le réinitialise
        if (newFilters[key] !== undefined) {
          newFilters[key] = undefined;
          hasChanges = true;
        }
      }
    });
    
    // Mettre à jour les filtres uniquement si nécessaire
    if (hasChanges) {
      setFilters(newFilters);
    }
  }, [searchParams]);
  // Ajout de l'état pour le QuickView
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [quickViewId, setQuickViewId] = useState(null);
  // État pour la barre de filtre mobile (accordéon)
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    const currentSection = sectionRef.current;
    if (currentSection) {
      observer.observe(currentSection);
    }

    return () => {
      if (currentSection) {
        observer.unobserve(currentSection);
      }
    };
  }, [searchParams, setSearchParams, setIsVisible]);

  // Initialiser filteredArticles avec tous les articles dès qu'ils sont chargés
  useEffect(() => {
    if (articles && articles.length > 0) {
      setFilteredArticles(articles);
    }
  }, [articles]);

  if (loading) {
    return <section ref={sectionRef} className="w-full bg-white pl-8 pr-11 pt-8 pb-8 mt-24 flex justify-center items-center" style={{ fontFamily: 'Commissioner, sans-serif' }}>Chargement des articles...</section>;
  }
  if (error) {
    return <section ref={sectionRef} className="w-full bg-white pl-8 pr-11 pt-8 pb-8 mt-24 flex justify-center items-center text-red-500" style={{ fontFamily: 'Commissioner, sans-serif' }}>Erreur : {error}</section>;
  }

  return (
    <>
      <section ref={sectionRef} className="w-full border-t bg-white pl-2 pr-2 sm:pl-4 sm:pr-4 lg:pl-8 lg:pr-11 pt-8 pb-8 mt-24" style={{ fontFamily: 'Commissioner, sans-serif' }}>
      {/* Header section */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6 sticky top-0 z-20 bg-white">
        <div className="flex items-center gap-3">
          {/* Affichage dynamique des filtres actifs */}
          <span className="text-sm sm:text-2xl font-extrabold tracking-wide">
            {!filters.categorie ? (
              <span><b>TOUT</b> </span>
            ) : (
              <span><b>{filters.categorie.toUpperCase()}</b> </span>
            )}
            {filters.remises && filters.remises.length > 0 && (
              <span>/ <b>{filters.remises.join(', ')}</b> </span>
            )}
            {filters.tailles && filters.tailles.length > 0 && (
              <span>/ <b>{filters.tailles.join(', ')}</b> </span>
            )}
            {filters.sexe && filters.sexe.toUpperCase && (
              <span>/ <b>{filters.sexe.toUpperCase()}</b> </span>
            )}
            {(filters.priceMin !== undefined || filters.priceMax !== undefined) && (
              <span>/<b>
                {filters.priceMin !== undefined ? `min ${filters.priceMin}` : ''}
                {filters.priceMin !== undefined && filters.priceMax !== undefined ? ' - ' : ''}
                {filters.priceMax !== undefined ? `max ${filters.priceMax}` : ''}
              </b></span>
            )}
          </span>
          <span className="text-gray-400 text-xs sm:text-lg font-light">• {filteredArticles.length} {filteredArticles.length !== 1 ? 'ITEMS' : 'ITEM'}</span>
        </div>
        <button
            className="bg-transparent text-black mr-4 px-2 py-2 text-xs font-thin uppercase tracking-wider hover:bg-white hover:text-black  transition lg:hidden"
            onClick={() => setShowMobileFilter((prev) => !prev)}
          >
            <svg class="w-6 h-6 text-gray-800 dark:text-black hover:text-black/40" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" stroke-linecap="round" stroke-width="1.5" d="M18.796 4H5.204a1 1 0 0 0-.753 1.659l5.302 6.058a1 1 0 0 1 .247.659v4.874a.5.5 0 0 0 .2.4l3 2.25a.5.5 0 0 0 .8-.4v-7.124a1 1 0 0 1 .247-.659l5.302-6.059c.566-.646.106-1.658-.753-1.658Z"/>
            </svg>
        </button>
        <button
            className="bg-black text-white px-6 py-2 text-xs font-semibold uppercase tracking-wider border border-transparent hover:bg-white hover:text-black hover:border-black hover:border-solid transition hidden lg:block"
          onClick={() => setShowFilterBar((prev) => !prev)}
        >
          FILTRER
        </button>
      </div>
        {/* Barre de filtre mobile (bloc sous le header) */}
        {showMobileFilter && (
          <FilterBar
            filters={filters}
            onFilterChange={updateFilter}
          />
        )}
      {/* Grille + barre de filtre */}
      <div className="flex w-full border-b border-black/20 mb-16 pb-8 ">
        {/* Grille produits */}
        {filteredArticles.length > 0 ? (
          <div className={`grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 ${showFilterBar ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-x-1 sm:gap-x-2 gap-y-4 flex-1 transition-all duration-300`}>
            {filteredArticles.map((article, index) => (
              <ProductCard
                key={article.id}
                article={article}
                isVisible={isVisible}
                index={index}
                onEyeClick={(id) => {
                  setQuickViewId(id);
                  setQuickViewOpen(true);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-16 text-center px-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun article trouvé</h3>
            <p className="text-gray-500 mb-6 max-w-md">Aucun produit ne correspond aux filtres sélectionnés. Essayez de modifier vos critères de recherche.</p>
            <button
              onClick={() => {
                // Réinitialiser tous les filtres
                updateFilter('categorie', '');
                updateFilter('remises', []);
                updateFilter('tailles', []);
                updateFilter('sexe', '');
                updateFilter('priceMin', undefined);
                updateFilter('priceMax', undefined);
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium  shadow-sm text-white bg-black hover:bg-gray-950 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Réinitialiser les filtres
            </button>
          </div>
        )}
        {/* Barre de filtre latérale */}
        {showFilterBar && (
            <aside className="hidden lg:block w-64 ml-4 bg-white p-2 h-[calc(100vh-4rem)] sticky top-0 filter-slide-in ">
              <FilterBar
                filters={filters}
                onFilterChange={updateFilter}
              />
          </aside>
        )}
      </div>
      {/* Partie CTA */}
      <div className="backdrop-blur-sm max-w-5xl mx-auto w-full border border-gray-300 my-8  h-80 sm:h-80 flex flex-col items-center text-center bg-black bg-no-repeat bg-center bg-cover"
        style={{ backgroundImage: `url(${getImagePath('Clothing-Canyon.png', 'cover')})`,
        filter: 'grayscale(100%)', }}
      > 
        <div className="bg-black/40 h-full flex flex-col items-center justify-center">
        <h3 className=" text-white text-xl sm:text-2xl md:text-3xl font-semibold mb-2">Inscrivez-vous a notre newsletter pour être informé des dernières nouveautés. </h3>
        <form className="flex flex-col justify-center sm:flex-row gap-3 sm:gap-4 w-full max-w-xs sm:max-w-none mx-auto px-4">
          <input type="email" name="email" id="email" placeholder="Adresse e-mail" className=" bg-black/40 w-full sm:w-auto px-6 py-2 border border-gray-300 text-white font-medium hover:border-black transition" />
          <button type="submit" className="w-full sm:w-auto px-6 py-2 bg-black text-white font-medium hover:bg-white hover:text-black hover:border transition">Envoyé</button>
        </form>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); }
        }
        @keyframes productCard {
          from { opacity: 0; transform: translateY(40px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fade-in { animation: fadeIn 0.8s ease-out forwards; }
        .animate-fade-in-delay-1 { animation: fadeIn 0.8s ease-out 0.2s forwards; opacity: 0; }
        .animate-fade-in-delay-4 { animation: fadeIn 0.8s ease-out 1.2s forwards; opacity: 0; }
        .animate-product-card { animation: productCard 0.8s ease-out forwards; opacity: 0; }
        @keyframes filterSlideIn {
          from { opacity: 0; transform: translateX(60px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .filter-slide-in {
          animation: filterSlideIn 0.5s cubic-bezier(0.4,0,0.2,1) forwards;
          opacity: 0;
        }
        input[type="checkbox"] {
          appearance: none;
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          border: 1px solid #9CA3AF;
          border-radius: 0;
          background: #fff;
          cursor: pointer;
          position: relative;
        }
        input[type="checkbox"]:checked {
          background: #000;
        }
        input[type="checkbox"]:focus {
          outline: 0px solid #000;
        }
      `}</style>
    </section>
      {/* QuickView modal */}
      <ProductQuickView
        articleId={quickViewId}
        open={quickViewOpen}
        onClose={() => setQuickViewOpen(false)}
      />
    </>
  );
} 