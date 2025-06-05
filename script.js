const apiKey = "s6nmPYMoE5O7RLxzbFwEQw==eEFPeuEwe3cawel8"; // Replace with your actual API key

const MEALS_STORAGE_KEY = 'calorieTrackerMeals';
const OVERALL_TOTAL_STORAGE_KEY = 'calorieTrackerOverallTotal';
const MEAL_ITEMS_STORAGE_KEY_PREFIX = 'calorieTrackerMealItems_';

let mealTotals = {
  breakfast: { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0 },
  lunch:     { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0 },
  snacks:    { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0 },
  dinner:    { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0 },
};

let overallTotal = { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0 };

const nutrientFields = ['calories', 'protein', 'carbs', 'fat', 'sugar'];

document.addEventListener('DOMContentLoaded', () => {
    loadData();

    const mealsContainer = document.getElementById('meals');
    const resetDayButton = document.getElementById('reset-day-button');
    const loadingIndicator = document.getElementById('loading-indicator');
    const errorMessageDiv = document.getElementById('error-message');

    mealsContainer.addEventListener('click', async (event) => {
        const target = event.target;
        // Handle "Add" button clicks
        if (target.tagName === 'BUTTON' && target.dataset.meal) {
            const mealId = target.dataset.meal;
            const mealDiv = document.getElementById(mealId);
            const quantityInput = mealDiv.querySelector(".quantity-input");
            const foodInput = mealDiv.querySelector(".food-input");
            
            await addFood(mealId, foodInput, quantityInput, loadingIndicator, errorMessageDiv);
        }
        // Handle "Delete" button clicks
        else if (target.classList.contains('delete-item-btn')) {
            const mealId = target.closest('.meal').id;
            deleteFoodItem(target, mealId);
        }
    });

    if (resetDayButton) {
        resetDayButton.addEventListener('click', resetDay);
    }
});

