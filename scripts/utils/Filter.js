import RecipesApi from '../Api/Api.js';
import RecipeCard from '../templates/RecipeCard.js';

export default class Tag {
	constructor() {
		this.data = new Set();
		this.cardWrapper = document.querySelector('main .recipes');
		this.searchBar = document.getElementById('search');

		this.filteredLabels = {
			ingredients: new Set(),
			appareils: new Set(),
			ustensiles: new Set()
		};

		this.currentTags = {
			ingredients : [],
			appliances : [], 
			ustensils : []
		};
		
		this.focusOnload = this.focusOnload();
	}

	async getData() {
		const data = await new RecipesApi('data/recipes.json').getRecipes();
		//Envoi toutes les recette en globlal dans this.data
		data.forEach(recipe => {
			this.data.add(recipe);
		});
	}

	filterBy_Searchbar_Tags() {

		this.getData();

		// parcours la data et ajoute à this.filteredLabels chaque ingrédient, appareil, ustensile
		[...this.data].forEach(recipe => {
			recipe.appliance ? this.filteredLabels.appareils.add(recipe.appliance.toLowerCase()) : '';
			recipe.ingredients.forEach(ingredient => this.filteredLabels.ingredients.add(ingredient.ingredient.toLowerCase()));
			recipe.ustensils.forEach(ustensil => this.filteredLabels.ustensiles.add(ustensil.toLowerCase()));
		});
		
		const ingredientsTagsContainer = document.querySelector('.filtre-ingredients-content');
		const appareilsTagsContainer = document.querySelector('.filtre-appareils-content');
		const ustensilesTagsContainer = document.querySelector('.filtre-ustensiles-content');
		
		const ingredientsFilter = document.getElementById('filtre-ingredients');
		const appareilsFilter = document.getElementById('filtre-appareils');
		const ustensilesFilter = document.getElementById('filtre-ustensiles');
		
		const ingredientsInput = document.getElementById('input-ingredients');
		const appareilsInput = document.getElementById('input-appareils');
		const ustensilesInput = document.getElementById('input-ustensiles');

		const filterIcons = document.querySelectorAll('.filtre i');
		const ingredientsIcon = filterIcons[0];
		const appareilsIcon = filterIcons[1];
		const ustensilesIcon = filterIcons[2];

		this.listenInput(this.filteredLabels.ingredients, ingredientsTagsContainer, ingredientsFilter, ingredientsInput, ingredientsIcon);
		this.listenInput(this.filteredLabels.appareils, appareilsTagsContainer, appareilsFilter, appareilsInput, appareilsIcon);
		this.listenInput(this.filteredLabels.ustensiles, ustensilesTagsContainer, ustensilesFilter, ustensilesInput, ustensilesIcon);

	}

	/**
	* Gère les evenements liés aux inputs et tags
	* @param {Array} data - Tableau d'objets qui contient toute la data qui provient du fichier json 
	* @param {HTMLElement} tagsContainer - Container des tags
	* @param {HTMLElement} filter - Container global de chaque filtre
	* @param {HTMLElement} input - Input de chaque filtre
	* @param {HTMLElement} icon - Icone à droite de l'input qui permet d'ouvrir ou de fermer la liste des tags
	*/
	listenInput = (data, tagsContainer, filter, input, icon) => {

		// l'input de recherche avancée s'ouvre en cliquant sur çelui-ci 
		input.addEventListener('focus', () => {
			filter.classList.add('selected');
			input.classList.add('selected');
			tagsContainer.classList.add('selected');
			this.clearLabels();
			this.show_filter_TagList(input, tagsContainer, data);
			this.renderTag_filterRecipes(input, tagsContainer);
		});

		// lorsque l'input est ouvert, il se ferme en cliquant en dehors
		window.addEventListener('click', () => this.deselect(filter, input, tagsContainer));

		// gestion des tab
		window.addEventListener('keyup', event => (event.key == 'Tab') ? this.deselect(filter, input, tagsContainer) : '');

		// en cliquant sur l'icone chevron, l'input s'ouvre ou se ferme
		icon.addEventListener('click', ()=> {
			filter.classList.toggle('selected');
			input.classList.toggle('selected');
			tagsContainer.classList.toggle('selected');
			input.classList.contains('selected') ? input.focus() : '';
		});
		
		// compare les mots recherchés et affiche les tags par rapport à ces mots clés
		input.addEventListener('input', () => {
			this.clearLabels();
			this.show_filter_TagList(input, tagsContainer, data);
			this.renderTag_filterRecipes(input, tagsContainer);
		});

		// enlève le comportement par défaut du formulaire en faisant une recherche 
		const form = document.getElementById('search-form');
		form.addEventListener('submit', (e) => {
			e.preventDefault();
		});

		// écoute sur la barre de recherche principale
		const searchbar = document.querySelector('form .search-bar');
		searchbar.addEventListener('keyup', (e) => {
			e.stopImmediatePropagation(); //évite d'executer 2 fois les lignes suivantes
			if(e.keyCode !== 13) { //evite de relancer une recherche en tappant sur entrée 
				this.checkValues_FilterRecipes();
			}

			// if(searchbar.value.length == 2 ) {
			// 	// si aucun tag n'a été précisé, on affiche toutes les recherches. Si un tag à été recherché on ne fait rien
			// 	Object.values(this.currentTags).every(currentTag => {
			// 		if(currentTag.length == 0) {
			// 			this.displayAllRecipes();
			// 		}else {
			// 			this.checkValues_FilterRecipes();
			// 		}
			// 	});
			// }
		});
	};

