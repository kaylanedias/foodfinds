// Receber os ingredientes do usuário
// Buscar as receitas na API
// Exibir as receitas na tela
// Exibir detalhes da receita em um modal
// Comparação dos ingredientes da receita com os do usuário
// Sistema de paginação

// Chave API
const API_KEY = "5738e1c3121d47a0a0ca383a193ebf6d";

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
    const paginationContainer = document.getElementById("pagination-container"); // Container de paginação
    const prevPageBtn = document.getElementById("prev-page-btn"); // Botão de página anterior
    const nextPageBtn = document.getElementById("next-page-btn"); // Botão de próxima página
    const pageIndicator = document.getElementById("page-indicator"); // Indicador de página

    // Evento de clique do botão "Buscar"
    searchBtn.addEventListener("click", handleSearch);

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
        const ingredientesString = ingredientInput.value.trim();

        // Verifica se o input está vazio
        if (ingredientesString === "") {
            alert("Por favor, digite os ingredientes.");
            return;
        }

        currentUserIngredients = ingredientesString
            .split(",") // Divide a string em um array
            .map((ing) => ing.trim().toLowerCase()) // Limpa espaços e formata
            .filter((ing) => ing.length > 0); // Remove entradas vazias

        const apiIngredientsString = currentUserIngredients.join(",+");


        mainContainer.classList.add("hidden"); 
        resultsGrid.innerHTML = ''; 
        paginationContainer.style.display = 'none'; 

        try {
            const recipes = await fetchRecipes(
                apiIngredientsString
            );

            if (recipes.length === 0) {
                resultsGrid.innerHTML =
                    "<p>Nenhuma receita encontrada com esses ingredientes.</p>";
                allFetchedRecipes = [];
                paginationContainer.style.display = 'none';
                resultsContainer.style.display = 'block';
                return;
            }

            allFetchedRecipes = recipes;
            currentPage = 1;
            displayCurrentPage();

            resultsContainer.style.display = 'block';
            paginationContainer.style.display = 'flex';

            resultsContainer.scrollIntoView({ behavior: 'smooth' });

        } catch (error) {
            console.error("Erro ao buscar receitas:", error);
            resultsGrid.innerHTML =
                "<p>Erro ao buscar receitas. Tente novamente.</p>";
            resultsContainer.style.display = "block";
            resultsContainer.scrollIntoView({ behavior: 'smooth' });

        } finally {
            loader.style.display = "none";
        }
    }

    // Função que busca receitas na API
    async function fetchRecipes(ingredients) {
        // 1. Usa o endpoint "findByIngredients" para busca exata
        // 2. O parâmetro da API é "ingredients"
        let url = `https://api.spoonacular.com/recipes/findByIngredients?apiKey=${API_KEY}&ingredients=${ingredients}&ranking=1&number=30&ignorePantry=true`;

        console.log("Buscando na URL (findByIngredients):", url);

        // Faz a requisição para a API
        const response = await fetch(url);

        // Verifica se a resposta foi bem-sucedida
        if (!response.ok) {
            if (response.status === 402) {
                console.error("Erro 402: Cota da API excedida.");
                throw new Error(
                    `Erro de API: Cota da API excedida (Status: ${response.status})`
                );
            }
            throw new Error(
                `Erro de API: ${response.statusText} (Status: ${response.status})`
            );
        }

        // Converte a resposta em JSON
        const data = await response.json();

        // Retorna a lista de receitas
        return data;
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