async function addFood(mealId, foodInputElem, quantityInputElem, loadingIndicator, errorMessageDiv) {
    const query = foodInputElem.value.trim();
    const quantity = parseInt(quantityInputElem.value) || 1;

    if (!query) {
        showError("Please enter a food item.", errorMessageDiv);
        return;
    }
    if (quantity <= 0) {
        showError("Quantity must be greater than zero.", errorMessageDiv);
        return;
    }

    loadingIndicator.style.display = 'block';
    errorMessageDiv.style.display = 'none';

    try {
        const response = await fetch(`https://api.calorieninjas.com/v1/nutrition?query=${quantity} ${query}`, {
            headers: { 'X-Api-Key': apiKey }
        });
        const data = await response.json();

        if (!response.ok) {
            let errorMsg = `API Error: ${response.status}`;
            if (data && data.message) {
                errorMsg += ` - ${data.message}`;
            } else if (response.status === 401) {
                errorMsg += ` - Unauthorized. Check your API Key.`;
            } else if (response.status === 429) {
                errorMsg += ` - API rate limit exceeded. Please try again later.`;
            }
            throw new Error(errorMsg);
        }
        
        if (!data.items || data.items.length === 0) {
            showError(`No nutritional data found for "${query}". Try being more specific or check spelling.`, errorMessageDiv);
            return;
        }

        const mealDiv = document.getElementById(mealId);
        const tbody = mealDiv.querySelector("tbody");

        data.items.forEach(food => { // API might return multiple items if query is general like "apple"
            const foodData = {
                name: food.name,
                calories: food.calories || 0,
                protein: food.protein_g || 0,
                carbs: food.carbohydrates_total_g || 0,
                fat: food.fat_total_g || 0,
                sugar: food.sugar_g || 0,
            };

            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${foodData.name}</td>
                <td>${foodData.calories.toFixed(2)}</td>
                <td>${foodData.protein.toFixed(2)}</td>
                <td>${foodData.carbs.toFixed(2)}</td>
                <td>${foodData.fat.toFixed(2)}</td>
                <td>${foodData.sugar.toFixed(2)}</td>
                <td><button class="delete-item-btn">X</button></td>
            `;
            tbody.appendChild(row);
            updateTotals(mealId, foodData, 'add');
        });

        foodInputElem.value = "";
        quantityInputElem.value = "1";

    } catch (err) {
        console.error('Fetch Error:', err);
        showError(`Error: ${err.message || 'Could not fetch data. Check console.'}`, errorMessageDiv);
    } finally {
        loadingIndicator.style.display = 'none';
    }
}

function deleteFoodItem(buttonElement, mealId) {
    const row = buttonElement.closest('tr');
    if (!row) return;

    const foodData = {
        name: row.cells[0].textContent, // Not strictly needed for calculation but good for context
        calories: parseFloat(row.cells[1].textContent) || 0,
        protein: parseFloat(row.cells[2].textContent) || 0,
        carbs: parseFloat(row.cells[3].textContent) || 0,
        fat: parseFloat(row.cells[4].textContent) || 0,
        sugar: parseFloat(row.cells[5].textContent) || 0,
    };

    row.remove();
    updateTotals(mealId, foodData, 'subtract');
}


function updateTotals(mealId, values, operation = 'add') {
    const multiplier = operation === 'add' ? 1 : -1;

    nutrientFields.forEach(field => {
        mealTotals[mealId][field] += (values[field] * multiplier);
        overallTotal[field] += (values[field] * multiplier);
    });

    // Update meal totals in DOM
    const mealTotalRowTds = document.querySelector(`#${mealId} .totals`).children;
    mealTotalRowTds[1].textContent = mealTotals[mealId].calories.toFixed(2);
    mealTotalRowTds[2].textContent = mealTotals[mealId].protein.toFixed(2);
    mealTotalRowTds[3].textContent = mealTotals[mealId].carbs.toFixed(2);
    mealTotalRowTds[4].textContent = mealTotals[mealId].fat.toFixed(2);
    mealTotalRowTds[5].textContent = mealTotals[mealId].sugar.toFixed(2);

    // Update overall totals in DOM
    const overallRowTds = document.getElementById("overall-totals-row").children;
    overallRowTds[0].textContent = overallTotal.calories.toFixed(2);
    overallRowTds[1].textContent = overallTotal.protein.toFixed(2);
    overallRowTds[2].textContent = overallTotal.carbs.toFixed(2);
    overallRowTds[3].textContent = overallTotal.fat.toFixed(2);
    overallRowTds[4].textContent = overallTotal.sugar.toFixed(2);

    saveData();
}

function saveData() {
    localStorage.setItem(MEALS_STORAGE_KEY, JSON.stringify(mealTotals));
    localStorage.setItem(OVERALL_TOTAL_STORAGE_KEY, JSON.stringify(overallTotal));

    // Save items for each meal
    document.querySelectorAll('.meal').forEach(mealDiv => {
        const mealId = mealDiv.id;
        const tbody = mealDiv.querySelector("tbody");
        const items = [];
        tbody.querySelectorAll('tr').forEach(row => {
            const rowData = {
                name: row.cells[0].textContent,
                calories: row.cells[1].textContent,
                protein: row.cells[2].textContent,
                carbs: row.cells[3].textContent,
                fat: row.cells[4].textContent,
                sugar: row.cells[5].textContent,
            };
            items.push(rowData);
        });
        localStorage.setItem(MEAL_ITEMS_STORAGE_KEY_PREFIX + mealId, JSON.stringify(items));
    });
}

function loadData() {
    const storedMealTotals = localStorage.getItem(MEALS_STORAGE_KEY);
    const storedOverallTotal = localStorage.getItem(OVERALL_TOTAL_STORAGE_KEY);

    if (storedMealTotals) {
        Object.assign(mealTotals, JSON.parse(storedMealTotals));
    }
    if (storedOverallTotal) {
        Object.assign(overallTotal, JSON.parse(storedOverallTotal));
    }

    // Repopulate tables and totals
    document.querySelectorAll('.meal').forEach(mealDiv => {
        const mealId = mealDiv.id;
        const tbody = mealDiv.querySelector("tbody");
        tbody.innerHTML = ''; // Clear existing items

        const storedItems = localStorage.getItem(MEAL_ITEMS_STORAGE_KEY_PREFIX + mealId);
        if (storedItems) {
            const items = JSON.parse(storedItems);
            items.forEach(itemData => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${itemData.name}</td>
                    <td>${itemData.calories}</td>
                    <td>${itemData.protein}</td>
                    <td>${itemData.carbs}</td>
                    <td>${itemData.fat}</td>
                    <td>${itemData.sugar}</td>
                    <td><button class="delete-item-btn">X</button></td>
                `;
                tbody.appendChild(row);
            });
        }
        // Update displayed meal totals
        const mealTotalRowTds = mealDiv.querySelector(".totals").children;
        mealTotalRowTds[1].textContent = mealTotals[mealId].calories.toFixed(2);
        mealTotalRowTds[2].textContent = mealTotals[mealId].protein.toFixed(2);
        mealTotalRowTds[3].textContent = mealTotals[mealId].carbs.toFixed(2);
        mealTotalRowTds[4].textContent = mealTotals[mealId].fat.toFixed(2);
        mealTotalRowTds[5].textContent = mealTotals[mealId].sugar.toFixed(2);
    });

    // Update displayed overall total
    const overallRowTds = document.getElementById("overall-totals-row").children;
    overallRowTds[0].textContent = overallTotal.calories.toFixed(2);
    overallRowTds[1].textContent = overallTotal.protein.toFixed(2);
    overallRowTds[2].textContent = overallTotal.carbs.toFixed(2);
    overallRowTds[3].textContent = overallTotal.fat.toFixed(2);
    overallRowTds[4].textContent = overallTotal.sugar.toFixed(2);
}

function resetDay() {
    if (confirm("Are you sure you want to clear all entries for the day? This cannot be undone.")) {
        // Clear data objects
        mealTotals = {
            breakfast: { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0 },
            lunch:     { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0 },
            snacks:    { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0 },
            dinner:    { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0 },
        };
        overallTotal = { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0 };

        // Clear tables in DOM
        document.querySelectorAll('.meal tbody').forEach(tbody => tbody.innerHTML = '');
        
        // Update totals in DOM (essentially resetting them to 0)
        loadData(); // Easiest way to reset UI to reflect cleared data
        saveData(); // Persist the cleared state
        showError("All data for the day has been reset.", document.getElementById('error-message'), 'success');
    }
}

function showError(message, element, type = 'error') {
    element.textContent = message;
    element.style.display = 'block';
    if (type === 'success') {
        element.style.backgroundColor = '#d4edda';
        element.style.color = '#155724';
        element.style.borderColor = '#c3e6cb';
    } else {
        element.style.backgroundColor = '#f8d7da';
        element.style.color = '#721c24';
        element.style.borderColor = '#f5c6cb';
    }
     // Optional: auto-hide message after a few seconds
    setTimeout(() => {
        element.style.display = 'none';
    }, 5000);
}