	async displayAllRecipes() {
		const recipes = await this.data;
		this.cardWrapper.innerHTML = '';

		recipes.forEach(recipe => {
			const template = new RecipeCard(recipe);
			this.cardWrapper.appendChild(template.createCard());
		});
	}
	

	clearLabels = () => {
		this.filteredLabels = {
			ingredients: new Set(),
			appareils: new Set(),
			ustensiles: new Set()
		};
	};

	deselect = (filter, input, tagsContainer) => {
		if (document.activeElement !== input) {
			filter.classList.remove('selected');
			input.classList.remove('selected');
			tagsContainer.classList.remove('selected');
			input.value = '';
		}
	};

	// Focus sur le champs de recherche en arrivant sur la page
	focusOnload() {
		window.addEventListener('load', () => {
			const searchInput = document.querySelector('form .search-bar');
			searchInput.focus();
		});
	}
	
	// affiche les tags en fonction des mots qui sont recherchés dans la barre de recherche principale, et affine la liste des tags avec les mots recherchés dans les filtres avancés
	show_filter_TagList = (input, tagsContainer) => {

		tagsContainer.innerHTML = '';
		const searchbarValue = this.searchBar.value.toLowerCase();
		const searchtagValue = input.value.toLowerCase();
		let filteredRecipesBySearchbar = new Set();
		let filteredTagsBySearchtag = new Set();

		// filteredRecipesBySearchbar contient toutes les recettes si aucun mot clé recherché
		[...this.data].forEach(recipe => filteredRecipesBySearchbar.add(recipe));

		// on filtre les recettes en fonction du mot recherché dans la barre de recherche
		filteredRecipesBySearchbar = [...filteredRecipesBySearchbar].filter(recipe => recipe.name.toLowerCase().includes(searchbarValue) 
			|| recipe.appliance.toLowerCase().includes(searchbarValue) 
			|| recipe.ustensils.some(ustensil => ustensil.toLowerCase().includes(searchbarValue)) 
			|| recipe.ingredients.some(ingredient => ingredient.ingredient.toLowerCase().includes(searchbarValue))
		);
		
		if(filteredRecipesBySearchbar.length) {
			// on switch sur chaque input
			switch (tagsContainer.id) {
			case 'labels-ingredients':
				filteredRecipesBySearchbar.forEach(recipe => {
					recipe.ingredients.forEach(ingredient => {
						// on ajoute à this.filteredLabels chaque ingredient/appareil/ustensile pour chaque recette filtrée par la barre de recherche principale
						this.filteredLabels.ingredients.add(ingredient.ingredient.toLowerCase());
						// on ajoute à filteredTagsBySearchtag chaque ingredient pour chaque recette filtrée par la barre de recherche des TAGS
						[...this.filteredLabels.ingredients].forEach(ingredient => ingredient.includes(searchtagValue) ? filteredTagsBySearchtag.add(ingredient) : '');
					});
				});
				// on affiche les tags disponibles dans filteredTagsBySearchtag qui correspondent aux recettes filtrée par la barre de recherche principale ET celle des tags
				if([...filteredTagsBySearchtag].length) {
					filteredTagsBySearchtag.forEach(ingredient => {
						tagsContainer.innerHTML += `<li class='tag'>${ingredient.charAt(0).toUpperCase() + ingredient.slice(1)}</li>`;
					});
				} else {
					tagsContainer.innerHTML = `<p class='not-found'>Aucun ${input.placeholder.toLowerCase().slice(0, -1)} ne correspond à votre recherche.</li>`;
				}
				break;
			case 'labels-appareils':
				filteredRecipesBySearchbar.forEach(recipe => {
					this.filteredLabels.appareils.add(recipe.appliance.toLowerCase());
					this.filteredLabels.appareils.forEach(appliance => appliance.includes(searchtagValue) ? filteredTagsBySearchtag.add(appliance) : '');
				});
				if([...filteredTagsBySearchtag].length) {
					this.filteredLabels.appareils.forEach(appliance => {
						tagsContainer.innerHTML += `<li class='tag'>${appliance.charAt(0).toUpperCase() + appliance.slice(1)}</li>`;
					});
				} else {
					tagsContainer.innerHTML = `<p class='not-found'>Aucun ${input.placeholder.toLowerCase().slice(0, -1)} ne correspond à votre recherche.</li>`;
				}
				break;
			case 'labels-ustensiles':
				filteredRecipesBySearchbar.forEach(recipe => {
					recipe.ustensils.forEach(ustensile => {
						this.filteredLabels.ustensiles.add(ustensile.toLowerCase());
						[...this.filteredLabels.ustensiles].forEach(ustensile => ustensile.includes(searchtagValue) ? filteredTagsBySearchtag.add(ustensile) : '');
					});
				});
				if([...filteredTagsBySearchtag].length) {
					filteredTagsBySearchtag.forEach(ustensile => {
						tagsContainer.innerHTML += `<li class='tag'>${ustensile.charAt(0).toUpperCase() + ustensile.slice(1)}</li>`;
					});
				} else {
					tagsContainer.innerHTML = `<p class='not-found'>Aucun ${input.placeholder.toLowerCase().slice(0, -1)} ne correspond à votre recherche.</li>`;
				}
				break;
			default:
				console.log('type de tag inéxistant');
				break;
			}
		} else {
			// si la recherche principale ne touve aucune recette, aucun tag de recherche avancée n'est proposé
			tagsContainer.innerHTML = `<p class='not-found'>Aucun ${input.placeholder.toLowerCase().slice(0, -1)} ne correspond à votre recherche.</li>`;
		}
	};

