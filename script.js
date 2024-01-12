'use strict';

let pokemonData = [];
let pokemonNumIDArr = [];

//grabs info from the pokeAPI regarding a single pokemon
async function getSinglePokeData(num) {
  try {
    //fetches from pokeAPI
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${num}`);
    //parse the pokeAPI data
    const data = await response.json();
    return data; //returns the data as the fulfillment value within a Promise
  } catch {
    throw new Error(
      'Unable to fetch pokemon data... Please reload the page and try again'
    );
  }
}

//creates a pokemon array to be used for the questions that will be displayed
async function makePokemonDataArray(pokemonIDarr) {
  try {
    //creates an array of promises. Each promise is obtained from the getSinglePokeData function, which fetches the data about a single pokemon. Exactly which pokemon it fetches data about is derived off each pokemonID in the passed pokemonIDarr
    const promiseArray = pokemonIDarr.map(async function (pokemonID) {
      return getSinglePokeData(pokemonID);
    });
    //Promise.allSettled returns an array of all the fulfilled data (or unfufilled data) from the promiseArray above
    const pokemonDataArr = await Promise.allSettled(promiseArray);
    const pokemonDataValues = pokemonDataArr.map(pokeData => pokeData.value);
    return pokemonDataValues;
  } catch {
    throw new Error(
      'Unable to fetch pokemon data... Please reload the page and try again'
    );
  }
}

function setPokemonNumIDArr(chosenRegion) {
  let min = 0;
  let max = 0;
  switch (chosenRegion) {
    case 'kanto':
      min = 1;
      max = 151;
      break;
    case 'johto':
      min = 152;
      max = 251;
      break;
    case 'hoenn':
      min = 252;
      max = 386;
      break;
    case 'sinnoh':
      min = 387;
      max = 493;
      break;
    default:
      min = 0;
      max = 809;
  }
  console.log(min, max);

  for (let i = 0; i <= 14; i++) {
    let num = Math.floor(Math.random() * (max - min) + min);
    pokemonNumIDArr.push(num);
  }
}

//--------------------TESTING------------------------------
//test to see if the function above works for a single pokemon
// getSinglePokeData(2).then(res => console.log(res));

//test to see if the pokemonData is able to be set.
setPokemonNumIDArr('johto');
console.log(pokemonNumIDArr);
makePokemonDataArray(pokemonNumIDArr).then(pokemonDataValues => {
  pokemonData = [...pokemonDataValues];
  console.log(pokemonData);
});

/* TO DO:
1) Create all global variables, classes, data needed for the game to properly run
2) Create the following functions:
    a) Function to reset the game
    b) Function to update the UI
    c) Function to render data into the divs WHEN the data is fetched. */
