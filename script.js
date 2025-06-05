const apiKey = "s6nmPYMoE5O7RLxzbFwEQw==eEFPeuEwe3cawel8";

const mealTotals = {
  breakfast: { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0 },
  lunch:     { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0 },
  snacks:    { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0 },
  dinner:    { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0 },
};

const overallTotal = { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0 };

async function addFood(meal) {
  const mealDiv = document.getElementById(meal);
  const input = mealDiv.querySelector(".food-input");
  const query = input.value.trim();
  if (!query) return;

  try {
    const response = await fetch(`https://api.calorieninjas.com/v1/nutrition?query=${query}`, {
      headers: { 'X-Api-Key': apiKey }
    });
    const data = await response.json();
    if (!data.items || data.items.length === 0) {
      alert("No data found for that food item.");
      return;
    }

    const food = data.items[0]; // Only first item used
    const calories = food.calories || 0;
    const protein = food.protein_g || 0;
    const carbs = food.carbohydrates_total_g || 0;
    const fat = food.fat_total_g || 0;
    const sugar = food.sugar_g || 0;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${food.name}</td>
      <td>${calories.toFixed(2)}</td>
      <td>${protein.toFixed(2)}</td>
      <td>${carbs.toFixed(2)}</td>
      <td>${fat.toFixed(2)}</td>
      <td>${sugar.toFixed(2)}</td>
    `;
    mealDiv.querySelector("tbody").appendChild(row);

    // Update totals
    updateTotals(meal, { calories, protein, carbs, fat, sugar });
    input.value = "";

  } catch (err) {
    console.error(err);
    alert("Error fetching data. Check your internet or API key.");
  }
}

function updateTotals(meal, values) {
  const fields = ['calories', 'protein', 'carbs', 'fat', 'sugar'];

  fields.forEach(field => {
    mealTotals[meal][field] += values[field];
    overallTotal[field] += values[field];
  });

  const tds = document.querySelector(`#${meal} .totals`).children;
  tds[1].textContent = mealTotals[meal].calories.toFixed(2);
  tds[2].textContent = mealTotals[meal].protein.toFixed(2);
  tds[3].textContent = mealTotals[meal].carbs.toFixed(2);
  tds[4].textContent = mealTotals[meal].fat.toFixed(2);
  tds[5].textContent = mealTotals[meal].sugar.toFixed(2);

  const overallRow = document.getElementById("overall").children;
  overallRow[0].textContent = overallTotal.calories.toFixed(2);
  overallRow[1].textContent = overallTotal.protein.toFixed(2);
  overallRow[2].textContent = overallTotal.carbs.toFixed(2);
  overallRow[3].textContent = overallTotal.fat.toFixed(2);
  overallRow[4].textContent = overallTotal.sugar.toFixed(2);
}