	renderTag_filterRecipes = (input, tagsContainer) => {
		const tagsList = tagsContainer.querySelectorAll('li');
		tagsList.forEach(tagElement => {
			tagElement.addEventListener('click', () => {
				// on ajoute à this.currentTags le tag recherché et on l'affiche
				this.updateCurrentTags(input.placeholder, tagElement.textContent);
				console.log('%cThis.currentTags', 'color: blue', this.currentTags);
				// on vide les résultats et récupère la valeur du mot clé recherché
				document.querySelector('.recipes').innerHTML = '';
				// on filtre les résultats en fonction du/des mot(s) clé(s) + tag(s)
				this.checkValues_FilterRecipes();
			});
		});
	};

	// Vérifie dans chaque recette si le mot recherché est contenu dans la recette, et retourne template (le tableau filtré)
	checkValues_FilterRecipes = () => {

		const searchedValue = document.querySelector('form .search-bar').value.toLowerCase().trim();
		const filteredResult = [...this.data].reduce((filteredRecipes, currentRecipe) => {
			let matchIngredient, matchAppliance, matchUstensil;

			// si une recette contient tous les tag ET le mot clé dans la barre de recherche => matchIngredient = true
			if(this.currentTags.ingredients.every(tagIngredient => 
				currentRecipe.ingredients.some(ingredient => ingredient.ingredient.toLowerCase().includes(tagIngredient.toLowerCase())) 
			)) 
				matchIngredient = true;

			if(currentRecipe.appliance.includes(this.currentTags.appliances)) matchAppliance = true;
			
			if(this.currentTags.ustensils.every(tagUstensil => currentRecipe.ustensils.includes(tagUstensil))) matchUstensil = true;
			
			if(matchIngredient && matchAppliance && matchUstensil && (
				currentRecipe.name.toLowerCase().includes(searchedValue) 
			||  currentRecipe.ingredients.some(ingredient => ingredient.ingredient.toLowerCase().includes(searchedValue)) 
			||  currentRecipe.description.toLowerCase().includes(searchedValue) 
			)) {
				filteredRecipes.push(currentRecipe);
			}
			
			return filteredRecipes;
		}, []);
		
		this.cardWrapper.innerHTML = '';

		let template = filteredResult.map(el=>new RecipeCard(el));
		if(template.length == 0) {
			this.cardWrapper.textContent = 'Aucune recette ne correspond à votre critère… vous pouvez chercher « tarte aux pommes », « poisson », etc..';
		} else {
			template.forEach(el => {
				this.cardWrapper.appendChild(el.createCard());
			});
		}
		console.log('%cFilteredResult', 'color : blue', filteredResult);
	};
	
	updateCurrentTags = (currentInputPlaceholder, tagContent) => {
		// ajoute à this.currentTags le tag séléctionné soit dans ingredients, appliance ou ustensils en fonction de la catégorie de l'input
		let category;
		switch (currentInputPlaceholder) {
		case 'Ingrédients':
			category = 'ingredients';
			break;
		case 'Appareils':
			category = 'appliances';
			break;
		case 'Ustensiles':
			category = 'ustensils';
			tagContent = tagContent.toLowerCase();
			break;
		default:
			break;
		}

		// Si le tag est déja dans la liste des tags on ne fait rien, sinon on le crée et on l'affiche / évite les doublons (alternative d'un Set) 
		if(this.currentTags[category].includes(tagContent)) {
			return;
		} else {
			this.currentTags[category].push(tagContent);
			//on crée le tag et on l'affiche, il ne s'affichera qu'une seule fois
			const tag = document.createElement('div');
			tag.classList.add(`tag-${currentInputPlaceholder}`);
			tag.innerHTML = `${tagContent}<i class="fa-regular fa-circle-xmark"></i>`;
			document.querySelector('.tags').appendChild(tag);
			// on retire le tag en cliquant sur l'icon X
			const closeIcon = tag.querySelector('i');
			closeIcon.addEventListener('click', () => {
				closeIcon.parentElement.remove();
				this.currentTags[category].splice(-1, 1);
				console.log('%cThis.currentTags', 'color: blue', this.currentTags);
				this.checkValues_FilterRecipes();
			});
		}
	};
}
