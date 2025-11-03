# Foody Finds - Gerador de Receitas (Código JS)

## Etapa 1: Ouvintes de Eventos

Assim que o documento HTML é carregado (`DOMContentLoaded`), o script não faz nada visível, apenas seleciona e adiciona "ouvintes" (`addEventListener`) aos botões e elementos interativos.

(Em outras palavras: o script espera que o usuário realize uma ação.)

```javascript
// Espera o documento HTML carregar completamente
document.addEventListener("DOMContentLoaded", () => {
  // Seleciona os elementos do DOM
  const ingredientInput = document.getElementById("ingredient-input");
  const searchBtn = document.getElementById("search-btn"); // Eventos de clique
  // ... outros elementos ...

  searchBtn.addEventListener("click", handleSearch);
  resultsGrid.addEventListener("click", handleCardClick);
  // ... outros eventos ...
});

```

## Etapa 2: Ação do Usuário e Início da Busca

Quando o usuário clica em "Buscar", a função async `handleSearch` é disparada para formatar o texto do usuário, previnir erros e buscas vazias.

```javascript
async function handleSearch() {
        // Identifica os ingredientes do input
        const ingredientesString = ingredientInput.value.trim();

        // Verifica se o input está vazio
        if (ingredientesString === "") {
            // Se ele estiver, exibe um alerta ao usuário
            alert("Por favor, digite os ingredientes.");
            // Encerra a função para evitar buscas vazias
            return;
        }

        // Realiza a formatação dos ingredientes
        currentUserIngredients = ingredientesString
            .split(",") // Divide a string em um array
            .map((ing) => ing.trim().toLowerCase()) // Limpa espaços
            .filter((ing) => ing.length > 0); // Remove entradas vazias

        // Constrói a string (texto) para a API com um separador adequado
        const apiIngredientsString = currentUserIngredients.join(",+");

        // ... controle de exibição do loader ...

        // Tenta buscar as receitas
        try {
            const recipes = await fetchRecipes(
                apiIngredientsString
            );

            // Verifica se encontrou alguma receita
            if (recipes.length === 0) { // Se nenhuma receita for encontrada
                // Mostra uma mensagem ao usuário
                resultsGrid.innerHTML =
                    "<p>Nenhuma receita encontrada com esses ingredientes.</p>";
                // Limpa as receitas armazenadas e esconde a paginação
                allFetchedRecipes = [];
                paginationContainer.style.display = 'none';
                resultsContainer.style.display = 'block';
                return;
            }

            // Se não, armazena todas as receitas buscadas
            allFetchedRecipes = recipes;
            currentPage = 1; // Reseta para a primeira página
            displayCurrentPage(); // Exibe a primeira página de resultados

            // Mostra o container de resultados e a paginação
            resultsContainer.style.display = 'block';
            paginationContainer.style.display = 'flex';

        // ... animação de rolagem ...

        // ... captura de erros (limite de api, rede, etc)

        // ... controle de exibição do loader ...
    }
}

```

## Etapa 3: Primeira Chamada à API (Busca de Receitas)

A função async `fetchRecipes()` realiza a primeira chamada da API através do endpoint `findByIngredients`, carregando apenas a lista de receitas (com ID, Título e Imagem) que correspondem aos ingredientes.

O resultado (de até 30 receitas) é salvo na variável global `allFetchedRecipes`.

