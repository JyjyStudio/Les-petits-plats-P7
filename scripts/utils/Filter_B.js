import RecipesApi from '../Api/Api.js';
import RecipeCard from '../templates/RecipeCard.js';

export default class Filter_B {
	constructor() {
		this.focusOnload = this.focusOnload();
		this.data = new Set();
		this.cardWrapper = document.querySelector('main .recipes');

		this.filteredLabels = {
			ingredients: new Set(),
			appliance: new Set(),
			ustensils: new Set()
		};

		this.currentTags = {
			ingredients : [],
			appliance : [], 
			ustensils : []
		};
	}

	async getData() {
		const data = await new RecipesApi('data/recipes.json').getRecipes();
		//Envoi toutes les recette en globlal dans this.data, et tous les tags dans this.filteredLabels
		data.forEach(recipe => {
			this.data.add(recipe);
			recipe.appliance ? this.filteredLabels.appliance.add(recipe.appliance.toLowerCase()) : '';
			recipe.ingredients.forEach(ingredient => this.filteredLabels.ingredients.add(ingredient.ingredient.toLowerCase()));
			recipe.ustensils.forEach(ustensil => this.filteredLabels.ustensils.add(ustensil.toLowerCase()));
		});
	}

	filterBy_Searchbar_Tags() {

		this.getData();
		
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
		this.listenInput(this.filteredLabels.appliance, appareilsTagsContainer, appareilsFilter, appareilsInput, appareilsIcon);
		this.listenInput(this.filteredLabels.ustensils, ustensilesTagsContainer, ustensilesFilter, ustensilesInput, ustensilesIcon);

	}

