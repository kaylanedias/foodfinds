// (Kaylane) - Adicionei as funções pro modal e removi o sistema de tradução (A tradução era instável e deixava a aplicação lenta)
// Receber os ingredientes do usuário
// Buscar as receitas na API
// Exibir as receitas na tela
// Exibir detalhes da receita em um modal
// Filtros de ordenação, dieta e região
// Comparação dos ingredientes da receita com os do usuário
// Sistema de paginação

// Chave API
const API_KEY = "e30e10cd756f41b0b7f745fc090e1bee";

// Array para armazenar os ingredientes do usuário
let currentUserIngredients = [];

// Array para armazenar todas as receitas buscadas
let allFetchedRecipes = [];

// Página atual para paginação
let currentPage = 1;

// Número de receitas por página
const recipesPerPage = 5;

// Espera o documento HTML carregar completamente
document.addEventListener("DOMContentLoaded", () => {
    // Seleção dos elementos do DOM
    const ingredientInput = document.getElementById("ingredient-input"); // Input de ingredientes
    const searchBtn = document.getElementById("search-btn"); // Botão de busca
    const mainContainer = document.querySelector(
        ".main-section.search-container"
    ); // Container principal
    const loader = document.getElementById("loader"); // Loader de carregamento
    const resultsContainer = document.querySelector(".section-recipe"); // Container de resultados
    const resultsGrid = document.getElementById("recipes-grid"); // Grid de receitas
    const modalOverlay = document.getElementById("modal-overlay"); // Overlay do modal
    const modalCloseBtn = document.getElementById("modal-close-btn"); // Botão de fechar modal
    const modalDetailsContent = document.getElementById("modal-details-content"); // Conteúdo do modal
    const sortBy = document.getElementById("sort-by"); // Select de ordenação
    const dietType = document.getElementById("diet-type"); // Select de dieta
    const regionType = document.getElementById("region-type"); // Select de região
    const applyFiltersBtn = document.getElementById("apply-filters-btn"); // Botão de aplicar filtros
    const paginationContainer = document.getElementById("pagination-container"); // Container de paginação
    const prevPageBtn = document.getElementById("prev-page-btn"); // Botão de página anterior
    const nextPageBtn = document.getElementById("next-page-btn"); // Botão de próxima página
    const pageIndicator = document.getElementById("page-indicator"); // Indicador de página

    // Evento de clique do botão "Buscar"
    searchBtn.addEventListener("click", handleSearch);

    // Evento de clique do botão "Aplicar Filtros"
    applyFiltersBtn.addEventListener("click", handleSearch);

    // Evento de clique no card da receita
    resultsGrid.addEventListener("click", handleCardClick);

    // Evento de clique no botão de fechar modal
    modalCloseBtn.addEventListener("click", closeModal);

    //Evento de clique fora do modal para fechar
    modalOverlay.addEventListener("click", (event) => {
        if (event.target === modalOverlay) {
            closeModal();
        }
    });

    // Eventos de clique dos botões de paginação
    prevPageBtn.addEventListener("click", () => {
        // Verifica se não está na primeira página
        if (currentPage > 1) {
            // Volta uma página
            currentPage--;
            displayCurrentPage();
        }
    });

    // Evento de clique do botão "Próximo"
    nextPageBtn.addEventListener("click", () => {
        // Calcula o número máximo de páginas
        const maxPage = Math.ceil(allFetchedRecipes.length / recipesPerPage);
        // Verifica se não está na última página
        if (currentPage < maxPage) {
            // Avança uma página
            currentPage++;
            displayCurrentPage();
        }
    });

    // Função que gerencia o fluxo de busca e exibição
    async function handleSearch() {
        // Pega os ingredientes digitados
        const ingredientesInput = ingredientInput.value;

        // Atualiza o array global de ingredientes do usuário
        currentUserIngredients = ingredientesInput
            // Divide a string em um array usando vírgulas
            .split(",")
            // Remove espaços extras e converte para minúsculas
            .map((ing) => ing.trim().toLowerCase())
            // Remove entradas vazias
            .filter((ing) => ing.length > 0);

        // Pega os valores dos filtros
        const sortValue = sortBy.value;
        const dietValue = dietType.value;
        const regionValue = regionType.value;

        // Verifica se o input está vazio
        if (ingredientesInput.trim() === "") {
            alert("Por favor, digite os ingredientes.");
            return;
        }

        // Prepara a interface para a busca
        mainContainer.classList.add("hidden"); // Esconde a tela de busca
        resultsContainer.style.display = "none"; // Esconde resultados antigos

        // A função  try é utilizada pra envolver um bloco de código que pode gerar erros
        try {
            //1. Buscas as receitas na API
            const recipes = await fetchRecipes(
                ingredientesInput,
                sortValue,
                dietValue,
                regionValue
            );

            // 2. Verifica se encontrou alguma receita
            if (recipes.length === 0) {
                // Se a API não retornar nada
                resultsGrid.innerHTML =
                    "<p>Nenhuma receita encontrada com esses ingredientes.</p>";
                allFetchedRecipes = []; // Limpa resultados antigos
                paginationContainer.style.display = 'none'; // Esconde a paginação
                resultsContainer.style.display = 'block'; // Mostra a mensagem de nenhum resultado
                return;
            }

            // 3. Armazena todas as receitas buscadas e exibe a primeira página
            allFetchedRecipes = recipes;
            // Reseta pra página 1
            currentPage = 1; 
            // Exibe a página atual
            displayCurrentPage();

            // Mostra os resultados e a paginação
            resultsContainer.style.display = 'block';
            paginationContainer.style.display = 'flex';

            // 4. Renderiza as receitas na tela
            renderRecipes(recipes);

            // Mostra o container de resultados
            resultsContainer.style.display = "block";

        } catch (error) {
            // A função catch é utilizada pra achar erros inesperados que possam ocorrer durante a execução do bloco try
            // Ex: problemas de rede, erros na API, etc.
            // Mostra no console e avisa o usuário
            console.error("Erro ao buscar receitas:", error);
            resultsGrid.innerHTML =
                "<p>Erro ao buscar receitas. Tente novamente.</p>";
            resultsContainer.style.display = "block"; // Mostra a msg de erro
            
        } finally {
            // A função finally é executada após o try e catch, independentemente do resultado
            // Independentemente de sucesso ou erro, esconde o loader
            loader.style.display = "none";
        }
    }

    // Função que busca receitas na API
    async function fetchRecipes(ingredients, sort, diet, cuisine) {
        // A url "complessSearch" permite buscar receitas com vários filtros
        let url = `https://api.spoonacular.com/recipes/complexSearch?apiKey=${API_KEY}&includeIngredients=${ingredients}&number=30`;

        // Adiciona os filtros na URL, se houver
        if (sort) {
            // Adiciona o parâmetro de ordenação
            url += `&sort=${sort}`;
        }

        // Adiciona o filtro de dieta, se não for "all"
        if (diet && diet !== "all") {
            // Adiciona o parâmetro de dieta
            url += `&type=${diet}`;
        }

        // Adiciona o filtro de culinária/região, se não for "all"
        if (cuisine && cuisine !== "all") {
            // Adiciona o parâmetro de culinária
            url += `&cuisine=${cuisine}`;
        }

        console.log("Buscando na URL (complexSearch):", url);

        // Faz a requisição para a API
        const response = await fetch(url);

        // Verifica se a resposta foi bem-sucedida
        if (!response.ok) {
            throw new Error(
                `Erro de API: ${response.statusText} (Status: ${response.status})`
            );
        }

        // Converte a resposta em JSON
        const data = await response.json();

        // Retorna a lista de receitas
        return data.results;
    }

    // Função que mostra as receitas na tela
    function renderRecipes(recipes) {
        // Limpa os resultados anteriores
        resultsGrid.innerHTML = "";

        // Verifica se encontrou alguma receita, se não, avisa o usuário
        if (recipes.length === 0) {
            resultsGrid.innerHTML =
                "<p>Nenhuma receita encontrada com esses ingredientes.</p>";
            return;
        }

        // Cria um card para cada receita
        recipes.forEach((recipe) => {
            // Cria o elemento do card
            const card = document.createElement("div");
            // Adiciona a classe CSS
            card.className = "recipe-card";

            // Adicionam o ID da receita no 'dataset' (Precisamos disso pra função de exibir detalhes)
            card.dataset.recipeId = recipe.id;

            // Preenche o card com a imagem e título da receita
            card.innerHTML = `
                <img src="${recipe.image}" alt="${recipe.title}">
                <h3>${recipe.title}</h3>
            `;

            // Adiciona o card ao grid de resultados
            resultsGrid.appendChild(card);
        });
    }

    // Função que exibe a página atual com paginação
    function displayCurrentPage() {
        // Calcula os índices inicial e final das receitas a serem exibidas
        const startIndex = (currentPage - 1) * recipesPerPage;
        // Índice inicial da página atual
        const endIndex = startIndex + recipesPerPage;
        // Índice final
        const recipesToShow = allFetchedRecipes.slice(startIndex, endIndex);

        // Renderiza as receitas da página atual
        renderRecipes(recipesToShow);

        // Atualiza o indicador de página
        pageIndicator.textContent = `Página ${currentPage}`;

        // Habilita ou desabilita os botões de navegação
        prevPageBtn.disabled = (currentPage === 1);
        // Desabilita o botão "Anterior" se estiver na primeira página
        nextPageBtn.disabled = (endIndex >= allFetchedRecipes.length);
    }

    // Função que fecha o modal
    async function handleCardClick(event) {
        // 'closest' encontra o '.recipe-card' mais próximo de onde o usuário clicou
        const card = event.target.closest(".recipe-card");

        // Se o clique não foi em um card (foi no espaço entre eles), não faz nada
        if (!card) return;

        // Pega o ID guardado no 'dataset' na função renderRecipes
        const recipeId = card.dataset.recipeId;

        // Mostra o modal com uma mensagem de "carregando"
        modalOverlay.style.display = "flex";
        modalDetailsContent.innerHTML = "<p>Carregando detalhes...</p>";

        try {
            // Busca os detalhes específicos da receita
            const details = await fetchRecipeDetails(recipeId);

            // Mostra os detalhes completos dentro do modal
            renderRecipeDetails(details);
        } catch (error) {
            console.error("Erro ao buscar detalhes da receita:", error);
            modalDetailsContent.innerHTML =
                "<p>Não foi possível carregar os detalhes.</p>";
        }
    }

    // Função que exibe os detalhes da receita no modal
    async function fetchRecipeDetails(id) {
        const url = `https://api.spoonacular.com/recipes/${id}/information?apiKey=${API_KEY}`;

        console.log("Buscando detalhes na URL:", url);

        // Faz a requisição para a API
        const response = await fetch(url);
        // Verifica se a resposta foi bem-sucedida
        if (!response.ok) {
            throw new Error(
                `Erro de API: ${response.statusText} (Status: ${response.status})`
            );
        }
        // Converte a resposta em JSON
        const data = await response.json();
        return data; // Retorna um objeto com todos os detalhes
    }

    // Função que preenche o modal com os detalhes da receita
    function renderRecipeDetails(recipe) {
        // Array para os ingredientes que o usuário NÃO possui
        const missingIngredients = [];

        // Array para os ingredientes que o usuário possui
        const ownedIngredients = [];

        // 1. Separa os ingredientes da receita em duas listas
        recipe.extendedIngredients.forEach((ingredient) => {
            // Nomes em minúsculo para comparação
            const recipeIngName = ingredient.name.toLowerCase();
            // Ingredientes sem formatações especiais (ex: "egg-white")
            const recipeIngNameClean = ingredient.nameClean
                // Verifica se nameClean existe (nem sempre existe)
                ? ingredient.nameClean.toLowerCase()
                // Se não existir, usa o nome normal
                : recipeIngName;

            // Verifica se o nome do ingrediente da receita (ex: "large eggs") contém algum dos ingredientes do usuário (ex: "egg")
            const isFound = currentUserIngredients.some(
                (userIng) =>
                    recipeIngName.includes(userIng) ||
                    recipeIngNameClean.includes(userIng)
            );

            // Adiciona o ingrediente na lista correta
            if (isFound) {
                // Ingrediente encontrado entre os do usuário
                // "original" traz o ingrediente com a quantidade e unidade (ex: "2 large eggs")
                ownedIngredients.push(ingredient.original);

                // Se não encontrou, adiciona na lista de faltantes
            } else {
                missingIngredients.push(ingredient.original);
            }
        });

        // 2. Cria o HTML para a lista de FALTANTES
        let missingHtml = "";

        // Só cria se houver ingredientes faltando
        if (missingIngredients.length > 0) {
            missingHtml = `
                <h3>Ingredientes faltantes</h3>
                <ul class="missing-ingredients">
                    ${missingIngredients.map((item) => `<li>${item}</li>`).join("")}
                </ul>
            `;
        }

        // 3. Cria o HTML para a lista dos que o usuário POSSUI
        let ownedHtml = "";
        if (ownedIngredients.length > 0) {
            ownedHtml = `
                <h3>Ingredientes disponíveis</h3>
                <ul class="owned-ingredients">
                    ${ownedIngredients
                    .map((item) => `<li>${item}</li>`)
                    .join("")}
                </ul>
            `;
        }

        // 4. Constrói o HTML final do modal
        modalDetailsContent.innerHTML = `
        <h2>${recipe.title}</h2>
        <img src="${recipe.image}" alt="${recipe.title}">

        ${missingHtml} 
        ${ownedHtml}

            <h3>Instruções</h3>
            <div class="instructions">
                ${recipe.instructions || "Instruções não disponíveis."}
            </div>
        `;
    }

    // Função que fecha o modal
    function closeModal() {
        // Esconde o modal
        modalOverlay.style.display = "none";
        // Limpa o conteúdo para não exibir o conteúdo antigo na próxima vez
        modalDetailsContent.innerHTML = "";
    }
});