```javascript
// Função que busca receitas na API
async function fetchRecipes(ingredients) {
  let url = `https://api.spoonacular.com/recipes/findByIngredients?apiKey=${API_KEY}&ingredients=${ingredients}&ranking=1&number=30&ignorePantry=true`;

  console.log("Buscando na URL (findByIngredients):", url);

  // Faz a requisição para a API
  const response = await fetch(url);

  // Verifica se a resposta foi bem-sucedida
  if (!response.ok) {
    // Se não, vai exibir uma mensagem de erro no console
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

```

## Etapa 4: Exibição e Paginação

Após gerar a lista de receitas, a função `displayCurrentPage()` é chamada para criar a paginação.

A função calcula quais receitas devem ser exibidas na página principal (por padrão, a página 1) e usa `.slice()` para pegar apenas as 5 primeiras receitas da lista principal.

```javascript
function displayCurrentPage() {
  // Calcula os índices iniciais e finais das receitas a serem exibidas
  const startIndex = (currentPage - 1) * recipesPerPage;
  const endIndex = startIndex + recipesPerPage;
  const recipesToShow = allFetchedRecipes.slice(startIndex, endIndex);

  // Renderiza as receitas da página atual
  renderRecipes(recipesToShow);

  // Atualiza o indicador de página
  pageIndicator.textContent = `Página ${currentPage}`;

  // Habilita ou desabilita os botões de navegação
  prevPageBtn.disabled = currentPage === 1;
  // Desabilita o botão "Anterior" se estiver na primeira página
  nextPageBtn.disabled = endIndex >= allFetchedRecipes.length;
}

```

Depois, a função `renderRecipes` recebe as 5 receitas, constrói o HTML para cada uma, e adiciona no `resultsGrid`. Ao criar cada card, o script armazena o `recipe.id` dentro do dataset (estrutura de dados) do elemento HTML.

```javascript
function renderRecipes(recipes) {
  // Limpa os resultados anteriores
  resultsGrid.innerHTML = "";

  // Verifica se encontrou alguma receita
  if (recipes.length === 0) {
    // Se não, exibe uma mensagem para o usuário
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

    // Adicionam o ID da receita no "dataset"
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

```

## Etapa 5: Interação do Usuário

Ao clicar em um dos cards, o ouvinte de evento no `resultsGrid` é disparado e chama a função `handleCardClick`.

A função usa `event.target.closest(".recipe-card")` para descobrir em qual card o usuário clicou e, em seguida, lê o ID que foi salvo na etapa anterior.

```javascript
async function handleCardClick(event) {
  // 'closest' encontra o '.recipe-card' mais próximo de onde o usuário clicou
  const card = event.target.closest(".recipe-card");

  // Se o clique não foi em um card (foi no espaço entre eles), não faz nada
  if (!card) return;

  // Pega o ID guardado no "dataset" na função renderRecipes
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

```

## Etapa 6: Segunda Chamada à API (Busca de Detalhes)

A função `handleCardClick` agora chama `await fetchRecipeDetails(recipeId)` usando o endpoint `/information` e o ID específico da receita.

Ela carrega todos os detalhes (instruções, tempo de preparo e a lista completa de ingredientes).

```javascript
async function fetchRecipeDetails(id) {
  const url = `https://api.spoonacular.com/recipes/${id}/information?apiKey=${API_KEY}`;

  console.log("Buscando detalhes na URL:", url);

  // Faz a requisição para a API
  const response = await fetch(url);
  // Verifica se a resposta foi bem-sucedida
  if (!response.ok) {
    // Se não, exibe uma mensagem de erro
    throw new Error(
      `Erro de API: ${response.statusText} (Status: ${response.status})`
    );
  }

  // Converte a resposta em JSON
  const data = await response.json();
  // Retorna um objeto com todos os detalhes
  return data;
}

```

## Etapa 7: Comparação dos Ingredientes

Após receber todos os detalhes, a função `handleCardClick` passa o resultado para `renderRecipeDetails`, onde para cada ingrediente da receita, ele verifica se o nome (`recipeIngName` ou `recipeIngNameClean`) inclui algum dos ingredientes que o usuário digitou (`currentUserIngredients`).

Depois, ele separa os ingredientes em duas listas: `ownedIngredients` (ingredientes iguais) e `missingIngredients` (ingredientes diferentes).

```javascript
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

    // ... (cria o HTML para as listas e instruções) ...

    // ... Adiciona o HTML final no modal ...
    modalDetailsContent.innerHTML = `<h2>${recipe.title}</h2> ...`;

```

## Etapa 8: Finalização (Fechando o Modal)

Ao clicar no botão "Fechar" (`modalCloseBtn`) ou fora do modal (`modalOverlay`), isso dispara a função `closeModal` que limpa o conteúdo do modal (`modalDetailsContent.innerHTML = ""`) e garante que o usuário não veja os detalhes da receita anterior enquanto a próxima é carregada.

```javascript
function closeModal() {
  modalOverlay.style.display = "none";
  modalDetailsContent.innerHTML = ""; // Limpeza para a próxima abertura
}

```

## Lógica de Filtros

Foi utilizada a função `fetchRecipes` com o endpoint `complexSearch` da API para construir a URL de forma dinânimca, em algumas etapas:

1. Usa a URL base, que inclui os ingredientes obrigatórios;
2. Verifica todos os filtros um por um;
3. Se um filtro não possi mais o valor padrão "all", ele é adicionado à URL como um parâmetro.

Dessa forma o usuário pode buscar apenas por ingredientes, ou por ingredientes + filtros, e o código constrói a chamada de API para cada caso.

```javascript
async function fetchRecipes(ingredients, sort, diet, cuisine) {
  // 1. A url base agora usa "complexSearch"
  let url = `https://api.spoonacular.com/recipes/complexSearch?apiKey=${API_KEY}&includeIngredients=${ingredients}&number=30`;

  // 2. Adiciona o filtro de Ordenação, se houver
  if (sort) {
    url += `&sort=${sort}`;
  }

  // 3. Adiciona o filtro de Dieta, se não for "all"
  if (diet && diet !== "all") {
    url += `&type=${diet}`;
  }

  // 4. Adiciona o filtro de Região, se não for "all"
  if (cuisine && cuisine !== "all") {
    url += `&cuisine=${cuisine}`;
  }

  console.log("Buscando na URL (complexSearch):", url);

  // ... Transforma em json ...
  const data = await response.json();

  // O 'complexSearch' retorna os resultados dentro de uma chave "results"
  return data.results;
}

```