	/**
	* G??re les evenements li??s aux inputs et tags
	* @param {Array} data - Tableau d'objets qui contient toute la data qui provient du fichier json 
	* @param {HTMLElement} tagsContainer - Container des tags
	* @param {HTMLElement} filter - Container global de chaque filtre
	* @param {HTMLElement} input - Input de chaque filtre
	* @param {HTMLElement} icon - Icone ?? droite de l'input qui permet d'ouvrir ou de fermer la liste des tags
	*/
	listenInput = (data, tagsContainer, filter, input, icon) => {

		// l'input de recherche avanc??e s'ouvre en cliquant sur ??elui-ci 
		input.addEventListener('focus', () => {
			filter.classList.add('selected');
			input.classList.add('selected');
			tagsContainer.classList.add('selected');
			// this.clearLabels();
			this.checkValues_FilterRecipes();
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
		
		// compare les mots recherch??s et affiche les tags par rapport ?? ces mots cl??s
		input.addEventListener('input', () => {
			// this.clearLabels();
			this.show_filter_TagList(input, tagsContainer, data);
			this.renderTag_filterRecipes(input, tagsContainer);
		});

		// enl??ve le comportement par d??faut du formulaire en faisant une recherche 
		const form = document.getElementById('search-form');
		form.addEventListener('submit', (e) => {
			e.preventDefault();
		});

		// ??coute sur la barre de recherche principale
		document.querySelector('form .search-bar').addEventListener('input', (e) => {
			e.stopImmediatePropagation(); //??vite d'executer plusieurs fois les lignes suivantes
			if(e.keyCode !== 13) { //evite de relancer une recherche en tappant sur entr??e 
				this.checkValues_FilterRecipes();
			}
		});
	};

	clearLabels = () => {
		this.filteredLabels = {
			ingredients: new Set(),
			appliance: new Set(),
			ustensils: new Set()
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
	
	// affiche les tags en fonction des mots qui sont recherch??s dans la barre de recherche principale, et affine la liste des tags avec les mots recherch??s dans les filtres avanc??s
	show_filter_TagList = (input, tagsContainer) => {
		
		tagsContainer.innerHTML = '';
		const searchtagValue = input.value.toLowerCase();
		
		if(this.filteredResult.size) {
			// on switch sur chaque input
			switch (tagsContainer.id) {
			case 'labels-ingredients':
				if(this.filteredLabels.ingredients.size) {
					this.filteredLabels.ingredients.forEach(ingredient => {
						if(ingredient.toLowerCase().includes(searchtagValue)) {
							tagsContainer.innerHTML += `<li class='tag'>${ingredient.charAt(0).toUpperCase() + ingredient.slice(1)}</li>`;
						}
					});
					// on affiche les tags disponibles dans filteredTagsBySearchtag qui correspondent aux recettes filtr??es					
				} else {
					tagsContainer.innerHTML = `<p class='not-found'>Aucun ${input.placeholder.toLowerCase().slice(0, -1)} ne correspond ?? votre recherche.</li>`;
				}
				break;
			case 'labels-appareils':
				if(this.filteredLabels.appliance.size) {
					this.filteredLabels.appliance.forEach(appliance => {
						if(appliance.toLowerCase().includes(searchtagValue)) {
							tagsContainer.innerHTML += `<li class='tag'>${appliance.charAt(0).toUpperCase() + appliance.slice(1)}</li>`;
						}
					});
				} else {
					tagsContainer.innerHTML = `<p class='not-found'>Aucun ${input.placeholder.toLowerCase().slice(0, -1)} ne correspond ?? votre recherche.</li>`;
				}
				break;
			case 'labels-ustensiles':
				if(this.filteredLabels.ustensils.size) {
					this.filteredLabels.ustensils.forEach(ustensil => {
						if(ustensil.toLowerCase().includes(searchtagValue)) {
							tagsContainer.innerHTML += `<li class='tag'>${ustensil.charAt(0).toUpperCase() + ustensil.slice(1)}</li>`;
						}
					});
				} else {
					tagsContainer.innerHTML = `<p class='not-found'>Aucun ${input.placeholder.toLowerCase().slice(0, -1)} ne correspond ?? votre recherche.</li>`;
				}
				break;
			default:
				console.log('type de tag in??xistant');
				break;
			}
		} else {
			// si la recherche principale ne touve aucune recette, aucun tag de recherche avanc??e n'est propos??
			tagsContainer.innerHTML = `<p class='not-found'>Aucun ${input.placeholder.toLowerCase().slice(0, -1)} ne correspond ?? votre recherche.</li>`;
		}
	};

	renderTag_filterRecipes = (input, tagsContainer) => {
		const tagsList = tagsContainer.querySelectorAll('li');
		tagsList.forEach(tagElement => {
			tagElement.addEventListener('click', () => {
				// on ajoute ?? this.currentTags le tag recherch?? et on l'affiche
				this.updateCurrentTags(input.placeholder, tagElement.textContent);
				// console.log('%cThis.currentTags', 'color: blue', this.currentTags);
				// on vide les r??sultats et r??cup??re la valeur du mot cl?? recherch??
				document.querySelector('.recipes').innerHTML = '';
				// on filtre les r??sultats en fonction du/des mot(s) cl??(s) + tag(s)
				this.checkValues_FilterRecipes();
			});
		});
	};

	// V??rifie dans chaque recette si le mot recherch?? est contenu dans la recette, et retourne template (le tableau filtr??)
	checkValues_FilterRecipes = () => {
		this.filteredResult = new Set();
		const searchbar = document.querySelector('form .search-bar');
		let searchbarValue = '';
		if(searchbar.value.length >= 3) {
			searchbarValue = searchbar.value.toLowerCase().trim();
			console.time('for..of');
		}
		for(let currentRecipe of Array.from(this.data)) {
			let matchIngredient, matchAppliance, matchUstensil;

			// si une recette contient tous les tag ET le mot cl?? dans la barre de recherche => matchIngredient = true
			if(this.currentTags.ingredients.every(tagIngredient => 
				currentRecipe.ingredients.some(ingredient => ingredient.ingredient.toLowerCase().includes(tagIngredient.toLowerCase())) 
			)) 
				matchIngredient = true;

			if(this.currentTags.appliance.every(tagAppliance => currentRecipe.appliance.toLowerCase().includes(tagAppliance.toLowerCase()))) matchAppliance = true;
			
			if(this.currentTags.ustensils.every(tagUstensil => currentRecipe.ustensils.some(recipeUstensil => recipeUstensil.toLowerCase().includes(tagUstensil.toLowerCase())))) matchUstensil = true;
			
			// si une recette contient tous les tag ET le mot cl?? dans la barre de recherche => filteredRecipes.push(currentRecipe);
			if(matchIngredient && matchAppliance && matchUstensil && (
				currentRecipe.name.toLowerCase().includes(searchbarValue) 
			||  currentRecipe.ingredients.some(ingredient => ingredient.ingredient.toLowerCase().includes(searchbarValue)) 
			||  currentRecipe.description.toLowerCase().includes(searchbarValue) 
			)) {
				this.filteredResult.add(currentRecipe);
			}	
		}
		if(searchbar.value.length >= 3) console.timeEnd('for..of');

		//met a jour this.filteredResult en fonction de la recherche
		this.clearLabels();
		for (const recipe of this.filteredResult) {
			recipe.ingredients.forEach(ingredient => this.filteredLabels.ingredients.add(ingredient.ingredient.toLowerCase()));
			this.filteredLabels.appliance.add(recipe.appliance.toLowerCase());
			recipe.ustensils.forEach(ustensil => this.filteredLabels.ustensils.add(ustensil.toLowerCase()));
		}
		
		this.cardWrapper.innerHTML = '';

		let template = [];
		for (const filteredRecipe of this.filteredResult) {
			template.push(new RecipeCard(filteredRecipe));
		}

		if(template.length == 0) {
			this.cardWrapper.innerHTML = '<p class="not-found">Aucune recette ne correspond ?? votre crit??re??? vous pouvez chercher ?? tarte aux pommes ??, ?? poisson ??, etc..</p>';
		} else {
			for (const recipeCard of template) {
				this.cardWrapper.appendChild(recipeCard.createCard());
			}
		}
		// console.log('%cFilteredResult', 'color : blue', this.filteredResult);
	};
	
	updateCurrentTags = (currentInputPlaceholder, tagContent) => {
		// ajoute ?? this.currentTags le tag s??l??ctionn?? soit dans ingredients, appliance ou ustensils en fonction de la cat??gorie de l'input
		let category;
		switch (currentInputPlaceholder) {
		case 'Ingr??dients':
			category = 'ingredients';
			break;
		case 'Appareils':
			category = 'appliance';
			break;
		case 'Ustensiles':
			category = 'ustensils';
			tagContent = tagContent.toLowerCase();
			break;
		default:
			break;
		}

		// Si le tag est d??ja dans la liste des tags on ne fait rien, sinon on le cr??e et on l'affiche / ??vite les doublons (alternative d'un Set) 
		if(this.currentTags[category].includes(tagContent)) {
			return;
		} else {
			this.currentTags[category].push(tagContent);
			//on cr??e le tag et on l'affiche, il ne s'affichera qu'une seule fois
			const tag = document.createElement('div');
			tag.classList.add(`tag-${currentInputPlaceholder}`);
			tag.innerHTML = `${tagContent}<i class="fa-regular fa-circle-xmark"></i>`;
			document.querySelector('.tags').appendChild(tag);
			// on retire le tag en cliquant sur l'icon X
			const closeIcon = tag.querySelector('i');
			closeIcon.addEventListener('click', () => {
				closeIcon.parentElement.remove();
				this.currentTags[category].splice(this.currentTags[category].indexOf(tagContent), 1);
				// console.log('%cThis.currentTags', 'color: blue', this.currentTags);
				this.checkValues_FilterRecipes();
			});
		}
	};
}
