document.addEventListener('DOMContentLoaded', function () {
    const search = new JsSearch.Search('conditions');
    let cachedData = [];
    let timeoutId; // To keep track of debounce timeout

    // Fetch the JSON data
    fetch('conditions.json')
        .then(response => response.json())
        .then(data => {
            cachedData = data;
            search.addIndex('phenotypes');
            search.addIndex('genes');
            search.addIndex('conditions');
            search.addDocuments(cachedData);

            // Add input event listener for search with debounce
            const searchInput = document.getElementById('search-input');
            searchInput.addEventListener('input', function () {
                clearTimeout(timeoutId); // Clear previous timeout
                const query = searchInput.value;

                // Set a new timeout for debounce
                timeoutId = setTimeout(() => {
                    const results = search.search(query);
                    displayResults(results, query);
                    autocomplete(query, cachedData);
                }, 300); // Adjust the delay (in milliseconds) as needed
            });
        });

    // Display search results
    function displayResults(results, query) {
        const resultsContainer = document.getElementById('results');
        resultsContainer.innerHTML = '';

        results.forEach(result => {
            const phenotypeMatches = matchScore(result.phenotypes, query);
            const geneMatches = matchScore(result.genes, query);

            resultsContainer.innerHTML += `
                <div>
                    <h3>${result.conditions}</h3>
                    <p><strong>Matched Phenotypes:</strong> ${phenotypeMatches.score}/${phenotypeMatches.total} - ${phenotypeMatches.details}</p>
                    <p><strong>Matched Genes:</strong> ${geneMatches.score}/${geneMatches.total} - ${geneMatches.details}</p>
                </div>
            `;
        });
    }

    // Calculate match score for phenotypes and genes
    function matchScore(list, query) {
        const items = list ? list.split(',').map(item => item.trim()) : [];
        const queries = query.split(',').map(q => q.trim().toLowerCase());

        const matchedItems = items.filter(item => {
            return queries.some(q => item.toLowerCase().includes(q));
        });

        return {
            score: matchedItems.length,
            total: items.length,
            details: matchedItems.join(', ')
        };
    }

    // Autocomplete logic
    function autocomplete(query, data) {
        const autocompleteList = document.getElementById('autocomplete-list');
        autocompleteList.innerHTML = '';

        if (!query) {
            return;
        }

        const phenotypes = data.flatMap(item => item.phenotypes.split(',').map(p => p.trim())).filter(p => p);
        const genes = data.flatMap(item => item.genes.split(',').map(g => g.trim())).filter(g => g);

        const allSuggestions = [...new Set([...phenotypes, ...genes])];
        const filteredSuggestions = allSuggestions.filter(suggestion =>
            suggestion.toLowerCase().startsWith(query.toLowerCase())
        );

        filteredSuggestions.slice(0, 5).forEach(suggestion => {
            const item = document.createElement('li');
            item.textContent = suggestion;
            item.addEventListener('click', function () {
                document.getElementById('search-input').value = suggestion;
                const event = new Event('input');
                document.getElementById('search-input').dispatchEvent(event);
            });
            autocompleteList.appendChild(item);
        });
    }
});
